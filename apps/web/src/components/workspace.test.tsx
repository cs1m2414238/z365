import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { DashboardProvider } from "./dashboard-provider";
import { ThemeProvider } from "./theme-provider";
import { Workspace } from "./workspace";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/?source=demo"]}>
        <ThemeProvider>
          <DashboardProvider>
            <Workspace>
              <p>Dashboard content</p>
            </Workspace>
          </DashboardProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("workspace navigation", () => {
  it("keeps one header brand and exposes every section in the left navigation without a toggle", () => {
    mount();
    const header = screen.getByRole("banner");
    const sidebar = screen.getByRole("complementary", {
      name: "Workspace navigation",
    });
    const navigation = within(sidebar).getByRole("navigation", {
      name: "Main navigation",
    });
    expect(screen.getAllByRole("link", { name: "Z365 home" })).toHaveLength(1);
    expect(
      within(navigation)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual([
      "Home",
      "Learn",
      "Practice",
      "Projects",
      "Labs",
      "Agents",
      "Profile",
    ]);
    expect(
      within(navigation)
        .getByRole("link", { name: "Profile" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(within(header).queryByRole("navigation")).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: /show sidebar|hide sidebar|close navigation/i,
      }),
    ).toBeNull();
    expect(
      within(header).getByRole("button", { name: "Search workspace" }),
    ).toBeTruthy();
    expect(
      within(header).getByRole("button", { name: "Dark mode" }),
    ).toBeTruthy();
    expect(within(header).getByLabelText("Account menu")).toBeTruthy();
  });

  it("navigates between sections and updates the active link while retaining the header", () => {
    mount();
    const navigation = screen.getByRole("navigation", {
      name: "Main navigation",
    });
    fireEvent.click(within(navigation).getByRole("link", { name: "Projects" }));
    expect(
      within(navigation)
        .getByRole("link", { name: "Projects" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      within(navigation)
        .getByRole("link", { name: "Profile" })
        .hasAttribute("aria-current"),
    ).toBe(false);
    expect(screen.getByRole("heading", { name: "Projects." })).toBeTruthy();
    expect(screen.getByText("Dashboard content")).toBeTruthy();

    fireEvent.click(within(navigation).getByRole("link", { name: "Profile" }));
    expect(
      within(navigation)
        .getByRole("link", { name: "Profile" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.queryByRole("heading", { name: "Projects." })).toBeNull();
    expect(screen.getAllByRole("link", { name: "Z365 home" })).toHaveLength(1);
  });
});
