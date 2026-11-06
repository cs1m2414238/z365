package com.z365.coreapi.users;

import com.z365.coreapi.common.ApiResponse;
import com.z365.coreapi.integrations.PlatformService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
class ProfileController {
    private final ProfileService profiles;
    private final ProfileActivity activity;
    private final PlatformService platforms;

    ProfileController(ProfileService profiles, ProfileActivity activity, PlatformService platforms) {
        this.profiles = profiles;
        this.activity = activity;
        this.platforms = platforms;
    }

    @GetMapping("/me")
    ApiResponse<ProfileService.Profile> me(Principal principal) {
        return ApiResponse.success(profiles.withSkills(profiles.ownProfile(principal.getName())));
    }

    @GetMapping("/{username}")
    ApiResponse<ProfileService.Profile> profile(@PathVariable String username, Principal viewer) {
        return ApiResponse.success(profiles.withSkills(visible(username, viewer)));
    }

    @PatchMapping("/me")
    ApiResponse<ProfileService.Profile> update(Principal principal,
                                                @Valid @RequestBody ProfileService.ProfileUpdate update) {
        return ApiResponse.success(profiles.update(principal.getName(), update));
    }

    @GetMapping("/me/settings")
    ApiResponse<ProfileService.Settings> settings(Principal principal) {
        return ApiResponse.success(profiles.settings(principal.getName()));
    }

    @PatchMapping("/me/settings")
    ApiResponse<ProfileService.Settings> updateSettings(Principal principal,
                                                        @Valid @RequestBody PrivacySettings update) {
        return ApiResponse.success(profiles.updatePrivacy(principal.getName(), update.isPublic()));
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(Principal principal, @Valid @RequestBody AccountDeletion deletion, HttpServletRequest request) {
        profiles.delete(principal.getName(), deletion.password());
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
    }

    @GetMapping("/{username}/stats")
    ApiResponse<ProfileActivity.Stats> stats(@PathVariable String username, Principal viewer) {
        return ApiResponse.success(activity.stats(visible(username, viewer).id()));
    }

    @GetMapping("/{username}/activity")
    ApiResponse<ProfileActivity.Activity> activity(@PathVariable String username, Principal viewer) {
        return ApiResponse.success(activity.activity(visible(username, viewer).id()));
    }

    @GetMapping("/{username}/skills")
    ApiResponse<List<Object>> skills(@PathVariable String username, Principal viewer) {
        visible(username, viewer);
        return ApiResponse.success(List.of());
    }

    @GetMapping("/{username}/ratings")
    ApiResponse<UnrankedProfile> ratings(@PathVariable String username, Principal viewer) {
        visible(username, viewer);
        return ApiResponse.success(new UnrankedProfile(null, null,
                "Z365 engineering scores are unavailable. External ratings are shown with their platform.",
                List.of(), List.of()));
    }

    @GetMapping("/{username}/achievements")
    ApiResponse<Map<String, Object>> achievements(@PathVariable String username, Principal viewer) {
        visible(username, viewer);
        return ApiResponse.success(Map.of("items", List.of(), "totalAvailable", 0));
    }

    @GetMapping("/{username}/platforms")
    ApiResponse<List<PlatformService.Connection>> platforms(@PathVariable String username, Principal viewer) {
        ProfileService.Profile profile = visible(username, viewer);
        return ApiResponse.success(platforms.list(profile.id(), profile.canEdit()));
    }

    @PostMapping("/me/platforms")
    ApiResponse<PlatformService.Connection> link(Principal principal, @Valid @RequestBody LinkPlatform request) {
        return ApiResponse.success(platforms.link(profiles.ownProfile(principal.getName()).id(),
                request.platform(), request.handle()));
    }

    @PostMapping("/me/platforms/{platform}/sync")
    @ResponseStatus(HttpStatus.ACCEPTED)
    ApiResponse<PlatformService.Connection> sync(Principal principal, @PathVariable String platform) {
        return ApiResponse.success(platforms.queue(profiles.ownProfile(principal.getName()).id(), platform));
    }

    @DeleteMapping("/me/platforms/{platform}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void unlink(Principal principal, @PathVariable String platform) {
        platforms.unlink(principal.getName(), platform);
    }

    private ProfileService.Profile visible(String username, Principal viewer) {
        return profiles.readProfile(username, viewer == null ? null : viewer.getName());
    }

    record PrivacySettings(@NotNull Boolean isPublic) {}
    record AccountDeletion(@NotBlank @Size(max = 72) String password) {}
    record LinkPlatform(@NotBlank @Size(max = 16) String platform,
                        @NotBlank @Size(max = 50) @Pattern(regexp = "[a-zA-Z0-9_.-]+") String handle) {}
    record UnrankedProfile(Integer score, String level, String methodology, List<Object> history,
                           List<Object> rankings) {}
}
