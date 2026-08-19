import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signSession, setSessionCookie } from "@/lib/auth";
import { allowRequest, cleanText, getClientIp, isSameOrigin } from "@/lib/security";

const DUMMY_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = cleanText(body?.email, 254).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password || password.length > 200) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const emailKey = crypto.createHash("sha256").update(email).digest("hex");
  const allowed = await allowRequest(`login:${getClientIp(req)}:${emailKey}`, 5, 15 * 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429 }
    );
  }

  let user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.password || DUMMY_HASH);

  if (!user || !valid) {
    return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
  }
  if (!user.active) {
    return NextResponse.json(
      { error: "Ce compte est désactivé. Contactez l’administrateur." },
      { status: 403 }
    );
  }

  const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (configuredAdmin && user.email.toLowerCase() === configuredAdmin && user.role !== "ADMIN") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
  }

  const token = signSession({
    userId: user.id,
    email: user.email,
    sessionVersion: user.sessionVersion,
  });
  setSessionCookie(token);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
