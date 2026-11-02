package com.z365.coreapi.challenges.service;

import com.z365.coreapi.challenges.domain.Challenge;
import com.z365.coreapi.challenges.domain.ChallengeStatus;
import com.z365.coreapi.challenges.domain.Difficulty;
import com.z365.coreapi.challenges.repository.ChallengeRepository;
import com.z365.coreapi.challenges.web.dto.ChallengeResponse;
import com.z365.coreapi.challenges.web.dto.CreateChallengeRequest;
import com.z365.coreapi.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChallengeServiceImpl implements ChallengeService {

    private static final Logger log = LoggerFactory.getLogger(ChallengeServiceImpl.class);
    private final ChallengeRepository challengeRepository;

    @Override
    public List<ChallengeResponse> getChallenges(Difficulty difficulty, ChallengeStatus status) {
        log.debug("Fetching challenges with difficulty: {} and status: {}", difficulty, status);
        List<Challenge> challenges;

        if (difficulty != null && status != null) {
            challenges = challengeRepository.findByDifficultyAndStatus(difficulty, status);
        } else if (difficulty != null) {
            challenges = challengeRepository.findByDifficulty(difficulty);
        } else if (status != null) {
            challenges = challengeRepository.findByStatus(status);
        } else {
            challenges = challengeRepository.findAll();
        }

        return challenges.stream()
                .map(ChallengeResponse::fromEntity)
                .toList();
    }

    @Override
    public ChallengeResponse getChallengeById(String id) {
        log.debug("Fetching challenge by ID: {}", id);
        return challengeRepository.findById(id)
                .map(ChallengeResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge", "id", id));
    }

    @Override
    public ChallengeResponse getChallengeBySlug(String slug) {
        log.debug("Fetching challenge by slug: {}", slug);
        return challengeRepository.findBySlug(slug)
                .map(ChallengeResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge", "slug", slug));
    }

    @Override
    @Transactional
    public ChallengeResponse createChallenge(CreateChallengeRequest request) {
        log.info("Creating new challenge with title: {}", request.getTitle());

        String generatedSlug = generateSlug(request.getTitle());
        String generatedId = "ch-" + UUID.randomUUID().toString().substring(0, 8);

        Challenge challenge = Challenge.builder()
                .id(generatedId)
                .title(request.getTitle())
                .slug(generatedSlug)
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .status(ChallengeStatus.PUBLISHED)
                .points(request.getPoints() != null ? request.getPoints() : 100)
                .timeLimitMs(request.getTimeLimitMs() != null ? request.getTimeLimitMs() : 2000)
                .memoryLimitMb(request.getMemoryLimitMb() != null ? request.getMemoryLimitMb() : 256)
                .starterCode(request.getStarterCode())
                .solutionTemplate(request.getSolutionTemplate())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Challenge saved = challengeRepository.save(challenge);
        log.info("Successfully created challenge with ID: {}", saved.getId());
        return ChallengeResponse.fromEntity(saved);
    }

    private String generateSlug(String title) {
        String base = title.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
        return base + "-" + UUID.randomUUID().toString().substring(0, 4);
    }
}

