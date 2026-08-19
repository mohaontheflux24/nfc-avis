import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

// Code court, lisible, sans caractères ambigus (0/O, 1/I) pour l'URL /r/[code]
const generateCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

export async function GET(req: NextRequest) {
  const session = getCurrentSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  const where = businessId
    ? { businessId, business: { ownerId: session.userId } }
    : { business: { ownerId: session.userId } };

  const cards = await prisma.nfcCard.findMany({
    where,
    include: { _count: { select: { scans: true, reviews: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const session = getCurrentSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { businessId, label } = await req.json();
  if (!businessId || !label) {
    return NextResponse.json({ error: "businessId et label sont requis." }, { status: 400 });
  }

  // Vérifie que l'entreprise appartient bien à l'utilisateur connecté
  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.userId },
  });
  if (!business) {
    return NextResponse.json({ error: "Entreprise introuvable." }, { status: 404 });
  }

  const card = await prisma.nfcCard.create({
    data: { businessId, label, code: generateCode() },
  });

  return NextResponse.json(card);
}
