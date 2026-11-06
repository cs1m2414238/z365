package com.z365.coreapi.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI z365OpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Z365 Core API")
                        .description("Modular Monolith Core Backend API for Z365 Platform")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Z365 Engineering Team")
                                .email("engineering@z365.dev"))
                        .license(new License().name("Apache 2.0").url("https://spring.io")))
                .components(new Components().addSecuritySchemes("session", new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY).in(SecurityScheme.In.COOKIE).name("JSESSIONID")))
                .path("/api/v1/auth/login", new PathItem().post(new Operation()
                        .tags(List.of("Accounts")).summary("Sign in with a username or email")
                        .addParametersItem(csrfHeader())
                        .requestBody(new RequestBody().required(true).content(new Content()
                                .addMediaType("application/x-www-form-urlencoded", new MediaType().schema(new ObjectSchema()
                                        .addProperty("username", new StringSchema())
                                        .addProperty("password", new StringSchema().format("password"))
                                        .required(List.of("username", "password"))))))
                        .responses(new ApiResponses()
                                .addApiResponse("204", new ApiResponse().description("Signed in"))
                                .addApiResponse("401", new ApiResponse().description("Invalid credentials"))
                                .addApiResponse("403", new ApiResponse().description("Missing or invalid CSRF token"))
                                .addApiResponse("429", new ApiResponse().description("Too many attempts")))))
                .path("/api/v1/auth/logout", new PathItem().post(new Operation()
                        .tags(List.of("Accounts")).summary("End the current session")
                        .addSecurityItem(new SecurityRequirement().addList("session"))
                        .addParametersItem(csrfHeader())
                        .responses(new ApiResponses()
                                .addApiResponse("204", new ApiResponse().description("Signed out"))
                                .addApiResponse("403", new ApiResponse().description("Missing or invalid CSRF token")))))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Server")
                ));
    }

    private static Parameter csrfHeader() {
        return new Parameter().name("X-CSRF-TOKEN").in("header").required(true)
                .description("Token from GET /api/v1/auth/csrf").schema(new StringSchema());
    }
}

