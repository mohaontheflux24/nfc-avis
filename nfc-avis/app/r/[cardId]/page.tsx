import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import RatingForm from "@/components/RatingForm";

// Note: le segment de dossier s'appelle [cardId] mais contient en réalité
// le "code" court de la carte NFC (ex: /r/AB3C7XZ9).
export default async function ScanPage({ params }: { params: { cardId: string } }) {
  const code = params.cardId;

  const card = await prisma.nfcCard.findUnique({
    where: { code },
    include: { business: true },
  });

  if (!card) notFound();

  // On enregistre le scan (best-effort, ne bloque pas l'affichage en cas d'erreur)
  await prisma.scan.create({ data: { cardId: card.id } }).catch(() => null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-16 text-porcelain">
      <div className="w-full max-w-sm text-center">
        {card.business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.business.logoUrl}
            alt={card.business.name}
            className="mx-auto mb-6 h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-signal font-display text-xl font-semibold">
            {card.business.name.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="text-sm text-porcelain/60">{card.business.name}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          Comment s'est passée votre expérience ?
        </h1>

        <RatingForm code={code} googleReviewUrl={card.business.googleReviewUrl} />
      </div>
    </main>
  );
}
