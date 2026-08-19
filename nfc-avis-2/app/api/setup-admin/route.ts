import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Route à visiter UNE SEULE FOIS pour créer le compte admin, ex:
// https://votre-site.vercel.app/api/setup-admin?secret=VOTRE_SETUP_SECRET
// Elle ne fait rien si un compte admin existe déjà (protège contre une double création).
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL et ADMIN_PASSWORD doivent être configurés dans les variables d'environnement." },
      { status: 500 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "Le compte admin existe déjà. Connectez-vous sur /login." });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, password: hashed, name: "Admin" } });

  return NextResponse.json({ message: "Compte admin créé avec succès. Connectez-vous sur /login." });
}
