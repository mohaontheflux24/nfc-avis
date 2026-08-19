import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === req.nextUrl.origin;
}

export async function allowRequest(key: string, limit: number, windowSeconds: number) {
  const now = new Date();
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.resetAt <= now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        resetAt: new Date(now.getTime() + windowSeconds * 1000),
      },
      update: {
        count: 1,
        resetAt: new Date(now.getTime() + windowSeconds * 1000),
      },
    });
    return true;
  }

  if (existing.count >= limit) return false;
  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}

export function fingerprintFromValues(purpose: string, ip: string, userAgent: string) {
  const secret = process.env.FINGERPRINT_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("FINGERPRINT_SECRET ou JWT_SECRET doit être configuré.");

  const day = new Date().toISOString().slice(0, 10);
  const value = [purpose, day, ip, userAgent].join("|");
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function visitorFingerprint(req: NextRequest, purpose: string) {
  return fingerprintFromValues(
    purpose,
    getClientIp(req),
    req.headers.get("user-agent") || "unknown"
  );
}

export function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function validHttpsUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function validGoogleReviewUrl(value: string) {
  const normalized = validHttpsUrl(value);
  if (!normalized) return null;

  const hostname = new URL(normalized).hostname.toLowerCase();
  const allowed =
    hostname === "g.page" ||
    hostname === "maps.app.goo.gl" ||
    hostname === "search.google.com" ||
    hostname === "google.com" ||
    hostname.endsWith(".google.com");

  return allowed ? normalized : null;
}
