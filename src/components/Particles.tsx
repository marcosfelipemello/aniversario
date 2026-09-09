/* Partículas flutuantes de fundo (faíscas/moedas do arcade). */

import { useMemo } from "react";
import { motion } from "framer-motion";

const GLYPHS = ["✦", "●", "▲", "✧", "■", "★"];

export function Particles({ count = 20 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 6 + Math.random() * 10,
        delay: Math.random() * 5,
        dur: 6 + Math.random() * 7,
        glyph: GLYPHS[i % GLYPHS.length],
        opacity: 0.1 + Math.random() * 0.22,
      })),
    [count]
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="absolute text-neon"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            opacity: p.opacity,
          }}
          animate={{ y: [0, -28, 0], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          {p.glyph}
        </motion.span>
      ))}
    </div>
  );
}
