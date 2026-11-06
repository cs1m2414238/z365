import { useState, type FormEvent, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  AlertCircle,
  ArrowRight,
  LogIn,
  LogOut,
  Sparkles,
  UserPlus,
  UserRound,
  Eye,
  EyeOff,
  LockKeyhole,
  ArrowLeft,
  Check,
} from "lucide-react";
import { AuthStory } from "@/components/auth-story";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-provider";
import Link from "@/components/ui/link";
import { Apple, Facebook, Github, Google } from "@/components/ui/social-icons";
import { accountApi, apiErrorMessage } from "@/lib/api/client";
import { registrationSchema } from "@/lib/api/schemas";
import { workspaceDestination } from "@/lib/auth-navigation";
import { registrationSteps, type RegistrationStep } from "@/lib/auth-preview";
import { markVisitorAsKnown } from "@/lib/first-visit";

const socialProviders = [
  { id: "github", label: "GitHub", Icon: Github },
  { id: "google", label: "Google", Icon: Google },
  { id: "apple", label: "Apple", Icon: Apple },
  { id: "facebook", label: "Facebook", Icon: Facebook },
] as const;

interface LoginPageProps {
  initialMode?: "login" | "register";
}

export function LoginPage({ initialMode = "login" }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // Form input state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>(0);
  const [stepDirection, setStepDirection] = useState("forward");
  const stepInput = useRef<HTMLInputElement>(null);
  const focusNextStep = useRef(false);

  // Resolve intended return destination
  const searchParams = new URLSearchParams(location.search);
  const redirectTarget =
    searchParams.get("redirect") ||
    ((location.state as { from?: { pathname: string; search: string } })?.from
      ? `${location.state.from.pathname}${location.state.from.search || ""}`
      : null) ||
    null;
  const enabledProviders = socialProviders.filter(({ id }) =>
    Boolean(import.meta.env[`VITE_OAUTH_${id.toUpperCase()}_URL`]),
  );

  // Check if session is already active
  const settings = useQuery({
    queryKey: ["account", "settings"],
    queryFn: ({ signal }) => accountApi.settings(signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  const signedIn = settings.isSuccess && Boolean(settings.data?.email);
  const sessionError =
    settings.isError &&
    !(
      axios.isAxiosError(settings.error) &&
      settings.error.response?.status === 401
    )
      ? apiErrorMessage(settings.error)
      : "";

  useEffect(() => {
    document.title = `${mode === "login" ? "Sign In" : "Create Account"} · Z365`;
  }, [mode]);

  useEffect(() => {
    if (focusNextStep.current) {
      stepInput.current?.focus();
      focusNextStep.current = false;
    }
  }, [mode, registrationStep]);

  function changeRegistrationStep(next: RegistrationStep) {
    if (pending) return;
    setError("");
    setShowPassword(false);
    setStepDirection(next < registrationStep ? "back" : "forward");
    focusNextStep.current = true;
    setRegistrationStep(next);
  }

  function handleTabChange(nextMode: "login" | "register") {
    if (pending || nextMode === mode) return;
    setMode(nextMode);
    setPassword("");
    setShowPassword(false);
    setError("");
    setRegistrationStep(0);
    setStepDirection("forward");
    focusNextStep.current = false;
  }

  async function handleExploreDemo() {
    markVisitorAsKnown();
    navigate(workspaceDestination(redirectTarget, "demo"));
  }

  async function handleSocialAuth(
    provider: "github" | "google" | "apple" | "facebook",
  ) {
    const envKey = `VITE_OAUTH_${provider.toUpperCase()}_URL`;
    const endpoint = (import.meta.env as Record<string, string | undefined>)[
      envKey
    ];
    if (endpoint) {
      window.location.href = endpoint;
      return;
    }

    setError(
      "This sign-in provider is not configured. Use your username or email.",
    );
  }

  async function handleSignOut() {
    setPending(true);
    setError("");
    try {
      await accountApi.logout();
      await queryClient.cancelQueries({ queryKey: ["profile"] });
      queryClient.removeQueries({ queryKey: ["profile"] });
      queryClient.removeQueries({ queryKey: ["account"] });
      await settings.refetch();
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim();

    if (mode === "register" && registrationStep === 0) {
      if (!registrationSchema.shape.email.safeParse(trimmedEmail).success) {
        setError("Please enter a valid email address.");
        return;
      }
      changeRegistrationStep(1);
      return;
    }
    if (mode === "register" && registrationStep === 1) {
      if (
        !registrationSchema.shape.displayName.safeParse(trimmedDisplayName)
          .success
      ) {
        setError("Please enter your display name (up to 50 characters).");
        return;
      }
      changeRegistrationStep(2);
      return;
    }

    // Client-side validations
    if (mode === "register") {
      if (!trimmedDisplayName) {
        setError("Please enter your display name.");
        return;
      }
      if (!trimmedEmail || !trimmedEmail.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(trimmedUsername)) {
        setError("Username must be 3–24 letters, numbers, or underscores.");
        return;
      }
      if (password.length < 12) {
        setError("Password must be at least 12 characters.");
        return;
      }
      const registration = registrationSchema.safeParse({
        username: trimmedUsername,
        displayName: trimmedDisplayName,
        email: trimmedEmail,
        password,
      });
      if (!registration.success) {
        setError(
          registration.error.issues[0]?.message ||
            "Check your account details.",
        );
        return;
      }
    } else {
      if (!trimmedUsername) {
        setError("Please enter your username or email.");
        return;
      }
      if (!password) {
        setError("Please enter your password.");
        return;
      }
    }

    setError("");
    setPending(true);

    try {
      if (mode === "register") {
        await accountApi.register({
          username: trimmedUsername,
          password,
          email: trimmedEmail,
          displayName: trimmedDisplayName,
        });
        // If automatic login fails, the account still exists: allow signing in again.
        setMode("login");
      }

      const profile = await accountApi.login(trimmedUsername, password);

      // Successfully authenticated
      markVisitorAsKnown();

      await queryClient.cancelQueries({ queryKey: ["profile", "api"] });
      queryClient.removeQueries({ queryKey: ["profile", "api"] });
      queryClient.removeQueries({ queryKey: ["account"] });

      setPassword("");
      navigate(workspaceDestination(redirectTarget, "api", profile.username));
    } catch (cause) {
      if (axios.isAxiosError(cause) && cause.response?.status === 401) {
        setError("The username, email, or password is incorrect.");
      } else if (axios.isAxiosError(cause) && cause.response?.status === 409) {
        setError("That username or email is already registered.");
      } else {
        setError(apiErrorMessage(cause));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      {/* Top Header */}
      <header className="auth-header">
        <Link href="/" className="auth-header-brand" aria-label="Z365 home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            Z365
            <span className="brand-period" aria-hidden="true">
              .
            </span>
          </span>
        </Link>
        <div className="auth-header-actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExploreDemo}
          >
            Explore Demo
          </Button>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="auth-main">
        <div className="auth-layout">
          <AuthStory
            mode={signedIn ? "login" : mode}
            name={displayName}
            username={username}
          />
          <div className="auth-container">
            <div className="auth-card">
              <div className="auth-badge">
                <span className="auth-section-number">01 /</span>
                <span>
                  {mode === "login" ? "WELCOME BACK" : "THE START OF SOMETHING"}
                </span>
              </div>
              <div className="auth-card-header">
                <h1 key={mode} className="auth-mode-title" data-mode={mode}>
                  {signedIn
                    ? "You’re already signed in"
                    : mode === "login"
                      ? "Welcome to Z365"
                      : "Create your Z365 account"}
                </h1>
                <p>
                  {signedIn
                    ? "Continue to your workspace or switch accounts."
                    : mode === "login"
                      ? "Pick up where you left off. Your workspace is waiting."
                      : "One profile. All your progress. Make it yours."}
                </p>
              </div>

              {/* If user is already authenticated */}
              {signedIn && settings.data ? (
                <div className="auth-active-session">
                  <div className="auth-active-header">
                    <div className="auth-active-avatar">
                      <UserRound size={20} />
                    </div>
                    <div className="auth-active-info">
                      <strong>Active Account</strong>
                      <span>{settings.data.email}</span>
                    </div>
                  </div>

                  <div className="auth-active-actions">
                    <Button
                      type="button"
                      className="auth-submit-btn"
                      onClick={() => {
                        markVisitorAsKnown();
                        navigate(workspaceDestination(redirectTarget, "api"));
                      }}
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="auth-guest-btn"
                      disabled={pending}
                      onClick={handleSignOut}
                    >
                      <LogOut size={15} />
                      <span>Sign out of this session</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Auth Form & Tabs */
                <>
                  <div
                    className="auth-tabs"
                    role="tablist"
                    data-mode={mode}
                    aria-label="Account access"
                  >
                    <button
                      type="button"
                      role="tab"
                      id="login-tab"
                      aria-selected={mode === "login"}
                      disabled={pending}
                      className={`auth-tab ${mode === "login" ? "active" : ""}`}
                      onClick={() => handleTabChange("login")}
                    >
                      <LogIn size={15} />
                      <span>Sign in</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      id="register-tab"
                      aria-selected={mode === "register"}
                      disabled={pending}
                      className={`auth-tab ${mode === "register" ? "active" : ""}`}
                      onClick={() => handleTabChange("register")}
                    >
                      <UserPlus size={15} />
                      <span>Create account</span>
                    </button>
                  </div>

                  {(error || sessionError) && (
                    <div className="auth-alert" id="auth-error" role="alert">
                      <AlertCircle size={17} />
                      <span>{error || sessionError}</span>
                    </div>
                  )}

                  <form
                    key={`${mode}-${registrationStep}`}
                    className="auth-form"
                    data-mode={mode}
                    data-direction={stepDirection}
                    aria-label={
                      mode === "login" ? "Sign in form" : "Registration form"
                    }
                    onSubmit={handleSubmit}
                    noValidate
                    aria-busy={pending}
                    aria-describedby={
                      error || sessionError ? "auth-error" : undefined
                    }
                  >
                    {mode === "register" && (
                      <ol
                        className="auth-registration-progress"
                        aria-label="Registration progress"
                      >
                        {registrationSteps.map((label, index) => (
                          <li
                            key={label}
                            aria-current={
                              index === registrationStep ? "step" : undefined
                            }
                            data-complete={index < registrationStep}
                          >
                            <span>
                              {index < registrationStep ? (
                                <Check size={10} />
                              ) : (
                                index + 1
                              )}
                            </span>
                            {label}
                          </li>
                        ))}
                      </ol>
                    )}
                    <div className="auth-step-fields">
                      {mode === "register" && registrationStep === 1 && (
                        <div className="auth-field">
                          <label htmlFor="auth-display-name">
                            Display Name
                          </label>
                          <input
                            ref={stepInput}
                            id="auth-display-name"
                            name="displayName"
                            type="text"
                            required
                            maxLength={50}
                            autoComplete="name"
                            placeholder="e.g. Maya Rao"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                          />
                        </div>
                      )}
                      {mode === "register" && registrationStep === 0 && (
                        <div className="auth-field">
                          <label htmlFor="auth-email">Email Address</label>
                          <input
                            ref={stepInput}
                            id="auth-email"
                            name="email"
                            type="email"
                            required
                            maxLength={100}
                            autoComplete="email"
                            placeholder="maya@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      )}
                      {(mode === "login" || registrationStep === 2) && (
                        <>
                          <div className="auth-field">
                            <label htmlFor="auth-username">
                              {mode === "register"
                                ? "Username"
                                : "Username or Email"}
                            </label>
                            {mode === "register" ? (
                              <div className="auth-prefix-wrapper">
                                <span className="auth-prefix">@</span>
                                <input
                                  ref={stepInput}
                                  id="auth-username"
                                  name="username"
                                  type="text"
                                  required
                                  maxLength={24}
                                  autoComplete="username"
                                  placeholder="maya_code"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                />
                              </div>
                            ) : (
                              <input
                                id="auth-username"
                                name="username"
                                type="text"
                                required
                                maxLength={100}
                                autoComplete="username"
                                placeholder="Username or email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                              />
                            )}
                            {mode === "register" && (
                              <span className="auth-field-hint">
                                3–24 letters, numbers, or underscores.
                              </span>
                            )}
                          </div>

                          <div className="auth-field">
                            <label htmlFor="auth-password">Password</label>
                            <div className="auth-password-wrapper">
                              <input
                                id="auth-password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={mode === "register" ? 12 : undefined}
                                maxLength={72}
                                autoComplete={
                                  mode === "register"
                                    ? "new-password"
                                    : "current-password"
                                }
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                              <button
                                type="button"
                                className="auth-password-toggle"
                                aria-label={
                                  showPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                                aria-pressed={showPassword}
                                onClick={() =>
                                  setShowPassword((value) => !value)
                                }
                              >
                                {showPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            </div>
                            {mode === "register" && (
                              <span className="auth-field-hint">
                                At least 12 characters. Make it one you haven’t
                                used before.
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="auth-form-actions">
                      {mode === "register" && registrationStep > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="auth-back-btn"
                          onClick={() =>
                            changeRegistrationStep(
                              (registrationStep - 1) as RegistrationStep,
                            )
                          }
                          disabled={pending}
                        >
                          <ArrowLeft size={14} /> Back
                        </Button>
                      )}
                      <Button
                        type="submit"
                        data-testid="auth-submit-btn"
                        className="auth-submit-btn"
                        disabled={pending}
                      >
                        <span>
                          {pending
                            ? "Please wait…"
                            : mode === "login"
                              ? "Sign in"
                              : registrationStep === 2
                                ? "Create account"
                                : "Continue"}
                        </span>
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </form>

                  {enabledProviders.length > 0 && (
                    <div className="auth-social-section">
                      <div className="auth-divider">
                        <span>or continue with</span>
                      </div>
                      <div className="auth-social-grid">
                        {enabledProviders.map(({ id, label, Icon }) => (
                          <button
                            key={id}
                            type="button"
                            className="auth-social-btn"
                            disabled={pending}
                            onClick={() => handleSocialAuth(id)}
                            aria-label={`Continue with ${label}`}
                          >
                            <Icon size={18} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="auth-guest-section">
                    <Button
                      type="button"
                      variant="ghost"
                      className="auth-guest-btn"
                      onClick={handleExploreDemo}
                    >
                      <Sparkles size={16} />
                      <span>Explore Demo as Guest</span>
                    </Button>
                    <p className="auth-guest-hint">
                      Take a look around with sample data.
                    </p>
                  </div>
                  <p className="auth-privacy">
                    <LockKeyhole size={12} /> Your profile starts private. Share
                    when you’re ready.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className="auth-footer">
        <span>A little progress. A bigger possibility.</span>
        <span>Built for your next chapter.</span>
      </footer>
    </div>
  );
}
