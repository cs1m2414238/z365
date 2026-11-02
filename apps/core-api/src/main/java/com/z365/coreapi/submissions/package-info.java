/**
 * Submissions Domain Module:
 * Tracks user code submissions, delegates to isolated code runner, and records outcomes.
 * Untrusted code is never executed inside this core backend.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Submissions Module",
    allowedDependencies = {"challenges"}
)
package com.z365.coreapi.submissions;

