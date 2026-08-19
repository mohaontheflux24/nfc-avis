import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = getCurrentSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    include: { cards: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(businesses);
}

export async function POST(req: NextRequest) {
  const session = getCurrentSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { name, googleReviewUrl, logoUrl } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Le nom de l'entreprise est requis." }, { status: 400 });
  }

  const business = await prisma.business.create({
    data: {
      name,
      googleReviewUrl: googleReviewUrl || null,
      logoUrl: logoUrl || null,
      ownerId: session.userId,
    },
  });

  return NextResponse.json(business);
}
