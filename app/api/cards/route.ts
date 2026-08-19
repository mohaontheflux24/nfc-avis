import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/db";
import { getAccess } from "@/lib/access";
import { cleanText, isSameOrigin } from "@/lib/security";

const generateCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 12);

export async function GET(req: NextRequest) {
  const access = await getAccess();
  if (!access) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const businessId = cleanText(req.nextUrl.searchParams.get("businessId"), 100);
  const ownership = access.isAdmin ? {} : { business: { ownerId: access.user.id } };
  const where = businessId ? { businessId, ...ownership } : ownership;

  const cards = await prisma.nfcCard.findMany({
    where,
    include: {
      business: { select: { name: true, owner: { select: { name: true, email: true } } } },
      _count: { select: { scans: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cards);
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
  const businessId = cleanText(body?.businessId, 100);
  const label = cleanText(body?.label, 100);
  if (!businessId || !label) {
    return NextResponse.json({ error: "Entreprise et nom de carte requis." }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: "Entreprise introuvable." }, { status: 404 });

  const card = await prisma.nfcCard.create({
    data: { businessId, label, code: generateCode() },
  });

  return NextResponse.json(card, { status: 201 });
}
