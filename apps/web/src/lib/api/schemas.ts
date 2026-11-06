import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_]{3,24}$/, "Use 3–24 letters, numbers, or underscores.");
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    try {
      return (
        new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
      );
    } catch {
      return false;
    }
  }, "Expected a valid calendar date.");
const count = z.number().int().nonnegative();
const nullableUrl = z
  .string()
  .url()
  .refine(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Use an http or https URL.",
  )
  .nullable()
  .default(null);
const socialLink = (host: string) =>
  z
    .string()
    .trim()
    .max(200)
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return (
          url.protocol === "https:" &&
          [host, `www.${host}`].includes(url.hostname)
        );
      } catch {
        return false;
      }
    }, `Use a valid https://${host} profile URL.`);
const imageLink = z
  .union([z.literal(""), z.url({ protocol: /^https$/ }).max(500)])
  .optional();
const profileSkills = z.array(z.string().trim().min(1).max(40)).max(12);

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1, "Add your name.").max(50),
  bio: z.string().trim().max(180),
  location: z.string().trim().max(45),
  college: z.string().trim().max(70),
  githubUrl: socialLink("github.com"),
  linkedinUrl: socialLink("linkedin.com"),
  isPublic: z.boolean(),
  role: z.string().trim().max(60).optional(),
  avatarUrl: imageLink,
  bannerUrl: imageLink,
  skills: profileSkills.optional(),
});
export const profileSchema = profileUpdateSchema.extend({
  id: z.string().min(1),
  role: z.string().max(60),
  avatarUrl: nullableUrl,
  bannerUrl: nullableUrl,
  skills: profileSkills.optional(),
  joinedAt: z.string().datetime({ offset: true }),
  verified: z.boolean().default(false),
  active: z.boolean().default(false),
  canEdit: z.boolean().default(false),
});
export const statsSchema = z.object({
  problemsSolved: count,
  projectsBuilt: count.nullable(),
  labsCompleted: count.nullable(),
  agentsCreated: count.nullable(),
  activeDays: count,
  currentStreak: count,
  longestStreak: count,
  totalContributions: count,
});
export const activityDaySchema = z.object({ date: dateSchema, count });
export const recentActivitySchema = z.object({
  id: z.string().min(1),
  verb: z.string().max(40),
  title: z.string().max(150),
  detail: z.string().max(300),
  occurredAt: z.string().datetime({ offset: true }),
  url: nullableUrl.optional(),
  section: z.enum(["learn", "practice", "projects", "labs", "agents"]),
  icon: z.string().max(30),
  color: z.enum(["green", "purple", "pink", "blue", "orange", "slate"]),
});
export const activitySchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
    days: z.array(activityDaySchema).max(366),
    recent: z.array(recentActivitySchema).max(100),
  })
  .superRefine((value, ctx) => {
    const span = Date.parse(value.to) - Date.parse(value.from);
    if (span < 0 || span > 365 * 86_400_000)
      ctx.addIssue({
        code: "custom",
        message: "The activity range must cover at most 366 days.",
      });
    const keys = new Set<string>();
    for (const day of value.days) {
      if (keys.has(day.date) || day.date < value.from || day.date > value.to)
        ctx.addIssue({
          code: "custom",
          message:
            "Activity dates must be unique and inside the requested range.",
        });
      keys.add(day.date);
    }
  });
export const skillSchema = z.object({
  name: z.string().min(1).max(60),
  score: z.number().min(0).max(100),
  evidenceCount: count,
  icon: z.string().max(30),
  source: z.string().max(120),
});
export const ratingsSchema = z.object({
  score: z.number().nonnegative().nullable(),
  level: z.string().max(30).nullable(),
  methodology: z.string().max(2000),
  history: z
    .array(z.object({ date: dateSchema, rating: z.number().nonnegative() }))
    .max(1000),
  rankings: z
    .array(
      z.object({
        scope: z.enum(["Z365", "College", "Country"]),
        label: z.string().max(80),
        rank: z.number().int().positive().nullable(),
        percentile: z.number().min(0).max(100).nullable(),
        participants: count,
      }),
    )
    .max(3),
});
export const platformNameSchema = z.enum([
  "github",
  "leetcode",
  "codeforces",
  "codechef",
  "gfg",
  "hackerrank",
]);
export const platformLinkSchema = z.object({
  platform: platformNameSchema,
  handle: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use a platform username, not a URL."),
});
export const platformSchema = platformLinkSchema.extend({
  id: z.string().min(1),
  url: z
    .string()
    .url()
    .refine((url) => new URL(url).protocol === "https:"),
  status: z.enum(["pending", "verified", "error", "limited"]),
  rating: z.number().nonnegative().nullable(),
  rank: z.number().int().positive().nullable(),
  lastSyncedAt: z.string().datetime({ offset: true }).nullable(),
  verificationCode: z.string().nullable().optional(),
  syncError: z.string().nullable().optional(),
  syncing: z.boolean().optional(),
  coverageFrom: dateSchema.nullable().optional(),
  observedActions: count.nullable().optional(),
  solvedProblems: count.nullable().optional(),
});
export const achievementSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(60),
  subtitle: z.string().max(80),
  description: z.string().max(1000),
  earnedAt: z.string().datetime({ offset: true }),
  icon: z.string().max(30),
  color: z.enum(["green", "purple", "pink", "blue", "orange", "slate"]),
});
export const achievementCollectionSchema = z.object({
  items: z.array(achievementSchema).max(200),
  totalAvailable: count,
});
export const profileFormSchema = z.object({
  name: profileUpdateSchema.shape.displayName,
  handle: usernameSchema,
  bio: profileUpdateSchema.shape.bio,
  location: profileUpdateSchema.shape.location,
  college: profileUpdateSchema.shape.college,
  github: profileUpdateSchema.shape.githubUrl,
  linkedin: profileUpdateSchema.shape.linkedinUrl,
  role: z.string().trim().max(60),
  avatarUrl: imageLink,
  bannerUrl: imageLink,
  skills: profileSkills.optional(),
  isPublic: z.boolean().default(true),
});

export const registrationSchema = z.object({
  username: usernameSchema,
  email: z.email().max(100),
  displayName: profileUpdateSchema.shape.displayName,
  password: z
    .string()
    .min(12)
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Use a password with at most 72 UTF-8 bytes.",
    ),
});
export const accountSettingsSchema = z.object({
  email: z.email(),
  isPublic: z.boolean(),
});

export type ProfileDto = z.infer<typeof profileSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type ProfileStats = z.infer<typeof statsSchema>;
export type ProfileActivity = z.infer<typeof activitySchema>;
export type ProfileRatings = z.infer<typeof ratingsSchema>;
export type ProfileSkill = z.infer<typeof skillSchema>;
export type PlatformConnection = z.infer<typeof platformSchema>;
export type PlatformLink = z.infer<typeof platformLinkSchema>;
export type ProfileAchievement = z.infer<typeof achievementSchema>;
