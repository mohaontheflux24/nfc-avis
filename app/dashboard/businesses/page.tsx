"use client";

import { useEffect, useState } from "react";

type Merchant = {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  businesses: {
    id: string;
    name: string;
    googleReviewUrl: string | null;
    _count: { cards: number; reviews: number };
  }[];
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadMerchants() {
    const response = await fetch("/api/admin/merchants");
    const data = await response.json();
    if (response.ok) setMerchants(data);
    else setError(data.error || "Impossible de charger les commerçants.");
  }

  useEffect(() => {
    loadMerchants();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          businessName,
          googleReviewUrl,
          logoUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Erreur lors de la création.");
        return;
      }

      setSuccess(`Compte créé pour ${email}. Notez son mot de passe avant de quitter cette page.`);
      setName("");
      setEmail("");
      setPassword("");
      setBusinessName("");
      setGoogleReviewUrl("");
      setLogoUrl("");
      await loadMerchants();
    } finally {
      setLoading(false);
    }
  }

  async function toggleMerchant(merchant: Merchant) {
    setError(null);
    setSuccess(null);
    setActionId(merchant.id);

    try {
      const response = await fetch("/api/admin/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: merchant.id, active: !merchant.active }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Impossible de modifier ce compte.");
        return;
      }

      setSuccess(
        merchant.active
          ? `Le compte de ${merchant.email} est désactivé. Ses cartes NFC sont maintenant bloquées.`
          : `Le compte de ${merchant.email} est réactivé.`
      );
      await loadMerchants();
    } finally {
      setActionId(null);
    }
  }

  async function deleteMerchant(merchant: Merchant) {
    const accepted = window.confirm(
      `Supprimer définitivement ${merchant.email} ?\n\nToutes ses entreprises, cartes NFC, statistiques et retours seront supprimés. Cette action est irréversible. Si vous souhaitez conserver les données, utilisez plutôt « Désactiver ».`
    );
    if (!accepted) return;

    const confirmation = window.prompt(
      'Pour confirmer la suppression définitive, tapez exactement : SUPPRIMER'
    );
    if (confirmation !== "SUPPRIMER") {
      if (confirmation !== null) setError("Suppression annulée : le mot SUPPRIMER n'a pas été saisi exactement.");
      return;
    }

    setError(null);
    setSuccess(null);
    setActionId(merchant.id);

    try {
      const response = await fetch("/api/admin/merchants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: merchant.id, confirmation }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Impossible de supprimer ce compte.");
        return;
      }

      setSuccess(`Le compte ${merchant.email} et toutes ses données ont été supprimés.`);
      await loadMerchants();
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Commerçants</h1>
      <p className="mt-1 text-sm text-mist">
        Créez ici le compte, l'entreprise et les identifiants de chaque nouveau client.
      </p>

      <form onSubmit={handleCreate} className="card mt-8 max-w-xl space-y-4">
        <h2 className="font-display text-lg font-semibold">Nouveau commerçant</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Nom du commerçant</label>
          <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email de connexion</label>
          <input
            required
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mot de passe temporaire</label>
          <input
            required
            minLength={12}
            type="password"
            className="input"
            placeholder="12 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nom de l'entreprise</label>
          <input
            required
            className="input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Lien Google Avis</label>
          <input
            className="input"
            placeholder="https://g.page/r/xxxxx/review"
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
          />
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
        {success && <p className="text-sm text-green-700">{success}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Création..." : "Créer le compte commerçant"}
        </button>
      </form>

      <div className="mt-12">
        <h2 className="font-display text-lg font-semibold">Commerçants enregistrés</h2>
        <p className="mt-1 text-sm text-mist">
          Désactiver bloque la connexion et les cartes NFC sans effacer les données.
        </p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {merchants.length === 0 && <p className="text-sm text-mist">Aucun commerçant pour le moment.</p>}
        {merchants.map((merchant) => (
          <div key={merchant.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-semibold">{merchant.name || "Sans nom"}</p>
                <p className="mt-1 text-sm text-mist">{merchant.email}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  merchant.active
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {merchant.active ? "Actif" : "Désactivé"}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {merchant.businesses.map((business) => (
                <div key={business.id} className="rounded-lg bg-porcelain p-3">
                  <p className="text-sm font-medium">{business.name}</p>
                  <p className="mt-1 text-xs text-mist">
                    {business._count.cards} carte(s) · {business._count.reviews} retour(s)
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-black/10 pt-4">
              <button
                type="button"
                disabled={actionId === merchant.id}
                onClick={() => toggleMerchant(merchant)}
                className="rounded-lg border border-black/15 px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {actionId === merchant.id
                  ? "Patientez..."
                  : merchant.active
                    ? "Désactiver"
                    : "Réactiver"}
              </button>
              <button
                type="button"
                disabled={actionId === merchant.id}
                onClick={() => deleteMerchant(merchant)}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
