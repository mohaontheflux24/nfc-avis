"use client";

import { useState } from "react";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmation) {
      setError("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Impossible de modifier le mot de passe.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setMessage("Mot de passe modifié. Les anciennes sessions ont été invalidées.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Sécurité</h1>
      <p className="mt-1 text-sm text-mist">Modifiez régulièrement votre mot de passe.</p>

      <form onSubmit={handleSubmit} className="card mt-8 max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Mot de passe actuel</label>
          <input
            required
            type="password"
            autoComplete="current-password"
            className="input"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nouveau mot de passe</label>
          <input
            required
            minLength={12}
            type="password"
            autoComplete="new-password"
            className="input"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <p className="mt-1 text-xs text-mist">Au moins 12 caractères.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirmer le nouveau mot de passe</label>
          <input
            required
            minLength={12}
            type="password"
            autoComplete="new-password"
            className="input"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Modification..." : "Modifier le mot de passe"}
        </button>
      </form>
    </div>
  );
}
