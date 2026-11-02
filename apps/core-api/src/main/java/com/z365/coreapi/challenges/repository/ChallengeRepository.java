package com.z365.coreapi.challenges.repository;

import com.z365.coreapi.challenges.domain.Challenge;
import com.z365.coreapi.challenges.domain.ChallengeStatus;
import com.z365.coreapi.challenges.domain.Difficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChallengeRepository extends JpaRepository<Challenge, String> {

    Optional<Challenge> findBySlug(String slug);

    List<Challenge> findByStatus(ChallengeStatus status);

    List<Challenge> findByDifficulty(Difficulty difficulty);

    List<Challenge> findByDifficultyAndStatus(Difficulty difficulty, ChallengeStatus status);
}

