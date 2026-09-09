/* Wrapper de tela — define a transição padrão de entrada/saída.
   Toda tela usa <Screen> para que cada navegação tenha motion. */

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const variants = {
  initial: { opacity: 0, y: 30, scale: 0.97, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -24, scale: 0.98, filter: "blur(8px)" },
};

export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.main
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className={`relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-5 py-10 safe-b ${className}`}
    >
      {children}
    </motion.main>
  );
}
