import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

export async function getCurrentUser() {
  const session = getCurrentSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.sessionVersion !== session.sessionVersion) return null;

  return user;
}

export function isAdminUser(user: { role: string; email: string }) {
  const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return user.role === "ADMIN" || Boolean(configuredAdmin && user.email.toLowerCase() === configuredAdmin);
}

export async function getAccess() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user, isAdmin: isAdminUser(user) };
}
