import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  return typeof value === "string" ? value : value?.id || null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customer = customerId(subscription.customer);
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const endsAt = periodEnd ? new Date(periodEnd * 1000) : null;

  await prisma.user.updateMany({
    where: {
      OR: [
        { stripeSubscriptionId: subscription.id },
        ...(customer ? [{ stripeCustomerId: customer }] : []),
      ],
    },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionEndsAt: endsAt,
    },
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook Stripe non configuré." }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature Stripe invalide." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId) {
        await prisma.user.updateMany({
          where: { id: userId, role: "MERCHANT" },
          data: {
            stripeCustomerId: customerId(session.customer),
            stripeSubscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id || null,
            subscriptionStatus: "active",
          },
        });
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }
  } catch (error) {
    console.error("Stripe webhook processing error", error);
    return NextResponse.json({ error: "Traitement du webhook impossible." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
