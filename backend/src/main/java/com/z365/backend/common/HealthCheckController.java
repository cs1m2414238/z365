package com.z365.backend.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthCheckController {

    @GetMapping("/ping")
    public Map<String, String> ping() {
        return Map.of(
            "status", "UP",
            "service", "z365-backend-monolith"
        );
    }
}
