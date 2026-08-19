"use client";

import { useEffect, useState } from "react";

type Stats = {
  scanCount: number;
  reviewCount: number;
  googleReviewCount: number;
  conversionRate: number;
  averageRating: number;
  privateFeedback: { id: string; rating: number; comment: string | null; createdAt: string }[];
};

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-mist">Vue d'ensemble de toutes vos entreprises.</p>

      {!stats ? (
        <p className="mt-8 text-sm text-mist">Chargement...</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="Scans" value={stats.scanCount} />
            <StatCard label="Clics Google" value={stats.googleReviewCount} />
            <StatCard label="Taux de conversion" value={`${stats.conversionRate}%`} />
            <StatCard label="Retours privés" value={stats.privateFeedback.length} />
            <StatCard label="Note moyenne" value={stats.averageRating ? `${stats.averageRating} ★` : "—"} />
          </div>

          <h2 className="mt-12 font-display text-xl font-semibold">Retours privés récents</h2>
          <div className="mt-4 space-y-3">
            {stats.privateFeedback.length === 0 && (
              <p className="text-sm text-mist">Aucun retour privé pour le moment.</p>
            )}
            {stats.privateFeedback.map((f) => (
              <div key={f.id} className="card">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                  <span className="text-xs text-mist">{new Date(f.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                {f.comment && <p className="mt-2 text-sm text-ink/80">{f.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-mist">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
