"use client";

import { useState } from "react";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { CoinAmount } from "@/components/wallet/CoinAmount";
import { COIN_PACKS, formatCoins, formatRands, packSaving } from "@/lib/marketplace/catalog";
import { useToast } from "@/lib/toast/toast-context";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import { useWallet } from "@/lib/wallet/wallet-context";

const DEFAULT_PACK = COIN_PACKS.find((p) => p.badge === "Popular")?.id ?? COIN_PACKS[0].id;

export function BuyCoinsModal() {
  const { balance, loaded, buyCoins, buyCoinsOpen, setBuyCoinsOpen } = useWallet();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState(DEFAULT_PACK);
  const [buying, setBuying] = useState(false);
  const close = () => !buying && setBuyCoinsOpen(false);
  useEscapeToClose(buyCoinsOpen, close);
  if (!buyCoinsOpen) return null;

  const selected = COIN_PACKS.find((p) => p.id === selectedId) ?? COIN_PACKS[0];

  async function pay() {
    setBuying(true);
    const result = await buyCoins(selected.id);
    setBuying(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast(`${formatCoins(selected.coins)} Soyucoins added to your balance.`, "success");
    setBuyCoinsOpen(false);
  }

  return (
    <div className="owned-themes-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div
        className="owned-themes-modal buy-coins-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-coins-title"
      >
        <div className="owned-themes-head">
          <div id="buy-coins-title" className="owned-themes-title">
            Buy Soyucoins
          </div>
          <button type="button" className="panel-toggle" onClick={close} aria-label="Close">
            <SettingsIcon name="close" />
          </button>
        </div>

        <div className="owned-themes-body">
          <div className="coin-balance">
            <span className="login-label">Your balance</span>
            {loaded ? (
              <CoinAmount coins={balance} size={20} className="coin-balance-amount" />
            ) : (
              <span className="coin-balance-hint" style={{ flexBasis: "auto" }}>Loading…</span>
            )}
            <span className="coin-balance-hint">
              Spend Soyucoins on premium themes in the marketplace. They&apos;re a once-off
              purchase and don&apos;t expire.
            </span>
          </div>

          <div className="coin-packs" role="radiogroup" aria-label="Coin packs">
            {COIN_PACKS.map((pack) => {
              const saving = packSaving(pack);
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
                  <CoinAmount coins={pack.coins} size={18} className="coin-pack-coins" />
                  <span className="coin-pack-price">{formatRands(pack.price)}</span>
                  <span className="coin-pack-saving">{saving > 0 ? `Save ${saving}%` : " "}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="owned-themes-foot">
          <button type="button" className="btn btn-ghost" onClick={close} disabled={buying}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={pay} disabled={buying}>
            {buying
              ? "Processing…"
              : `Pay ${formatRands(selected.price)} for ${formatCoins(selected.coins)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
