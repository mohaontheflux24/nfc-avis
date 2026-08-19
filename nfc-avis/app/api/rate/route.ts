import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { code, rating, comment } = await req.json();

  if (!code || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const card = await prisma.nfcCard.findUnique({
    where: { code },
    include: { business: true },
  });
  if (!card) {
    return NextResponse.json({ error: "Carte introuvable." }, { status: 404 });
  }

  const redirected = rating >= 4;

  const review = await prisma.review.create({
    data: {
      businessId: card.businessId,
      cardId: card.id,
      rating,
      comment: rating <= 3 ? comment || null : null,
      redirected,
    },
  });

  return NextResponse.json({
    id: review.id,
    redirected,
    googleReviewUrl: redirected ? card.business.googleReviewUrl : null,
  });
}
