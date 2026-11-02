package com.z365.coreapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;

@Modulithic(
    sharedModules = {"common", "config"}
)
@SpringBootApplication
public class Z365CoreApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(Z365CoreApiApplication.class, args);
    }
}

