package com.z365.coreapi.challenges.service;

import com.z365.coreapi.challenges.domain.Challenge;
import com.z365.coreapi.challenges.domain.ChallengeStatus;
import com.z365.coreapi.challenges.domain.Difficulty;
import com.z365.coreapi.challenges.repository.ChallengeRepository;
import com.z365.coreapi.challenges.web.dto.ChallengeResponse;
import com.z365.coreapi.challenges.web.dto.CreateChallengeRequest;
import com.z365.coreapi.common.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChallengeServiceTest {

    @Mock
    private ChallengeRepository challengeRepository;

    @InjectMocks
    private ChallengeServiceImpl challengeService;

    private Challenge sampleChallenge;

    @BeforeEach
    void setUp() {
        sampleChallenge = Challenge.builder()
                .id("ch-001")
                .title("Two Sum")
                .slug("two-sum")
                .description("Solve the two sum problem")
                .difficulty(Difficulty.EASY)
                .status(ChallengeStatus.PUBLISHED)
                .points(10)
                .timeLimitMs(1000)
                .memoryLimitMb(128)
                .starterCode("def two_sum(): pass")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Should return all challenges when no filters provided")
    void shouldReturnAllChallenges() {
        when(challengeRepository.findAll()).thenReturn(List.of(sampleChallenge));

        List<ChallengeResponse> result = challengeService.getChallenges(null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Two Sum");
        verify(challengeRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should return challenges filtered by difficulty")
    void shouldReturnFilteredChallenges() {
        when(challengeRepository.findByDifficulty(Difficulty.EASY)).thenReturn(List.of(sampleChallenge));

        List<ChallengeResponse> result = challengeService.getChallenges(Difficulty.EASY, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDifficulty()).isEqualTo(Difficulty.EASY);
        verify(challengeRepository, times(1)).findByDifficulty(Difficulty.EASY);
    }

    @Test
    @DisplayName("Should return challenge by ID")
    void shouldReturnChallengeById() {
        when(challengeRepository.findById("ch-001")).thenReturn(Optional.of(sampleChallenge));

        ChallengeResponse result = challengeService.getChallengeById("ch-001");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("ch-001");
        assertThat(result.getTitle()).isEqualTo("Two Sum");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when challenge ID not found")
    void shouldThrowExceptionWhenIdNotFound() {
        when(challengeRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> challengeService.getChallengeById("non-existent"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Challenge not found with id: 'non-existent'");
    }

    @Test
    @DisplayName("Should create challenge successfully")
    void shouldCreateChallenge() {
        CreateChallengeRequest request = CreateChallengeRequest.builder()
                .title("Binary Search")
                .description("Implement standard binary search")
                .difficulty(Difficulty.EASY)
                .points(15)
                .timeLimitMs(1500)
                .memoryLimitMb(256)
                .starterCode("def binary_search(): pass")
                .build();

        when(challengeRepository.save(any(Challenge.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ChallengeResponse response = challengeService.createChallenge(request);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Binary Search");
        assertThat(response.getPoints()).isEqualTo(15);
        assertThat(response.getSlug()).startsWith("binary-search");
        verify(challengeRepository, times(1)).save(any(Challenge.class));
    }
}

