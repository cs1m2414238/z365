package com.z365.coreapi.config;

import com.z365.coreapi.common.ErrorResponse;
import com.z365.coreapi.users.ProfileService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Configuration
class ProfileSecurityConfig {
    @Bean
    PasswordEncoder accountPasswordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    UserDetailsService accountDetails(ProfileService profiles) {
        return login -> profiles.credentials(login)
                .map(account -> User.withUsername(account.id())
                        .password(account.passwordHash()).authorities(account.role()).build())
                .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
    }

    @Bean
    @Order(1)
    SecurityFilterChain profileSecurity(HttpSecurity http, UserDetailsService accountDetails, JsonMapper json,
                                       @Value("${z365.web.origins}") List<String> origins) throws Exception {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(origins);
        cors.setAllowedMethods(List.of("GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Content-Type", "Accept", "X-CSRF-TOKEN"));
        cors.setAllowCredentials(true);

        http.securityMatcher("/api/v1/auth/**", "/api/v1/users/**", "/api/v1/challenges/**")
                .cors(config -> config.configurationSource(request -> cors))
                .requestCache(cache -> cache.disable())
                .userDetailsService(accountDetails)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/csrf").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/challenges/**").permitAll()
                        .requestMatchers("/api/v1/challenges/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/users/me", "/api/v1/users/me/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, cause) ->
                                error(json, request, response, HttpStatus.UNAUTHORIZED, "Sign in to continue."))
                        .accessDeniedHandler((request, response, cause) ->
                                error(json, request, response, HttpStatus.FORBIDDEN, "Request denied.")))
                .formLogin(login -> login
                        .loginProcessingUrl("/api/v1/auth/login")
                        .successHandler((request, response, authentication) -> response.setStatus(204))
                        .failureHandler((request, response, cause) ->
                                error(json, request, response, HttpStatus.UNAUTHORIZED, "Invalid login or password.")))
                .logout(logout -> logout
                        .logoutUrl("/api/v1/auth/logout")
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)))
                .addFilterBefore(new LoginRateLimit(json), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void error(JsonMapper json, HttpServletRequest request, HttpServletResponse response,
                              HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(response.getOutputStream(), ErrorResponse.builder()
                .status(status.value()).error(status.getReasonPhrase()).message(message)
                .path(request.getRequestURI()).build());
    }

    private static final class LoginRateLimit extends OncePerRequestFilter {
        private final JsonMapper json;
        private final Map<String, Integer> attempts = new HashMap<>();
        private long window = System.nanoTime();

        private LoginRateLimit(JsonMapper json) {
            this.json = json;
        }

        private synchronized boolean allow(String address) {
            long now = System.nanoTime();
            if (now - window >= TimeUnit.MINUTES.toNanos(1)) {
                attempts.clear();
                window = now;
            }
            if (attempts.size() >= 10_000 && !attempts.containsKey(address)) return false;
            int count = attempts.getOrDefault(address, 0);
            if (count >= 12) return false;
            attempts.put(address, count + 1);
            return true;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws IOException, ServletException {
            String path = request.getServletPath();
            boolean authenticationAttempt = "POST".equals(request.getMethod())
                    && ("/api/v1/auth/login".equals(path) || "/api/v1/auth/register".equals(path));
            if (authenticationAttempt && !allow(request.getRemoteAddr())) {
                response.setHeader("Retry-After", "60");
                error(json, request, response, HttpStatus.TOO_MANY_REQUESTS, "Try again in a minute.");
                return;
            }
            if (authenticationAttempt && "/api/v1/auth/login".equals(path)) {
                String username = request.getParameter("username");
                String password = request.getParameter("password");
                if (username == null || username.length() > 100 || password == null || password.length() > 72
                        || password.getBytes(StandardCharsets.UTF_8).length > 72) {
                    error(json, request, response, HttpStatus.UNAUTHORIZED, "Invalid login or password.");
                    return;
                }
            }
            chain.doFilter(request, response);
        }
    }
}
