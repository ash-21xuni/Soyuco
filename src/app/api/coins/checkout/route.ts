import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { COIN_PACKS } from "@/lib/marketplace/catalog";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Starts a Soyucoins purchase for the signed-in user.
//
// No payment provider is connected yet. When one is (PayFast, Yoco, ...), this
// route should create the provider's checkout and return its URL, and a
// separate webhook route should call credit_coins() once the provider confirms
// the payment, passing the provider's transaction id as p_provider_ref.
//
// Until then, setting SOYUCOINS_TEST_PAYMENTS=true credits packs immediately
// without charging. Never enable it on a live site.
export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Soyucoins aren't set up on the server yet." },
      { status: 503 },
    );
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: null };
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pack = COIN_PACKS.find((p) => p.id === body.packId);
  if (!pack) {
    return NextResponse.json({ error: "Unknown coin pack." }, { status: 400 });
  }

  if (process.env.SOYUCOINS_TEST_PAYMENTS !== "true") {
    return NextResponse.json(
      { error: "Payments aren't available yet. Check back soon." },
      { status: 501 },
    );
  }

  const { data: balance, error } = await admin.rpc("credit_coins", {
    p_user_id: user.id,
    p_pack_id: pack.id,
    p_provider: "test",
    p_provider_ref: `test_${randomUUID()}`,
  });
  if (error) {
    console.error("Failed to credit coins:", error.message);
    return NextResponse.json({ error: "Couldn't add your Soyucoins." }, { status: 500 });
  }

  return NextResponse.json({ balance });
}
