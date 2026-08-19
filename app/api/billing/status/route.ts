import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";

export async function GET() {
  const access = await getAccess();
  if (!access || access.isAdmin) {
    return NextResponse.json({ error: "Compte commerçant requis." }, { status: 403 });
  }

  return NextResponse.json({
    status: access.user.subscriptionStatus,
    hasCustomer: Boolean(access.user.stripeCustomerId),
    subscriptionEndsAt: access.user.subscriptionEndsAt,
  });
}
