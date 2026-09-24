import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Libre_Caslon_Text, Manrope } from "next/font/google";
import { ScrollEffects } from "@/components/landing/ScrollEffects";
import "./landing.css";

const caslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--lp-font-serif",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--lp-font-sans",
});

export const metadata: Metadata = {
  title: "Soyuco",
};

function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {name}
    </span>
  );
}

function Logo() {
  return <img src="/logo.svg" alt="" className="lp-logo-mark" />;
}

export default function LandingPage() {
  return (
    <div className={`landing-page ${caslon.variable} ${manrope.variable}`}>
      {/* next/font has no Material Symbols; React hoists this into <head> */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        precedence="default"
      />

      <ScrollEffects />
      <div className="lp-progress" aria-hidden="true" />

      <header className="lp-header">
        <nav className="lp-nav lp-container">
          <a href="#" className="lp-brand">
            <Logo />
            <span className="lp-wordmark">Soyuco</span>
          </a>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#philosophy">Philosophy</a>
            <a href="#security">Security</a>
            <a href="#journal">Journal</a>
          </div>
          <Link href="/login" className="lp-btn lp-btn-primary lp-btn-sm">
            Sign In
          </Link>
        </nav>
      </header>

      <main className="lp-main">
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-hero-glow" />
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-text" data-reveal>
              <div className="lp-pill">
                <span className="lp-pill-dot" />
                <span>Private Sanctuary</span>
              </div>
              <h1 className="lp-hero-title">
                Your thoughts, <br />
                <span className="lp-gold-text">preserved in stillness.</span>
              </h1>
              <p className="lp-hero-lede">
                Soyuco is an encrypted, distraction-free digital journal designed for mindful
                clarity. A timeless space where honesty meets quiet luxury, crafted for daily
                stillness.
              </p>
              <div className="lp-hero-actions">
                <Link href="/login" className="lp-btn lp-btn-primary lp-btn-lg lp-arrow-btn">
                  <span>Sign In Now</span>
                  <span className="lp-arrow">→</span>
                </Link>
                <a href="#features" className="lp-btn lp-btn-ghost lp-btn-lg">
                  Explore More
                </a>
              </div>
              <div className="lp-trust">
                <div>
                  <Icon name="lock" />
                  <span>Zero Knowledge</span>
                </div>
                <span className="lp-trust-sep">•</span>
                <div>
                  <Icon name="verified_user" />
                  <span>End-to-End Encrypted</span>
                </div>
                <span className="lp-trust-sep">•</span>
                <div>
                  <Icon name="sync_saved_locally" />
                  <span>Private by Design</span>
                </div>
              </div>
            </div>

            <div className="lp-hero-visual" data-reveal>
              <div className="lp-device">
                <div className="lp-device-backlight" />
                <div className="lp-device-frame">
                  <Image
                    src="/landing/hero.png"
                    alt="Soyuco Sanctuary Reflection Interface"
                    width={293}
                    height={512}
                    priority
                  />
                  <div className="lp-device-gloss" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="lp-features" id="features">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <div>
                <p className="lp-eyebrow">Core Architecture</p>
                <h2 className="lp-h2">Crafted for intentional writing.</h2>
                <p className="lp-section-sub">
                  Every interaction has been honed to eliminate digital clutter, protecting your
                  sacred state of mindful introspection.
                </p>
              </div>
              <Link href="/login" className="lp-text-link">
                <span>View All Capabilities</span>
                <span>→</span>
              </Link>
            </div>

            <div className="lp-grid">
              <div data-reveal className="lp-card">
                <div>
                  <div className="lp-card-icon">
                    <Icon name="stylus_note" />
                  </div>
                  <h3 className="lp-card-title">Daily Reflections</h3>
                  <p className="lp-card-body">
                    An uncluttered editorial canvas configured to keep the hand moving. Capture
                    instantaneous thoughts, voice snippets, and ambient moments with serene
                    elegance.
                  </p>
                </div>
                <div className="lp-card-preview">
                  <Image
                    src="/landing/reflections.png"
                    alt="Soyuco Interface Preview"
                    width={293}
                    height={512}
                  />
                  <div className="lp-card-preview-fade" />
                </div>
              </div>

              <div data-reveal className="lp-card" id="security">
                <div>
                  <div className="lp-card-icon">
                    <Icon name="shield_locked" />
                  </div>
                  <h3 className="lp-card-title">Zero-Knowledge Sanctuary</h3>
                  <p className="lp-card-body">
                    Your journal entries are encrypted client-side before touching the network.
                    No ads, no algorithmic data harvesting, and no LLM training on your thoughts.
                  </p>
                </div>
                <div className="lp-crypto">
                  <div className="lp-crypto-row">
                    <span>Encryption Level</span>
                    <span className="lp-crypto-value">AES-GCM 256-bit</span>
                  </div>
                  <div className="lp-crypto-bar">
                    <div />
                  </div>
                  <div className="lp-crypto-row lp-crypto-foot">
                    <span>Private keys never leave device</span>
                    <span className="lp-verified">Verified</span>
                  </div>
                </div>
              </div>

              <div data-reveal className="lp-card">
                <div>
                  <div className="lp-card-icon">
                    <Icon name="sync_alt" />
                  </div>
                  <h3 className="lp-card-title">Seamless Continuity</h3>
                  <p className="lp-card-body">
                    Begin a morning contemplation on mobile during transit and conclude on desktop
                    in your study. Sync occurs instantaneously across every connected sanctuary.
                  </p>
                </div>
                <div className="lp-devices">
                  <div>
                    <Icon name="smartphone" />
                    <p>iOS &amp; Android</p>
                  </div>
                  <div>
                    <Icon name="laptop_mac" />
                    <p>macOS &amp; Web</p>
                  </div>
                  <div>
                    <Icon name="cloud_off" />
                    <p>Offline First</p>
                  </div>
                </div>
              </div>

              <div data-reveal className="lp-card">
                <div>
                  <div className="lp-card-icon">
                    <Icon name="bedtime" />
                  </div>
                  <h3 className="lp-card-title">Distraction Silence</h3>
                  <p className="lp-card-body">
                    Full-screen sanctuary mode fades away menus, headers, and stats when your
                    keystrokes begin. Nothing stands between the cursor and your candid voice.
                  </p>
                </div>
                <span className="lp-card-note">
                  <span className="lp-note-dot" />
                  Focus telemetry disabled by default
                </span>
              </div>

              <div data-reveal className="lp-card" id="journal">
                <div>
                  <div className="lp-card-icon">
                    <Icon name="auto_stories" />
                  </div>
                  <h3 className="lp-card-title">Timeless Ledger</h3>
                  <p className="lp-card-body">
                    Organize your chapters effortlessly by date, mood resonance, or personal
                    themes. Export at any time into cleanly formatted PDF, Markdown, or JSON.
                  </p>
                </div>
                <span className="lp-card-note">
                  <span className="lp-note-dot" />
                  Full data sovereignty &amp; open export
                </span>
              </div>

              <div data-reveal className="lp-card lp-card-highlight">
                <div className="lp-highlight-inner">
                  <div className="lp-highlight-icon">
                    <Icon name="auto_awesome" />
                  </div>
                  <h3 className="lp-highlight-title">Crafted for the Private Sanctuary</h3>
                  <p className="lp-card-body lp-highlight-body">
                    A bespoke environment tailored specifically for introspective writers,
                    thinkers, and seekers of quietude.
                  </p>
                  <Link href="/login" className="lp-btn lp-btn-primary">
                    Explore More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="lp-philosophy" id="philosophy">
          <div className="lp-philosophy-inner" data-reveal>
            <span className="lp-quote-mark">&ldquo;</span>
            <blockquote className="lp-quote">
              Soyuco is built on the belief that clarity begins with a single word spoken into the
              silence.
            </blockquote>
            <div className="lp-rule" />
            <p className="lp-philosophy-body">
              We designed this space to be an absolute retreat from the ceaseless velocity of the
              digital sphere. No social validation, no notifications, no algorithmic feed—only
              you, your consciousness, and the quiet dignity of the written word.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-container lp-cta-wrap">
          <div className="lp-cta" data-reveal>
            <div className="lp-cta-glow lp-cta-glow-tl" />
            <div className="lp-cta-glow lp-cta-glow-br" />
            <div className="lp-cta-inner">
              <div className="lp-brand lp-cta-brand">
                <Logo />
                <span className="lp-wordmark">Soyuco</span>
              </div>
              <h2 className="lp-cta-title">Ready to find clarity?</h2>
              <p className="lp-cta-body">
                Join a dedicated collective of writers who have established their digital
                sanctuary for daily contemplation.
              </p>
              <Link href="/login" className="lp-btn lp-btn-primary lp-btn-xl lp-arrow-btn">
                <span>Sign In Now</span>
                <span className="lp-arrow">→</span>
              </Link>
              <p className="lp-cta-fine">No credit card required · Free to begin</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner" data-reveal>
          <div className="lp-footer-brand">
            <a href="#" className="lp-brand">
              <Logo />
              <span className="lp-wordmark">Soyuco</span>
            </a>
            <p>© {new Date().getFullYear()} Soyuco. All rights reserved. Crafted for the private sanctuary.</p>
          </div>
          <div className="lp-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#security">Security Specs</a>
            <a href="#">Journaling Guide</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
