import { NextResponse } from "next/server";

// Inscription publique désactivée : le compte admin unique est créé via /api/setup-admin.
export async function POST() {
  return NextResponse.json(
    { error: "L'inscription publique est désactivée sur ce système." },
    { status: 403 }
  );
}
