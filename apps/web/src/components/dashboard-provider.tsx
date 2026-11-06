import { DashboardContext, profileQueryKey } from "@/lib/dashboard-context";
import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import { defaultProfile, type Profile } from "@/lib/data";
import { profileApi } from "@/lib/api/client";
import {
  demoAchievements,
  demoActivityResponse,
  demoPlatforms,
  demoProfile,
  demoRatings,
  demoSkills,
  demoStats,
} from "@/lib/api/demo";
import {
  platformLinkSchema,
  platformSchema,
  profileFormSchema,
  usernameSchema,
  type PlatformConnection,
  type PlatformLink,
  type ProfileDto,
} from "@/lib/api/schemas";

const emptyProfile: Profile = {
  name: "Your coding profile",
  handle: "",
  role: "Developer",
  bio: "Your identity and progress will appear here when your profile connects.",
  college: "",
  location: "",
  github: "",
  linkedin: "",
};
const toView = (profile: ProfileDto): Profile => ({
  name: profile.displayName,
  handle: profile.username,
  role: profile.role,
  bio: profile.bio,
  college: profile.college,
  location: profile.location,
  github: profile.githubUrl,
  linkedin: profile.linkedinUrl,
  isPublic: profile.isPublic,
  avatarUrl: profile.avatarUrl ?? "",
  bannerUrl: profile.bannerUrl ?? "",
  skills: profile.skills ?? [],
});

function useDashboardState() {
  const location = useLocation();
  const match = useMatch("/u/:username");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(location.search);
  const profileRoute =
    ["/", "/profile", "/preview"].includes(location.pathname) || Boolean(match);
  const requestedSource =
    params.get("source") || import.meta.env.VITE_DATA_SOURCE || "api";
  const source =
    !profileRoute || location.pathname === "/preview"
      ? "demo"
      : requestedSource === "demo"
        ? "demo"
        : "api";
  const requestedUsername =
    match?.params.username ||
    params.get("username") ||
    import.meta.env.VITE_PROFILE_USERNAME;
  const ownProfile = source === "api" && !requestedUsername;
  const identityKey = source === "demo" ? "aaravm" : requestedUsername || "me";
  const validUsername =
    ownProfile || usernameSchema.safeParse(identityKey).success;
  const [preview, setPreview] = useState<Profile>(defaultProfile);
  const [previewPlatforms, setPreviewPlatforms] =
    useState<PlatformConnection[]>(demoPlatforms);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("z365.profile.v1") || "null",
      );
      const parsed = profileFormSchema.safeParse(saved);
      if (parsed.success) setPreview(parsed.data);
      const connections = JSON.parse(
        localStorage.getItem("z365.platforms.preview.v1") || "null",
      );
      const parsedConnections = platformSchema.array().safeParse(connections);
      if (parsedConnections.success)
        setPreviewPlatforms(parsedConnections.data);
    } catch {
      /* Preview storage is optional; live profile data never comes from it. */
    }
  }, []);
  const identity = useQuery({
    queryKey: profileQueryKey(source, identityKey, "identity"),
    queryFn: ({ signal }) =>
      source === "demo"
        ? Promise.resolve(demoProfile)
        : ownProfile
          ? profileApi.me(signal)
          : profileApi.profile(identityKey, signal),
    enabled: validUsername && profileRoute,
  });
  const username = ownProfile ? identity.data?.username || "" : identityKey;
  const enabled =
    Boolean(username) && validUsername && profileRoute && identity.isSuccess;
  const stats = useQuery({
    queryKey: profileQueryKey(source, username, "stats"),
    queryFn: ({ signal }) =>
      source === "demo"
        ? Promise.resolve(demoStats)
        : profileApi.stats(username, signal),
    enabled,
  });
  const activity = useQuery({
    queryKey: profileQueryKey(source, username, "activity"),
    queryFn: ({ signal }) =>
      source === "demo"
        ? Promise.resolve(demoActivityResponse)
        : profileApi.activity(username, signal),
    enabled,
  });
  const skills = useQuery({
    queryKey: profileQueryKey(source, username, "skills"),
    queryFn: ({ signal }) =>
      source === "demo"
        ? Promise.resolve(demoSkills)
        : profileApi.skills(username, signal),
    enabled,
  });
  const ratings = useQuery({
    queryKey: profileQueryKey(source, username, "ratings"),
    queryFn: ({ signal }) =>
      source === "demo"
        ? Promise.resolve(demoRatings)
        : profileApi.ratings(username, signal),
    enabled,
  });
  const platforms = useQuery({
    queryKey: profileQueryKey(source, username, "platforms"),
    queryFn: ({ signal }) =>
      source === "demo"
        ? Promise.resolve(demoPlatforms)
        : profileApi.platforms(username, signal),
    enabled,
    refetchInterval: (query) =>
      source === "api" &&
      query.state.data?.some((connection) => connection.syncing)
        ? 2500
        : false,
  });
  useEffect(() => {
    if (
      source !== "api" ||
      !platforms.data ||
      platforms.data.some((connection) => connection.syncing)
    )
      return;
    for (const part of ["activity", "stats"]) {
      void queryClient.invalidateQueries({
        queryKey: profileQueryKey(source, username, part),
      });
    }
  }, [platforms.data, queryClient, source, username]);
  const achievements = useQuery({
    queryKey: profileQueryKey(source, username, "achievements"),
    queryFn: ({ signal }) =>
      source === "demo"
        ? Promise.resolve(demoAchievements)
        : profileApi.achievements(username, signal),
    enabled,
  });
  const profile =
    source === "demo"
      ? preview
      : identity.isSuccess
        ? toView(identity.data)
        : { ...emptyProfile, handle: validUsername ? username : "" };
  const record =
    source === "demo"
      ? {
          ...demoProfile,
          displayName: preview.name,
          username: preview.handle,
          isPublic: preview.isPublic ?? true,
          avatarUrl: preview.avatarUrl || demoProfile.avatarUrl,
          bannerUrl: preview.bannerUrl || null,
          skills: preview.skills,
        }
      : identity.isSuccess
        ? identity.data
        : undefined;
  const saveProfile = useMutation({
    mutationFn: async (value: Profile) => {
      if (source === "api" && (!identity.isSuccess || !identity.data.canEdit))
        throw new Error("This profile is read-only for your account.");
      const clean = profileFormSchema.parse(value);
      if (source === "demo") {
        setPreview(clean);
        try {
          localStorage.setItem("z365.profile.v1", JSON.stringify(clean));
        } catch {
          /* Session-only preview is still editable. */
        }
        return {
          ...demoProfile,
          username: clean.handle,
          displayName: clean.name,
        };
      }
      return profileApi.update({
        username: clean.handle,
        displayName: clean.name,
        bio: clean.bio,
        location: clean.location,
        college: clean.college,
        githubUrl: clean.github,
        linkedinUrl: clean.linkedin,
        isPublic: clean.isPublic,
        role: clean.role,
        avatarUrl: clean.avatarUrl,
        bannerUrl: clean.bannerUrl,
        skills: clean.skills,
      });
    },
    onSuccess: async (updated) => {
      if (source === "demo") return;
      queryClient.setQueryData(
        profileQueryKey("api", updated.username, "identity"),
        updated,
      );
      if (ownProfile)
        queryClient.setQueryData(
          profileQueryKey("api", "me", "identity"),
          updated,
        );
      await queryClient.invalidateQueries({
        queryKey: profileQueryKey("api", username),
      });
      if (updated.username !== username)
        navigate(`/u/${encodeURIComponent(updated.username)}?source=api`, {
          replace: true,
        });
    },
  });
  function persistPlatforms(connections: PlatformConnection[]) {
    setPreviewPlatforms(connections);
    try {
      localStorage.setItem(
        "z365.platforms.preview.v1",
        JSON.stringify(connections),
      );
    } catch {
      /* Keep preview changes for the session. */
    }
  }
  const linkPlatform = useMutation({
    mutationFn: async (value: PlatformLink) => {
      if (source === "api" && (!identity.isSuccess || !identity.data.canEdit))
        throw new Error("This profile is read-only for your account.");
      const input = platformLinkSchema.parse(value);
      if (source !== "demo") return profileApi.linkPlatform(input);
      const origins: Record<PlatformLink["platform"], string> = {
        github: "https://github.com/",
        leetcode: "https://leetcode.com/u/",
        codeforces: "https://codeforces.com/profile/",
        codechef: "https://www.codechef.com/users/",
        gfg: "https://www.geeksforgeeks.org/profile/",
        hackerrank: "https://www.hackerrank.com/",
      };
      const connection: PlatformConnection = {
        ...input,
        id: crypto.randomUUID(),
        url: origins[input.platform] + encodeURIComponent(input.handle),
        status: "pending",
        rating: null,
        rank: null,
        lastSyncedAt: null,
      };
      persistPlatforms([
        ...previewPlatforms.filter((item) => item.platform !== input.platform),
        connection,
      ]);
      return connection;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: profileQueryKey(source, username, "platforms"),
      }),
  });
  const unlinkPlatform = useMutation({
    mutationFn: async (platform: PlatformLink["platform"]) => {
      if (source === "api" && (!identity.isSuccess || !identity.data.canEdit))
        throw new Error("This profile is read-only for your account.");
      if (source === "demo")
        persistPlatforms(
          previewPlatforms.filter((item) => item.platform !== platform),
        );
      else await profileApi.unlinkPlatform(platform);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: profileQueryKey(source, username, "platforms"),
      }),
  });
  const syncPlatform = useMutation({
    mutationFn: (platform: PlatformLink["platform"]) =>
      profileApi.syncPlatform(platform),
    onSuccess: (updated) => {
      const key = profileQueryKey(source, username, "platforms");
      queryClient.setQueryData<PlatformConnection[]>(key, (previous) =>
        previous?.map((connection) =>
          connection.id === updated.id ? updated : connection,
        ),
      );
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
  return {
    source,
    username,
    validUsername,
    profileRoute,
    profile,
    record,
    identity,
    stats,
    activity,
    skills,
    ratings,
    platforms,
    achievements,
    connections:
      source === "demo"
        ? previewPlatforms
        : (identity.isSuccess && platforms.data) || [],
    canEdit: source === "demo" || (identity.isSuccess && identity.data.canEdit),
    saveProfile,
    linkPlatform,
    unlinkPlatform,
    syncPlatform,
    refresh: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: profileQueryKey(source, username),
        }),
        ownProfile &&
          queryClient.invalidateQueries({
            queryKey: profileQueryKey(source, identityKey),
          }),
      ]),
  };
}

export type DashboardState = ReturnType<typeof useDashboardState>;
export function DashboardProvider({ children }: { children: ReactNode }) {
  const value = useDashboardState();
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
