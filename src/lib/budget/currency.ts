"use client";

import { useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";

// Currencies offered in Preferences. Amounts are stored as plain numbers, so
// switching only changes how they're shown, never converts them.
export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "ZAR", name: "South African Rand" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "AED", name: "UAE Dirham" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "BWP", name: "Botswana Pula" },
  { code: "NAD", name: "Namibian Dollar" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

function isCurrency(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((c) => c.code === value);
}

function formatter(code: CurrencyCode, whole: boolean) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
    ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : null),
  });
}

export function currencySymbol(code: CurrencyCode) {
  return formatter(code, true).formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
}

export function saveCurrency(code: CurrencyCode) {
  return supabase.auth.updateUser({ data: { currency: code } });
}

/**
 * The account's chosen currency and a `money()` formatter for it, e.g.
 * money(1234.5) → "R1,234.50" and money(1234.5, true) → "R1,235".
 */
export function useCurrency() {
  const { user } = useAuth();
  const saved = user?.user_metadata?.currency;
  const code: CurrencyCode = isCurrency(saved) ? saved : DEFAULT_CURRENCY;

  return useMemo(() => {
    const exact = formatter(code, false);
    const rounded = formatter(code, true);
    return {
      code,
      symbol: currencySymbol(code),
      money: (amount: number, whole = false) => (whole ? rounded : exact).format(amount),
    };
  }, [code]);
}
