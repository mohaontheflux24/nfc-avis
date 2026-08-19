import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAccess } from "@/lib/access";
import { cleanText } from "@/lib/security";

export async function GET(req: NextRequest) {
  const access = await getAccess();
  if (!access) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const businessId = cleanText(req.nextUrl.searchParams.get("businessId"), 100);
  const businessWhere = {
    ...(businessId ? { id: businessId } : {}),
    ...(access.isAdmin ? {} : { ownerId: access.user.id }),
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

  const googleClickCount = reviews.filter((review) => review.redirected).length;
  const privateFeedback = reviews.filter((review) => Boolean(review.comment));
  const averageRating = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const conversionRate = scanCount
    ? Math.round((googleClickCount / scanCount) * 1000) / 10
    : 0;

  return NextResponse.json({
    scanCount,
    reviewCount: reviews.length,
    googleReviewCount: googleClickCount,
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
