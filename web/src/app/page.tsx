import Link from "next/link";
import "./landing.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="nav-landing">
        <nav className="nav-container">
          <a href="#" className="logo-link">
            <div className="logo-img-slot" style={{ width: 36, height: 36 }}>
              <img src="/logo.svg" alt="Soyuco Logo" style={{ width: 40, height: 40 }} />
            </div>
            <span className="logo-text">Soyuco</span>
          </a>
          <div className="nav-links">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#philosophy" className="nav-link">
              Philosophy
            </a>
            <Link href="/login" className="nav-link">
              Sign In
            </Link>
            <Link href="/login" className="btn-landing-primary" style={{ padding: "8px 20px" }}>
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="landing-container">
          <div className="hero-section">
            <div className="hero-content">
              <div className="badge">
                <span>✦</span>
                <span className="badge-text">PRIVATE SANCTUARY</span>
              </div>
              <h1 className="hero-title">
                Your journal,
                <br />
                <span className="text-gradient">everywhere</span> you go.
              </h1>
              <p className="hero-subtitle">
                Soyuco is a space for the unspoken. Capture your daily reflections in a
                minimalist interface designed for clarity and peace.
              </p>
              <div className="button-group">
                <Link href="/login" className="btn-landing-primary">
                  Start Journaling
                </Link>
                <a href="#features" className="btn-landing-secondary">
                  Learn More
                </a>
              </div>
            </div>
            <div className="hero-image">
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: -20,
                    background: "radial-gradient(ellipse, var(--ai-glow) 0%, transparent 70%)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    background: "linear-gradient(135deg, var(--surface) 0%, var(--bg2) 100%)",
                    borderRadius: 48,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      background: "var(--bg)",
                      borderRadius: 40,
                      padding: 20,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 280,
                        height: 500,
                        background: "linear-gradient(180deg, var(--surface) 0%, var(--bg2) 100%)",
                        borderRadius: 32,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              background: "var(--danger)",
                              borderRadius: "50%",
                            }}
                          />
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              background: "var(--accent)",
                              borderRadius: "50%",
                            }}
                          />
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              background: "var(--success)",
                              borderRadius: "50%",
                            }}
                          />
                        </div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--accent2)" }}>
                          ✦ Journal
                        </div>
                      </div>
                      <div style={{ padding: 16, flex: 1 }}>
                        <div
                          style={{
                            background: "var(--surface)",
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 12,
                          }}
                        >
                          <div style={{ fontSize: "0.7rem", color: "var(--text3)" }}>Today</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text)" }}>
                            Found peace in the morning silence...
                          </div>
                        </div>
                        <div
                          style={{
                            background: "var(--surface)",
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 12,
                          }}
                        >
                          <div style={{ fontSize: "0.7rem", color: "var(--text3)" }}>Yesterday</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text)" }}>
                            Completed the project ahead of schedule...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section" id="features">
          <div className="landing-container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Refined Features</h2>
                <p className="section-subtitle">
                  Built with a deep respect for your privacy and the quiet ritual of daily
                  writing.
                </p>
              </div>
              <Link
                href="/login"
                style={{
                  color: "var(--accent)",
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--accent)",
                  paddingBottom: 4,
                }}
              >
                View All Capabilities →
              </Link>
            </div>
            <div className="features-grid">
              {/* Feature 1 */}
              <div className="feature-card">
                <div className="feature-icon">
                  <span>📝</span>
                </div>
                <h3 className="feature-title">Daily Reflections</h3>
                <p className="feature-description">
                  Effortless writing with a focus on the present. Capture thoughts, locations,
                  and voices with ease.
                </p>
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: "50%" }} />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text2)" }}>Morning entry</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text3)" }}>2 hours ago</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="right-column">
                <div className="feature-card">
                  <div className="feature-icon">
                    <span>🔒</span>
                  </div>
                  <h3 className="feature-title">Secure & Private</h3>
                  <p className="feature-description">
                    End-to-end encryption ensures your sanctuary remains for your eyes only.
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">
                    <span>🔄</span>
                  </div>
                  <h3 className="feature-title">Cross-Device Sync</h3>
                  <p className="feature-description">
                    Your thoughts flow seamlessly across your phone, tablet, and desktop.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div
                className="feature-card"
                style={{
                  background: "linear-gradient(135deg, var(--surface), var(--bg3))",
                  borderColor: "var(--accent)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: 16 }}>✦</div>
                <h3 className="feature-title" style={{ color: "var(--accent2)" }}>
                  Crafted for the Private Sanctuary
                </h3>
                <p className="feature-description" style={{ marginBottom: 24 }}>
                  Minimalist by design. Powerful by intent.
                </p>
                <Link href="/login" className="btn-landing-primary" style={{ width: "100%", textAlign: "center" }}>
                  Explore More
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="landing-container" id="philosophy">
          <div className="philosophy-section">
            <div className="quote-icon">&ldquo;</div>
            <h2 className="quote-text">
              &quot;Soyuco is built on the belief that clarity begins with a single word spoken
              into the silence.&quot;
            </h2>
            <div className="divider" />
            <p className="hero-subtitle" style={{ maxWidth: "none" }}>
              We designed this space to be a retreat from the noise of the digital world. No
              notifications, no social pressure, no distractions—just you and your thoughts in
              an elegant, leather-bound digital sanctuary.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="landing-container">
          <div className="cta-section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
              <div className="logo-img-slot" style={{ width: 36, height: 36 }}>
                <img src="/logo.svg" alt="Soyuco Logo" style={{ width: 40, height: 40 }} />
              </div>
              <span className="logo-text" style={{ fontSize: "1.5rem" }}>
                Soyuco
              </span>
            </div>
            <h2 className="cta-title">Ready to find clarity?</h2>
            <p className="hero-subtitle" style={{ maxWidth: 500, margin: "0 auto 24px" }}>
              Join thousands of users who have found their private sanctuary for reflection and
              growth.
            </p>
            <Link href="/login" className="btn-landing-primary" style={{ padding: "16px 48px" }}>
              Sign In Now →
            </Link>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text3)",
                marginTop: 24,
              }}
            >
              NO CREDIT CARD REQUIRED • CANCEL ANYTIME
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="landing-container">
          <div className="footer-content">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, justifyContent: "center" }}>
                <span className="logo-text">Soyuco</span>
              </div>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--text3)" }}>
                © 2026 Soyuco. All rights reserved.
                <br />
                Crafted for the private sanctuary.
              </p>
            </div>
            <div className="footer-links">
              <a href="#" className="footer-link">
                Privacy Policy
              </a>
              <a href="#" className="footer-link">
                Terms of Service
              </a>
              <a href="#" className="footer-link">
                Support
              </a>
              <a href="#" className="footer-link">
                Journaling Guide
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
