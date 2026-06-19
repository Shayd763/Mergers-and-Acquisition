import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { userDb, type Tier } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  const tierFromMetadata = (metadata: Record<string, string> | null): Tier => {
    const t = metadata?.tier;
    if (t === "searcher" || t === "broker" || t === "institutional") return t;
    return "explorer";
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.metadata?.email;
      const tier = tierFromMetadata(session.metadata as Record<string, string>);
      if (email) await userDb.setTier(email, tier);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const user = await userDb.getByStripeCustomerId(sub.customer as string);
      if (user) await userDb.setTier(user.email, "explorer");
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tier = tierFromMetadata(sub.metadata as Record<string, string>);
      const user = await userDb.getByStripeCustomerId(sub.customer as string);
      if (user) await userDb.setTier(user.email, tier);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
