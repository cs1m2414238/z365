import { achievements, activities, defaultProfile, skills } from "@/lib/data";
import { activitySummary, demoActivity } from "@/lib/activity";
import type {
  ProfileActivity,
  ProfileDto,
  ProfileRatings,
  ProfileStats,
  PlatformConnection,
} from "./schemas";

export const demoProfile: ProfileDto = {
  bannerUrl: null,
  id: "preview-user",
  username: defaultProfile.handle,
  displayName: defaultProfile.name,
  bio: defaultProfile.bio,
  location: defaultProfile.location,
  college: defaultProfile.college,
  githubUrl: defaultProfile.github,
  linkedinUrl: defaultProfile.linkedin,
  role: defaultProfile.role,
  avatarUrl: "/images/avatar.jpg",
  joinedAt: "2025-03-15T12:00:00Z",
  isPublic: true,
  verified: true,
  active: true,
  canEdit: true,
};
const summary = activitySummary(demoActivity);
export const demoStats: ProfileStats = {
  problemsSolved: 1248,
  projectsBuilt: 36,
  labsCompleted: 12,
  agentsCreated: 5,
  ...summary,
  totalContributions: summary.total,
};
export const demoActivityResponse: ProfileActivity = {
  from: demoActivity[0].date,
  to: demoActivity[demoActivity.length - 1].date,
  days: demoActivity,
  recent: activities.map((activity, index) => ({
    ...activity,
    color: activity.color as "green",
    section: activity.section as "practice",
    id: `preview-${index}`,
    occurredAt: new Date(
      Date.parse("2026-11-02T12:00:00Z") - (index + 1) * 7_200_000,
    ).toISOString(),
  })),
};
const values = [
  1568, 1580, 1602, 1634, 1621, 1610, 1647, 1680, 1664, 1652, 1688, 1712, 1700,
  1724, 1768, 1779, 1763, 1787, 1842,
];
export const demoRatings: ProfileRatings = {
  score: 1842,
  level: "EXPERT",
  methodology:
    "Illustrative Z365 engineering score. Production methodology and verified results are supplied by the backend.",
  history: values.map((rating, index) => ({
    rating,
    date: new Date(
      Date.parse("2026-11-02T12:00:00Z") -
        [90, 80, 70, 60, 50, 40, 30, 25, 20, 15, 12, 10, 7, 6, 5, 4, 3, 2, 0][
          index
        ] *
          86_400_000,
    )
      .toISOString()
      .slice(0, 10),
  })),
  rankings: [
    {
      scope: "Z365",
      label: "Z365 learners",
      rank: 412,
      percentile: 0.8,
      participants: 52139,
    },
    {
      scope: "College",
      label: "IIT Bombay",
      rank: 12,
      percentile: 2.1,
      participants: 572,
    },
    {
      scope: "Country",
      label: "learners in India",
      rank: 86,
      percentile: 0.5,
      participants: 17204,
    },
  ],
};
export const demoSkills = skills.map((skill) => ({
  name: skill.name,
  icon: skill.icon,
  score: skill.value,
  evidenceCount: 12,
  source: "Sample assessment-based scores",
}));
export const demoPlatforms: PlatformConnection[] = [
  {
    id: "preview-lc",
    platform: "leetcode",
    handle: "aaravm",
    url: "https://leetcode.com/",
    status: "verified",
    rating: 1842,
    rank: 3921,
    lastSyncedAt: "2026-11-02T12:00:00Z",
  },
  {
    id: "preview-cf",
    platform: "codeforces",
    handle: "aaravm",
    url: "https://codeforces.com/",
    status: "verified",
    rating: 1681,
    rank: 7306,
    lastSyncedAt: "2026-11-02T12:00:00Z",
  },
  {
    id: "preview-gfg",
    platform: "gfg",
    handle: "aaravm",
    url: "https://www.geeksforgeeks.org/",
    status: "verified",
    rating: 1726,
    rank: 5138,
    lastSyncedAt: "2026-11-02T12:00:00Z",
  },
  {
    id: "preview-cc",
    platform: "codechef",
    handle: "aaravm",
    url: "https://www.codechef.com/",
    status: "verified",
    rating: 1575,
    rank: 12670,
    lastSyncedAt: "2026-11-02T12:00:00Z",
  },
  {
    id: "preview-hr",
    platform: "hackerrank",
    handle: "aaravm",
    url: "https://www.hackerrank.com/",
    status: "verified",
    rating: 1592,
    rank: 21480,
    lastSyncedAt: "2026-11-02T12:00:00Z",
  },
];
export const demoAchievements = {
  totalAvailable: 12,
  items: achievements.map((achievement, index) => ({
    ...achievement,
    id: `preview-badge-${index}`,
    color: achievement.color as "purple",
    earnedAt: new Date(`${achievement.date} 12:00:00 UTC`).toISOString(),
  })),
};
