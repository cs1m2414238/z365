package com.z365.coreapi;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularMonolithArchitectureTests {

    @Test
    void verifyModularMonolithArchitecture() {
        ApplicationModules modules = ApplicationModules.of(Z365CoreApiApplication.class);
        modules.verify();
    }
}

