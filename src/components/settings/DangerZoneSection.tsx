"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PromptModal } from "@/components/modals/PromptModal";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/lib/toast/toast-context";

export function DangerZoneSection() {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm(value: string) {
    if (value.trim().toUpperCase() !== "DELETE") {
      showToast('Type "DELETE" exactly to confirm.', "error");
      return;
    }
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      showToast(error, "error");
      return;
    }
    setOpen(false);
    router.push("/");
  }

  return (
    <div className="planner-card" style={{ borderColor: "var(--danger)" }}>
      <div className="planner-card-header">
        <div className="planner-card-title" style={{ color: "var(--danger)" }}>⚠ Danger Zone</div>
      </div>
      <div className="planner-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--text)" }}>
            Delete Account
          </div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", color: "var(--text3)", marginTop: 2 }}>
            Permanently deletes your journal, planner, and budget data. This cannot be undone.
          </div>
        </div>
        <button
          className="btn"
          style={{ background: "var(--danger)", color: "#fff", flexShrink: 0 }}
          onClick={() => setOpen(true)}
          disabled={deleting}
        >
          Delete Account
        </button>
      </div>

      <PromptModal
        open={open}
        title="Delete Account?"
        label='Type "DELETE" to confirm'
        placeholder="DELETE"
        confirmLabel="Delete Account"
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
