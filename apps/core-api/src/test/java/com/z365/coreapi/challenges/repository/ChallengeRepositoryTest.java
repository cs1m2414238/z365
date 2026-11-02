package com.z365.coreapi.challenges.repository;

import com.z365.coreapi.challenges.domain.Challenge;
import com.z365.coreapi.challenges.domain.ChallengeStatus;
import com.z365.coreapi.challenges.domain.Difficulty;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ChallengeRepositoryTest {

    @Autowired
    private ChallengeRepository challengeRepository;

    @Test
    @DisplayName("Should persist and find challenge by slug")
    void shouldPersistAndFindBySlug() {
        Challenge challenge = Challenge.builder()
                .id("ch-test-1")
                .title("Unique Slug Challenge")
                .slug("unique-slug-challenge")
                .description("Test challenge description")
                .difficulty(Difficulty.EASY)
                .status(ChallengeStatus.PUBLISHED)
                .points(10)
                .timeLimitMs(1000)
                .memoryLimitMb(128)
                .build();

        challengeRepository.save(challenge);

        Optional<Challenge> found = challengeRepository.findBySlug("unique-slug-challenge");
        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Unique Slug Challenge");
    }

    @Test
    @DisplayName("Should filter challenges by difficulty and status")
    void shouldFilterByDifficultyAndStatus() {
        Challenge c1 = Challenge.builder()
                .id("ch-filter-1")
                .title("Hard Published")
                .slug("hard-published")
                .description("Hard problem")
                .difficulty(Difficulty.HARD)
                .status(ChallengeStatus.PUBLISHED)
                .build();

        Challenge c2 = Challenge.builder()
                .id("ch-filter-2")
                .title("Hard Draft")
                .slug("hard-draft")
                .description("Draft problem")
                .difficulty(Difficulty.HARD)
                .status(ChallengeStatus.DRAFT)
                .build();

        challengeRepository.saveAll(List.of(c1, c2));

        List<Challenge> published = challengeRepository.findByDifficultyAndStatus(Difficulty.HARD, ChallengeStatus.PUBLISHED);
        assertThat(published).hasSize(1);
        assertThat(published.get(0).getTitle()).isEqualTo("Hard Published");
    }
}
