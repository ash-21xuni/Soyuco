"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { SoyucoinIcon } from "@/components/wallet/SoyucoinIcon";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { CoinAmount } from "@/components/wallet/CoinAmount";
import {
  CATALOG,
  TIERS,
  TIER_ORDER,
  formatCoins,
  listingPrice,
  tierPricing,
  type ThemeListing,
  type ThemePreview,
  type Tier,
} from "@/lib/marketplace/catalog";
import { useTheme } from "@/lib/theme/theme-context";
import { useToast } from "@/lib/toast/toast-context";
import { useWallet } from "@/lib/wallet/wallet-context";

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

function ThemeCard({
  listing,
  highlighted,
}: {
  listing: ThemeListing;
  highlighted: boolean;
}) {
  const { savedTheme, previewing, setTheme, previewTheme } = useTheme();
  const { showToast } = useToast();
  const { balance, loaded, buyTheme, ownsTheme, setBuyCoinsOpen } = useWallet();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const tier = TIERS[listing.tier];
  const price = listingPrice(listing);
  const active = listing.themeId !== undefined && savedTheme === listing.themeId;
  const isPreviewing =
    listing.themeId !== undefined && previewing === listing.themeId;
  const owned = listing.themeId !== undefined && ownsTheme(listing.themeId);

  useEffect(() => {
    if (highlighted) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);
  // Until the balance loads, offer Unlock; the server has the final say anyway.
  const affordable = !loaded || balance >= price;

  async function confirmPurchase() {
    setConfirmOpen(false);
    if (!listing.themeId || buying) return;
    setBuying(true);
    const result = await buyTheme(listing.themeId);
    setBuying(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    setTheme(listing.themeId);
    showToast(`${listing.name} unlocked and applied.`, "success");
  }

  return (
    <article
      ref={cardRef}
      className={`market-card${listing.placeholder ? " is-placeholder" : ""}${highlighted ? " is-highlighted" : ""}`}
    >
      <PreviewMock
        preview={listing.preview}
        placeholder={listing.placeholder}
      />
      <div className="market-card-body">
        <div className="market-card-head">
          <h3 className="market-card-name">{listing.name}</h3>
          <CoinAmount coins={price} className="market-price" />
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
          {owned ? (
            <span className="market-tier">Owned</span>
          ) : (
            !listing.placeholder && (
              <span className="market-tier market-tier-locked">
                <SettingsIcon name="lock" size={10} /> Locked
              </span>
            )
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
          ) : owned ? (
            <button
              className="btn btn-primary"
              disabled={active}
              onClick={() => {
                if (!listing.themeId) return;
                setTheme(listing.themeId);
                showToast(`${listing.name} applied.`, "success");
              }}
            >
              {active ? "In use" : "Apply"}
            </button>
          ) : (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  if (!listing.themeId) return;
                  if (isPreviewing) {
                    previewTheme(null);
                    return;
                  }
                  previewTheme(listing.themeId);
                  showToast(
                    `Previewing ${listing.name}. It switches back when you leave the marketplace.`,
                    "info",
                  );
                }}
              >
                {isPreviewing ? "Stop preview" : "Preview"}
              </button>
              {affordable ? (
                <button
                  className="btn btn-primary"
                  disabled={buying}
                  onClick={() => setConfirmOpen(true)}
                >
                  {buying ? "Unlocking…" : <>Unlock <CoinAmount coins={price} /></>}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setBuyCoinsOpen(true)}
                >
                  <SoyucoinIcon size={16} /> Get Soyucoins
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={`Unlock ${listing.name}?`}
        message={`This spends ${formatCoins(price)} Soyucoins. You'll have ${formatCoins(Math.max(0, balance - price))} left, and the theme is yours to keep.`}
        confirmLabel="Unlock"
        tone="primary"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmPurchase}
      />
    </article>
  );
}

export default function MarketplacePage() {
  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense fallback={null}>
      <Marketplace />
    </Suspense>
  );
}

function Marketplace() {
  const [filter, setFilter] = useState<Filter>("all");
  const { balance, setBuyCoinsOpen } = useWallet();
  const { previewTheme } = useTheme();
  // Set when arriving from a locked theme in the sidebar: ?theme=<ThemeId>.
  const highlight = useSearchParams().get("theme");

  // Make sure the highlighted theme isn't hidden by a tier filter.
  const [prevHighlight, setPrevHighlight] = useState(highlight);
  if (prevHighlight !== highlight) {
    setPrevHighlight(highlight);
    if (highlight) setFilter("all");
  }

  // Previews are only for browsing here; leaving puts the saved theme back.
  useEffect(() => () => previewTheme(null), [previewTheme]);

  const listings = useMemo(
    () =>
      CATALOG.filter((l) => filter === "all" || l.tier === filter).sort(
        (a, b) =>
          Number(!!a.placeholder) - Number(!!b.placeholder) ||
          listingPrice(a) - listingPrice(b),
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
            Make Soyuco yours. Unlock themes with Soyucoins, priced by how much
            each one transforms the app. Every theme is yours to keep.
          </div>
          <div className="market-wallet">
            <span className="market-wallet-label">Your balance</span>
            <CoinAmount coins={balance} size={16} className="market-wallet-balance" />
            <button
              type="button"
              className="btn btn-ghost market-wallet-btn"
              onClick={() => setBuyCoinsOpen(true)}
            >
              <SoyucoinIcon size={16} /> Get Soyucoins
            </button>
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
                    {tierPricing(t).varies && <span className="market-tier-card-from">from</span>}
                    <CoinAmount coins={tierPricing(t).from} size={18} />
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
                  : `${TIERS[f].label} · ${tierPricing(f).varies ? "from " : ""}${formatCoins(tierPricing(f).from)} coins`}
              </button>
            ))}
          </div>

          <div className="market-grid">
            {listings.map((l) => (
              <ThemeCard
                key={l.id}
                listing={l}
                highlighted={!!highlight && l.themeId === highlight}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
