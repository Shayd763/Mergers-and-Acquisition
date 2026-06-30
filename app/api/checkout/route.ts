import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { userDb, type Tier } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string> = {
  searcher:      process.env.STRIPE_PRICE_SEARCHER!,
  broker:        process.env.STRIPE_PRICE_BROKER!,
  institutional: process.env.STRIPE_PRICE_INSTITUTIONAL ?? "",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { tier } = await req.json() as { tier: Tier };
  const priceId = PRICE_IDS[tier];
  if (!priceId) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const email = session.user.email;
  const userRow = await userDb.getByEmail(email);

  let customerId = userRow?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      name: session.user.name ?? undefined,
      metadata: { tier },
    });
    customerId = customer.id;
    await userDb.setStripeCustomerId(email, customerId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? "http://localhost:3000";

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard`,
      metadata: { email, tier },
      subscription_data: { metadata: { email, tier } },
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
