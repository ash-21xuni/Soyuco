import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { formatCoins } from "@/lib/marketplace/catalog";

// A Soyucoins figure: coin icon followed by the amount.
export function CoinAmount({
  coins,
  size = 14,
  className,
}: {
  coins: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`coin-amount${className ? ` ${className}` : ""}`}>
      <SettingsIcon name="coins" size={size} />
      {formatCoins(coins)}
    </span>
  );
}
