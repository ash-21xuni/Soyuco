import type { User } from "@supabase/supabase-js";

// The name the user chose in settings wins; otherwise fall back to what the
// OAuth provider supplied (Google sets full_name/name, never display_name).
export function profileName(user: User | null | undefined): string {
  const meta = user?.user_metadata ?? {};
  return (meta.display_name || meta.full_name || meta.name || "").trim();
}

// For places that must always show something, e.g. the topbar.
export function displayName(user: User | null | undefined): string {
  return profileName(user) || user?.email?.split("@")[0] || "";
}
