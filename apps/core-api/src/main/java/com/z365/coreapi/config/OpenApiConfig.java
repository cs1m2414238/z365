package com.z365.coreapi.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
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
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Server")
                ));
    }
}

