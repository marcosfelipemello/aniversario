/* Flash + faixa varrendo a tela a cada mudança de tela.
   O App incrementa `k` a cada navegação para re-disparar a animação. */

import { AnimatePresence, motion } from "framer-motion";

export function ScreenFlash({ k }: { k: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={k}
        className="pointer-events-none fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, times: [0, 0.12, 1], ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(252,211,77,0.45), rgba(252,211,77,0.08) 60%, transparent 78%)",
        }}
      >
        {/* faixa de energia que varre a tela */}
        <motion.div
          className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent blur-sm"
          initial={{ x: "-120%" }}
          animate={{ x: "380%" }}
          transition={{ duration: 0.55, ease: [0.2, 0.8, 0.4, 1] }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
