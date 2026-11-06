package com.z365.coreapi.users;

import com.z365.coreapi.common.ResourceNotFoundException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProfileService {
    private static final String PROFILE_SELECT = """
            SELECT u.id, u.username, u.created_at, p.*
            FROM users u JOIN user_profiles p ON p.user_id = u.id
            """;

    private final JdbcClient database;
    private final PasswordEncoder passwords;

    public ProfileService(JdbcClient database, PasswordEncoder passwords) {
        this.database = database;
        this.passwords = passwords;
    }

    @Transactional
    public Profile register(String username, String email, String displayName, String password) {
        String id = UUID.randomUUID().toString();
        try {
            database.sql("""
                    INSERT INTO users (id, username, email, password_hash)
                    VALUES (:id, :username, :email, :password)
                    """)
                    .param("id", id)
                    .param("username", canonicalUsername(username))
                    .param("email", email.strip().toLowerCase(Locale.ROOT))
                    .param("password", passwords.encode(password))
                    .update();
            database.sql("INSERT INTO user_profiles (user_id, display_name) VALUES (:id, :name)")
                    .param("id", id).param("name", displayName.strip()).update();
        } catch (DuplicateKeyException duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username or email is already registered.");
        }
        return ownProfile(id);
    }

    public Optional<Credentials> credentials(String login) {
        String normalized = login.strip().toLowerCase(Locale.ROOT);
        String field = normalized.contains("@") ? "email" : "username";
        return database.sql("SELECT id, password_hash, role FROM users WHERE lower(" + field + ") = :login")
                .param("login", normalized)
                .query((row, index) -> new Credentials(row.getString("id"), row.getString("password_hash"),
                        row.getString("role")))
                .optional();
    }

    public Profile ownProfile(String ownerId) {
        return profile(PROFILE_SELECT + " WHERE u.id = :key", ownerId, ownerId);
    }

    public Profile readProfile(String username, String viewerId) {
        Profile profile = profile(PROFILE_SELECT + " WHERE lower(u.username) = :key",
                username.toLowerCase(Locale.ROOT), viewerId);
        if (!profile.isPublic() && !profile.canEdit()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This profile is private.");
        }
        return profile;
    }

    private Profile profile(String sql, String key, String viewerId) {
        Profile profile = database.sql(sql).param("key", key)
                .query((row, index) -> new Profile(
                        row.getString("id"), row.getString("username"), row.getString("display_name"),
                        row.getString("bio"), row.getString("location"), row.getString("college"),
                        row.getString("role_label"), row.getString("github_url"), row.getString("linkedin_url"),
                        row.getString("avatar_url"), row.getString("banner_url"),
                        row.getObject("created_at", OffsetDateTime.class).toInstant(),
                        row.getBoolean("is_public"), false, false, row.getString("id").equals(viewerId),
                        List.of()))
                .optional().orElseThrow(() -> new ResourceNotFoundException("Profile not found."));
        return profile;
    }

    public Profile withSkills(Profile profile) {
        List<String> skills = database.sql("SELECT name FROM user_profile_skills WHERE user_id = :id ORDER BY name")
                .param("id", profile.id()).query(String.class).list();
        return new Profile(profile.id(), profile.username(), profile.displayName(), profile.bio(), profile.location(),
                profile.college(), profile.role(), profile.githubUrl(), profile.linkedinUrl(), profile.avatarUrl(),
                profile.bannerUrl(), profile.joinedAt(), profile.isPublic(), profile.verified(), profile.active(),
                profile.canEdit(), skills);
    }

    @Transactional
    public Profile update(String id, ProfileUpdate request) {
        lockAccount(id);
        Profile current = ownProfile(id);
        String username = request.username() == null ? current.username() : canonicalUsername(request.username());
        String displayName = replace(request.displayName(), current.displayName());
        if (displayName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name is required.");
        }
        try {
            database.sql("UPDATE users SET username = :username, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                    .param("username", username).param("id", id).update();
        } catch (DuplicateKeyException duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already registered.");
        }
        database.sql("""
                UPDATE user_profiles
                SET display_name = :name, bio = :bio, location = :location, college = :college,
                    role_label = :role, github_url = :github, linkedin_url = :linkedin,
                    avatar_url = :avatar, banner_url = :banner, is_public = :public
                WHERE user_id = :id
                """)
                .param("id", id).param("name", displayName)
                .param("bio", replace(request.bio(), current.bio()))
                .param("location", replace(request.location(), current.location()))
                .param("college", replace(request.college(), current.college()))
                .param("role", replace(request.role(), current.role()))
                .param("github", checkedUrl(request.githubUrl(), current.githubUrl(), "github.com"))
                .param("linkedin", checkedUrl(request.linkedinUrl(), current.linkedinUrl(), "linkedin.com"))
                .param("avatar", checkedUrl(request.avatarUrl(), current.avatarUrl(), null))
                .param("banner", checkedUrl(request.bannerUrl(), current.bannerUrl(), null))
                .param("public", request.isPublic() == null ? current.isPublic() : request.isPublic())
                .update();
        if (request.skills() != null) {
            database.sql("DELETE FROM user_profile_skills WHERE user_id = :id").param("id", id).update();
            for (String skill : request.skills().stream().map(String::strip).distinct().toList()) {
                database.sql("INSERT INTO user_profile_skills (user_id, name) VALUES (:id, :name)")
                        .param("id", id).param("name", skill).update();
            }
        }
        return withSkills(ownProfile(id));
    }

    public Settings settings(String id) {
        return database.sql("""
                SELECT u.email, p.is_public FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = :id
                """).param("id", id)
                .query((row, index) -> new Settings(row.getString("email"), row.getBoolean("is_public")))
                .optional().orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    @Transactional
    public Settings updatePrivacy(String id, boolean isPublic) {
        lockAccount(id);
        database.sql("UPDATE user_profiles SET is_public = :public WHERE user_id = :id")
                .param("public", isPublic).param("id", id).update();
        return settings(id);
    }

    @Transactional
    public void delete(String id, String password) {
        String hash = database.sql("SELECT password_hash FROM users WHERE id = :id FOR UPDATE")
                .param("id", id).query(String.class).optional()
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        if (password.getBytes(StandardCharsets.UTF_8).length > 72 || !passwords.matches(password, hash)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The password is incorrect.");
        }
        database.sql("DELETE FROM users WHERE id = :id").param("id", id).update();
    }

    private void lockAccount(String id) {
        database.sql("SELECT id FROM users WHERE id = :id FOR UPDATE")
                .param("id", id).query(String.class).optional()
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    private static String canonicalUsername(String value) {
        String username = value.strip().toLowerCase(Locale.ROOT);
        if (!username.matches("[a-z0-9_]{3,24}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use 3–24 letters, digits, or underscores.");
        }
        return username;
    }

    private static String replace(String value, String previous) {
        return value == null ? previous : value.strip();
    }

    private static String checkedUrl(String value, String previous, String allowedHost) {
        if (value == null) return previous;
        if (value.isBlank()) return allowedHost == null ? null : "";
        try {
            URI url = URI.create(value.strip());
            String host = url.getHost();
            if ("https".equalsIgnoreCase(url.getScheme()) && host != null && url.getUserInfo() == null
                    && (allowedHost == null || allowedHost.equalsIgnoreCase(host)
                    || ("www." + allowedHost).equalsIgnoreCase(host))) {
                return url.toASCIIString();
            }
        } catch (IllegalArgumentException invalidUrl) {
            // Return the same validation response for malformed and disallowed URLs.
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid HTTPS profile or image URL.");
    }

    public record Credentials(String id, String passwordHash, String role) {}

    public record Profile(String id, String username, String displayName, String bio, String location, String college,
                          String role, String githubUrl, String linkedinUrl, String avatarUrl, String bannerUrl,
                          Instant joinedAt, boolean isPublic, boolean verified, boolean active, boolean canEdit,
                          List<String> skills) {}

    public record ProfileUpdate(
            @Pattern(regexp = "[a-zA-Z0-9_]{3,24}") String username,
            @Size(max = 50) String displayName,
            @Size(max = 180) String bio,
            @Size(max = 45) String location,
            @Size(max = 70) String college,
            @Size(max = 60) String role,
            @Size(max = 200) String githubUrl,
            @Size(max = 200) String linkedinUrl,
            @Size(max = 500) String avatarUrl,
            @Size(max = 500) String bannerUrl,
            Boolean isPublic,
            @Size(max = 12) List<@NotBlank @Size(max = 40) String> skills) {}

    public record Settings(String email, boolean isPublic) {}
}
