package com.z365.coreapi.users;

import com.z365.coreapi.integrations.PlatformService;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.TreeMap;

@Service
class ProfileActivity {
    private final JdbcClient database;
    private final PlatformService platforms;

    ProfileActivity(JdbcClient database, PlatformService platforms) {
        this.database = database;
        this.platforms = platforms;
    }

    @Transactional(readOnly = true)
    Activity activity(String userId) {
        LocalDate to = LocalDate.now(ZoneOffset.UTC);
        LocalDate from = to.minusDays(364);
        return new Activity(from, to, days(userId, from, to), recent(userId, from, to));
    }

    private List<Day> days(String userId, LocalDate from, LocalDate to) {
        TreeMap<LocalDate, Long> days = new TreeMap<>();
        platforms.dailyActivity(userId, from, to).forEach(day -> days.put(day.date(), day.count()));
        database.sql("""
                SELECT (solved_at AT TIME ZONE 'UTC')::date AS day, count(*) AS count
                FROM user_progress WHERE user_id = :id AND status = 'SOLVED'
                  AND solved_at >= :from AND solved_at < :until
                GROUP BY day
                """).param("id", userId).param("from", from.atStartOfDay().atOffset(ZoneOffset.UTC))
                .param("until", to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC))
                .query((row, index) -> new Day(row.getObject("day", LocalDate.class), row.getLong("count")))
                .list().forEach(day -> days.merge(day.date(), day.count(), Long::sum));
        return days.entrySet().stream().map(day -> new Day(day.getKey(), day.getValue())).toList();
    }

    private List<Recent> recent(String userId, LocalDate from, LocalDate to) {
        List<Recent> recent = new ArrayList<>();
        for (PlatformService.RecentAction action : platforms.recentActions(userId, from, to)) {
            boolean codeforces = "codeforces".equals(action.platform());
            String verb = switch (action.kind()) {
                case "Accepted" -> "Solved";
                case "Submission" -> "Submitted";
                case "PushEvent" -> "Pushed";
                case "PullRequestEvent" -> "Pull request";
                case "IssuesEvent" -> "Issue activity";
                case "PullRequestReviewEvent" -> "Reviewed";
                case "IssueCommentEvent" -> "Commented";
                case "ReleaseEvent" -> "Released";
                default -> "Updated";
            };
            recent.add(new Recent(action.id(), verb, action.title(), codeforces ? "Codeforces" : "GitHub",
                    action.occurredAt(), codeforces ? "practice" : "projects", codeforces ? "code" : "layers",
                    codeforces ? "blue" : "green", action.url()));
        }
        recent.addAll(database.sql("""
                SELECT p.id, p.solved_at, c.title
                FROM user_progress p JOIN challenges c ON c.id = p.challenge_id
                WHERE p.user_id = :id AND p.status = 'SOLVED' AND p.solved_at >= :from AND p.solved_at < :until
                ORDER BY p.solved_at DESC LIMIT 20
                """).param("id", userId).param("from", from.atStartOfDay().atOffset(ZoneOffset.UTC))
                .param("until", to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC))
                .query((row, index) -> new Recent(row.getString("id"), "Solved", row.getString("title"), "Z365",
                        row.getObject("solved_at", OffsetDateTime.class).toInstant(), "practice", "check", "green", null)).list());
        return recent.stream().sorted(Comparator.comparing(Recent::occurredAt).reversed()
                .thenComparing(Recent::id)).limit(20).toList();
    }

    @Transactional(readOnly = true)
    Stats stats(String userId) {
        long solved = database.sql("SELECT count(*) FROM user_progress WHERE user_id = :id AND status = 'SOLVED'")
                .param("id", userId).query(Long.class).single();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Day> days = days(userId, today.minusDays(364), today);
        int current = 0;
        int longest = 0;
        int run = 0;
        LocalDate previous = null;
        for (Day day : days) {
            run = day.date().minusDays(1).equals(previous) ? run + 1 : 1;
            longest = Math.max(longest, run);
            previous = day.date();
        }
        if (previous != null && !previous.isBefore(today.minusDays(1))) current = run;
        long contributions = days.stream().mapToLong(Day::count).sum();
        return new Stats(solved, null, null, null, days.size(), current, longest, contributions);
    }

    record Day(LocalDate date, long count) {}
    record Activity(LocalDate from, LocalDate to, List<Day> days, List<Recent> recent) {}
    record Recent(String id, String verb, String title, String detail, Instant occurredAt,
                  String section, String icon, String color, String url) {}
    record Stats(long problemsSolved, Long projectsBuilt, Long labsCompleted, Long agentsCreated, int activeDays,
                 int currentStreak, int longestStreak, long totalContributions) {}
}
