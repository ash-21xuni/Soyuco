"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useAuth } from "@/lib/supabase/auth-context";
import { BudgetProvider } from "@/lib/budget/budget-context";
import { JournalProvider } from "@/lib/journal/journal-context";
import { PlannerProvider } from "@/lib/planner/planner-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { ToastProvider } from "@/lib/toast/toast-context";
import { useJournalReminder } from "@/lib/notifications/reminder";
import { useJournal } from "@/lib/journal/journal-context";
import { usePlanner } from "@/lib/planner/planner-context";
import { useSplash } from "@/components/splash/SplashProvider";

// Keeps the splash up until the first cloud pull lands, so a fresh device
// never shows empty journal/planner screens that then pop full.
function SplashUntilSynced() {
  const { synced: journalSynced } = useJournal();
  const { synced: plannerSynced } = usePlanner();
  useSplash(!journalSynced || !plannerSynced);
  return null;
}

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  useJournalReminder();
  useSplash(loading || !user);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        <JournalProvider>
          <PlannerProvider>
            <BudgetProvider>
              <SplashUntilSynced />
              <div id="app">
                <Sidebar />
                <main id="main">
                  <Topbar />
                  <div id="content">{children}</div>
                </main>
              </div>
            </BudgetProvider>
          </PlannerProvider>
        </JournalProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
