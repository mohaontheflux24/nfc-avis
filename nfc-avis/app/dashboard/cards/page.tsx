"use client";

import { useEffect, useState } from "react";

type Business = { id: string; name: string };
type Card = {
  id: string;
  label: string;
  code: string;
  businessId: string;
  _count: { scans: number; reviews: number };
};

export default function CardsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function loadData() {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data: Business[]) => {
        setBusinesses(data);
        if (data.length && !businessId) setBusinessId(data[0].id);
      });
    fetch("/api/cards")
      .then((r) => r.json())
      .then(setCards);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, label }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création.");
        return;
      }
      setLabel("");
      loadData();
    } finally {
      setLoading(false);
    }
  }

  function cardUrl(code: string) {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/r/${code}`;
  }

  async function copyLink(card: Card) {
    await navigator.clipboard.writeText(cardUrl(card.code));
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Cartes NFC</h1>
      <p className="mt-1 text-sm text-mist">
        Chaque carte a un lien unique. C'est cette URL qu'il faut écrire sur votre carte NFC (ou son
        QR code de secours).
      </p>

      {businesses.length === 0 ? (
        <p className="mt-8 text-sm text-mist">
          Ajoutez d'abord une entreprise dans l'onglet « Entreprises ».
        </p>
      ) : (
        <form onSubmit={handleCreate} className="card mt-8 max-w-lg space-y-4">
          <h2 className="font-display text-lg font-semibold">Nouvelle carte</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Entreprise</label>
            <select
              className="input"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Nom de la carte</label>
            <input
              required
              className="input"
              placeholder="ex: Comptoir, Table 3..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Création..." : "Créer la carte"}
          </button>
        </form>
      )}

      <h2 className="mt-12 font-display text-lg font-semibold">Vos cartes</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.length === 0 && <p className="text-sm text-mist">Aucune carte pour le moment.</p>}
        {cards.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold">{c.label}</p>
                <p className="mt-1 text-xs text-mist">
                  {c._count.scans} scans · {c._count.reviews} avis
                </p>
              </div>
              <button onClick={() => copyLink(c)} className="btn-secondary text-xs">
                {copiedId === c.id ? "Copié !" : "Copier le lien"}
              </button>
            </div>
            <p className="mt-3 truncate rounded-lg bg-porcelain px-3 py-2 text-xs text-mist">
              {cardUrl(c.code)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
