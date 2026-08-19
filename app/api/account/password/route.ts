import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAccess } from "@/lib/access";
import { signSession, setSessionCookie } from "@/lib/auth";
import { allowRequest, getClientIp, isSameOrigin } from "@/lib/security";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const access = await getAccess();
  if (!access) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const allowed = await allowRequest(`password:${getClientIp(req)}:${access.user.id}`, 5, 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || newPassword.length < 12 || newPassword.length > 200) {
    return NextResponse.json(
      { error: "Le nouveau mot de passe doit contenir au moins 12 caractères." },
      { status: 400 }
    );
  }

  const currentValid = await bcrypt.compare(currentPassword, access.user.password);
  if (!currentValid) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 401 });
  }
  if (await bcrypt.compare(newPassword, access.user.password)) {
    return NextResponse.json({ error: "Choisissez un nouveau mot de passe différent." }, { status: 400 });
  }

  const password = await bcrypt.hash(newPassword, 12);
  const updated = await prisma.user.update({
    where: { id: access.user.id },
    data: {
      password,
      sessionVersion: { increment: 1 },
    },
  });

  const token = signSession({
    userId: updated.id,
    email: updated.email,
    sessionVersion: updated.sessionVersion,
  });
  setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
