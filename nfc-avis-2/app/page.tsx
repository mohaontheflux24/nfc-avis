import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink text-porcelain">
      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 pb-24 pt-20">
        <nav className="flex w-full items-center justify-between pb-16">
          <span className="font-display text-xl font-semibold">NFC Avis</span>
          <Link href="/login" className="btn-primary text-sm">
            Connexion
          </Link>
        </nav>

        <span className="rounded-full border border-signal/40 px-3 py-1 text-xs uppercase tracking-widest text-signal">
          Un tap. Un avis.
        </span>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
          Le client tape sa carte.
          <br />
          <span className="text-signal">Google récolte l'avis.</span>
        </h1>
        <p className="max-w-xl text-lg text-porcelain/70">
          Posez une carte NFC sur votre comptoir. En un scan, vos meilleurs clients sont redirigés
          vers votre fiche Google, et les retours difficiles arrivent en privé — jamais en public.
        </p>
        <div className="flex gap-4">
          <Link href="/login" className="btn-primary">
            Accéder au tableau de bord
          </Link>
          <a href="#comment-ca-marche" className="btn-secondary">
            Voir comment ça marche
          </a>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="border-t border-porcelain/10 bg-porcelain py-24 text-ink">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl font-semibold">Comment ça marche</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step
              n="01"
              title="Le client scanne"
              text="Il approche son téléphone de la carte NFC posée sur le comptoir ou la table."
            />
            <Step
              n="02"
              title="Il note son expérience"
              text="Une page à votre logo lui demande simplement : comment s'est passée votre expérience ?"
            />
            <Step
              n="03"
              title="On oriente la suite"
              text="4-5 étoiles → redirection vers votre avis Google. 1-3 étoiles → message privé envoyé directement à vous."
            />
          </div>
        </div>
      </section>

      {/* Dashboard teaser */}
      <section className="border-t border-porcelain/10 bg-ink py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl font-semibold">Votre tableau de bord</h2>
          <p className="mt-3 max-w-xl text-porcelain/70">
            Scans, avis Google générés, taux de conversion, note moyenne et retours privés — tout au
            même endroit.
          </p>
          <div className="mt-10">
            <Link href="/login" className="btn-primary">
              Accéder au tableau de bord
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="card">
      <span className="font-display text-sm text-signal">{n}</span>
      <h3 className="mt-2 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-mist">{text}</p>
    </div>
  );
}
