/* Toast de conquista desbloqueada (estilo arcade). */

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";

export function AchievementToast({
  show,
  title,
  subtitle,
}: {
  show: boolean;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-5">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: 90, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 90, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="panel panel-glow flex items-center gap-3.5 rounded-2xl px-5 py-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neon/15 ring-1 ring-neon/40">
              <Trophy className="h-5 w-5 text-neon" />
            </span>
            <div className="text-left">
              <p className="font-pixel text-[8px] uppercase tracking-widest text-neon">
                Conquista desbloqueada
              </p>
              <p className="mt-1 font-display text-base font-bold text-slate-50">
                {title}
              </p>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
