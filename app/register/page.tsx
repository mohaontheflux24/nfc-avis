import Link from "next/link";

// L'inscription publique est désactivée : ce système est réservé à un admin unique.
// Le compte admin est créé une seule fois via /api/setup-admin (voir README).
export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-porcelain px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="font-display text-lg font-semibold">
          NFC Avis
        </Link>
        <h1 className="mt-6 font-display text-2xl font-semibold">Accès réservé</h1>
        <p className="mt-3 text-sm text-mist">
          L'inscription publique est désactivée. Cet espace est réservé à l'administrateur.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Aller à la connexion
        </Link>
      </div>
    </main>
  );
}
