"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { ToastProvider } from "@/lib/toast/toast-context";
import { useSplash } from "@/components/splash/SplashProvider";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  useSplash(loading || !user);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
