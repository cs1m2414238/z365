package com.z365.coreapi.challenges.web.dto;

import com.z365.coreapi.challenges.domain.Challenge;
import com.z365.coreapi.challenges.domain.ChallengeStatus;
import com.z365.coreapi.challenges.domain.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeResponse {

    private String id;
    private String title;
    private String slug;
    private String description;
    private Difficulty difficulty;
    private ChallengeStatus status;
    private Integer points;
    private Integer timeLimitMs;
    private Integer memoryLimitMb;
    private String starterCode;
    private Instant createdAt;
    private Instant updatedAt;

    public static ChallengeResponse fromEntity(Challenge entity) {
        return ChallengeResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .slug(entity.getSlug())
                .description(entity.getDescription())
                .difficulty(entity.getDifficulty())
                .status(entity.getStatus())
                .points(entity.getPoints())
                .timeLimitMs(entity.getTimeLimitMs())
                .memoryLimitMb(entity.getMemoryLimitMb())
                .starterCode(entity.getStarterCode())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

