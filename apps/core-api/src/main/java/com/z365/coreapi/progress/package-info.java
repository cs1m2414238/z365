/**
 * Progress Domain Module:
 * Tracks user progress, streaks, solved challenges, and skill gains.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Progress Module",
    allowedDependencies = {"challenges", "skills"}
)
package com.z365.coreapi.progress;

