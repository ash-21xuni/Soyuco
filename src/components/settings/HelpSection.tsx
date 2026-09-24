"use client";

import { useToast } from "@/lib/toast/toast-context";
import { SettingsCardTitle } from "@/components/settings/SettingsIcon";

const FAQS = [
  {
    q: "Where is my data stored?",
    a: "Your entries, planner items, budget data, and mood history are saved to your account and kept locally in your browser too, so everything loads instantly and stays with you across devices when you're signed in.",
  },
  {
    q: "Can I change my theme later?",
    a: "Yes — switch between the free and premium themes any time from the Preferences tab.",
  },
  {
    q: "I signed in with Google — can I also use a password?",
    a: "Yes. Set one from the Profile tab and you'll be able to sign in with either method afterwards.",
  },
  {
    q: "What happens when I delete my account?",
    a: "Every journal entry, planner item, budget record, and mood log tied to your account is permanently removed. This can't be undone.",
  },
];

export function HelpSection() {
  const { showToast } = useToast();

  return (
    <>
      <div className="planner-card">
        <div className="planner-card-header">
          <SettingsCardTitle icon="help">Frequently Asked Questions</SettingsCardTitle>
        </div>
        <div className="planner-card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {FAQS.map((item) => (
            <div key={item.q}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>
                {item.q}
              </div>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text2)", marginTop: 4, lineHeight: 1.6 }}>
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="planner-card">
        <div className="planner-card-header">
          <SettingsCardTitle icon="mail">Contact & Feedback</SettingsCardTitle>
        </div>
        <div className="planner-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--text2)" }}>
            Found a bug or have an idea for Soyuco? Let us know.
          </div>
          <button
            className="btn btn-ghost"
            style={{ flexShrink: 0 }}
            onClick={() => showToast("In-app feedback is coming soon.", "info")}
          >
            Send Feedback
          </button>
        </div>
      </div>
    </>
  );
}
