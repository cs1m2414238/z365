package com.z365.coreapi.challenges.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z365.coreapi.challenges.domain.ChallengeStatus;
import com.z365.coreapi.challenges.domain.Difficulty;
import com.z365.coreapi.challenges.service.ChallengeService;
import com.z365.coreapi.challenges.web.dto.ChallengeResponse;
import com.z365.coreapi.challenges.web.dto.CreateChallengeRequest;
import com.z365.coreapi.common.ResourceNotFoundException;
import com.z365.coreapi.config.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ChallengeController.class)
@Import(SecurityConfig.class)
class ChallengeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private ChallengeService challengeService;

    @Test
    @DisplayName("GET /api/v1/challenges returns 200 with list of challenges")
    void shouldReturnChallengesList() throws Exception {
        ChallengeResponse challenge = ChallengeResponse.builder()
                .id("ch-001")
                .title("Two Sum")
                .slug("two-sum")
                .description("Two sum description")
                .difficulty(Difficulty.EASY)
                .status(ChallengeStatus.PUBLISHED)
                .points(10)
                .timeLimitMs(1000)
                .memoryLimitMb(128)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(challengeService.getChallenges(null, null)).thenReturn(List.of(challenge));

        mockMvc.perform(get("/api/v1/challenges")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value("ch-001"))
                .andExpect(jsonPath("$.data[0].title").value("Two Sum"));
    }

    @Test
    @DisplayName("GET /api/v1/challenges/{id} returns 200 when found")
    void shouldReturnChallengeById() throws Exception {
        ChallengeResponse challenge = ChallengeResponse.builder()
                .id("ch-001")
                .title("Two Sum")
                .slug("two-sum")
                .description("Two sum description")
                .difficulty(Difficulty.EASY)
                .status(ChallengeStatus.PUBLISHED)
                .points(10)
                .timeLimitMs(1000)
                .memoryLimitMb(128)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(challengeService.getChallengeById("ch-001")).thenReturn(challenge);

        mockMvc.perform(get("/api/v1/challenges/ch-001")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Two Sum"));
    }

    @Test
    @DisplayName("GET /api/v1/challenges/{id} returns 404 when not found")
    void shouldReturn404WhenNotFound() throws Exception {
        when(challengeService.getChallengeById("non-existent"))
                .thenThrow(new ResourceNotFoundException("Challenge", "id", "non-existent"));

        mockMvc.perform(get("/api/v1/challenges/non-existent")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("POST /api/v1/challenges creates challenge and returns 201")
    void shouldCreateChallenge() throws Exception {
        CreateChallengeRequest request = CreateChallengeRequest.builder()
                .title("Valid Challenge")
                .description("Valid description")
                .difficulty(Difficulty.MEDIUM)
                .points(20)
                .timeLimitMs(2000)
                .memoryLimitMb(256)
                .build();

        ChallengeResponse response = ChallengeResponse.builder()
                .id("ch-002")
                .title("Valid Challenge")
                .slug("valid-challenge")
                .description("Valid description")
                .difficulty(Difficulty.MEDIUM)
                .status(ChallengeStatus.PUBLISHED)
                .points(20)
                .timeLimitMs(2000)
                .memoryLimitMb(256)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(challengeService.createChallenge(any(CreateChallengeRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/challenges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("ch-002"))
                .andExpect(jsonPath("$.data.title").value("Valid Challenge"));
    }

    @Test
    @DisplayName("POST /api/v1/challenges returns 400 when title is blank")
    void shouldReturn400WhenValidationFails() throws Exception {
        CreateChallengeRequest request = CreateChallengeRequest.builder()
                .title("")
                .description("Valid description")
                .difficulty(Difficulty.EASY)
                .build();

        mockMvc.perform(post("/api/v1/challenges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.validationErrors.title").exists());
    }
}
