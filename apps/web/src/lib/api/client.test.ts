import { afterEach, describe, expect, it } from "vitest";
import MockAdapter from "axios-mock-adapter";
import {
  api,
  ApiContractError,
  apiErrorMessage,
  parseResponse,
  profileApi,
} from "./client";
import {
  activitySchema,
  dateSchema,
  profileFormSchema,
  profileSchema,
  statsSchema,
} from "./schemas";
import { demoProfile, demoStats } from "./demo";

let mock: MockAdapter | undefined;
afterEach(() => mock?.restore());

describe("profile API integration contract", () => {
  it("validates actual dates, totals, identity, and visibility", () => {
    expect(dateSchema.safeParse("2024-02-29").success).toBe(true);
    expect(dateSchema.safeParse("2026-02-29").success).toBe(false);
    expect(dateSchema.safeParse("2026-02-31").success).toBe(false);
    expect(
      statsSchema.safeParse({ ...demoStats, problemsSolved: -1 }).success,
    ).toBe(false);
    expect(
      statsSchema.safeParse({ ...demoStats, problemsSolved: "1248" }).success,
    ).toBe(false);
    expect(statsSchema.safeParse({ activeDays: 1 }).success).toBe(false);
    const {
      canEdit: _canEdit,
      verified: _verified,
      ...unknownPermissions
    } = demoProfile;
    expect(
      profileSchema.parse({ ...unknownPermissions, avatarUrl: null }).canEdit,
    ).toBe(false);
    expect(
      profileSchema.parse({ ...unknownPermissions, avatarUrl: null }).verified,
    ).toBe(false);
  });

  it("rejects invalid activity ranges, duplicates, and out-of-range dates", () => {
    const valid = {
      from: "2026-11-01",
      to: "2026-11-03",
      days: [{ date: "2026-11-01", count: 2 }],
      recent: [],
    };
    expect(activitySchema.safeParse(valid).success).toBe(true);
    expect(
      activitySchema.safeParse({
        ...valid,
        days: [...valid.days, ...valid.days],
      }).success,
    ).toBe(false);
    expect(
      activitySchema.safeParse({
        ...valid,
        days: [{ date: "2026-10-31", count: 1 }],
      }).success,
    ).toBe(false);
    expect(
      activitySchema.safeParse({ ...valid, to: "2025-11-01" }).success,
    ).toBe(false);
  });

  it("keeps legitimate zero results and never substitutes sample statistics", async () => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
    const zero = Object.fromEntries(
      Object.keys(demoStats)
        .filter((key) => key !== "total")
        .map((key) => [key, 0]),
    );
    mock.onGet("/users/maya/stats").reply(200, { success: true, data: zero });
    expect((await profileApi.stats("maya")).problemsSolved).toBe(0);
    expect(mock.history.get[0].withCredentials).toBe(true);
    expect(mock.history.get[0].withXSRFToken).toBe(true);
  });

  it("rejects malformed response envelopes and usernames before displaying results", async () => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock
      .onGet("/users/maya/stats")
      .reply(200, { success: true, data: { problemsSolved: 123 } });
    await expect(profileApi.stats("maya")).rejects.toBeInstanceOf(
      ApiContractError,
    );
    await expect(profileApi.profile("../private")).rejects.toThrow();
    expect(mock.history.get).toHaveLength(1);
    expect(() =>
      parseResponse(statsSchema, "<!doctype html>fallback page"),
    ).toThrow(ApiContractError);
  });

  it("sends only the validated profile patch fields", async () => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onGet("/auth/csrf").reply(200, {
      success: true,
      data: { headerName: "X-CSRF-TOKEN", token: "test-token" },
    });
    const input = {
      username: "maya",
      displayName: " Maya Rao ",
      bio: "Building",
      location: "India",
      college: "",
      githubUrl: "https://github.com/maya",
      linkedinUrl: "",
      isPublic: false,
    };
    mock.onPatch("/users/me").reply(200, {
      success: true,
      data: {
        ...demoProfile,
        ...input,
        displayName: "Maya Rao",
        avatarUrl: null,
      },
    });
    await profileApi.update({
      ...input,
      rating: 9999,
      canEdit: true,
    } as typeof input);
    const body = JSON.parse(mock.history.patch[0].data);
    expect(mock.history.patch[0].headers?.["X-CSRF-TOKEN"]).toBe("test-token");
    expect(body.displayName).toBe("Maya Rao");
    expect(body.isPublic).toBe(false);
    expect(body).not.toHaveProperty("rating");
    expect(body).not.toHaveProperty("canEdit");
  });

  it("requests platform linking without claiming a verified rating", async () => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onGet("/auth/csrf").reply(200, {
      success: true,
      data: { headerName: "X-CSRF-TOKEN", token: "test-token" },
    });
    mock.onPost("/users/me/platforms").reply(200, {
      success: true,
      data: {
        id: "link-1",
        platform: "github",
        handle: "maya",
        url: "https://github.com/maya",
        status: "pending",
        rating: null,
        rank: null,
        lastSyncedAt: null,
      },
    });
    const connection = await profileApi.linkPlatform({
      platform: "github",
      handle: "maya",
      rating: 9999,
    } as { platform: "github"; handle: string });
    expect(connection.status).toBe("pending");
    expect(connection.rating).toBeNull();
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      platform: "github",
      handle: "maya",
    });
  });

  it("rejects unsafe or unrelated social profile URLs", () => {
    const input = {
      name: "Maya",
      handle: "maya",
      bio: "",
      location: "",
      college: "",
      github: "https://github.com/maya",
      linkedin: "",
      role: "Developer",
      isPublic: true,
    };
    expect(profileFormSchema.safeParse(input).success).toBe(true);
    expect(
      profileFormSchema.safeParse({ ...input, github: "javascript:alert(1)" })
        .success,
    ).toBe(false);
    expect(
      profileFormSchema.safeParse({
        ...input,
        github: "https://github.com.evil.example/maya",
      }).success,
    ).toBe(false);
  });

  it.each([401, 403, 404, 409, 500])(
    "provides a useful message for HTTP %s without exposing server internals",
    async (status) => {
      mock = new MockAdapter(api, { onNoMatch: "throwException" });
      mock
        .onGet("/users/maya")
        .reply(status, { message: "internal database password stack trace" });
      try {
        await profileApi.profile("maya");
        throw new Error("Expected request to fail");
      } catch (error) {
        const message = apiErrorMessage(error);
        expect(message.length).toBeGreaterThan(15);
        expect(message).not.toContain("password");
      }
    },
  );

  it("handles network timeouts explicitly", async () => {
    mock = new MockAdapter(api, { onNoMatch: "throwException" });
    mock.onGet("/users/maya").timeout();
    try {
      await profileApi.profile("maya");
    } catch (error) {
      expect(apiErrorMessage(error)).toContain("too long");
    }
  });
});
