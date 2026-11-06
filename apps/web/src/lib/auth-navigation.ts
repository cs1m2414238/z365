const authPaths = new Set(["/login", "/signin", "/register", "/signup"]);

/** Accept only application paths, never an external or authentication destination. */
export function authDestination(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value))
    return null;
  const url = new URL(value, "https://z365.local");
  if (
    url.origin !== "https://z365.local" ||
    authPaths.has(url.pathname.replace(/\/+$/, ""))
  )
    return null;
  return url;
}

export function workspaceDestination(
  value: string | null | undefined,
  source: "api" | "demo",
  username?: string,
) {
  const requested = authDestination(value);
  const url =
    (source === "api" && requested?.pathname === "/preview"
      ? null
      : requested) ??
    new URL(
      source === "api" && username ? `/u/${encodeURIComponent(username)}` : "/",
      "https://z365.local",
    );
  url.searchParams.set("source", source);
  url.searchParams.delete("provider");
  return `${url.pathname}${url.search}${url.hash}`;
}
