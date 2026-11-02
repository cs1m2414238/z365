package com.z365.coreapi.challenges.web;

import com.z365.coreapi.challenges.domain.ChallengeStatus;
import com.z365.coreapi.challenges.domain.Difficulty;
import com.z365.coreapi.challenges.service.ChallengeService;
import com.z365.coreapi.challenges.web.dto.ChallengeResponse;
import com.z365.coreapi.challenges.web.dto.CreateChallengeRequest;
import com.z365.coreapi.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/challenges")
@RequiredArgsConstructor
@Tag(name = "Challenges", description = "Endpoints for exploring, filtering, and managing coding challenges")
public class ChallengeController {

    private final ChallengeService challengeService;

    @GetMapping
    @Operation(summary = "List all challenges", description = "Retrieve coding challenges with optional difficulty and status filters")
    public ResponseEntity<ApiResponse<List<ChallengeResponse>>> getAllChallenges(
            @Parameter(description = "Filter by difficulty (EASY, MEDIUM, HARD)")
            @RequestParam(required = false) Difficulty difficulty,
            @Parameter(description = "Filter by status (DRAFT, PUBLISHED, ARCHIVED)")
            @RequestParam(required = false) ChallengeStatus status) {
        List<ChallengeResponse> challenges = challengeService.getChallenges(difficulty, status);
        return ResponseEntity.ok(ApiResponse.success(challenges, "Challenges retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get challenge by ID", description = "Retrieve a single coding challenge by its unique identifier")
    public ResponseEntity<ApiResponse<ChallengeResponse>> getChallengeById(
            @PathVariable String id) {
        ChallengeResponse challenge = challengeService.getChallengeById(id);
        return ResponseEntity.ok(ApiResponse.success(challenge, "Challenge retrieved successfully"));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get challenge by slug", description = "Retrieve a single coding challenge by its SEO-friendly slug")
    public ResponseEntity<ApiResponse<ChallengeResponse>> getChallengeBySlug(
            @PathVariable String slug) {
        ChallengeResponse challenge = challengeService.getChallengeBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(challenge, "Challenge retrieved successfully"));
    }

    @PostMapping
    @Operation(summary = "Create a challenge", description = "Add a new challenge to the catalog")
    public ResponseEntity<ApiResponse<ChallengeResponse>> createChallenge(
            @Valid @RequestBody CreateChallengeRequest request) {
        ChallengeResponse created = challengeService.createChallenge(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Challenge created successfully"));
    }
}

