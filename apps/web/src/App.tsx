import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Workspace } from "@/components/workspace";
import { DashboardProvider } from "@/components/dashboard-provider";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { LoginPage } from "@/components/login-page";
import { FirstVisitGuard } from "@/components/first-visit-guard";
import { sectionNames, type Section } from "@/lib/data";
import Link from "@/components/ui/link";

const LibraryPage = lazy(() =>
  import("@/components/library-page").then((module) => ({
    default: module.LibraryPage,
  })),
);

function SectionPage() {
  const { section = "" } = useParams();
  return Object.hasOwn(sectionNames, section) ? (
    <Suspense
      fallback={
        <div className="glass loading-card" role="status">
          Getting your workspace ready…
        </div>
      }
    >
      <LibraryPage key={section} section={section as Section} />
    </Suspense>
  ) : (
    <div className="empty-page glass">
      <span className="eyebrow">A SMALL DETOUR</span>
      <h2>This page wandered off.</h2>
      <p>Your coding journey is right where you left it.</p>
      <Link className="button button-primary" href="/">
        Back to your profile
      </Link>
    </div>
  );
}

function WorkspaceLayout() {
  return (
    <DashboardProvider>
      <Workspace>
        <Outlet />
      </Workspace>
    </DashboardProvider>
  );
}

export default function App() {
  return (
    <FirstVisitGuard>
      <Routes>
        {/* Dedicated authentication routes */}
        <Route path="/login" element={<LoginPage initialMode="login" />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route
          path="/register"
          element={<LoginPage initialMode="register" />}
        />
        <Route path="/signup" element={<Navigate to="/register" replace />} />

        {/* Workspace layout routes */}
        <Route element={<WorkspaceLayout />}>
          <Route path="/" element={<ProfileDashboard />} />
          <Route path="/profile" element={<ProfileDashboard />} />
          <Route path="/preview" element={<ProfileDashboard />} />
          <Route path="/u/:username" element={<ProfileDashboard />} />
          <Route path="/:section" element={<SectionPage />} />
          <Route path="*" element={<SectionPage />} />
        </Route>
      </Routes>
    </FirstVisitGuard>
  );
}
