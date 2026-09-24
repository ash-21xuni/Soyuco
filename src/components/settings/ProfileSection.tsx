"use client";

import { useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast/toast-context";
import { SettingsCardTitle } from "@/components/settings/SettingsIcon";
import { profileName } from "@/lib/supabase/display-name";

export function ProfileSection() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(() => profileName(user));
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const providers = user?.app_metadata?.providers ?? [];
  const isGoogleLinked = providers.includes("google");

  async function saveDisplayName() {
    const clean = displayName.trim();
    if (!clean) {
      showToast("Display name can't be empty.", "error");
      return;
    }
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: clean } });
    setSavingName(false);
    showToast(error ? error.message : "Display name updated.", error ? "error" : "success");
  }

  async function saveEmail() {
    const clean = email.trim();
    if (!clean || clean === user?.email) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: clean });
    setSavingEmail(false);
    showToast(
      error ? error.message : `Confirmation link sent to ${clean}. Click it to finish changing your email.`,
      error ? "error" : "success",
    );
  }

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="user">Profile</SettingsCardTitle>
        {isGoogleLinked && (
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem", color: "var(--text3)" }}>
            Signed in with Google
          </span>
        )}
      </div>
      <div className="planner-card-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label className="login-label">Display Name</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              className="login-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <button className="btn btn-primary" onClick={saveDisplayName} disabled={savingName}>
              Save
            </button>
          </div>
        </div>

        <div>
          <label className="login-label">Email Address</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={saveEmail}
              disabled={savingEmail || email.trim() === user?.email}
            >
              Save
            </button>
          </div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", color: "var(--text3)", marginTop: 6 }}>
            Changing your email sends a confirmation link to the new address.
          </div>
        </div>
      </div>
    </div>
  );
}
