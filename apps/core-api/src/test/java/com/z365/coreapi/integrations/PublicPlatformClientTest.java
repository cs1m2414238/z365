package com.z365.coreapi.integrations;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PublicPlatformClientTest {
    private final HttpClient http = mock(HttpClient.class);
    private final PublicPlatformClient client = new PublicPlatformClient(JsonMapper.builder().build(), "", http);

    @Test
    void doesNotImportGitHubActivityForAnUnverifiedHandle() {
        provider(Map.of("/users/octocat", response(200, "{\"id\":1,\"bio\":\"No ownership marker\"}")));
        assertThatThrownBy(() -> client.fetch(claim("github", "octocat")))
                .isInstanceOf(PublicPlatformClient.ProviderFailure.class).hasMessageContaining("code was not found");
        verify(http, times(1)).sendAsync(any(HttpRequest.class), anyBody());
    }

    @Test
    void importsOnlyPublicGitHubActionsFromTheVerifiedActor() {
        String now = Instant.now().toString();
        String events = """
                [
                  {"id":"100","type":"PushEvent","actor":{"id":1},"public":true,"created_at":"%s"},
                  {"id":"101","type":"PushEvent","actor":{"id":2},"public":true,"created_at":"%s"},
                  {"id":"102","type":"PushEvent","actor":{"id":1},"public":false,"created_at":"%s"},
                  {"id":"103","type":"WatchEvent","actor":{"id":1},"public":true,"created_at":"%s"}
                ]
                """.formatted(now, now, now, now);
        provider(Map.of("/users/octocat", response(200, "{\"id\":1,\"bio\":\"z365-test-proof\"}"),
                "/users/octocat/events/public", response(200, events)));
        PublicPlatformClient.Snapshot result = client.fetch(claim("github", "octocat"));
        assertThat(result.providerId()).isEqualTo("1");
        assertThat(result.rating()).isNull();
        assertThat(result.actions()).extracting(PublicPlatformClient.Action::id).containsExactly("100");
    }

    @Test
    void readsCodeforcesRatingAndDistinguishesAcceptedProblemsFromAttempts() {
        long now = Instant.now().getEpochSecond();
        provider(Map.of(
                "/api/user.info", response(200, """
                        {"status":"OK","result":[{"handle":"tourist","registrationTimeSeconds":1300000000,
                        "organization":"z365-test-proof","rating":3900}]}
                        """),
                "/api/user.status", response(200, """
                        {"status":"OK","result":[
                        {"id":100,"creationTimeSeconds":%d,"verdict":"OK","problem":{"contestId":123,"index":"A"}},
                        {"id":101,"creationTimeSeconds":%d,"verdict":"WRONG_ANSWER","problem":{"contestId":123,"index":"B"}}
                        ]}
                        """.formatted(now, now))));
        PublicPlatformClient.Snapshot result = client.fetch(claim("codeforces", "tourist"));
        assertThat(result.providerId()).isEqualTo("tourist:1300000000");
        assertThat(result.rating()).isEqualTo(3900);
        assertThat(result.coverageFrom()).isEqualTo(LocalDate.now(ZoneOffset.UTC).minusDays(364));
        assertThat(result.actions()).extracting(PublicPlatformClient.Action::solvedProblem)
                .containsExactly("123:A", null);
    }

    @Test
    void preservesProviderRetryDelay() {
        HttpResponse<byte[]> response = response(429, "{}");
        when(response.headers()).thenReturn(HttpHeaders.of(Map.of("Retry-After", List.of("600")), (key, value) -> true));
        provider(Map.of("/users/octocat", response));
        assertThatThrownBy(() -> client.fetch(claim("github", "octocat")))
                .isInstanceOfSatisfying(PublicPlatformClient.ProviderFailure.class, failure -> {
                    assertThat(failure.retryable).isTrue();
                    assertThat(failure.retryAfterSeconds).isEqualTo(600);
                });
    }

    private void provider(Map<String, HttpResponse<byte[]>> responses) {
        when(http.sendAsync(any(HttpRequest.class), anyBody())).thenAnswer(call -> {
            HttpRequest request = call.getArgument(0);
            HttpResponse<byte[]> response = responses.get(request.uri().getPath());
            if (response == null) throw new AssertionError("Unexpected provider path " + request.uri().getPath());
            return CompletableFuture.completedFuture(response);
        });
    }

    private static HttpResponse.BodyHandler<byte[]> anyBody() {
        return any();
    }

    @SuppressWarnings("unchecked")
    private static HttpResponse<byte[]> response(int status, String json) {
        HttpResponse<byte[]> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(json.getBytes(StandardCharsets.UTF_8));
        when(response.headers()).thenReturn(HttpHeaders.of(Map.of(), (key, value) -> true));
        return response;
    }

    private static PlatformService.SyncClaim claim(String platform, String handle) {
        return new PlatformService.SyncClaim("connection", platform, handle, "z365-test-proof", null, "lease", 0);
    }
}
