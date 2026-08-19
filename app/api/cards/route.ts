import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

const generateCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

async function currentAccess() {
  const session = getCurrentSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  const isAdmin =
    user.role === "ADMIN" ||\n    user.name === "Admin" ||\n    user.email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();
  return { user, isAdmin };
}

export async function GET(req: NextRequest) {
  const access = await currentAccess();
  if (!access) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
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
  const access = await currentAccess();
  if (!access) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const { businessId, label } = await req.json();
  if (!businessId || !label) {
    return NextResponse.json({ error: "Entreprise et nom de carte requis." }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: "Entreprise introuvable." }, { status: 404 });

  const card = await prisma.nfcCard.create({
    data: { businessId, label, code: generateCode() },
  });

  return NextResponse.json(card);
}
