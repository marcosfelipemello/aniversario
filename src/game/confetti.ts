/* Helper de confete com a paleta âmbar/dourada do convite. */

import confetti from "canvas-confetti";

const PALETTE = ["#fcd34d", "#fbbf24", "#f59e0b", "#ffffff", "#93c5fd"];

export function boom() {
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 42,
    origin: { y: 0.7 },
    colors: PALETTE,
    disableForReducedMotion: true,
  });
}

export function bigBoom() {
  const end = Date.now() + 900;
  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: PALETTE,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: PALETTE,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
