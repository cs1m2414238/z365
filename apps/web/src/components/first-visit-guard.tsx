import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isFirstTimeVisitor, markVisitorAsKnown } from "@/lib/first-visit";

const AUTH_PATHS = new Set(["/login", "/signin", "/register", "/signup"]);

export function FirstVisitGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isExplicitDemo =
    searchParams.get("source") === "demo" || location.pathname === "/preview";
  const isAuthRoute = AUTH_PATHS.has(location.pathname);
  const isPublicProfile = /^\/u\/[^/]+\/?$/.test(location.pathname);

  // If visiting directly via explicit demo link, remember this visitor
  useEffect(() => {
    if (isExplicitDemo) {
      markVisitorAsKnown();
    }
  }, [isExplicitDemo]);

  if (
    !isAuthRoute &&
    !isExplicitDemo &&
    !isPublicProfile &&
    isFirstTimeVisitor()
  ) {
    const fullPath = `${location.pathname}${location.search}`;
    const redirectParam =
      fullPath !== "/" ? `?redirect=${encodeURIComponent(fullPath)}` : "";
    return (
      <Navigate
        to={`/login${redirectParam}`}
        replace
        state={{ from: location }}
      />
    );
  }

  return <>{children}</>;
}
