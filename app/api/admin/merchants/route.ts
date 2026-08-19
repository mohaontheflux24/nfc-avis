import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

async function requireAdmin() {
  const session = getCurrentSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const configuredAdmin = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin = user?.role === "ADMIN" || user?.email.toLowerCase() === configuredAdmin;

  return isAdmin ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });

  const merchants = await prisma.user.findMany({
    where: {
      id: { not: admin.id },
      role: "MERCHANT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      businesses: {
        select: {
          id: true,
          name: true,
          googleReviewUrl: true,
          logoUrl: true,
          _count: { select: { cards: true, reviews: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(merchants);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });

  const { name, email, password, businessName, googleReviewUrl, logoUrl } = await req.json();
  if (!name || !email || !password || !businessName) {
    return NextResponse.json(
      { error: "Nom, email, mot de passe et nom du commerce sont requis." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Un compte utilise déjà cet email." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const merchant = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "MERCHANT",
      businesses: {
        create: {
          name: businessName.trim(),
          googleReviewUrl: googleReviewUrl?.trim() || null,
          logoUrl: logoUrl?.trim() || null,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      businesses: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(merchant, { status: 201 });
}
