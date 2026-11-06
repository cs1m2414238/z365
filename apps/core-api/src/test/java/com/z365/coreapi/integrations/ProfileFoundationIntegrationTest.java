package com.z365.coreapi.integrations;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "z365.integrations.sync-enabled=false")
@AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named = "PROFILE_TEST_DB_URL", matches = ".+")
class ProfileFoundationIntegrationTest {
    private static final String PASSWORD = "disposable-test-passphrase";
    private static final String USERS = "/api/v1/users";
    private static final String AUTH = "/api/v1/auth";
    @Autowired MockMvc mvc;
    @Autowired JsonMapper json;
    @Autowired PlatformService platforms;
    @Autowired JdbcClient database;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("PROFILE_TEST_DB_URL"));
        registry.add("spring.datasource.username", () -> System.getenv("PROFILE_TEST_DB_USER"));
        registry.add("spring.datasource.password", () -> System.getenv("PROFILE_TEST_DB_PASSWORD"));
    }

    @Test
    void protectsPrivateResourcesAndSupportsTheAccountLifecycle() throws Exception {
        String username = username();
        mvc.perform(post(AUTH + "/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        String id = register(username);
        AuthSession anonymous = csrf(null);
        mvc.perform(registration(username, anonymous)).andExpect(status().isConflict());
        mvc.perform(write(patch(USERS + "/me"), anonymous, Map.of("displayName", "Unauthorized")))
                .andExpect(status().isUnauthorized());
        for (String path : List.of("", "/activity", "/stats", "/skills", "/ratings", "/achievements", "/platforms")) {
            mvc.perform(get(USERS + "/" + username + path)).andExpect(status().isForbidden());
        }
        AuthSession owner = login(username + "@example.test");
        mvc.perform(get(USERS + "/me").session(owner.session()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id))
                .andExpect(jsonPath("$.data.canEdit").value(true))
                .andExpect(jsonPath("$.data.email").doesNotExist());
        mvc.perform(get(USERS + "/" + username + "/stats").session(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.problemsSolved").value(0))
                .andExpect(jsonPath("$.data.totalContributions").value(0))
                .andExpect(jsonPath("$.data.projectsBuilt").isEmpty());
        mvc.perform(write(post("/api/v1/challenges"), owner, Map.of()))
                .andExpect(status().isForbidden());
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components").doesNotExist());
        mvc.perform(patch(USERS + "/me").session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"isPublic\":true}"))
                .andExpect(status().isForbidden());
        String renamed = username();
        mvc.perform(write(patch(USERS + "/me"), owner, Map.of(
                        "username", renamed.toUpperCase(java.util.Locale.ROOT), "displayName", "Updated Developer",
                        "bio", "Writing tests.", "skills", List.of("Java", "SQL"), "isPublic", true)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.username").value(renamed))
                .andExpect(jsonPath("$.data.skills[0]").value("Java"));
        mvc.perform(get(USERS + "/" + renamed)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.canEdit").value(false))
                .andExpect(jsonPath("$.data.displayName").value("Updated Developer"));
        mvc.perform(get(USERS + "/me").session(owner.session()))
                .andExpect(jsonPath("$.data.username").value(renamed));
        mvc.perform(write(patch(USERS + "/me/settings"), owner, Map.of("isPublic", false)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.isPublic").value(false));
        mvc.perform(get(USERS + "/" + renamed + "/activity")).andExpect(status().isForbidden());
        mvc.perform(post(AUTH + "/logout").session(owner.session()).header(owner.header(), owner.token()))
                .andExpect(status().isNoContent());
        assertThat(owner.session().isInvalid()).isTrue();
        owner = login(renamed);
        mvc.perform(write(delete(USERS + "/me"), owner, Map.of("password", "wrong password")))
                .andExpect(status().isForbidden());
        mvc.perform(write(delete(USERS + "/me"), owner, Map.of("password", PASSWORD)))
                .andExpect(status().isNoContent());
        mvc.perform(get(USERS + "/" + renamed)).andExpect(status().isNotFound());
    }

    @Test
    void importsOnlyVerifiedRecordsDeduplicatesAndFencesLateWrites() throws Exception {
        String username = username();
        String userId = register(username);
        AuthSession owner = login(username);
        mvc.perform(write(patch(USERS + "/me"), owner, Map.of("isPublic", true))).andExpect(status().isOk());
        MvcResult linked = mvc.perform(write(post(USERS + "/me/platforms"), owner,
                        Map.of("platform", "github", "handle", username)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("pending"))
                .andExpect(jsonPath("$.data.rating").isEmpty()).andReturn();
        JsonNode connection = data(linked);
        assertThat(connection.path("verificationCode").asText()).startsWith("z365-");
        mvc.perform(get(USERS + "/" + username + "/platforms"))
                .andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(post(USERS + "/me/platforms/github/sync").session(owner.session())
                        .header(owner.header(), owner.token()))
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.data.syncing").value(true));
        PlatformService.SyncClaim claim = platforms.claim().orElseThrow();
        assertThat(claim.id()).isEqualTo(connection.path("id").asText());
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        PublicPlatformClient.Action first = new PublicPlatformClient.Action("action-1",
                today.minusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC), "PushEvent", "example/first", null);
        PublicPlatformClient.Snapshot snapshot = new PublicPlatformClient.Snapshot(
                UUID.randomUUID().toString(), null, today.minusDays(29),
                List.of(first, first, new PublicPlatformClient.Action("action-2",
                        today.atStartOfDay().toInstant(ZoneOffset.UTC), "PushEvent", "example/latest", null)));
        platforms.storeSync(claim, snapshot);
        mvc.perform(get(USERS + "/" + username + "/platforms"))
                .andExpect(jsonPath("$.data[0].status").value("verified"))
                .andExpect(jsonPath("$.data[0].observedActions").value(2))
                .andExpect(jsonPath("$.data[0].verificationCode").isEmpty());
        mvc.perform(get(USERS + "/" + username + "/activity"))
                .andExpect(jsonPath("$.data.from").value(today.minusDays(364).toString()))
                .andExpect(jsonPath("$.data.to").value(today.toString()))
                .andExpect(jsonPath("$.data.days[0].count").value(1))
                .andExpect(jsonPath("$.data.days[1].count").value(1))
                .andExpect(jsonPath("$.data.recent[0].title").value("example/latest"));
        mvc.perform(get(USERS + "/" + username + "/stats"))
                .andExpect(jsonPath("$.data.totalContributions").value(2))
                .andExpect(jsonPath("$.data.currentStreak").value(2));
        mvc.perform(delete(USERS + "/me/platforms/github").session(owner.session())
                        .header(owner.header(), owner.token()))
                .andExpect(status().isNoContent());
        platforms.storeSync(claim, snapshot);
        assertThat(platforms.list(userId, true)).isEmpty();
        mvc.perform(get(USERS + "/" + username + "/activity")).andExpect(jsonPath("$.data.days").isEmpty());
        mvc.perform(write(delete(USERS + "/me"), owner, Map.of("password", PASSWORD)))
                .andExpect(status().isNoContent());
    }

    private String register(String username) throws Exception {
        MvcResult response = mvc.perform(registration(username, csrf(null)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.isPublic").value(false)).andReturn();
        String id = data(response).path("id").asText();
        String hash = database.sql("SELECT password_hash FROM users WHERE id = :id").param("id", id).query(String.class).single();
        assertThat(hash).startsWith("{bcrypt}").doesNotContain(PASSWORD);
        return id;
    }

    private MockHttpServletRequestBuilder registration(String username, AuthSession session) {
        return write(post(AUTH + "/register"), session, Map.of("username", username,
                "email", username + "@example.test", "displayName", "Test Developer", "password", PASSWORD));
    }

    private AuthSession login(String login) throws Exception {
        AuthSession anonymous = csrf(null);
        MvcResult response = mvc.perform(post(AUTH + "/login").session(anonymous.session())
                        .header(anonymous.header(), anonymous.token()).contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("username", login).param("password", PASSWORD))
                .andExpect(status().isNoContent()).andReturn();
        return csrf((MockHttpSession) response.getRequest().getSession(false));
    }

    private AuthSession csrf(MockHttpSession existing) throws Exception {
        MockHttpServletRequestBuilder request = get(AUTH + "/csrf");
        if (existing != null) request.session(existing);
        MvcResult response = mvc.perform(request).andExpect(status().isOk()).andReturn();
        JsonNode token = data(response);
        return new AuthSession((MockHttpSession) response.getRequest().getSession(false),
                token.path("headerName").asText(), token.path("token").asText());
    }

    private MockHttpServletRequestBuilder write(MockHttpServletRequestBuilder request, AuthSession session,
                                               Map<String, ?> data) {
        return request.session(session.session()).header(session.header(), session.token())
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(data));
    }

    private JsonNode data(MvcResult response) {
        return json.readTree(response.getResponse().getContentAsByteArray()).path("data");
    }

    private static String username() {
        return "test" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private record AuthSession(MockHttpSession session, String header, String token) {}
}
