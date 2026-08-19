import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
  if (!access?.isAdmin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const merchants = await prisma.user.findMany({
    where: { id: { not: access.user.id }, role: "MERCHANT" },
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
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const access = await getAccess();
  if (!access?.isAdmin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = cleanText(body?.name, 100);
  const email = cleanText(body?.email, 254).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  const businessName = cleanText(body?.businessName, 120);
  const googleReviewInput = cleanText(body?.googleReviewUrl, 500);
  const logoInput = cleanText(body?.logoUrl, 500);

  if (!name || !email || !businessName || password.length < 12 || password.length > 200) {
    return NextResponse.json(
      { error: "Tous les champs sont requis et le mot de passe doit avoir au moins 12 caractères." },
      { status: 400 }
    );
  }

  const googleReviewUrl = googleReviewInput ? validGoogleReviewUrl(googleReviewInput) : null;
  const logoUrl = logoInput ? validHttpsUrl(logoInput) : null;
  if (googleReviewInput && !googleReviewUrl) {
    return NextResponse.json({ error: "Le lien Google Avis n'est pas valide." }, { status: 400 });
  }
  if (logoInput && !logoUrl) {
    return NextResponse.json({ error: "Le logo doit utiliser une adresse HTTPS valide." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Un compte utilise déjà cet email." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const merchant = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "MERCHANT",
      businesses: {
        create: { name: businessName, googleReviewUrl, logoUrl },
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
