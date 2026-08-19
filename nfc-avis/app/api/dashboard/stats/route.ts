import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getCurrentSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");

  const businessWhere = businessId
    ? { id: businessId, ownerId: session.userId }
    : { ownerId: session.userId };

  const businesses = await prisma.business.findMany({ where: businessWhere, select: { id: true } });
  const businessIds = businesses.map((b) => b.id);

  const [scanCount, reviews] = await Promise.all([
    prisma.scan.count({ where: { card: { businessId: { in: businessIds } } } }),
    prisma.review.findMany({ where: { businessId: { in: businessIds } } }),
  ]);

  const googleReviewCount = reviews.filter((r) => r.redirected).length;
  const privateFeedback = reviews
    .filter((r) => !r.redirected)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const averageRating = reviews.length
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const conversionRate = scanCount ? Math.round((googleReviewCount / scanCount) * 1000) / 10 : 0;

  return NextResponse.json({
    scanCount,
    reviewCount: reviews.length,
    googleReviewCount,
    conversionRate, // en %
    averageRating,
    privateFeedback: privateFeedback.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  });
}
