import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  allowRequest,
  cleanText,
  getClientIp,
  isSameOrigin,
  visitorFingerprint,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const code = cleanText(body?.code, 32);
  const rating = body?.rating;
  const comment = cleanText(body?.comment, 1000);

  if (!code || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const allowed = await allowRequest(`rate:${getClientIp(req)}:${code}`, 10, 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  const card = await prisma.nfcCard.findUnique({
    where: { code },
    include: { business: true },
  });
  if (!card) {
    return NextResponse.json({ error: "Carte introuvable." }, { status: 404 });
  }

  const fingerprint = visitorFingerprint(req, `review:${code}`);
  const existing = await prisma.review.findUnique({ where: { fingerprint } });
  if (existing) {
    return NextResponse.json({
      id: existing.id,
      duplicate: true,
      googleReviewUrl: card.business.googleReviewUrl,
    });
  }

  const review = await prisma.review.create({
    data: {
      businessId: card.businessId,
      cardId: card.id,
      rating,
      comment: rating <= 3 && comment ? comment : null,
      redirected: false,
      fingerprint,
    },
  });

  return NextResponse.json({
    id: review.id,
    googleReviewUrl: card.business.googleReviewUrl,
  }, { status: 201 });
}
