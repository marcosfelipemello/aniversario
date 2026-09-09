/* Botão do jogo — toda interação toca som e tem micro-motion (hover/tap). */

import { motion } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";
import { sound } from "../game/sound";

type Variant = "primary" | "gold" | "ghost" | "danger";
type Sfx =
  | "click"
  | "select"
  | "coin"
  | "correct"
  | "wrong"
  | "fanfare"
  | "levelup"
  | "gameover"
  | "tick"
  | "none";

const styles: Record<Variant, string> = {
  primary:
    "bg-neon text-[#0b1226] font-bold hover:bg-amber-200 shadow-[0_0_24px_rgba(252,211,77,0.35)]",
  gold:
    "bg-gradient-to-b from-amber-300 to-amber-500 text-[#0b1226] font-bold hover:from-amber-200 hover:to-amber-400 shadow-[0_0_28px_rgba(252,211,77,0.45)]",
  ghost:
    "border border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08] hover:border-white/25",
  danger:
    "bg-red-500/90 text-white font-bold hover:bg-red-400 shadow-[0_0_24px_rgba(248,113,113,0.35)]",
};

export function GameButton({
  children,
  onClick,
  variant = "primary",
  icon,
  className = "",
  disabled = false,
  sfx = "select",
  type = "button",
}: {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: Variant;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  sfx?: Sfx;
  type?: "button" | "submit";
}) {
  const handle = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (sfx !== "none") sound[sfx]();
    onClick?.(e);
  };

  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { scale: 1.035, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.95, y: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 22 }}
      onClick={handle}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {icon}
      {children}
    </motion.button>
  );
}
