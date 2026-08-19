import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAccess } from "@/lib/access";
import {
  cleanText,
  isSameOrigin,
  validGoogleReviewUrl,
  validHttpsUrl,
} from "@/lib/security";

export async function GET() {
  const access = await getAccess();
  if (!access) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const businesses = await prisma.business.findMany({
    where: access.isAdmin ? {} : { ownerId: access.user.id },
    include: {
      cards: true,
      owner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(businesses);
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const access = await getAccess();
  if (!access) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = cleanText(body?.name, 120);
  const ownerId = cleanText(body?.ownerId, 100);
  const googleInput = cleanText(body?.googleReviewUrl, 500);
  const logoInput = cleanText(body?.logoUrl, 500);

  if (!name || !ownerId) {
    return NextResponse.json({ error: "Le nom et le commerçant sont requis." }, { status: 400 });
  }

  const googleReviewUrl = googleInput ? validGoogleReviewUrl(googleInput) : null;
  const logoUrl = logoInput ? validHttpsUrl(logoInput) : null;
  if (googleInput && !googleReviewUrl) {
    return NextResponse.json({ error: "Lien Google Avis invalide." }, { status: 400 });
  }
  if (logoInput && !logoUrl) {
    return NextResponse.json({ error: "URL de logo invalide." }, { status: 400 });
  }

  const owner = await prisma.user.findFirst({ where: { id: ownerId, role: "MERCHANT" } });
  if (!owner) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });

  const business = await prisma.business.create({
    data: { name, googleReviewUrl, logoUrl, ownerId },
  });

  return NextResponse.json(business, { status: 201 });
}
