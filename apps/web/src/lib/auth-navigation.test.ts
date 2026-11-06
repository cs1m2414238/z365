import { describe, expect, it } from "vitest";
import { authDestination, workspaceDestination } from "./auth-navigation";

describe("authentication destinations", () => {
  it.each([
    "https://outside.test",
    "//outside.test",
    "/\\outside.test",
    "/login?redirect=/login",
    "/register",
    "/signin",
    "/signup",
    "/login/",
  ])("ignores external and authentication destinations: %s", (destination) => {
    expect(authDestination(destination)).toBeNull();
    expect(workspaceDestination(destination, "api", "first_dev")).toBe(
      "/u/first_dev?source=api",
    );
  });
  it("preserves the local destination while removing demo mode after sign-in", () => {
    expect(
      workspaceDestination("/practice?topic=trees&source=demo#saved", "api"),
    ).toBe("/practice?topic=trees&source=api#saved");
    expect(workspaceDestination("/?source=demo&provider=github", "api")).toBe(
      "/?source=api",
    );
    expect(workspaceDestination("/u/developer?source=api", "demo")).toBe(
      "/u/developer?source=demo",
    );
    expect(workspaceDestination("/preview", "api", "first_dev")).toBe(
      "/u/first_dev?source=api",
    );
  });
});
