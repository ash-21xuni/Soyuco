"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useSplash } from "@/components/splash/SplashProvider";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  useSplash(!timedOut);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/journal");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="login-body">
      <div className="login-container">
        <div className="login-card" style={{ textAlign: "center" }}>
          {timedOut ? (
            <div className="login-error" style={{ display: "block" }}>
              Sign-in is taking longer than expected.{" "}
              <a href="/login" style={{ color: "var(--accent2)" }}>Back to sign in</a>
            </div>
          ) : (
            <p style={{ color: "var(--text2)" }}>Signing you in...</p>
          )}
        </div>
      </div>
    </div>
  );
}
