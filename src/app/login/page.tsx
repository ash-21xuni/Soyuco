"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/supabase/auth-context";

type Tab = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();

  const [tab, setTab] = useState<Tab>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

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

  async function handleGoogleSignIn() {
    setError(null);
    setSuccess(null);
    setGoogleSubmitting(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setGoogleSubmitting(false);
    }
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

          <button
            type="button"
            className="login-btn-google"
            onClick={handleGoogleSignIn}
            disabled={googleSubmitting}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.26h2.92c1.7-1.57 2.69-3.88 2.69-6.63z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A8.97 8.97 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          <div className="login-divider">
            <span>or</span>
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
                <div className="login-password-wrap">
                  <input
                    className="login-input"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showLoginPassword} />
                  </button>
                </div>
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
                <div className="login-password-wrap">
                  <input
                    className="login-input"
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="at least 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowSignupPassword((v) => !v)}
                    aria-label={showSignupPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showSignupPassword} />
                  </button>
                </div>
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

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
