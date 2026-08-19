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

async function requireAdmin() {
  const access = await getAccess();
  return access?.isAdmin ? access : null;
}

export async function GET() {
  const access = await requireAdmin();
  if (!access) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const merchants = await prisma.user.findMany({
    where: { id: { not: access.user.id }, role: "MERCHANT" },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
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

  const access = await requireAdmin();
  if (!access) {
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
      active: true,
      businesses: {
        create: { name: businessName, googleReviewUrl, logoUrl },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      businesses: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(merchant, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const access = await requireAdmin();
  if (!access) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const id = cleanText(body?.id, 100);
  if (!id || typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const merchant = await prisma.user.findFirst({
    where: { id, role: "MERCHANT" },
  });
  if (!merchant) {
    return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      active: body.active,
      sessionVersion: { increment: 1 },
    },
    select: { id: true, active: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const access = await requireAdmin();
  if (!access) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const id = cleanText(body?.id, 100);
  if (!id || body?.confirmation !== "SUPPRIMER") {
    return NextResponse.json({ error: "Confirmation de suppression invalide." }, { status: 400 });
  }

  const merchant = await prisma.user.findFirst({
    where: { id, role: "MERCHANT" },
  });
  if (!merchant) {
    return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
