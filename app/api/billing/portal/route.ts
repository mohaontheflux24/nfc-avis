import { NextRequest, NextResponse } from "next/server";
import { getAccess } from "@/lib/access";
import { getStripe } from "@/lib/stripe";
import { isSameOrigin } from "@/lib/security";

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://nfc-avis-tau.vercel.app";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const access = await getAccess();
  if (!access || access.isAdmin || !access.user.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement Stripe trouvé." }, { status: 404 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: access.user.stripeCustomerId,
      return_url: `${APP_URL}/dashboard/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error", error);
    return NextResponse.json({ error: "Impossible d'ouvrir l'espace de facturation." }, { status: 500 });
  }
}
