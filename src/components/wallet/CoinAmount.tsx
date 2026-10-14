import { SoyucoinIcon } from "@/components/wallet/SoyucoinIcon";
import { formatCoins } from "@/lib/marketplace/catalog";

// A Soyucoins figure: coin icon followed by the amount. `size` matches the
// square icons it sits beside; the coin is drawn a touch larger so its round
// shape carries the same weight as those icons.
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
      <SoyucoinIcon size={Math.round(size * 1.15)} />
      {formatCoins(coins)}
    </span>
  );
}
