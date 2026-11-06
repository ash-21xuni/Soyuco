"use client";

import { useCallback, useEffect, useState } from "react";
import { SettingsCardTitle, SettingsIcon } from "@/components/settings/SettingsIcon";
import { CoinAmount } from "@/components/wallet/CoinAmount";
import {
  STORAGE_CATEGORIES,
  STORAGE_PACKS,
  fetchStorageUsage,
  formatBytes,
  usagePercent,
  type StorageUsage,
} from "@/lib/storage/storage";
import { useToast } from "@/lib/toast/toast-context";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import { useWallet } from "@/lib/wallet/wallet-context";

// Segment colours step down from the theme accent, so the breakdown suits
// every theme. Order matches STORAGE_CATEGORIES.
const SEGMENT_SHADES = [100, 72, 50, 32, 18];
const segmentColor = (i: number) =>
  `color-mix(in srgb, var(--accent) ${SEGMENT_SHADES[i]}%, var(--surface2))`;

function formatPercent(pct: number) {
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

export function StorageSection() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const apply = useCallback((result: StorageUsage | { error: string }) => {
    if ("error" in result) setError(result.error);
    else {
      setUsage(result);
      setError(null);
    }
  }, []);
  const load = useCallback(() => fetchStorageUsage().then(apply), [apply]);

  useEffect(() => {
    let cancelled = false;
    fetchStorageUsage().then((result) => {
      if (!cancelled) apply(result);
    });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const pct = usage ? usagePercent(usage) : 0;
  const level = pct >= 90 ? " is-full" : pct >= 75 ? " is-high" : "";

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="hardDrive">Storage</SettingsCardTitle>
      </div>
      <div className="planner-card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {error && !usage ? (
          <div className="storage-hint">
            Storage usage isn&apos;t available right now.{" "}
            <button type="button" className="storage-link" onClick={load}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className={`storage-meter${level}`}
              onClick={() => setOpen(true)}
              disabled={!usage}
              aria-label={
                usage
                  ? `${formatPercent(pct)} of storage used. Show breakdown and buy more storage.`
                  : "Loading storage usage"
              }
            >
              <span className="storage-meter-top">
                <span className="storage-meter-pct">{usage ? formatPercent(pct) : "…"}</span>
                <span className="storage-meter-detail">
                  {usage
                    ? `${formatBytes(usage.used)} of ${formatBytes(usage.quota)} used`
                    : "Loading…"}
                </span>
              </span>
              <span className="storage-track" aria-hidden="true">
                <span className="storage-fill" style={{ width: `${usage ? Math.max(pct, pct > 0 ? 1 : 0) : 0}%` }} />
              </span>
              <span className="storage-scale" aria-hidden="true">
                <span>0</span>
                <span>100</span>
              </span>
            </button>
            <div className="storage-hint">
              Click the bar to see what&apos;s using your space or add more storage.
            </div>
          </>
        )}
      </div>
      {open && usage && (
        <StorageModal
          usage={usage}
          onClose={() => setOpen(false)}
          onPurchased={load}
        />
      )}
    </div>
  );
}

function StorageModal({
  usage,
  onClose,
  onPurchased,
}: {
  usage: StorageUsage;
  onClose: () => void;
  onPurchased: () => Promise<void>;
}) {
  const { balance, loaded, buyStorage, buyCoinsOpen, setBuyCoinsOpen } = useWallet();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState(
    STORAGE_PACKS.find((p) => p.badge === "Popular")?.id ?? STORAGE_PACKS[0].id,
  );
  const [buying, setBuying] = useState(false);
  const close = useCallback(() => {
    // Escape closes the coin popup first when it's open on top.
    if (!buying && !buyCoinsOpen) onClose();
  }, [buying, buyCoinsOpen, onClose]);
  useEscapeToClose(true, close);

  const pct = usagePercent(usage);
  const selected = STORAGE_PACKS.find((p) => p.id === selectedId) ?? STORAGE_PACKS[0];
  const canAfford = balance >= selected.price;

  async function buy() {
    if (!canAfford) {
      setBuyCoinsOpen(true);
      return;
    }
    setBuying(true);
    const result = await buyStorage(selected.id);
    if (!result.ok) {
      setBuying(false);
      showToast(`Couldn't add storage: ${result.error}`, "error");
      return;
    }
    await onPurchased();
    setBuying(false);
    showToast(`${formatBytes(selected.bytes)} of storage added.`, "success");
  }

  return (
    <div className="owned-themes-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="owned-themes-modal storage-modal" role="dialog" aria-modal="true" aria-labelledby="storage-title">
        <div className="owned-themes-head">
          <div id="storage-title" className="owned-themes-title">
            Storage
          </div>
          <button type="button" className="panel-toggle" onClick={close} aria-label="Close">
            <SettingsIcon name="close" />
          </button>
        </div>

        <div className="owned-themes-body">
          <div>
            <div className="storage-summary">
              <span className="storage-meter-pct">{formatPercent(pct)}</span>
              <span className="storage-meter-detail">
                {formatBytes(usage.used)} of {formatBytes(usage.quota)} used
              </span>
            </div>
            <div className="storage-track storage-track-split" aria-hidden="true">
              {STORAGE_CATEGORIES.map((c, i) => {
                const share = usage.quota > 0 ? (usage.byCategory[c.id] / usage.quota) * 100 : 0;
                if (share <= 0) return null;
                return (
                  <span
                    key={c.id}
                    className="storage-segment"
                    style={{ width: `${Math.max(share, 0.75)}%`, background: segmentColor(i) }}
                  />
                );
              })}
            </div>
          </div>

          <ul className="storage-breakdown">
            {STORAGE_CATEGORIES.map((c, i) => {
              const bytes = usage.byCategory[c.id];
              const share = usage.used > 0 ? (bytes / usage.used) * 100 : 0;
              return (
                <li key={c.id}>
                  <span className="storage-swatch" style={{ background: segmentColor(i) }} />
                  <span className="storage-breakdown-name">
                    {c.label}
                    <span className="storage-breakdown-hint">{c.hint}</span>
                  </span>
                  <span className="storage-breakdown-size">
                    {formatBytes(bytes)}
                    <span className="storage-breakdown-hint">{formatPercent(share)} of used</span>
                  </span>
                </li>
              );
            })}
            <li className="storage-breakdown-free">
              <span className="storage-swatch" />
              <span className="storage-breakdown-name">
                Available
                <span className="storage-breakdown-hint">
                  {formatBytes(usage.free)} free
                  {usage.bought > 0 ? ` + ${formatBytes(usage.bought)} purchased` : ""}
                </span>
              </span>
              <span className="storage-breakdown-size">
                {formatBytes(Math.max(0, usage.quota - usage.used))}
              </span>
            </li>
          </ul>

          <div>
            <div className="storage-buy-head">
              <span className="login-label" style={{ margin: 0 }}>Get more storage</span>
              <span className="storage-buy-balance">
                Balance:{" "}
                {loaded ? <CoinAmount coins={balance} size={13} /> : "…"}
              </span>
            </div>
            <div className="coin-packs" role="radiogroup" aria-label="Storage packs">
              {STORAGE_PACKS.map((pack) => {
                const isSelected = pack.id === selected.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`coin-pack${pack.badge ? " is-featured" : ""}${isSelected ? " is-selected" : ""}`}
                    onClick={() => setSelectedId(pack.id)}
                  >
                    {pack.badge && <span className="coin-pack-badge">{pack.badge}</span>}
                    <span className="coin-pack-coins">+{formatBytes(pack.bytes)}</span>
                    <CoinAmount coins={pack.price} size={14} className="coin-pack-price" />
                    <span className="coin-pack-saving">One-off, never expires</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="owned-themes-foot">
          <button type="button" className="btn btn-ghost" onClick={close} disabled={buying}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={buy} disabled={buying || !loaded}>
            {buying
              ? "Processing…"
              : canAfford
                ? `Add ${formatBytes(selected.bytes)}`
                : "Get more Soyucoins"}
          </button>
        </div>
      </div>
    </div>
  );
}
