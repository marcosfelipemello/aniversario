/* Tela de abertura — estilo fliperama: INSERT COIN → LEVEL 31 → START. */

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { Screen } from "../components/Screen";
import { Chip } from "../components/Chip";
import { GameButton } from "../components/GameButton";
import { PARTY } from "../game/config";
import { sound } from "../game/sound";
import { conferirTelefone, soDigitos, DIGITOS_ESPERADOS } from "../game/api";
import type { StartScreenProps } from "../game/types";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 220, damping: 22 },
  },
};

const levelNumber: Variants = {
  hidden: { opacity: 0, scale: 0.4 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 160, damping: 14 },
  },
};

/** (21) 99999-9999 enquanto digita — cosmético; quem tranca é conferirTelefone. */
function mascara(bruto: string): string {
  const d = soDigitos(bruto);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  // dígito sobrando fica visível no fim: o contador acusa e o botão não libera
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}${d.slice(11)}`;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [tel, setTel] = useState("");
  const [erro, setErro] = useState("");
  const [shake, setShake] = useState(0);
  const [carregando, setCarregando] = useState(false);

  const digitos = soDigitos(tel);
  const problema = conferirTelefone(tel);
  const completo = problema === "";

  const handleStart = () => {
    if (!completo) {
      sound.wrong();
      setErro(problema);
      setShake((n) => n + 1);
      return;
    }
    sound.unlock();
    setErro("");
    setCarregando(true);
    onStart(`55${digitos}`);
  };

  return (
    <Screen className="text-center">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex w-full flex-col items-center"
      >
        <motion.div variants={item}>
          <Chip>INSERT COIN · 1 FICHA</Chip>
        </motion.div>

        {/* Bloco do nível */}
        <motion.div variants={item} className="relative mt-10">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/20 blur-3xl" />
          <p className="relative font-pixel text-[10px] uppercase tracking-[0.4em] text-neon/80">
            LEVEL
          </p>
          <div className="relative mt-3 flex items-start justify-center">
            {/* floaty no wrapper para não brigar com o spring de scale do número */}
            <div className="animate-floaty">
              <motion.h1
                variants={levelNumber}
                className="font-display text-[7rem] font-black leading-none text-slate-50 text-glow sm:text-[9rem]"
              >
                {PARTY.age}
              </motion.h1>
            </div>
            <Sparkles className="ml-2 mt-4 h-6 w-6 animate-spin-slow text-neon/60" />
          </div>
        </motion.div>

        <motion.div variants={item} className="mt-8">
          <p className="font-display text-xl italic text-slate-200">
            A jornada de {PARTY.name} continua
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Completei {PARTY.age - 1} fases. Ajude-me a comemorar a próxima.
          </p>
        </motion.div>

        {/* Identificacao (09/09/2026): o numero e a ficha do fliperama. Uma ficha
            por pessoa — o servidor guarda o placar e nao deixa jogar de novo. */}
        <motion.div variants={item} className="mt-10 w-full max-w-xs">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="tel"
              className="font-pixel text-[8px] uppercase tracking-widest text-neon/80"
            >
              Seu WhatsApp
            </label>
            <span
              className={`font-pixel text-[8px] tracking-widest ${
                completo ? "text-good" : digitos.length > DIGITOS_ESPERADOS ? "text-bad" : "text-slate-500"
              }`}
            >
              {digitos.length}/{DIGITOS_ESPERADOS}
            </span>
          </div>
          <motion.div key={shake} animate={{ x: [0, -10, 10, -6, 6, 0] }} transition={{ duration: 0.4 }}>
            <input
              id="tel"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={tel}
              disabled={carregando}
              onChange={(e) => {
                setTel(mascara(e.target.value));
                setErro("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="(21) 99999-9999"
              maxLength={15}
              aria-invalid={tel.length > 0 && !completo}
              className={`mt-2 w-full rounded-xl border bg-white/[0.05] px-4 py-3.5 text-center tracking-wider text-slate-50 placeholder-slate-500 outline-none transition-colors focus:bg-white/[0.07] disabled:opacity-50 ${
                completo
                  ? "border-good/60 focus:border-good"
                  : "border-white/10 focus:border-neon/50"
              }`}
            />
          </motion.div>
          <p className="mt-2 h-8 text-[11px] leading-tight text-slate-500">
            {erro ? (
              <span className="text-bad">{erro}</span>
            ) : completo ? (
              <span className="text-good">Número válido — pode inserir a ficha.</span>
            ) : (
              "DDD + 11 dígitos. Vale uma ficha por número: o placar é gravado e não dá pra repetir."
            )}
          </p>
        </motion.div>

        <motion.div variants={item} className="mt-4">
          <GameButton
            variant="gold"
            sfx="coin"
            disabled={carregando || !completo}
            onClick={handleStart}
            className={`font-pixel text-[10px] uppercase tracking-widest ${
              carregando || !completo ? "" : "animate-blink"
            }`}
            icon={carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {carregando ? "CARREGANDO..." : "▶ PRESSIONE START"}
          </GameButton>
        </motion.div>

        <motion.footer
          variants={item}
          className="mt-14 font-pixel text-[8px] uppercase tracking-widest text-slate-500"
        >
          <p>© 2026 {PARTY.name.toUpperCase()} ARCADE CO.</p>
          <p className="mt-2">v{PARTY.age}.0</p>
        </motion.footer>
      </motion.div>
    </Screen>
  );
}
