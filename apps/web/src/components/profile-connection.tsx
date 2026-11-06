import axios from "axios";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Cloud, RefreshCw, Unplug } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { useWorkspace } from "@/lib/workspace-context";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api/client";
import { usernameSchema } from "@/lib/api/schemas";

export function SourceControl() {
  const dashboard = useDashboard();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(dashboard.username);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    navigate(`/u/${encodeURIComponent(parsed.data)}?source=api`);
    setOpen(false);
  }
  return (
    <>
      <button
        className={`demo-pill source-control ${dashboard.source === "api" ? "source-api" : ""}`}
        onClick={() => setOpen(true)}
      >
        <span />
        {dashboard.source === "demo"
          ? "Demo workspace"
          : dashboard.identity.isSuccess
            ? "Connected profile"
            : "API connection"}
        <ChevronDown size={10} />
      </button>
      {open && (
        <Modal
          title="Your profile, connected"
          description="Load your Z365 profile or explore the illustrative preview."
          onClose={() => setOpen(false)}
        >
          <form className="profile-form" onSubmit={submit}>
            <label>
              Z365 username
              <input
                autoFocus
                value={username}
                maxLength={24}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                placeholder="Your username"
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="info-note">
              <Cloud size={18} />
              <span>
                Connected mode uses your account’s server responses. Your
                existing Z365 sign-in session is sent with requests. Demo mode
                uses clearly labeled illustrative data.
              </span>
            </div>
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigate("/?source=demo");
                  setOpen(false);
                }}
              >
                View demo
              </Button>
              <Button type="submit">
                Load profile <Cloud size={15} />
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function ProfileConnectionNotice() {
  const dashboard = useDashboard();
  const { openAccount } = useWorkspace();
  if (dashboard.source === "demo") return null;
  if (!dashboard.validUsername)
    return (
      <div className="connection-notice is-error" role="alert">
        <Unplug size={19} />
        <div>
          <strong>Check the profile username</strong>
          <p>Use 3–24 letters, numbers, or underscores.</p>
        </div>
      </div>
    );
  if (dashboard.identity.isPending)
    return (
      <div className="connection-notice" role="status">
        <RefreshCw size={18} className="is-spinning" />
        <div>
          <strong>Connecting your profile</strong>
          <p>Loading your identity and verified progress from Z365.</p>
        </div>
      </div>
    );
  if (
    axios.isAxiosError(dashboard.identity.error) &&
    dashboard.identity.error.response?.status === 401
  )
    return (
      <div className="connection-notice">
        <Cloud size={20} />
        <div>
          <strong>Sign in to your coding profile</strong>
          <p>Create an account or sign in to track your coding activity.</p>
        </div>
        <Button size="sm" onClick={openAccount}>
          Sign in
        </Button>
      </div>
    );
  if (dashboard.identity.isError)
    return (
      <div className="connection-notice is-error" role="alert">
        <Unplug size={20} />
        <div>
          <strong>Your profile couldn’t be loaded</strong>
          <p>{apiErrorMessage(dashboard.identity.error)}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => dashboard.identity.refetch()}
        >
          Try again <RefreshCw size={13} />
        </Button>
      </div>
    );
  return null;
}

export function PanelStatus({
  pending,
  error,
  empty,
  children,
}: {
  pending?: boolean;
  error?: unknown;
  empty?: boolean;
  children?: React.ReactNode;
}) {
  const dashboard = useDashboard();
  if (dashboard.source === "api" && dashboard.identity.isError)
    return (
      <p className="panel-empty">
        Connect your profile to view verified progress.
      </p>
    );
  if (error)
    return (
      <div className="panel-empty panel-error" role="alert">
        <span>{apiErrorMessage(error)}</span>
        <button onClick={() => dashboard.refresh()}>
          Try again <RefreshCw size={12} />
        </button>
      </div>
    );
  if (pending)
    return (
      <div
        className="panel-skeleton"
        role="status"
        aria-label="Loading profile data"
      >
        <i />
        <i />
        <i />
      </div>
    );
  if (empty)
    return (
      <p className="panel-empty">
        {children || "Verified activity will appear here as you make progress."}
      </p>
    );
  return null;
}
