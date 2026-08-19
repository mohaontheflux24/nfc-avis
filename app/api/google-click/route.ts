import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanText, isSameOrigin, visitorFingerprint } from "@/lib/security";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const reviewId = cleanText(body?.reviewId, 100);
  const code = cleanText(body?.code, 32);
  if (!reviewId || !code) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      card: {
        code,
        business: { owner: { active: true } },
      },
    },
    select: { id: true, fingerprint: true },
  });
  const fingerprint = visitorFingerprint(req, `review:${code}`);
  if (!review || review.fingerprint !== fingerprint) {
    return NextResponse.json({ error: "Avis introuvable." }, { status: 404 });
  }

  await prisma.review.update({
    where: { id: review.id },
    data: { redirected: true },
  });

  return NextResponse.json({ ok: true });
}
