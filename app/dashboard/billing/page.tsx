"use client";

import { useEffect, useState } from "react";

type BillingStatus = {
  status: string;
  hasCustomer: boolean;
  subscriptionEndsAt: string | null;
};

const ACTIVE_STATUSES = ["active", "trialing"];

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((response) => response.json())
      .then(setBilling)
      .catch(() => setError("Impossible de charger l'abonnement."));
  }, []);

  async function openBilling(endpoint: "checkout" | "portal") {
    setError(null);
    setLoading(endpoint);
    try {
      const response = await fetch(`/api/billing/${endpoint}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setError(data.error || "Impossible d'ouvrir Stripe.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  const active = billing && ACTIVE_STATUSES.includes(billing.status);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">Abonnement</h1>
      <p className="mt-1 text-sm text-mist">
        Gérez votre abonnement NFC Avis et vos informations de paiement.
      </p>

      <div className="card mt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold">NFC Avis Pro</p>
            <p className="mt-1 text-sm text-mist">Cartes NFC, statistiques et retours clients.</p>
          </div>
          <p className="font-display text-xl font-semibold">19,99 €<span className="text-sm text-mist">/mois</span></p>
        </div>

        {!billing ? (
          <p className="mt-6 text-sm text-mist">Chargement...</p>
        ) : (
          <>
            <div className="mt-6 rounded-lg bg-porcelain p-4">
              <p className="text-sm">
                Statut :{" "}
                <span className={active ? "font-semibold text-green-700" : "font-semibold text-orange-700"}>
                  {active ? "Actif" : billing.status === "past_due" ? "Paiement en retard" : "Inactif"}
                </span>
              </p>
              {billing.subscriptionEndsAt && (
                <p className="mt-1 text-xs text-mist">
                  Prochaine échéance : {new Date(billing.subscriptionEndsAt).toLocaleDateString("fr-BE")}
                </p>
              )}
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              {!active && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={Boolean(loading)}
                  onClick={() => openBilling("checkout")}
                >
                  {loading === "checkout" ? "Ouverture..." : "S'abonner"}
                </button>
              )}
              {billing.hasCustomer && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={Boolean(loading)}
                  onClick={() => openBilling("portal")}
                >
                  {loading === "portal" ? "Ouverture..." : "Gérer mon abonnement"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-mist">
        Le paiement est traité par Stripe. NFC Avis ne conserve pas les numéros de carte bancaire.
      </p>
    </div>
  );
}
