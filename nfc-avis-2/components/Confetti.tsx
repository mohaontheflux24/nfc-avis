"use client";

// Petite pluie de confettis en pur CSS, sans librairie externe.
// Chaque pièce a une position, une couleur, un délai et une vitesse légèrement aléatoires.
const COLORS = ["#FF7A45", "#0E4B4A", "#F4F2EE", "#FFC28A"];

export default function Confetti({ count = 28 }: { count?: number }) {
  const pieces = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.4;
    const duration = 1.1 + Math.random() * 0.9;
    const color = COLORS[i % COLORS.length];
    const rotate = Math.random() * 360;
    return { id: i, left, delay, duration, color, rotate };
  });

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
