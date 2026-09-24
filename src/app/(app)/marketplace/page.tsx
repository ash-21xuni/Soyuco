"use client";

import { useMemo, useState } from "react";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import {
  CATALOG,
  TIERS,
  TIER_ORDER,
  formatPrice,
  type ThemeListing,
  type ThemePreview,
  type Tier,
} from "@/lib/marketplace/catalog";
import { useTheme } from "@/lib/theme/theme-context";
import { useToast } from "@/lib/toast/toast-context";

type Filter = "all" | Tier;

function PreviewMock({
  preview,
  placeholder,
}: {
  preview: ThemePreview;
  placeholder?: boolean;
}) {
  const { bg, panel, surface, text, accent, radius } = preview;
  const r = Math.min(radius, 10);
  return (
    <div
      className={`market-preview${placeholder ? " is-placeholder" : ""}`}
      style={{ background: bg }}
    >
      <div className="market-preview-side" style={{ background: panel }}>
        <span style={{ background: accent, borderRadius: r }} />
        <span style={{ background: text, opacity: 0.25, borderRadius: r }} />
        <span style={{ background: text, opacity: 0.25, borderRadius: r }} />
        <span style={{ background: text, opacity: 0.25, borderRadius: r }} />
      </div>
      <div className="market-preview-main">
        <div
          className="market-preview-title"
          style={{ background: text, opacity: 0.7, borderRadius: r }}
        />
        <div
          className="market-preview-card"
          style={{ background: surface, borderRadius: r }}
        >
          <span style={{ background: text, opacity: 0.35 }} />
          <span style={{ background: text, opacity: 0.2 }} />
          <span style={{ background: text, opacity: 0.2, width: "60%" }} />
        </div>
        <div
          className="market-preview-btn"
          style={{ background: accent, borderRadius: r }}
        />
      </div>
      {placeholder && (
        <div className="market-preview-tag">Preview coming soon</div>
      )}
    </div>
  );
}

function ThemeCard({ listing }: { listing: ThemeListing }) {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const tier = TIERS[listing.tier];
  const active = listing.themeId !== undefined && theme === listing.themeId;

  return (
    <article
      className={`market-card${listing.placeholder ? " is-placeholder" : ""}`}
    >
      <PreviewMock
        preview={listing.preview}
        placeholder={listing.placeholder}
      />
      <div className="market-card-body">
        <div className="market-card-head">
          <h3 className="market-card-name">{listing.name}</h3>
          <span className="market-price">{formatPrice(tier.price)}</span>
        </div>
        <div className="market-card-meta">
          <span className={`market-tier market-tier-${listing.tier}`}>
            {tier.label}
          </span>
          {listing.placeholder && (
            <span className="market-tier market-tier-placeholder">
              Placeholder
            </span>
          )}
          {active && (
            <span className="market-tier market-tier-active">In use</span>
          )}
        </div>
        <p className="market-card-desc">{listing.description}</p>
        <ul className="market-features">
          {listing.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <div className="market-actions">
          {listing.placeholder ? (
            <button className="btn btn-ghost" disabled>
              Coming soon
            </button>
          ) : (
            <>
              <button
                className="btn btn-ghost"
                disabled={active}
                onClick={() => {
                  if (!listing.themeId) return;
                  setTheme(listing.themeId);
                  showToast(`Previewing ${listing.name}.`, "info");
                }}
              >
                {active ? "Previewing" : "Preview"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => showToast("Checkout is coming soon.", "info")}
              >
                <SettingsIcon name="shoppingBag" size={14} /> Buy{" "}
                {formatPrice(tier.price)}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MarketplacePage() {
  const [filter, setFilter] = useState<Filter>("all");

  const listings = useMemo(
    () =>
      CATALOG.filter((l) => filter === "all" || l.tier === filter).sort(
        (a, b) =>
          Number(!!a.placeholder) - Number(!!b.placeholder) ||
          TIERS[a.tier].price - TIERS[b.tier].price,
      ),
    [filter],
  );

  return (
    <div className="ai-layout">
      {/* One scroll container, so the banner scrolls away with the content. */}
      <div className="page-scroll">
        <div className="ai-hero page-hero">
          <div className="ai-hero-title">
            <SettingsIcon name="shoppingBag" size={16} /> Theme Marketplace
          </div>
          <div className="ai-hero-sub">
            Make Soyuco yours. Every theme is a once-off purchase, priced by how
            much it transforms the app.
          </div>
        </div>

        <div className="page-body">
          <div className="market-tiers">
            {TIER_ORDER.map((t) => (
              <div key={t} className={`market-tier-card market-tier-card-${t}`}>
                <div className="market-tier-card-head">
                  <span className="market-tier-card-name">
                    {TIERS[t].label}
                  </span>
                  <span className="market-tier-card-price">
                    {formatPrice(TIERS[t].price)}
                  </span>
                </div>
                <ul className="market-features">
                  {TIERS[t].includes.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="market-filters"
            role="tablist"
            aria-label="Filter by tier"
          >
            {(["all", ...TIER_ORDER] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className={`market-chip${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "All themes"
                  : `${TIERS[f].label} · ${formatPrice(TIERS[f].price)}`}
              </button>
            ))}
          </div>

          <div className="market-grid">
            {listings.map((l) => (
              <ThemeCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
