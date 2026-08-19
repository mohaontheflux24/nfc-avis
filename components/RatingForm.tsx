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
  const [submitting, setSubmitting] = useState(false);

  async function submitRating(value: number, commentText?: string) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, rating: value, comment: commentText }),
      });
      await res.json();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStarClick(value: number) {
    setRating(value);
    if (value >= 4) {
      await submitRating(value);
      setStep("thanks-high");
    } else {
      setStep("feedback-low");
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    await submitRating(rating, comment);
    setStep("thanks-low");
  }

  if (step === "thanks-high") {
    return (
      <div className="relative mt-10">
        <Confetti />
        <div className="animate-pop-in">
          <p className="text-5xl">🎉</p>
          <h2 className="mt-4 font-display text-xl font-semibold">Merci beaucoup !</h2>
          <p className="mt-2 text-sm text-porcelain/70">
            Votre avis compte énormément pour nous. Une minute de plus nous aiderait encore davantage.
          </p>
          {googleReviewUrl ? (
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-6 w-full animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              Laisser un avis Google
            </a>
          ) : (
            <p className="mt-6 text-xs text-porcelain/50">
              (Le commerçant n'a pas encore renseigné son lien Google Avis.)
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === "feedback-low") {
    return (
      <form onSubmit={handleFeedbackSubmit} className="mt-10 animate-fade-in-up text-left">
        <h2 className="font-display text-lg font-semibold text-center">Nous sommes désolés.</h2>
        <p className="mt-1 text-center text-sm text-porcelain/70">
          Expliquez-nous ce qui s'est passé — votre message est envoyé uniquement au commerçant.
        </p>
        <textarea
          className="input mt-6 h-32 resize-none bg-white/5 text-porcelain placeholder:text-porcelain/40"
          placeholder="Dites-nous en plus..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
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
          Le commerçant a été notifié et reviendra vers vous si nécessaire.
        </p>
      </div>
    );
  }

  // step === "rate"
  return (
    <div className="mt-10 flex justify-center gap-2">
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
  );
}
