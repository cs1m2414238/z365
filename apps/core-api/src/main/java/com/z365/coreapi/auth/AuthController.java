package com.z365.coreapi.auth;

import com.z365.coreapi.common.ApiResponse;
import com.z365.coreapi.users.ProfileService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
class AuthController {
    private final ProfileService profiles;

    AuthController(ProfileService profiles) {
        this.profiles = profiles;
    }

    @GetMapping("/csrf")
    ApiResponse<Map<String, String>> csrf(CsrfToken token) {
        return ApiResponse.success(Map.of("headerName", token.getHeaderName(), "token", token.getToken()));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<ProfileService.Profile> register(@Valid @RequestBody Registration registration) {
        if (registration.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must fit within 72 UTF-8 bytes.");
        }
        ProfileService.Profile profile = profiles.register(registration.username(), registration.email(),
                registration.displayName(), registration.password());
        return ApiResponse.success(profile);
    }

    record Registration(
            @NotBlank @Pattern(regexp = "[a-zA-Z0-9_]{3,24}") String username,
            @NotBlank @Email @Size(max = 100) String email,
            @NotBlank @Size(max = 50) String displayName,
            @NotBlank @Size(min = 12, max = 72) String password) {}
}
