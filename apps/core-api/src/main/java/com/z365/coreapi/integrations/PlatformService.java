package com.z365.coreapi.integrations;

import com.z365.coreapi.common.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PlatformService {
    private static final Map<String, String> PROFILE_URLS = Map.of(
            "github", "https://github.com/",
            "codeforces", "https://codeforces.com/profile/",
            "leetcode", "https://leetcode.com/u/",
            "gfg", "https://www.geeksforgeeks.org/profile/",
            "codechef", "https://www.codechef.com/users/",
            "hackerrank", "https://www.hackerrank.com/");
    private static final String CONNECTION_SELECT = """
            SELECT a.*, (a.lease_id IS NOT NULL OR a.next_sync_at <= CURRENT_TIMESTAMP) AS syncing,
              (SELECT count(*) FROM external_activity e WHERE e.account_id = a.id
                  AND e.occurred_on >= :from AND e.occurred_on <= :to) AS observed_actions,
              (SELECT count(DISTINCT e.solved_problem) FROM external_activity e WHERE e.account_id = a.id
                  AND e.occurred_on >= :from AND e.occurred_on <= :to) AS observed_solves
            FROM platform_accounts a
            """;
    private final JdbcClient database;
    private final JdbcTemplate jdbc;

    public PlatformService(JdbcClient database, JdbcTemplate jdbc) {
        this.database = database;
        this.jdbc = jdbc;
    }

    public List<Connection> list(String userId, boolean owner) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return database.sql(CONNECTION_SELECT + """
                WHERE a.user_id = :user AND (:owner OR a.verified_at IS NOT NULL)
                ORDER BY a.platform
                """)
                .param("user", userId).param("owner", owner).param("from", today.minusDays(364)).param("to", today)
                .query((row, index) -> connection(row, owner)).list();
    }

    @Transactional
    public Connection link(String userId, String platform, String rawHandle) {
        String handle = rawHandle.toLowerCase(Locale.ROOT);
        if (!PROFILE_URLS.containsKey(platform) || !validHandle(platform, handle)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid platform handle.");
        }
        database.sql("""
                INSERT INTO platform_accounts (id, user_id, platform, handle, verification_code)
                VALUES (:id, :user, :platform, :handle, :code)
                ON CONFLICT (user_id, platform) DO NOTHING
                """).param("id", UUID.randomUUID().toString()).param("user", userId)
                .param("platform", platform).param("handle", handle)
                .param("code", supported(platform) ? verificationCode() : null).update();
        Connection connection = ownConnection(userId, platform);
        if (!connection.handle().equals(handle)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Disconnect the existing account before changing its handle.");
        }
        return connection;
    }

    @Transactional
    public Connection queue(String userId, String platform) {
        if (!supported(platform)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This platform has limited integration.");
        }
        int queued = database.sql("""
                UPDATE platform_accounts SET next_sync_at = CURRENT_TIMESTAMP, last_error = NULL
                WHERE user_id = :user AND platform = :platform AND lease_id IS NULL
                  AND (last_synced_at IS NULL OR last_synced_at < CURRENT_TIMESTAMP - INTERVAL '1 minute')
                  AND (last_error IS NULL OR next_sync_at IS NULL OR next_sync_at <= CURRENT_TIMESTAMP)
                """).param("user", userId).param("platform", platform).update();
        Connection connection = ownConnection(userId, platform);
        if (queued == 0 && !connection.syncing()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Wait until the next sync is available.");
        }
        return connection;
    }

    @Transactional
    public void unlink(String userId, String platform) {
        database.sql("DELETE FROM platform_accounts WHERE user_id = :user AND platform = :platform")
                .param("user", userId).param("platform", platform).update();
    }

    private Connection ownConnection(String id, String platform) {
        return list(id, true).stream().filter(connection -> platform.equals(connection.platform())).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Platform connection not found."));
    }

    Optional<SyncClaim> claim() {
        return database.sql("""
                WITH candidate AS (
                    SELECT id FROM platform_accounts WHERE next_sync_at <= CURRENT_TIMESTAMP
                    ORDER BY next_sync_at LIMIT 1 FOR UPDATE SKIP LOCKED
                )
                UPDATE platform_accounts a SET lease_id = :lease, next_sync_at = CURRENT_TIMESTAMP + INTERVAL '5 minutes'
                FROM candidate WHERE a.id = candidate.id RETURNING a.*
                """).param("lease", UUID.randomUUID().toString())
                .query((row, index) -> new SyncClaim(row.getString("id"), row.getString("platform"),
                        row.getString("handle"), row.getString("verification_code"), row.getString("provider_id"),
                        row.getString("lease_id"), row.getInt("failures"))).optional();
    }

    @Transactional
    public void storeSync(SyncClaim claim, PublicPlatformClient.Snapshot snapshot) {
        int updated = database.sql("""
                UPDATE platform_accounts SET verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP),
                  provider_id = :provider, rating = :rating, last_synced_at = CURRENT_TIMESTAMP,
                  verification_code = NULL, next_sync_at = CURRENT_TIMESTAMP + INTERVAL '6 hours',
                  lease_id = NULL, failures = 0, last_error = NULL, coverage_from = :coverage
                WHERE id = :id AND lease_id = :lease
                """).param("provider", snapshot.providerId()).param("rating", snapshot.rating(), Types.INTEGER)
                .param("coverage", snapshot.coverageFrom()).param("id", claim.id()).param("lease", claim.lease())
                .update();
        if (updated == 0) return;
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate from = today.minusDays(364);
        List<Object[]> records = snapshot.actions().stream()
                .filter(action -> !action.date().isBefore(from) && !action.date().isAfter(today))
                .map(action -> new Object[] {claim.id(), action.id(), action.date(), action.solvedProblem(),
                        action.occurredAt().atOffset(ZoneOffset.UTC), action.kind(), action.title()})
                .toList();
        if (!records.isEmpty()) {
            jdbc.batchUpdate("""
                    INSERT INTO external_activity
                      (account_id, provider_event_id, occurred_on, solved_problem, occurred_at, event_kind, title)
                    VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (account_id, provider_event_id)
                    DO UPDATE SET occurred_on = EXCLUDED.occurred_on, solved_problem = EXCLUDED.solved_problem,
                      occurred_at = EXCLUDED.occurred_at, event_kind = EXCLUDED.event_kind, title = EXCLUDED.title
                    """, records);
        }
        database.sql("DELETE FROM external_activity WHERE account_id = :id AND occurred_on < :from")
                .param("id", claim.id()).param("from", from).update();
    }

    void fail(SyncClaim claim, PublicPlatformClient.ProviderFailure failure) {
        long delay = Math.max(Math.min(3600L, 60L << Math.min(6, claim.failures())), failure.retryAfterSeconds);
        OffsetDateTime next = failure.retryable
                ? OffsetDateTime.now(ZoneOffset.UTC).plusSeconds(Math.min(delay, 86_400)) : null;
        database.sql("""
                UPDATE platform_accounts SET lease_id = NULL, last_error = :error, failures = LEAST(failures + 1, 20),
                  next_sync_at = :next
                WHERE id = :id AND lease_id = :lease
                """).param("error", failure.getMessage()).param("next", next, Types.TIMESTAMP_WITH_TIMEZONE)
                .param("id", claim.id()).param("lease", claim.lease()).update();
    }

    @Transactional
    public void revoke(SyncClaim claim, String message) {
        int updated = database.sql("""
                UPDATE platform_accounts SET verified_at = NULL, provider_id = NULL, verification_code = :code,
                  last_synced_at = NULL, rating = NULL, coverage_from = NULL, next_sync_at = NULL, lease_id = NULL,
                  failures = 0, last_error = :error
                WHERE id = :id AND lease_id = :lease
                """).param("code", verificationCode()).param("error", message)
                .param("id", claim.id()).param("lease", claim.lease()).update();
        if (updated != 0) {
            database.sql("DELETE FROM external_activity WHERE account_id = :id").param("id", claim.id()).update();
        }
    }

    public List<DailyCount> dailyActivity(String userId, LocalDate from, LocalDate to) {
        return database.sql("""
                SELECT e.occurred_on, count(*) AS count
                FROM external_activity e JOIN platform_accounts a ON a.id = e.account_id
                WHERE a.user_id = :user AND a.verified_at IS NOT NULL AND e.occurred_on BETWEEN :from AND :to
                GROUP BY e.occurred_on
                """).param("user", userId).param("from", from).param("to", to)
                .query((row, index) -> new DailyCount(row.getObject("occurred_on", LocalDate.class),
                        row.getLong("count"))).list();
    }

    public List<RecentAction> recentActions(String userId, LocalDate from, LocalDate to) {
        return database.sql("""
                SELECT e.account_id, e.provider_event_id, e.occurred_at, e.event_kind, e.title, a.platform, a.handle
                FROM external_activity e JOIN platform_accounts a ON a.id = e.account_id
                WHERE a.user_id = :user AND a.verified_at IS NOT NULL
                  AND e.occurred_at IS NOT NULL AND e.occurred_on BETWEEN :from AND :to
                ORDER BY e.occurred_at DESC, e.provider_event_id DESC LIMIT 20
                """).param("user", userId).param("from", from).param("to", to)
                .query((row, index) -> new RecentAction(row.getString("account_id") + ":" + row.getString("provider_event_id"),
                        row.getObject("occurred_at", OffsetDateTime.class).toInstant(), row.getString("event_kind"),
                        row.getString("title"), row.getString("platform"),
                        PROFILE_URLS.get(row.getString("platform")) + row.getString("handle"))).list();
    }

    private static Connection connection(ResultSet row, boolean owner) throws SQLException {
        String platform = row.getString("platform");
        String handle = row.getString("handle");
        boolean verified = row.getObject("verified_at") != null;
        String error = row.getString("last_error");
        String status = !supported(platform) ? "limited" : verified ? "verified" : error == null ? "pending" : "error";
        OffsetDateTime synced = row.getObject("last_synced_at", OffsetDateTime.class);
        return new Connection(row.getString("id"), platform, handle, PROFILE_URLS.get(platform) + handle, status,
                verified ? row.getObject("rating", Integer.class) : null, null,
                synced == null ? null : synced.toInstant(), owner ? row.getString("verification_code") : null,
                owner ? error : null, owner && row.getBoolean("syncing"),
                verified ? row.getObject("coverage_from", LocalDate.class) : null,
                verified && synced != null ? row.getLong("observed_actions") : null,
                verified && synced != null && "codeforces".equals(platform) ? row.getLong("observed_solves") : null);
    }

    private static boolean validHandle(String platform, String handle) {
        if ("github".equals(platform)) {
            return handle.matches("[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?") && !handle.contains("--");
        }
        if ("codeforces".equals(platform)) return handle.matches("[a-z0-9_-]{3,24}");
        return handle.matches("[a-z0-9_][a-z0-9_.-]{0,49}");
    }

    private static boolean supported(String platform) {
        return "github".equals(platform) || "codeforces".equals(platform);
    }

    private static String verificationCode() {
        return "z365-" + UUID.randomUUID().toString().replace("-", "");
    }

    record SyncClaim(String id, String platform, String handle, String code, String providerId, String lease, int failures) {}

    public record Connection(String id, String platform, String handle, String url, String status, Integer rating,
                             Integer rank, Instant lastSyncedAt, String verificationCode, String syncError,
                             boolean syncing, LocalDate coverageFrom, Long observedActions, Long solvedProblems) {}

    public record DailyCount(LocalDate date, long count) {}
    public record RecentAction(String id, Instant occurredAt, String kind, String title, String platform, String url) {}
}
