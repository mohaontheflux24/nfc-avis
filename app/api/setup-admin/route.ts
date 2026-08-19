import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { allowRequest, getClientIp } from "@/lib/security";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const allowed = await allowRequest(`setup:${getClientIp(req)}`, 3, 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  }

  const configuredSecret = process.env.SETUP_SECRET;
  const suppliedSecret = req.headers.get("x-setup-secret") || "";
  if (!configuredSecret || configuredSecret.length < 32 || !safeEqual(suppliedSecret, configuredSecret)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL et un ADMIN_PASSWORD fort doivent être configurés." },
      { status: 500 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN" },
    });
    return NextResponse.json({ message: "Compte administrateur confirmé." });
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, password: hashed, name: "Administrateur", role: "ADMIN" },
  });

  return NextResponse.json({ message: "Compte administrateur créé." }, { status: 201 });
}
