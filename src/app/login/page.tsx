"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/supabase/auth-context";

type Tab = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp } = useAuth();

  const [tab, setTab] = useState<Tab>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/journal");
    }
  }, [loading, user, router]);

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
    setSuccess(null);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginEmail || !loginPassword) {
      setError("Please enter email and password");
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setSubmitting(false);

    if (error) {
      setError(error);
      return;
    }

    setSuccess("Sign in successful! Redirecting...");
    setTimeout(() => router.push("/journal"), 1000);
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!signupName || !signupEmail || !signupPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setSubmitting(false);

    if (error) {
      setError(error);
      return;
    }

    setSuccess("Account created! Please check your email to confirm, then sign in.");
    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
    setTimeout(() => switchTab("login"), 2000);
  }

  return (
    <div className="login-body">
      <div className="login-container">
        <div className="login-logo">
          <Link href="/">
            <div className="login-logo-img">
              <img src="/logo.svg" alt="Soyuco Logo" />
            </div>
            <div>
              <h1>Soyuco</h1>
              <p>Your journal, everywhere you go</p>
            </div>
          </Link>
        </div>

        <div className="login-card">
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab${tab === "login" ? " active" : ""}`}
              onClick={() => switchTab("login")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`login-tab${tab === "signup" ? " active" : ""}`}
              onClick={() => switchTab("signup")}
            >
              Create Account
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="login-form-group">
                <label className="login-label">Email</label>
                <input
                  className="login-input"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="login-form-group">
                <label className="login-label">Password</label>
                <input
                  className="login-input"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <button className="login-btn-primary" type="submit" disabled={submitting}>
                Sign In →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="login-form-group">
                <label className="login-label">Display Name</label>
                <input
                  className="login-input"
                  type="text"
                  placeholder="How should we call you?"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>
              <div className="login-form-group">
                <label className="login-label">Email</label>
                <input
                  className="login-input"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>
              <div className="login-form-group">
                <label className="login-label">Password</label>
                <input
                  className="login-input"
                  type="password"
                  placeholder="at least 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>
              <button className="login-btn-primary" type="submit" disabled={submitting}>
                Create Account →
              </button>
            </form>
          )}

          {error && <div className="login-error" style={{ display: "block" }}>{error}</div>}
          {success && <div className="login-success" style={{ display: "block" }}>{success}</div>}
        </div>
      </div>
    </div>
  );
}
