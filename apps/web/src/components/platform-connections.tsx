import { platformMeta } from "@/lib/platform-meta";
import { useState, type FormEvent } from "react";
import {
  ExternalLink,
  Link2,
  LoaderCircle,
  RefreshCw,
  Unlink,
} from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { useWorkspace } from "@/lib/workspace-context";
import { Button } from "@/components/ui/button";
import { DataIcon } from "@/components/ui/data-icon";
import { PanelStatus } from "@/components/profile-connection";
import { apiErrorMessage } from "@/lib/api/client";
import { platformLinkSchema, type PlatformLink } from "@/lib/api/schemas";

export function PlatformConnections() {
  const dashboard = useDashboard();
  const { notify } = useWorkspace();
  const [draft, setDraft] = useState<PlatformLink>({
    platform: "github",
    handle: "",
  });
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const parsed = platformLinkSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    try {
      const connection = await dashboard.linkPlatform.mutateAsync(parsed.data);
      setDraft({ ...draft, handle: "" });
      notify(
        dashboard.source === "demo"
          ? "Preview connection saved. Verification is pending."
          : connection.status === "limited"
            ? "Platform link saved with limited integration."
            : connection.status === "verified"
              ? "Platform connection saved."
              : "Platform saved. Follow the verification steps below.",
      );
    } catch (cause) {
      setError(apiErrorMessage(cause));
    }
  }
  async function unlink(platform: PlatformLink["platform"]) {
    setError("");
    try {
      await dashboard.unlinkPlatform.mutateAsync(platform);
      notify("Platform link removed.");
    } catch (cause) {
      setError(apiErrorMessage(cause));
    }
  }
  async function sync(platform: PlatformLink["platform"]) {
    setError("");
    try {
      await dashboard.syncPlatform.mutateAsync(platform);
      notify("Platform sync queued.");
    } catch (cause) {
      setError(apiErrorMessage(cause));
    }
  }
  return (
    <>
      <PanelStatus
        pending={dashboard.platforms.isPending}
        error={dashboard.platforms.error}
        empty={!dashboard.connections.length}
      >
        Link your first coding platform to bring your progress together.
      </PanelStatus>
      <div className="platform-modal-list">
        {dashboard.connections.map((connection) => {
          const meta = platformMeta[connection.platform];
          return (
            <div className="connection-row" key={connection.id}>
              <span className={`round-icon ${meta.color}`}>
                <DataIcon name={meta.mark} size={23} />
              </span>
              <div>
                <strong>
                  {meta.name}
                  <span className={`connection-status ${connection.status}`}>
                    {dashboard.source === "demo" && "Demo · "}
                    {connection.status}
                  </span>
                </strong>
                <span>
                  @{connection.handle} ·{" "}
                  {connection.rating !== null &&
                  connection.status === "verified"
                    ? `Rating ${connection.rating.toLocaleString("en-US")}`
                    : connection.status === "limited"
                      ? "Public link only"
                      : connection.status === "verified"
                        ? "Ownership verified"
                        : "Awaiting verification"}
                </span>
                {connection.verificationCode && dashboard.canEdit && (
                  <small className="platform-proof">
                    Add <code>{connection.verificationCode}</code> to your
                    public{" "}
                    {connection.platform === "github"
                      ? "GitHub bio"
                      : "Codeforces organization field"}
                    . Choose Verify, then remove the code once verified.
                  </small>
                )}
                {connection.syncError && (
                  <small role="status">{connection.syncError}</small>
                )}
                {connection.syncing && (
                  <small role="status">Sync in progress…</small>
                )}
                {connection.observedActions != null && (
                  <small>
                    {connection.observedActions.toLocaleString()} recorded
                    public actions in the past 365 days
                  </small>
                )}
                {connection.solvedProblems != null && (
                  <small>
                    {connection.solvedProblems.toLocaleString()} distinct
                    Codeforces problems solved in that data
                  </small>
                )}
                {connection.coverageFrom && (
                  <small>
                    Latest import window starts {connection.coverageFrom} UTC
                  </small>
                )}
                {connection.lastSyncedAt && (
                  <small>
                    Updated{" "}
                    {new Date(connection.lastSyncedAt).toLocaleDateString()}
                  </small>
                )}
              </div>
              <a
                href={connection.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${meta.name} profile`}
              >
                <ExternalLink size={15} />
              </a>
              {dashboard.source === "api" &&
                dashboard.canEdit &&
                ["github", "codeforces"].includes(connection.platform) && (
                  <button
                    className="subtle-icon"
                    type="button"
                    onClick={() => void sync(connection.platform)}
                    disabled={
                      connection.syncing || dashboard.syncPlatform.isPending
                    }
                    title={connection.verificationCode ? "Verify" : "Refresh"}
                    aria-label={`${connection.verificationCode ? "Verify" : "Refresh"} ${meta.name}`}
                  >
                    <RefreshCw size={15} />
                  </button>
                )}
              {dashboard.canEdit && (
                <button
                  className="subtle-icon"
                  onClick={() => unlink(connection.platform)}
                  disabled={dashboard.unlinkPlatform.isPending}
                  aria-label={`Unlink ${meta.name}`}
                >
                  <Unlink size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {dashboard.canEdit && (
        <form className="profile-form platform-link-form" onSubmit={submit}>
          <div className="form-row">
            <label>
              Platform
              <select
                aria-label="Platform"
                value={draft.platform}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    platform: event.target.value as PlatformLink["platform"],
                  })
                }
              >
                {Object.entries(platformMeta).map(([key, value]) => (
                  <option value={key} key={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Platform username
              <input
                autoComplete="off"
                required
                maxLength={50}
                value={draft.handle}
                onChange={(event) =>
                  setDraft({ ...draft, handle: event.target.value })
                }
                placeholder="Your platform handle"
              />
            </label>
          </div>
          <p className="field-note">
            {dashboard.source === "demo"
              ? "Preview links illustrate the connection flow."
              : "GitHub and Codeforces require proof of ownership. Other platforms can be saved as public links."}
          </p>
          <Button type="submit" disabled={dashboard.linkPlatform.isPending}>
            {dashboard.linkPlatform.isPending ? (
              <LoaderCircle size={15} className="is-spinning" />
            ) : (
              <Link2 size={15} />
            )}
            {dashboard.linkPlatform.isPending ? "Linking…" : "Link platform"}
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </>
  );
}
