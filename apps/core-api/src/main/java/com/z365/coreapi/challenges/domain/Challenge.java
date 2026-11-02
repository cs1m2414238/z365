package com.z365.coreapi.challenges.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "challenges")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Challenge {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20)")
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20)")
    @Builder.Default
    private ChallengeStatus status = ChallengeStatus.PUBLISHED;

    @Column(nullable = false)
    @Builder.Default
    private Integer points = 10;

    @Column(name = "time_limit_ms", nullable = false)
    @Builder.Default
    private Integer timeLimitMs = 2000;

    @Column(name = "memory_limit_mb", nullable = false)
    @Builder.Default
    private Integer memoryLimitMb = 256;

    @Column(name = "starter_code", columnDefinition = "TEXT")
    private String starterCode;

    @Column(name = "solution_template", columnDefinition = "TEXT")
    private String solutionTemplate;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        updatedAt = Instant.now();
    }
}

