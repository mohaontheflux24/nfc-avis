import { NextRequest, NextResponse } from "next/server";
import { getAccess } from "@/lib/access";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { isSameOrigin } from "@/lib/security";

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://nfc-avis-tau.vercel.app";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const access = await getAccess();
  if (!access || access.isAdmin) {
    return NextResponse.json({ error: "Compte commerçant requis." }, { status: 403 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Le tarif Stripe n'est pas configuré." }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    let customerId = access.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: access.user.email,
        name: access.user.name || undefined,
        metadata: { userId: access.user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: access.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: access.user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { userId: access.user.id } },
      success_url: `${APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${APP_URL}/dashboard/billing?canceled=1`,
      allow_promotion_codes: true,
    });

    if (!session.url) throw new Error("Stripe n'a pas renvoyé d'adresse de paiement.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    return NextResponse.json({ error: "Impossible d'ouvrir le paiement Stripe." }, { status: 500 });
  }
}
