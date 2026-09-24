"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast/toast-context";
import { SettingsCardTitle } from "@/components/settings/SettingsIcon";

export function PasswordSection() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const providers = user?.app_metadata?.providers ?? [];
  const hasPassword = providers.includes("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    if (password !== confirm) {
      showToast("Passwords don't match.", "error");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setPassword("");
    setConfirm("");
    showToast(hasPassword ? "Password updated." : "Password set — you can now sign in with email too.");
  }

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="lock">Password</SettingsCardTitle>
      </div>
      <div className="planner-card-body">
        {!hasPassword && (
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text2)", marginBottom: 14 }}>
            You signed in with Google and don&apos;t have a password yet. Set one below to also allow signing in with your email address.
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="login-label">{hasPassword ? "New Password" : "Password"}</label>
            <input
              className="login-input"
              type="password"
              placeholder="at least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <label className="login-label">Confirm Password</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ alignSelf: "flex-start" }}>
            {hasPassword ? "Update Password" : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
