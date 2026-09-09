import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Crown, MapPin, Zap } from "lucide-react";
import { Screen } from "../components/Screen";
import { GameButton } from "../components/GameButton";
import { Chip } from "../components/Chip";
import { PARTY, rankFor } from "../game/config";
import { sound } from "../game/sound";
import { bigBoom } from "../game/confetti";
import type { ResultScreenProps } from "../game/types";

const RANK_COLORS: Record<string, string> = {
  S: "text-neon",
  A: "text-emerald-300",
  B: "text-sky-300",
  C: "text-slate-300",
  D: "text-slate-500",
};

const container = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 22 } },
};

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="panel p-3 text-center">
      <div className="mb-1.5 flex justify-center">{icon}</div>
      <p className="font-pixel text-[10px] text-slate-100">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  );
}

export function ResultScreen({ go, result, jaJogou = false }: ResultScreenProps) {
  const rank = rankFor(result.correct, result.total);
  const fxRan = useRef(false);

  useEffect(() => {
    if (fxRan.current) return;
    fxRan.current = true;
    if (rank.letter === "S" || rank.letter === "A") {
      bigBoom();
      sound.fanfare();
    } else {
      sound.coin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen className="text-center">
      <motion.div
        variants={container}
        initial="initial"
        animate="animate"
        className="flex w-full flex-col items-center"
      >
        <motion.div variants={item}>
          <Chip>{jaJogou ? "VOCÊ JÁ JOGOU · PLACAR GRAVADO" : "FASE 1 COMPLETA · SEU PLACAR"}</Chip>
        </motion.div>

        {/* emoji + letra do rank */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
          className="mt-5 text-6xl leading-none drop-shadow-[0_0_22px_rgba(252,211,77,0.45)]"
        >
          {rank.emoji}
        </motion.div>

        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.25 }}
          className={`mt-1 font-display text-[7rem] font-black leading-none text-glow ${RANK_COLORS[rank.letter]}`}
        >
          {rank.letter}
        </motion.div>

        <motion.p
          variants={item}
          className="mt-2 font-pixel text-[10px] tracking-[0.3em] text-neon"
        >
          {rank.emoji} {rank.title} {rank.emoji}
        </motion.p>

        <motion.p variants={item} className="mx-auto mt-3 max-w-xs text-sm text-slate-300">
          {rank.message}
        </motion.p>

        {/* stats */}
        <motion.div variants={item} className="mt-7 grid w-full grid-cols-3 gap-3">
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-good" />}
            value={`${result.correct}/${result.total}`}
            label="acertos"
          />
          <StatCard
            icon={<Zap className="h-4 w-4 text-neon" />}
            value={String(result.score)}
            label="pontos"
          />
          <StatCard
            icon={<Crown className="h-4 w-4 text-neon" />}
            value={String(result.best)}
            label="recorde"
          />
        </motion.div>

        {result.score === result.best && result.score > 0 && (
          <motion.p
            variants={item}
            className="mt-4 animate-blink font-pixel text-[9px] text-neon"
          >
            ★ NOVO RECORDE! ★
          </motion.p>
        )}

        {/* próximos passos */}
        <motion.div variants={item} className="mt-8 w-full space-y-3">
          <GameButton
            variant="gold"
            sfx="coin"
            icon={<MapPin className="h-4 w-4" />}
            className="w-full font-pixel !text-[9px] tracking-widest"
            onClick={() => go("location")}
          >
            VER LOCAL DA COMEMORAÇÃO
          </GameButton>

          <p className="pt-1 text-[11px] text-slate-500">
            {jaJogou
              ? `Este número já usou a ficha dele. Placar travado em ${result.score} pts · rank ${rank.letter}.`
              : `Seu placar (${result.score} pts · rank ${rank.letter}) vai junto na confirmação 😉`}
          </p>
        </motion.div>
      </motion.div>
    </Screen>
  );
}
