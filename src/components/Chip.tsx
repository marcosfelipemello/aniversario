/* Selo pixel (eyebrow) usado acima dos títulos. */

import type { ReactNode } from "react";

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neon/25 bg-neon/[0.06] px-4 py-1.5 font-pixel text-[8px] uppercase tracking-[0.25em] text-neon/90 sm:text-[9px]">
      {children}
    </span>
  );
}
