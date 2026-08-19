import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

async function currentAccess() {
  const session = getCurrentSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  const isAdmin =
    user.role === "ADMIN" ||
    user.email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();
  return { user, isAdmin };
}

export async function GET() {
  const access = await currentAccess();
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
  const access = await currentAccess();
  if (!access) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const { name, googleReviewUrl, logoUrl, ownerId } = await req.json();
  if (!name || !ownerId) {
    return NextResponse.json({ error: "Le nom et le commerçant sont requis." }, { status: 400 });
  }

  const owner = await prisma.user.findFirst({ where: { id: ownerId, role: "MERCHANT" } });
  if (!owner) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });

  const business = await prisma.business.create({
    data: {
      name,
      googleReviewUrl: googleReviewUrl || null,
      logoUrl: logoUrl || null,
      ownerId,
    },
  });

  return NextResponse.json(business);
}
