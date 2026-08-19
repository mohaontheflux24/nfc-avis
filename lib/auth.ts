import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-nfc_avis_session" : "nfc_avis_session";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET doit contenir au moins 32 caractères.");
  }
  return secret;
}

export type SessionPayload = {
  userId: string;
  email: string;
  sessionVersion: number;
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "12h",
    issuer: "nfc-avis",
    audience: "nfc-avis-dashboard",
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), {
      issuer: "nfc-avis",
      audience: "nfc-avis-dashboard",
    }) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function getCurrentSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
