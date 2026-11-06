import { WorkspaceContext } from "@/lib/workspace-context";
("use client");

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "@/components/ui/link";
import { usePathname, useRouter } from "@/lib/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Flame,
  LogIn,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  HomeIcon as Home,
  LearnIcon as BookOpen,
  PracticeIcon as CodeXml,
  ProjectIcon as Layers3,
  LabIcon as FlaskConical,
  AgentIcon as Sparkles,
  ProfileIcon as UserRound,
} from "@/components/ui/z365-icon";
import {
  defaultProfile,
  resources,
  sectionNames,
  type Profile,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { safeLink } from "@/lib/utils";
import { useDashboard } from "@/lib/dashboard-context";
import { SourceControl } from "@/components/profile-connection";
import { apiErrorMessage } from "@/lib/api/client";
import { profileFormSchema } from "@/lib/api/schemas";
import { ThemeSwitcher } from "@/components/theme-provider";
import { AccountDialog } from "@/components/account-dialog";

const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Learn", href: "/learn", icon: BookOpen },
  { name: "Practice", href: "/practice", icon: CodeXml },
  { name: "Projects", href: "/projects", icon: Layers3 },
  { name: "Labs", href: "/labs", icon: FlaskConical },
  { name: "Agents", href: "/agents", icon: Sparkles },
  { name: "Profile", href: "/", icon: UserRound },
];

export function Workspace({ children }: { children: ReactNode }) {
  const dashboard = useDashboard();
  const profile = dashboard.profile;
  const [saveError, setSaveError] = useState("");
  const [modal, setModal] = useState<
    "edit" | "search" | "notifications" | "help" | "account" | null
  >(null);
  const [unread, setUnread] = useState(true);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const pageTitle = dashboard.profileRoute
    ? "Coding profile"
    : sectionNames[pathname.slice(1) as keyof typeof sectionNames] ||
      "Your workspace";

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setModal((current) => (current === "search" ? null : "search"));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setModal(null);
    document.title = `${pageTitle} · Z365`;
  }, [pathname]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4200);
  }, []);

  async function saveProfile(next: Profile) {
    setSaveError("");
    try {
      await dashboard.saveProfile.mutateAsync(next);
      notify(
        dashboard.source === "demo"
          ? "Preview profile updated in this browser."
          : "Your profile has been saved to Z365.",
      );
      setModal(null);
    } catch (error) {
      setSaveError(apiErrorMessage(error));
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{
        profile,
        openAccount: () => setModal("account"),
        openEdit: () => {
          if (dashboard.canEdit) {
            setSaveError("");
            setModal("edit");
          }
        },
        notify,
      }}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div
        className={`workspace-shell${dashboard.profileRoute ? " profile-shell" : ""}`}
      >
        <header className="topbar">
          <div className="topbar-inner">
            <div className="header-brand">
              <Link
                href="/"
                className="brand header-logo"
                aria-label="Z365 home"
              >
                <span className="brand-mark" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                {dashboard.profileRoute ? (
                  <h1>
                    Z365
                    <span className="brand-period" aria-hidden="true">
                      .
                    </span>
                  </h1>
                ) : (
                  <span>
                    Z365
                    <span className="brand-period" aria-hidden="true">
                      .
                    </span>
                  </span>
                )}
              </Link>
            </div>
            <div className="topbar-actions">
              <ThemeSwitcher />
              <button
                className="search-trigger"
                aria-label="Search workspace"
                onClick={() => setModal("search")}
              >
                <Search size={17} />
                <span>Search anything...</span>
                <kbd>Ctrl K</kbd>
              </button>
              <button
                className="icon-button notification-button"
                aria-label={
                  dashboard.source === "demo" && unread
                    ? "Notifications, 2 unread"
                    : "Notifications"
                }
                onClick={() => setModal("notifications")}
              >
                <Bell size={20} />
                {dashboard.source === "demo" && unread && <i />}
              </button>
              <details className="account-menu">
                <summary aria-label="Account menu">
                  <span className="letter-avatar">
                    {profile.handle ? (
                      profile.name.charAt(0).toUpperCase()
                    ) : (
                      <UserRound size={17} />
                    )}
                  </span>
                  <ChevronDown size={15} />
                </summary>
                <div className="account-popover glass">
                  <strong>{profile.name}</strong>
                  {profile.handle && <span>@{profile.handle}</span>}
                  <button
                    onClick={(event) => {
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                      setModal("account");
                    }}
                  >
                    <UserRound size={16} />
                    {dashboard.source === "api" && dashboard.canEdit
                      ? "Account settings"
                      : "Sign in or manage account"}
                  </button>
                  <Link
                    href="/login"
                    onClick={(event) =>
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open")
                    }
                  >
                    <LogIn size={16} />
                    Sign in page
                  </Link>
                  <button
                    disabled={!dashboard.canEdit}
                    onClick={(event) => {
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                      setModal("edit");
                    }}
                  >
                    <UserRound size={16} />
                    Edit profile
                  </button>
                  <Link
                    href={dashboard.source === "api" ? "/?source=api" : "/"}
                    onClick={(event) =>
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open")
                    }
                  >
                    <ShieldCheck size={16} />
                    My coding profile
                  </Link>
                  <button
                    onClick={(event) => {
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                      setModal("help");
                    }}
                  >
                    <CircleHelp size={16} />
                    Help & getting started
                  </button>
                </div>
              </details>
            </div>
          </div>
        </header>
        <aside
          className="workspace-navigation"
          aria-label="Workspace navigation"
        >
          <div className="workspace-label">YOUR WORKSPACE</div>
          <nav className="nav-list" aria-label="Main navigation">
            {navigation.map(({ name, href, icon: Icon }) => {
              const active =
                href === "/" ? dashboard.profileRoute : pathname === href;
              return (
                <Link
                  key={name}
                  href={href}
                  className={`nav-item${active ? " active" : ""}`}
                  aria-label={name}
                  title={name}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div
          className={`workspace-main${dashboard.profileRoute ? " profile-workspace" : ""}`}
        >
          <main id="main-content" className="main-content">
            {!dashboard.profileRoute && (
              <div className="page-heading">
                <div>
                  <h1>
                    {pageTitle}
                    <span className="title-dot">.</span>
                  </h1>
                </div>
              </div>
            )}
            {children}
            <footer className="page-footer">
              <SourceControl />
            </footer>
          </main>
        </div>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={17} />
          </span>
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal === "edit" && (
        <EditProfile
          profile={profile}
          isSaving={dashboard.saveProfile.isPending}
          serverError={saveError}
          isDemo={dashboard.source === "demo"}
          onSave={saveProfile}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "search" && <SearchDialog onClose={() => setModal(null)} />}
      {modal === "account" && <AccountDialog onClose={() => setModal(null)} />}
      {modal === "notifications" && (
        <Modal
          title="A little good news"
          description="Updates from your demo workspace."
          onClose={() => setModal(null)}
        >
          {dashboard.source === "demo" ? (
            <div className="notification-list">
              <div>
                <span className="round-icon orange">
                  <Flame size={21} />
                </span>
                <div>
                  <strong>You’re on an 18-day streak!</strong>
                  <p>One small step today keeps your momentum going.</p>
                  <Link href="/practice">
                    Find your next challenge <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
              <div>
                <span className="round-icon purple">
                  <Sparkles size={21} />
                </span>
                <div>
                  <strong>A new badge for your collection</strong>
                  <p>
                    You earned Agent Creator by building your first AI agent.
                  </p>
                  <small>2 days ago</small>
                </div>
              </div>
            </div>
          ) : (
            <p className="panel-empty">
              Account notifications will appear when notification support is
              connected.
            </p>
          )}
          <Button
            variant="secondary"
            className="full-width"
            onClick={() => {
              setUnread(false);
              setModal(null);
              notify("You’re all caught up.");
            }}
          >
            Mark all as read <Check size={16} />
          </Button>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="Make yourself at home"
          description="Your Z365 workspace brings your engineering journey together."
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            <p>
              <BookOpen size={20} />
              <span>
                <strong>Learn, then put it to work.</strong> Explore learning
                paths, coding challenges, and hands-on debugging labs.
              </span>
            </p>
            <p>
              <Layers3 size={20} />
              <span>
                <strong>Build something that’s yours.</strong> Track your
                projects and explore ideas for AI agents.
              </span>
            </p>
            <p>
              <UserRound size={20} />
              <span>
                <strong>See how far you’ve come.</strong> Your coding profile
                brings your activity, skills, and milestones together.
              </span>
            </p>
            <div className="info-note">
              <ShieldCheck size={18} />
              <span>
                {dashboard.source === "demo"
                  ? "This is the profile UI preview. Ratings and badges are illustrative, and preview edits stay in this browser. Use the data-source control to load a backend profile."
                  : "This profile uses validated responses from Z365. Profile editing, private access, verification, and authentication depend on your connected backend. No sample data replaces a failed request."}
              </span>
            </div>
            <p className="keyboard-hint">
              Find anything quickly with <kbd>Ctrl</kbd> + <kbd>K</kbd>.
            </p>
          </div>
        </Modal>
      )}
    </WorkspaceContext.Provider>
  );
}

function EditProfile({
  profile,
  onSave,
  onClose,
  isSaving,
  serverError,
  isDemo,
}: {
  profile: Profile;
  onSave: (profile: Profile) => void;
  onClose: () => void;
  isSaving: boolean;
  serverError: string;
  isDemo: boolean;
}) {
  const [draft, setDraft] = useState(profile);
  const [skillList, setSkillList] = useState(profile.skills?.join(", ") ?? "");
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = Object.fromEntries(
      Object.entries(draft).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ]),
    ) as unknown as Profile;
    const parsed = profileFormSchema.safeParse({
      ...clean,
      skills: skillList
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      isPublic: clean.isPublic ?? true,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!clean.name || !/^[a-zA-Z0-9_]{3,24}$/.test(clean.handle)) {
      setError(
        "Add your name and a username with 3–24 letters, numbers, or underscores.",
      );
      return;
    }
    for (const field of ["github", "linkedin"] as const)
      if (clean[field] && !safeLink(clean[field])) {
        setError("Social links must be valid http or https URLs.");
        return;
      }
    setError("");
    onSave(parsed.data);
  }
  return (
    <Modal
      title="A profile that feels like you"
      description="Introduce yourself to your future collaborators."
      onClose={onClose}
    >
      <form className="profile-form" onSubmit={submit} aria-busy={isSaving}>
        <div className="form-row">
          <label>
            Full name
            <input
              autoFocus
              required
              maxLength={50}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            Username
            <span className="input-with-prefix">
              <span>@</span>
              <input
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_]+"
                value={draft.handle}
                onChange={(e) => setDraft({ ...draft, handle: e.target.value })}
              />
            </span>
          </label>
        </div>
        <label>
          Bio
          <textarea
            rows={3}
            maxLength={180}
            value={draft.bio}
            onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          />
          <span className="field-note">
            A little about what you’re learning and building. {draft.bio.length}
            /180
          </span>
        </label>
        <div className="form-row">
          <label>
            Location
            <input
              maxLength={45}
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
          </label>
          <label>
            College
            <input
              maxLength={70}
              value={draft.college}
              onChange={(e) => setDraft({ ...draft, college: e.target.value })}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            GitHub URL
            <input
              type="url"
              maxLength={200}
              placeholder="https://github.com/you"
              value={draft.github}
              onChange={(e) => setDraft({ ...draft, github: e.target.value })}
            />
          </label>
          <label>
            LinkedIn URL
            <input
              type="url"
              maxLength={200}
              placeholder="https://linkedin.com/in/you"
              value={draft.linkedin}
              onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })}
            />
          </label>
        </div>
        <label>
          Role
          <input
            maxLength={60}
            value={draft.role}
            onChange={(event) =>
              setDraft({ ...draft, role: event.target.value })
            }
          />
        </label>
        <div className="form-row">
          <label>
            Profile image URL
            <input
              type="url"
              maxLength={500}
              value={draft.avatarUrl ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, avatarUrl: event.target.value })
              }
            />
          </label>
          <label>
            Banner image URL
            <input
              type="url"
              maxLength={500}
              value={draft.bannerUrl ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, bannerUrl: event.target.value })
              }
            />
          </label>
        </div>
        <label>
          Skills
          <input
            value={skillList}
            maxLength={491}
            onChange={(event) => setSkillList(event.target.value)}
            placeholder="Java, SQL, React"
          />
          <span className="field-note">
            Enter up to 12 skills, separated by commas.
          </span>
        </label>
        <label>
          Profile visibility
          <select
            value={(draft.isPublic ?? true) ? "public" : "private"}
            onChange={(event) =>
              setDraft({ ...draft, isPublic: event.target.value === "public" })
            }
          >
            <option value="public">Public profile</option>
            <option value="private">Private profile</option>
          </select>
          <span className="field-note">
            Z365 enforces account access and profile privacy on the server.
          </span>
        </label>
        {(error || serverError) && (
          <p className="form-error" role="alert">
            {error || serverError}
          </p>
        )}
        <div className="form-actions">
          <span>
            <CalendarDays size={14} />
            {isDemo
              ? "Preview saved in this browser"
              : "Saved to your Z365 account"}
          </span>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"} <Check size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pages = navigation.map((item) => ({
    title: item.name,
    subtitle: "Workspace",
    href: item.href,
  }));
  const entries = [
    ...pages,
    ...resources.map((item) => ({
      title: item.title,
      subtitle: sectionNames[item.section],
      href: `/${item.section}?resource=${item.id}`,
    })),
  ];
  const filtered = entries
    .filter((entry) =>
      `${entry.title} ${entry.subtitle}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 8);
  return (
    <Modal title="Where will curiosity take you?" onClose={onClose}>
      <form
        className="global-search"
        onSubmit={(event) => {
          event.preventDefault();
          if (filtered[0]) {
            router.push(filtered[0].href);
            onClose();
          }
        }}
      >
        <Search size={21} />
        <input
          autoFocus
          aria-label="Search workspace"
          placeholder="Search pages, projects, challenges..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <kbd>ESC</kbd>
      </form>
      <div className="search-results">
        <span className="eyebrow">
          {query ? `${filtered.length} RESULTS` : "JUMP TO"}
        </span>
        {filtered.map((entry) => (
          <Link
            key={`${entry.href}-${entry.title}`}
            href={entry.href}
            onClick={onClose}
          >
            <span className="search-result-icon">
              <Search size={17} />
            </span>
            <div>
              <strong>{entry.title}</strong>
              <span>{entry.subtitle}</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="search-empty">
            <Search size={25} />
            <strong>No matches just yet</strong>
            <p>Try “Java”, “projects”, or “practice”.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
