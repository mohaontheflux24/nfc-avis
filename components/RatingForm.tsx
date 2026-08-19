"use client";

import { useState } from "react";
import Confetti from "./Confetti";

type Props = {
  code: string;
  googleReviewUrl: string | null;
};

type Step = "rate" | "thanks-high" | "feedback-low" | "thanks-low";

export default function RatingForm({ code, googleReviewUrl }: Props) {
  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitRating(value: number, commentText?: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, rating: value, comment: commentText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible d'enregistrer votre retour.");
        return null;
      }
      setReviewId(data.id);
      return data.id as string;
    } catch {
      setError("Problème de connexion. Réessayez.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStarClick(value: number) {
    setRating(value);
    if (value >= 4) {
      const id = await submitRating(value);
      if (id) setStep("thanks-high");
    } else {
      setStep("feedback-low");
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    const id = await submitRating(rating, comment);
    if (id) setStep("thanks-low");
  }

  function trackGoogleClick() {
    if (!reviewId) return;
    void fetch("/api/google-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, code }),
      keepalive: true,
    });
  }

  const googleButton = googleReviewUrl ? (
    <a
      href={googleReviewUrl}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      onClick={trackGoogleClick}
      className="btn-primary mt-6 w-full animate-fade-in-up"
    >
      Laisser un avis Google
    </a>
  ) : null;

  if (step === "thanks-high") {
    return (
      <div className="relative mt-10">
        <Confetti />
        <div className="animate-pop-in">
          <p className="text-5xl">🎉</p>
          <h2 className="mt-4 font-display text-xl font-semibold">Merci beaucoup !</h2>
          <p className="mt-2 text-sm text-porcelain/70">
            Votre retour a bien été enregistré.
          </p>
          {googleButton}
        </div>
      </div>
    );
  }

  if (step === "feedback-low") {
    return (
      <form onSubmit={handleFeedbackSubmit} className="mt-10 animate-fade-in-up text-left">
        <h2 className="text-center font-display text-lg font-semibold">Nous sommes désolés.</h2>
        <p className="mt-1 text-center text-sm text-porcelain/70">
          Expliquez-nous ce qui s'est passé. Votre message sera visible uniquement par le commerçant.
        </p>
        <textarea
          className="input mt-6 h-32 resize-none bg-white/5 text-porcelain placeholder:text-porcelain/40"
          placeholder="Dites-nous en plus..."
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-porcelain/40">{comment.length}/1000</p>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary mt-4 w-full">
          {submitting ? "Envoi..." : "Envoyer"}
        </button>
      </form>
    );
  }

  if (step === "thanks-low") {
    return (
      <div className="mt-10 animate-pop-in">
        <p className="text-5xl">🙏</p>
        <h2 className="mt-4 font-display text-xl font-semibold">Merci pour votre retour.</h2>
        <p className="mt-2 text-sm text-porcelain/70">
          Votre message privé a bien été enregistré.
        </p>
        {googleButton}
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = (hoverRating ?? rating ?? 0) >= value;
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
              className="star text-4xl"
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => handleStarClick(value)}
              disabled={submitting}
            >
              {filled ? "★" : "☆"}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
    </div>
  );
}
