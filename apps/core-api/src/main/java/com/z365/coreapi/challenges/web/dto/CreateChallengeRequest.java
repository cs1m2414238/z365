package com.z365.coreapi.challenges.web.dto;

import com.z365.coreapi.challenges.domain.Difficulty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChallengeRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    @Min(value = 1, message = "Points must be at least 1")
    @Builder.Default
    private Integer points = 10;

    @Min(value = 100, message = "Time limit must be at least 100ms")
    @Builder.Default
    private Integer timeLimitMs = 2000;

    @Min(value = 64, message = "Memory limit must be at least 64MB")
    @Builder.Default
    private Integer memoryLimitMb = 256;

    private String starterCode;
    private String solutionTemplate;
}

