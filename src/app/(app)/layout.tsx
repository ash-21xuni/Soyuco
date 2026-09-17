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

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  useJournalReminder();

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
