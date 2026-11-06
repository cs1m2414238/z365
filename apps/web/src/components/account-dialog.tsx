import axios from "axios";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Link from "@/components/ui/link";
import { accountApi, apiErrorMessage } from "@/lib/api/client";

export function AccountDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const settings = useQuery({
    queryKey: ["account", "settings"],
    queryFn: ({ signal }) => accountApi.settings(signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const [register, setRegister] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const signedOut =
    axios.isAxiosError(settings.error) &&
    [401, 404].includes(settings.error.response?.status ?? 0);

  async function changeSession(path: string) {
    await cache.cancelQueries({ queryKey: ["profile", "api"] });
    cache.removeQueries({ queryKey: ["profile", "api"] });
    cache.removeQueries({ queryKey: ["account"] });
    navigate(path);
    onClose();
  }

  async function run(action: () => Promise<void>) {
    if (pending) return;
    setError("");
    setPending(true);
    try {
      await action();
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");
    void run(async () => {
      if (register) {
        await accountApi.register({
          username,
          password,
          email: String(form.get("email") ?? "").trim(),
          displayName: String(form.get("displayName") ?? "").trim(),
        });
        setRegister(false);
      }
      try {
        const profile = await accountApi.login(username, password);
        await changeSession(
          `/u/${encodeURIComponent(profile.username)}?source=api`,
        );
      } catch (cause) {
        if (axios.isAxiosError(cause) && cause.response?.status === 401) {
          throw new Error("The username, email, or password is incorrect.");
        }
        throw cause;
      }
    });
  }

  return (
    <Modal
      title={
        settings.isSuccess
          ? "Account settings"
          : register
            ? "Create your Z365 account"
            : "Sign in to Z365"
      }
      onClose={onClose}
    >
      {settings.isPending && <p role="status">Checking your session…</p>}
      {settings.isError && !signedOut && (
        <div className="profile-form">
          <p role="alert">{apiErrorMessage(settings.error)}</p>
          <Button onClick={() => void settings.refetch()}>Try again</Button>
        </div>
      )}
      {signedOut && (
        <form className="profile-form" onSubmit={authenticate}>
          {register && (
            <>
              <label>
                Display name
                <input
                  name="displayName"
                  required
                  maxLength={50}
                  autoComplete="name"
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={100}
                  autoComplete="email"
                />
              </label>
            </>
          )}
          <label>
            {register ? "Username" : "Username or email"}
            <input
              name="username"
              required
              maxLength={register ? 24 : 100}
              pattern={register ? "[a-zA-Z0-9_]{3,24}" : undefined}
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={register ? 12 : undefined}
              maxLength={72}
              autoComplete={register ? "new-password" : "current-password"}
            />
          </label>
          <div className="form-actions">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setError("");
                setRegister(!register);
              }}
            >
              {register ? "Use an existing account" : "Create account"}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Please wait…" : register ? "Register" : "Sign in"}
            </Button>
          </div>
          <div style={{ textAlign: "center", marginTop: "4px" }}>
            <Link
              href="/login"
              onClick={onClose}
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                textDecoration: "underline",
              }}
            >
              Open full login page
            </Link>
          </div>
        </form>
      )}
      {settings.data && (
        <div className="profile-form">
          <label>
            Account email
            <input value={settings.data.email} readOnly />
          </label>
          <label>
            Profile visibility
            <select
              value={settings.data.isPublic ? "public" : "private"}
              disabled={pending}
              onChange={(event) => {
                const isPublic = event.target.value === "public";
                void run(async () => {
                  const updated = await accountApi.updatePrivacy(isPublic);
                  cache.setQueryData(["account", "settings"], updated);
                  await cache.invalidateQueries({
                    queryKey: ["profile", "api"],
                  });
                });
              }}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <div className="form-actions">
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirmDelete(!confirmDelete)}
            >
              {confirmDelete ? "Cancel deletion" : "Delete account"}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                void run(async () => {
                  await accountApi.logout();
                  await changeSession("/?source=api");
                })
              }
            >
              Sign out
            </Button>
          </div>
          {confirmDelete && (
            <form
              className="profile-form"
              onSubmit={(event) => {
                event.preventDefault();
                const password = String(
                  new FormData(event.currentTarget).get("deletePassword") ?? "",
                );
                void run(async () => {
                  await accountApi.delete(password);
                  await changeSession("/?source=api");
                });
              }}
            >
              <p>
                This permanently removes your Z365 account, profile, and
                imported activity.
              </p>
              <label>
                Confirm your password
                <input
                  name="deletePassword"
                  type="password"
                  required
                  maxLength={72}
                  autoComplete="current-password"
                />
              </label>
              <Button type="submit" disabled={pending}>
                Permanently delete account
              </Button>
            </form>
          )}
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
