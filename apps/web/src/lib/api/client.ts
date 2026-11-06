import axios from "axios";
import { z } from "zod";
import {
  achievementCollectionSchema,
  accountSettingsSchema,
  activitySchema,
  platformLinkSchema,
  platformSchema,
  profileSchema,
  profileUpdateSchema,
  ratingsSchema,
  registrationSchema,
  skillSchema,
  statsSchema,
  usernameSchema,
  type PlatformLink,
  type ProfileUpdate,
} from "./schemas";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  timeout: 12_000,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: "application/json" },
});
export class ApiContractError extends Error {
  constructor() {
    super(
      "The server returned an unexpected profile response. Please try again or contact support.",
    );
    this.name = "ApiContractError";
  }
}
export function parseResponse<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = z
    .object({ success: z.literal(true), data: schema })
    .safeParse(body);
  if (!parsed.success) throw new ApiContractError();
  return parsed.data.data;
}
const userPath = (username: string) =>
  `/users/${encodeURIComponent(usernameSchema.parse(username))}`;
async function get<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await api.get(path, { signal });
  return parseResponse(schema, response.data);
}

const csrfSchema = z.object({
  headerName: z.literal("X-CSRF-TOKEN"),
  token: z.string().min(1),
});

async function write(
  method: "post" | "patch" | "delete",
  url: string,
  data?: unknown,
) {
  const csrf = await get("/auth/csrf", csrfSchema);
  return api.request({
    method,
    url,
    data,
    headers: { [csrf.headerName]: csrf.token },
  });
}

export const accountApi = {
  register: async (input: z.input<typeof registrationSchema>) => {
    const response = await write(
      "post",
      "/auth/register",
      registrationSchema.parse(input),
    );
    return parseResponse(profileSchema, response.data);
  },
  login: async (username: string, password: string) => {
    await write(
      "post",
      "/auth/login",
      new URLSearchParams({ username, password }),
    );
    return get("/users/me", profileSchema);
  },
  logout: () => write("post", "/auth/logout"),
  settings: (signal?: AbortSignal) =>
    get("/users/me/settings", accountSettingsSchema, signal),
  updatePrivacy: async (isPublic: boolean) => {
    const response = await write("patch", "/users/me/settings", { isPublic });
    return parseResponse(accountSettingsSchema, response.data);
  },
  delete: (password: string) => write("delete", "/users/me", { password }),
};

export const profileApi = {
  me: (signal?: AbortSignal) => get("/users/me", profileSchema, signal),
  profile: async (username: string, signal?: AbortSignal) =>
    get(userPath(username), profileSchema, signal),
  stats: async (username: string, signal?: AbortSignal) =>
    get(`${userPath(username)}/stats`, statsSchema, signal),
  activity: async (username: string, signal?: AbortSignal) =>
    get(`${userPath(username)}/activity`, activitySchema, signal),
  skills: async (username: string, signal?: AbortSignal) =>
    get(`${userPath(username)}/skills`, z.array(skillSchema), signal),
  ratings: async (username: string, signal?: AbortSignal) =>
    get(`${userPath(username)}/ratings`, ratingsSchema, signal),
  platforms: async (username: string, signal?: AbortSignal) =>
    get(`${userPath(username)}/platforms`, z.array(platformSchema), signal),
  achievements: async (username: string, signal?: AbortSignal) =>
    get(
      `${userPath(username)}/achievements`,
      achievementCollectionSchema,
      signal,
    ),
  update: async (input: ProfileUpdate) => {
    const response = await write(
      "patch",
      "/users/me",
      profileUpdateSchema.parse(input),
    );
    return parseResponse(profileSchema, response.data);
  },
  linkPlatform: async (input: PlatformLink) => {
    const response = await write(
      "post",
      "/users/me/platforms",
      platformLinkSchema.parse(input),
    );
    return parseResponse(platformSchema, response.data);
  },
  unlinkPlatform: async (platform: PlatformConnectionName) => {
    platformLinkSchema.shape.platform.parse(platform);
    await write(
      "delete",
      `/users/me/platforms/${encodeURIComponent(platform)}`,
    );
  },
  syncPlatform: async (platform: PlatformConnectionName) => {
    platformLinkSchema.shape.platform.parse(platform);
    const response = await write(
      "post",
      `/users/me/platforms/${encodeURIComponent(platform)}/sync`,
    );
    return parseResponse(platformSchema, response.data);
  },
};
type PlatformConnectionName = PlatformLink["platform"];

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiContractError) return error.message;
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401)
      return "Sign in to your Z365 account from the account menu.";
    if (error.response?.status === 403)
      return "This profile is private, or your account does not have permission to access it.";
    if (error.response?.status === 404)
      return "This profile could not be found.";
    if (error.response?.status === 409)
      return "That username, email, or platform account is already in use.";
    if (error.response?.status === 429)
      return "Please wait before trying again.";
    if (error.response?.status === 400 || error.response?.status === 422)
      return "The server could not accept these details. Check your entries and try again.";
    if (error.code === "ECONNABORTED")
      return "The server took too long to respond. Please try again.";
    if (!error.response)
      return "We couldn’t reach Z365. Check your connection and try again.";
    return "Z365 is temporarily unavailable. Please try again in a moment.";
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
