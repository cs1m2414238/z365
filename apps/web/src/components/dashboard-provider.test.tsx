import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useNavigate } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { DashboardProvider } from "./dashboard-provider";
import { profileQueryKey, useDashboard } from "@/lib/dashboard-context";
import { ProfileConnectionNotice } from "./profile-connection";
import { api } from "@/lib/api/client";
import { demoProfile, demoStats } from "@/lib/api/demo";

let mock: MockAdapter;
const serverProfile = {
  ...demoProfile,
  id: "real-42",
  username: "maya",
  displayName: "Maya Rao",
  avatarUrl: null,
  verified: false,
  active: false,
};
beforeEach(() => {
  localStorage.clear();
  mock = new MockAdapter(api, { onNoMatch: "throwException" });
  mock.onGet("/auth/csrf").reply(200, {
    success: true,
    data: { headerName: "X-CSRF-TOKEN", token: "test-token" },
  });
});
afterEach(() => {
  mock.restore();
  cleanup();
});

function Probe() {
  const dashboard = useDashboard();
  const navigate = useNavigate();
  return (
    <>
      <ProfileConnectionNotice />
      <output data-testid="source">{dashboard.source}</output>
      <output data-testid="name">{dashboard.profile.name}</output>
      <output data-testid="solved">
        {dashboard.stats.data?.problemsSolved ?? "unavailable"}
      </output>
      <output data-testid="editable">{String(dashboard.canEdit)}</output>
      <output data-testid="stats-error">
        {String(dashboard.stats.isError)}
      </output>
      <output data-testid="save-error">
        {String(dashboard.saveProfile.isError)}
      </output>
      <button
        onClick={() =>
          dashboard.saveProfile.mutate({
            ...dashboard.profile,
            name: "Maya Updated",
            isPublic: false,
          })
        }
      >
        Save profile
      </button>
      <button onClick={() => navigate("/?source=demo")}>Preview</button>
      <button onClick={() => navigate("/u/maya?source=api")}>API</button>
    </>
  );
}
function mount(entry = "/u/maya?source=api") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 60_000 },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <DashboardProvider>
          <Probe />
        </DashboardProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}
function endpoints() {
  mock
    .onGet("/users/maya/stats")
    .reply(200, { success: true, data: { ...demoStats, problemsSolved: 23 } });
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
      methodology: "Verified results",
      history: [],
      rankings: [],
    },
  });
  mock.onGet("/users/maya/platforms").reply(200, { success: true, data: [] });
  mock
    .onGet("/users/maya/achievements")
    .reply(200, { success: true, data: { totalAvailable: 12, items: [] } });
}

describe("dashboard API and demo isolation", () => {
  it("loads the signed-in profile before requesting its activity and statistics", async () => {
    mock.onGet("/users/me").reply(200, { success: true, data: serverProfile });
    endpoints();
    mount("/?source=api");
    await waitFor(() =>
      expect(screen.getByTestId("solved").textContent).toBe("23"),
    );
    expect(screen.getByTestId("name").textContent).toBe("Maya Rao");
    expect(mock.history.get.map((request) => request.url)).toContain(
      "/users/maya/activity",
    );
    expect(mock.history.get.map((request) => request.url)).not.toContain(
      "/users/aaravm",
    );
  });

  it("uses the requested identity and statistics from validated responses", async () => {
    localStorage.setItem(
      "z365.profile.v1",
      JSON.stringify({
        name: "Stored Demo",
        handle: "demo",
        bio: "",
        location: "",
        college: "",
        github: "",
        linkedin: "",
        role: "Student",
      }),
    );
    mock
      .onGet("/users/maya")
      .reply(200, { success: true, data: serverProfile });
    endpoints();
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("solved").textContent).toBe("23"),
    );
    expect(screen.getByTestId("name").textContent).toBe("Maya Rao");
    expect(screen.getByTestId("source").textContent).toBe("api");
    expect(screen.getByTestId("editable").textContent).toBe("true");
  });

  it("shows a missing profile and never falls back to sample identity or totals", async () => {
    mock.onGet("/users/maya").reply(404);
    mount();
    await screen.findByText("Your profile couldn’t be loaded");
    expect(screen.getByTestId("name").textContent).not.toBe("Aarav Mehta");
    expect(screen.getByTestId("solved").textContent).toBe("unavailable");
    expect(screen.getByTestId("editable").textContent).toBe("false");
    expect(mock.history.get).toHaveLength(1);
  });

  it("treats malformed statistics as an integration error without inventing values", async () => {
    mock
      .onGet("/users/maya")
      .reply(200, { success: true, data: serverProfile });
    endpoints();
    mock
      .onGet("/users/maya/stats")
      .reply(200, { success: true, data: { problemsSolved: 300 } });
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("stats-error").textContent).toBe("true"),
    );
    expect(screen.getByTestId("solved").textContent).toBe("unavailable");
  });

  it("respects the server's read-only permission even for a familiar username", async () => {
    mock.onGet("/users/maya").reply(200, {
      success: true,
      data: { ...serverProfile, canEdit: false },
    });
    endpoints();
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("name").textContent).toBe("Maya Rao"),
    );
    expect(screen.getByTestId("editable").textContent).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() =>
      expect(screen.getByTestId("save-error").textContent).toBe("true"),
    );
    expect(mock.history.patch).toHaveLength(0);
  });

  it("refreshes the cached server identity after a successful profile update", async () => {
    let profile = serverProfile;
    mock
      .onGet("/users/maya")
      .reply(() => [200, { success: true, data: profile }]);
    endpoints();
    mock.onPatch("/users/me").reply((config) => {
      const { avatarUrl, bannerUrl, ...patch } = JSON.parse(config.data);
      profile = {
        ...profile,
        ...patch,
        avatarUrl: avatarUrl || null,
        bannerUrl: bannerUrl || null,
      };
      return [200, { success: true, data: profile }];
    });
    const client = mount();
    await waitFor(() =>
      expect(screen.getByTestId("name").textContent).toBe("Maya Rao"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() =>
      expect(screen.getByTestId("name").textContent).toBe("Maya Updated"),
    );
    expect(
      client.getQueryData(profileQueryKey("api", "maya", "identity")),
    ).toMatchObject({ displayName: "Maya Updated", isPublic: false });
    expect(localStorage.getItem("z365.profile.v1")).toBeNull();
  });

  it("retains the last valid profile when saving fails", async () => {
    mock
      .onGet("/users/maya")
      .reply(200, { success: true, data: serverProfile });
    endpoints();
    mock.onPatch("/users/me").reply(409);
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("name").textContent).toBe("Maya Rao"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() =>
      expect(screen.getByTestId("save-error").textContent).toBe("true"),
    );
    expect(screen.getByTestId("name").textContent).toBe("Maya Rao");
  });

  it("keeps cached API data separate from the explicitly selected demo", async () => {
    mock
      .onGet("/users/maya")
      .reply(200, { success: true, data: serverProfile });
    endpoints();
    const client = mount();
    await waitFor(() =>
      expect(screen.getByTestId("solved").textContent).toBe("23"),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Preview$/ }));
    await waitFor(() =>
      expect(screen.getByTestId("solved").textContent).toBe("1248"),
    );
    expect(screen.getByTestId("source").textContent).toBe("demo");
    expect(
      client.getQueryData(profileQueryKey("api", "maya", "stats")),
    ).toMatchObject({ problemsSolved: 23 });
    fireEvent.click(screen.getByRole("button", { name: /^API$/ }));
    await waitFor(() =>
      expect(screen.getByTestId("solved").textContent).toBe("23"),
    );
  });
});
