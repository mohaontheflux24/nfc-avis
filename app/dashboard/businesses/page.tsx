"use client";

import { useEffect, useState } from "react";

type Business = {
  id: string;
  name: string;
  googleReviewUrl: string | null;
  logoUrl: string | null;
  cards: { id: string }[];
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [name, setName] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadBusinesses() {
    fetch("/api/business")
      .then((r) => r.json())
      .then(setBusinesses);
  }

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, googleReviewUrl, logoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création.");
        return;
      }
      setName("");
      setGoogleReviewUrl("");
      setLogoUrl("");
      loadBusinesses();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Entreprises</h1>
      <p className="mt-1 text-sm text-mist">
        Ajoutez votre entreprise et le lien vers votre fiche d'avis Google.
      </p>

      <form onSubmit={handleCreate} className="card mt-8 max-w-lg space-y-4">
        <h2 className="font-display text-lg font-semibold">Nouvelle entreprise</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Nom de l'entreprise</label>
          <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Lien de votre avis Google</label>
          <input
            className="input"
            placeholder="https://g.page/r/xxxxx/review"
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
          />
          <p className="mt-1 text-xs text-mist">
            Trouvez ce lien via Google Business Profile → Demander des avis.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">URL du logo (optionnel)</label>
          <input
            className="input"
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Création..." : "Ajouter l'entreprise"}
        </button>
      </form>

      <h2 className="mt-12 font-display text-lg font-semibold">Vos entreprises</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {businesses.length === 0 && <p className="text-sm text-mist">Aucune entreprise pour le moment.</p>}
        {businesses.map((b) => (
          <div key={b.id} className="card">
            <p className="font-display font-semibold">{b.name}</p>
            <p className="mt-1 text-xs text-mist">
              {b.cards.length} carte{b.cards.length > 1 ? "s" : ""} NFC
            </p>
            {b.googleReviewUrl ? (
              <p className="mt-2 truncate text-xs text-signal">{b.googleReviewUrl}</p>
            ) : (
              <p className="mt-2 text-xs text-red-500">Aucun lien Google Avis renseigné</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
