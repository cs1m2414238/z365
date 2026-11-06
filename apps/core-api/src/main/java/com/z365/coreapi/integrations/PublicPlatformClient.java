package com.z365.coreapi.integrations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Flow;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Component
class PublicPlatformClient {
    private static final int MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
    private static final Set<String> GITHUB_ACTIONS = Set.of("PushEvent", "PullRequestEvent", "IssuesEvent",
            "PullRequestReviewEvent", "IssueCommentEvent", "ReleaseEvent");
    private final HttpClient http;
    private final JsonMapper json;
    private final String githubToken;
    private long lastCodeforcesRequest;

    @Autowired
    PublicPlatformClient(JsonMapper json, @Value("${z365.integrations.github-token:}") String githubToken) {
        this(json, githubToken, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
    }

    PublicPlatformClient(JsonMapper json, String githubToken, HttpClient http) {
        this.json = json;
        this.githubToken = githubToken;
        this.http = http;
    }

    Snapshot fetch(PlatformService.SyncClaim claim) {
        try {
            return switch (claim.platform()) {
                case "github" -> github(claim);
                case "codeforces" -> codeforces(claim);
                default -> throw new ProviderFailure("This platform has no live integration.", false, 0);
            };
        } catch (ProviderFailure failure) {
            throw failure;
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new ProviderFailure("Sync was interrupted.", true, 0);
        } catch (IOException | RuntimeException invalid) {
            throw new ProviderFailure("The provider response could not be read. Sync will retry.", true, 0);
        }
    }

    private Snapshot github(PlatformService.SyncClaim claim) throws IOException, InterruptedException {
        String base = "https://api.github.com/users/" + claim.handle();
        JsonNode identity = request(base, true);
        String providerId = positiveId(identity.path("id"));
        requireOwnership(claim, providerId, identity.path("bio").asText(""));
        LocalDate start = LocalDate.now(ZoneOffset.UTC).minusDays(29);
        List<Action> actions = new ArrayList<>();
        LocalDate oldest = null;
        int seen = 0;
        for (int page = 1; page <= 3; page++) {
            JsonNode events = requireArray(request(base + "/events/public?per_page=100&page=" + page, true));
            seen += events.size();
            for (JsonNode event : events) {
                if (!providerId.equals(event.path("actor").path("id").asText())
                        || !event.path("public").asBoolean(false)) continue;
                Instant occurredAt = Instant.parse(event.path("created_at").asText());
                LocalDate date = day(occurredAt);
                if (oldest == null || date.isBefore(oldest)) oldest = date;
                String kind = event.path("type").asText();
                if (GITHUB_ACTIONS.contains(kind)) {
                    actions.add(new Action(eventId(event.path("id")), occurredAt, kind,
                            title(event.path("repo").path("name"), "GitHub repository"), null));
                }
            }
            if (events.size() < 100) break;
        }
        if (seen == 300 && oldest != null && oldest.isAfter(start)) start = oldest;
        return new Snapshot(providerId, null, start, actions);
    }

    private Snapshot codeforces(PlatformService.SyncClaim claim) throws IOException, InterruptedException {
        JsonNode users = cf("user.info?handles=" + claim.handle());
        if (users.size() != 1) throw invalidData();
        JsonNode identity = users.get(0);
        if (!claim.handle().equalsIgnoreCase(identity.path("handle").asText())) throw invalidData();
        String providerId = claim.handle() + ":" + positiveId(identity.path("registrationTimeSeconds"));
        requireOwnership(claim, providerId, identity.path("organization").asText(""));
        Integer rating = identity.path("rating").isIntegralNumber() && identity.path("rating").asInt() >= 0
                ? identity.path("rating").asInt() : null;
        LocalDate from = LocalDate.now(ZoneOffset.UTC).minusDays(364);
        LocalDate oldest = from;
        List<Action> actions = new ArrayList<>();
        for (int offset = 1; offset <= 2001; offset += 500) {
            JsonNode submissions = cf("user.status?handle=" + claim.handle() + "&from=" + offset + "&count=500");
            boolean reachedStart = false;
            for (JsonNode submission : submissions) {
                Instant occurredAt = Instant.ofEpochSecond(Long.parseLong(
                        positiveId(submission.path("creationTimeSeconds"))));
                LocalDate date = day(occurredAt);
                if (date.isBefore(from)) {
                    reachedStart = true;
                    continue;
                }
                oldest = date;
                String solved = null;
                JsonNode problem = submission.path("problem");
                String contest = problem.path("contestId").asText("");
                String index = problem.path("index").asText("");
                boolean accepted = "OK".equals(submission.path("verdict").asText());
                if (accepted
                        && contest.matches("[0-9]{1,10}") && index.matches("[A-Za-z0-9]{1,12}")) {
                    solved = contest + ":" + index;
                }
                actions.add(new Action(eventId(submission.path("id")), occurredAt,
                        accepted ? "Accepted" : "Submission", title(problem.path("name"), "Codeforces problem"), solved));
            }
            if (submissions.size() < 500 || reachedStart) {
                oldest = from;
                break;
            }
        }
        return new Snapshot(providerId, rating, oldest, actions);
    }

    private static void requireOwnership(PlatformService.SyncClaim claim, String providerId, String proof) {
        if (claim.providerId() != null && !claim.providerId().equals(providerId)) {
            throw new IdentityChanged();
        }
        if (claim.providerId() == null && (claim.code() == null || !proof.contains(claim.code()))) {
            throw new ProviderFailure("Verification code was not found in the public profile.", false, 0);
        }
    }

    private JsonNode cf(String method) throws IOException, InterruptedException {
        long remaining = TimeUnit.MILLISECONDS.toNanos(2100) - (System.nanoTime() - lastCodeforcesRequest);
        if (lastCodeforcesRequest != 0 && remaining > 0) TimeUnit.NANOSECONDS.sleep(remaining);
        lastCodeforcesRequest = System.nanoTime();
        JsonNode response = request("https://codeforces.com/api/" + method, false);
        if (!"OK".equals(response.path("status").asText())) {
            String comment = response.path("comment").asText("").toLowerCase(java.util.Locale.ROOT);
            if (comment.contains("not found")) throw new ProviderFailure("Provider account was not found.", false, 0);
            throw new ProviderFailure("Codeforces could not complete the request. Sync will retry.", true, 120);
        }
        return requireArray(response.path("result"));
    }

    private JsonNode request(String url, boolean github) throws IOException, InterruptedException {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(12))
                .header("User-Agent", "Z365-Profile-Sync")
                .header("Accept", github ? "application/vnd.github+json" : "application/json");
        if (github) {
            request.header("X-GitHub-Api-Version", "2026-03-10");
            if (!githubToken.isBlank()) request.header("Authorization", "Bearer " + githubToken);
        }
        var pending = http.sendAsync(request.build(), metadata -> new LimitedBody());
        HttpResponse<byte[]> response;
        try {
            response = pending.get(12, TimeUnit.SECONDS);
        } catch (TimeoutException | ExecutionException failure) {
            pending.cancel(true);
            throw new IOException("Provider request failed", failure);
        } catch (InterruptedException interrupted) {
            pending.cancel(true);
            throw interrupted;
        }
        int status = response.statusCode();
        if (status == 404) throw new ProviderFailure("Provider account was not found.", false, 0);
        if (status == 403 || status == 429) {
            long retry = response.headers().firstValueAsLong("Retry-After").orElse(120);
            long reset = response.headers().firstValueAsLong("X-RateLimit-Reset").orElse(0)
                    - Instant.now().getEpochSecond();
            throw new ProviderFailure("The provider temporarily refused requests. Sync will retry.",
                    true, Math.max(retry, reset));
        }
        if (status != 200 || response.body().length > MAX_RESPONSE_BYTES) throw invalidData();
        return json.readTree(response.body());
    }

    private static JsonNode requireArray(JsonNode value) {
        if (!value.isArray()) throw invalidData();
        return value;
    }

    private static LocalDate day(Instant value) {
        return value.atOffset(ZoneOffset.UTC).toLocalDate();
    }

    private static String positiveId(JsonNode value) {
        String id = value.asText("");
        if (!id.matches("[1-9][0-9]{0,18}")) throw invalidData();
        return id;
    }

    private static String eventId(JsonNode value) {
        String id = value.asText("");
        if (id.isBlank() || id.length() > 80) throw invalidData();
        return id;
    }

    private static ProviderFailure invalidData() {
        return new ProviderFailure("The provider returned unexpected data. Sync will retry.", true, 0);
    }

    private static final class LimitedBody implements HttpResponse.BodySubscriber<byte[]> {
        private final HttpResponse.BodySubscriber<byte[]> body = HttpResponse.BodySubscribers.ofByteArray();
        private Flow.Subscription subscription;
        private long received;

        @Override public CompletionStage<byte[]> getBody() { return body.getBody(); }

        @Override public void onSubscribe(Flow.Subscription subscription) {
            this.subscription = subscription;
            body.onSubscribe(subscription);
        }

        @Override public void onNext(List<ByteBuffer> buffers) {
            received += buffers.stream().mapToLong(ByteBuffer::remaining).sum();
            if (received > MAX_RESPONSE_BYTES) {
                subscription.cancel();
                body.onError(new IOException("Provider response exceeds the size limit"));
                return;
            }
            body.onNext(buffers);
        }

        @Override public void onError(Throwable failure) { body.onError(failure); }
        @Override public void onComplete() { body.onComplete(); }
    }

    record Snapshot(String providerId, Integer rating, LocalDate coverageFrom, List<Action> actions) {}
    private static String title(JsonNode value, String fallback) {
        String title = value.asText(fallback).strip();
        if (title.isEmpty()) return fallback;
        return title.substring(0, Math.min(title.length(), 150));
    }

    record Action(String id, Instant occurredAt, String kind, String title, String solvedProblem) {
        LocalDate date() { return day(occurredAt); }
    }

    static class ProviderFailure extends RuntimeException {
        final boolean retryable;
        final long retryAfterSeconds;

        ProviderFailure(String message, boolean retryable, long retryAfterSeconds) {
            super(message);
            this.retryable = retryable;
            this.retryAfterSeconds = retryAfterSeconds;
        }
    }

    static final class IdentityChanged extends ProviderFailure {
        IdentityChanged() {
            super("The provider identity changed. Verify the account again.", false, 0);
        }
    }
}
