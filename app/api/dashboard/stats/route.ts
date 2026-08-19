import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getCurrentSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const isAdmin =
    user.role === "ADMIN" ||
    user.name === "Admin" ||
    user.email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();
  const businessId = req.nextUrl.searchParams.get("businessId");

  const businessWhere = {
    ...(businessId ? { id: businessId } : {}),
    ...(isAdmin ? {} : { ownerId: user.id }),
  };

  const businesses = await prisma.business.findMany({
    where: businessWhere,
    select: { id: true },
  });
  const businessIds = businesses.map((business) => business.id);

  const [scanCount, reviews] = await Promise.all([
    prisma.scan.count({ where: { card: { businessId: { in: businessIds } } } }),
    prisma.review.findMany({
      where: { businessId: { in: businessIds } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const googleReviewCount = reviews.filter((review) => review.redirected).length;
  const privateFeedback = reviews.filter((review) => !review.redirected);
  const averageRating = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const conversionRate = scanCount ? Math.round((googleReviewCount / scanCount) * 1000) / 10 : 0;

  return NextResponse.json({
    scanCount,
    reviewCount: reviews.length,
    googleReviewCount,
    conversionRate,
    averageRating,
    privateFeedback: privateFeedback.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
  });
}
