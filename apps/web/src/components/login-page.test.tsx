import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import App from "@/App";
import { ThemeProvider } from "./theme-provider";
import { api } from "@/lib/api/client";
import { FIRST_VISIT_STORAGE_KEY } from "@/lib/first-visit";
import { demoProfile } from "@/lib/api/demo";

let mock: MockAdapter;

beforeEach(() => {
  localStorage.clear();
  for (const provider of ["GITHUB", "GOOGLE", "APPLE", "FACEBOOK"]) {
    vi.stubEnv(`VITE_OAUTH_${provider}_URL`, "");
  }
  mock = new MockAdapter(api, { onNoMatch: "throwException" });
  mock.onGet("/auth/csrf").reply(200, {
    success: true,
    data: { headerName: "X-CSRF-TOKEN", token: "test-csrf-token" },
  });
  // Default signed-out session
  mock.onGet("/users/me/settings").reply(401);
});

afterEach(() => {
  vi.unstubAllEnvs();
  mock.restore();
  cleanup();
});

function renderApp(initialEntry = "/") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return client;
}

function mockNewAccount(username = "first_dev") {
  const profile = {
    ...demoProfile,
    id: "new-account",
    username,
    displayName: "First Developer",
    bio: "",
    avatarUrl: null,
    bannerUrl: null,
    skills: [],
    verified: false,
    active: false,
    canEdit: true,
    isPublic: false,
  };
  mock.onGet("/users/me").reply(200, { success: true, data: profile });
  mock.onGet(`/users/${username}`).reply(200, { success: true, data: profile });
  const resources = {
    stats: {
      problemsSolved: 0,
      projectsBuilt: null,
      labsCompleted: null,
      agentsCreated: null,
      activeDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
    },
    activity: { from: "2026-11-01", to: "2026-11-03", days: [], recent: [] },
    skills: [],
    platforms: [],
    achievements: { items: [], totalAvailable: 0 },
    ratings: {
      score: null,
      level: null,
      methodology: "No verified score yet.",
      history: [],
      rankings: [],
    },
  };
  for (const [resource, data] of Object.entries(resources)) {
    mock
      .onGet(`/users/${username}/${resource}`)
      .reply(200, { success: true, data });
  }
  return profile;
}

function completeRegistrationIdentity(
  email = "maya@example.com",
  name = "Maya Rao",
) {
  fireEvent.change(screen.getByLabelText(/Email Address/i), {
    target: { value: email },
  });
  fireEvent.click(screen.getByTestId("auth-submit-btn"));
  fireEvent.change(screen.getByLabelText(/Display Name/i), {
    target: { value: name },
  });
  fireEvent.click(screen.getByTestId("auth-submit-btn"));
}

describe("First visit redirection and Login page", () => {
  it("redirects a first-time visitor from / to /login", async () => {
    expect(localStorage.getItem(FIRST_VISIT_STORAGE_KEY)).toBeNull();
    renderApp("/");

    // Should redirect to login and show login header
    expect(
      await screen.findByRole("heading", { name: "Welcome to Z365" }),
    ).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Sign in/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Create account/i })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Explore Demo as Guest/i }),
    ).toBeTruthy();
  });

  it("preserves redirect target when first-time visitor visits a deep page like /practice", async () => {
    renderApp("/practice");

    await screen.findByRole("heading", { name: "Welcome to Z365" });
    // Click "Explore Demo as Guest"
    fireEvent.click(
      screen.getByRole("button", { name: /Explore Demo as Guest/i }),
    );

    // After clicking explore, first-visit flag is marked and destination is loaded
    expect(localStorage.getItem(FIRST_VISIT_STORAGE_KEY)).toBe("true");
    await screen.findByRole("heading", { name: "Practice." });
  });

  it("does not redirect a returning visitor who already has visited", async () => {
    localStorage.setItem(FIRST_VISIT_STORAGE_KEY, "true");
    renderApp("/?source=demo");

    // Returning visitor sees their workspace directly
    expect(
      screen.queryByRole("heading", { name: "Welcome to Z365" }),
    ).toBeNull();
    expect(screen.getByRole("link", { name: "Z365 home" })).toBeTruthy();
  });

  it("does not redirect when visiting explicit demo ?source=demo or /preview", async () => {
    expect(localStorage.getItem(FIRST_VISIT_STORAGE_KEY)).toBeNull();
    renderApp("/?source=demo");

    expect(
      screen.queryByRole("heading", { name: "Welcome to Z365" }),
    ).toBeNull();
    // Also marks visitor as known so future visits don't redirect
    await waitFor(() => {
      expect(localStorage.getItem(FIRST_VISIT_STORAGE_KEY)).toBe("true");
    });
  });

  it("switches from sign-in to the email-first registration flow", async () => {
    renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome to Z365" });
    fireEvent.click(screen.getByRole("tab", { name: /Create account/i }));
    await screen.findByRole("heading", { name: "Create your Z365 account" });
    expect(screen.getByLabelText(/Email Address/i)).toBeTruthy();
    expect(screen.queryByLabelText(/Display Name/i)).toBeNull();
    expect(screen.queryByLabelText(/^Username/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });

  it("validates each registration step before allowing the next one", async () => {
    renderApp("/register");
    fireEvent.click(screen.getByTestId("auth-submit-btn"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Please enter a valid email address.",
    );
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "maya@example.com" },
    });
    fireEvent.click(screen.getByTestId("auth-submit-btn"));
    fireEvent.click(screen.getByTestId("auth-submit-btn"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Please enter your display name",
    );
    fireEvent.change(screen.getByLabelText(/Display Name/i), {
      target: { value: "Maya Rao" },
    });
    fireEvent.click(screen.getByTestId("auth-submit-btn"));
    fireEvent.change(screen.getByLabelText(/^Username/i), {
      target: { value: "hi" },
    });
    fireEvent.click(screen.getByTestId("auth-submit-btn"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Username must be 3–24 letters, numbers, or underscores.",
    );
    fireEvent.change(screen.getByLabelText(/^Username/i), {
      target: { value: "maya_rao" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByTestId("auth-submit-btn"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Password must be at least 12 characters.",
    );
    expect(mock.history.post).toHaveLength(0);
  });

  it("preserves identity details when moving back and greets the entered name", () => {
    renderApp("/register");
    completeRegistrationIdentity();
    expect(screen.getByRole("status").textContent).toContain("Maya");
    expect(document.activeElement).toBe(screen.getByLabelText(/^Username/i));
    expect(mock.history.post).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      (screen.getByLabelText(/Display Name/i) as HTMLInputElement).value,
    ).toBe("Maya Rao");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      (screen.getByLabelText(/Email Address/i) as HTMLInputElement).value,
    ).toBe("maya@example.com");
    expect(mock.history.post).toHaveLength(0);
  });

  it("authenticates an existing user and marks visitor as known", async () => {
    const user = {
      ...demoProfile,
      id: "maya-1",
      username: "maya",
      displayName: "Maya Rao",
      avatarUrl: null,
    };
    mock.onPost("/auth/login").reply(200, { success: true, data: user });
    mock.onGet("/users/me").reply(200, { success: true, data: user });
    mock.onGet("/users/maya/stats").reply(200, {
      success: true,
      data: {
        problemsSolved: 10,
        projectsBuilt: 2,
        labsCompleted: 3,
        agentsCreated: 1,
        activeDays: 5,
        currentStreak: 2,
        longestStreak: 4,
        totalContributions: 15,
      },
    });
    mock.onGet("/users/maya/activity").reply(200, {
      success: true,
      data: { from: "2026-11-01", to: "2026-11-03", days: [], recent: [] },
    });
    mock.onGet("/users/maya/skills").reply(200, { success: true, data: [] });
    mock.onGet("/users/maya/ratings").reply(200, {
      success: true,
      data: {
        score: null,
        level: null,
        methodology: "Verified",
        history: [],
        rankings: [],
      },
    });
    mock.onGet("/users/maya/platforms").reply(200, { success: true, data: [] });
    mock.onGet("/users/maya/achievements").reply(200, {
      success: true,
      data: { totalAvailable: 5, items: [] },
    });

    renderApp("/login");

    fireEvent.change(screen.getByLabelText(/Username or Email/i), {
      target: { value: "maya" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "validpassword123" },
    });
    fireEvent.click(screen.getByTestId("auth-submit-btn"));

    await waitFor(() => {
      expect(localStorage.getItem(FIRST_VISIT_STORAGE_KEY)).toBe("true");
    });
  });

  it("handles invalid credentials gracefully", async () => {
    mock.onPost("/auth/login").reply(401);

    renderApp("/login");

    fireEvent.change(screen.getByLabelText(/Username or Email/i), {
      target: { value: "wrong_user" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "wrongpassword123" },
    });
    fireEvent.click(screen.getByTestId("auth-submit-btn"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "The username, email, or password is incorrect.",
    );
  });

  it("allows exploring demo directly from login page and marks visited", async () => {
    renderApp("/login");

    const exploreBtn = await screen.findByRole("button", {
      name: /Explore Demo as Guest/i,
    });
    fireEvent.click(exploreBtn);

    expect(localStorage.getItem(FIRST_VISIT_STORAGE_KEY)).toBe("true");
  });

  it("shows active session controls when user is already signed in", async () => {
    mock.onGet("/users/me/settings").reply(200, {
      success: true,
      data: { email: "maya@example.com", isPublic: true },
    });

    renderApp("/login");

    expect(
      await screen.findByRole("heading", { name: "You’re already signed in" }),
    ).toBeTruthy();
    expect(screen.getByText("maya@example.com")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Open Workspace/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Sign out of this session/i }),
    ).toBeTruthy();
  });

  it("hides social providers that have no working sign-in endpoint", () => {
    renderApp("/register");
    expect(
      screen.queryByRole("button", {
        name: /Continue with (GitHub|Google|Apple|Facebook)/,
      }),
    ).toBeNull();
  });

  it("registers and signs in to an empty API profile even when the return link requested demo", async () => {
    const profile = mockNewAccount();
    mock.onPost("/auth/register").reply(201, { success: true, data: profile });
    mock.onPost("/auth/login").reply(204);
    renderApp("/register?redirect=%2F%3Fsource%3Ddemo");
    completeRegistrationIdentity("first@example.test", "First Developer");
    fireEvent.change(screen.getByLabelText(/^Username/i), {
      target: { value: "first_dev" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "long-test-passphrase" },
    });
    fireEvent.click(screen.getByTestId("auth-submit-btn"));
    await screen.findByRole(
      "heading",
      { name: "First Developer" },
      { timeout: 5000 },
    );
    expect(mock.history.post.map((request) => request.url)).toEqual([
      "/auth/register",
      "/auth/login",
    ]);
    expect(
      mock.history.post.every(
        (request) => request.headers?.["X-CSRF-TOKEN"] === "test-csrf-token",
      ),
    ).toBe(true);
    expect(screen.queryByText("Aarav Mehta")).toBeNull();
    const activity = await screen.findByText(
      /recorded actions in the last year/,
    );
    expect(activity.textContent).toMatch(
      /^0\s+recorded actions in the last year$/,
    );
  });

  it("allows direct public profile visits without forcing first-visit sign-in", async () => {
    mockNewAccount();
    renderApp("/u/first_dev");
    await screen.findByRole(
      "heading",
      { name: "First Developer" },
      { timeout: 5000 },
    );
    expect(
      screen.queryByRole("heading", { name: "Welcome to Z365" }),
    ).toBeNull();
  });

  it("rejects a multibyte password beyond the backend limit before registering", async () => {
    renderApp("/register");
    completeRegistrationIdentity("first@example.test", "First Developer");
    fireEvent.change(screen.getByLabelText(/^Username/i), {
      target: { value: "first_dev" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "語".repeat(25) },
    });
    fireEvent.click(screen.getByTestId("auth-submit-btn"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "72 UTF-8 bytes",
    );
    expect(mock.history.post).toHaveLength(0);
  });
});
