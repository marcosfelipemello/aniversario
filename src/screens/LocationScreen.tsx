import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  ExternalLink,
  HeartCrack,
  MapPin,
  Navigation,
  PartyPopper,
  Send,
  Shirt,
  Trophy,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Screen } from "../components/Screen";
import { GameButton } from "../components/GameButton";
import { Chip } from "../components/Chip";
import { PARTY, RSVP_MSG, rankFor } from "../game/config";
import { sound } from "../game/sound";
import { bigBoom } from "../game/confetti";
import type { LocationScreenProps } from "../game/types";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: number): TimeLeft | null {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const container = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const item = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 22 } },
};

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="panel p-3 text-center">
      <motion.span
        key={value}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="block font-pixel text-sm text-neon"
      >
        {String(value).padStart(2, "0")}
      </motion.span>
      <span className="mt-1 block text-[9px] uppercase tracking-widest text-slate-500">
        {label}
      </span>
    </div>
  );
}

export function LocationScreen({ quizResult, rsvp, onRsvp }: LocationScreenProps) {
  const target = new Date(PARTY.dateISO).getTime();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calcTimeLeft(target));
  const [modal, setModal] = useState<null | "mapa" | "rsvp">(null);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  /* abre o WhatsApp com o template escolhido + o placar do quiz anexado */
  const sendRsvp = (going: boolean) => {
    if (going) {
      sound.fanfare();
      bigBoom();
    }
    onRsvp(going);
    setModal(null);
    const placar = quizResult
      ? `\n\n⚡ Meu placar no quiz: ${quizResult.score} pts · ${quizResult.correct}/${quizResult.total} acertos · Rank ${rankFor(quizResult.correct, quizResult.total).letter}`
      : "";
    const text = encodeURIComponent((going ? RSVP_MSG.yes : RSVP_MSG.no) + placar);
    window.open(`https://wa.me/${PARTY.whatsapp}?text=${text}`, "_blank", "noopener");
  };

  return (
    <Screen className="justify-start pt-16">
      <motion.div
        variants={container}
        initial="initial"
        animate="animate"
        className="flex w-full flex-col items-center text-center"
      >
        <motion.div variants={item}>
          <Chip>CHECKPOINT · SAVE POINT</Chip>
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-4 font-display text-3xl font-black text-glow text-slate-50 sm:text-4xl"
        >
          LOCAL DA FESTA
        </motion.h1>

        {/* nota do aniversário real */}
        <motion.p
          variants={item}
          className="mt-3 max-w-xs text-center text-xs leading-relaxed text-slate-400"
        >
          🎂 {PARTY.birthdayNote}
        </motion.p>

        {/* countdown */}
        <motion.div variants={item} className="mt-6 w-full">
          {timeLeft ? (
            <div className="grid grid-cols-4 gap-2">
              <CountdownCell value={timeLeft.days} label="dias" />
              <CountdownCell value={timeLeft.hours} label="horas" />
              <CountdownCell value={timeLeft.minutes} label="min" />
              <CountdownCell value={timeLeft.seconds} label="seg" />
            </div>
          ) : (
            <p className="animate-blink font-pixel text-[10px] text-good">
              A FESTA COMEÇOU! 🎉
            </p>
          )}
          <p className="mt-2 font-pixel text-[8px] uppercase tracking-widest text-slate-500">
            Contagem regressiva para o boss final
          </p>
        </motion.div>

        {/* card do local */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.01 }}
          className="panel panel-glow mt-6 w-full p-6 text-left"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neon/10 ring-1 ring-neon/40">
              <MapPin className="h-6 w-6 animate-pin text-neon" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-50">
                {PARTY.venue}
              </h2>
              <p className="mt-0.5 text-sm text-slate-300">{PARTY.address}</p>
            </div>
          </div>

          <div className="my-4 border-t border-white/10" />

          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-slate-300">
              <Calendar className="h-4 w-4 shrink-0 text-neon" />
              {PARTY.dateLabel}
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300">
              <Shirt className="h-4 w-4 shrink-0 text-neon" />
              {PARTY.dressCode}
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300">
              <PartyPopper className="h-4 w-4 shrink-0 text-neon" />
              Aniversário de {PARTY.age} anos do {PARTY.name}
            </li>
          </ul>
        </motion.div>

        {/* box do rodízio */}
        <motion.div variants={item} className="panel mt-5 w-full p-5 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neon/10 ring-1 ring-neon/40">
              <UtensilsCrossed className="h-4.5 w-4.5 text-neon" />
            </span>
            <div>
              <p className="font-pixel text-[8px] uppercase tracking-widest text-neon/80">
                Info importante
              </p>
              <h3 className="mt-0.5 font-display text-lg font-bold text-slate-50">
                {PARTY.rodizio.title}
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {PARTY.rodizio.items.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                  row.highlight
                    ? "border-neon/50 bg-neon/[0.08] shadow-[0_0_18px_rgba(252,211,77,0.15)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <span className={`text-xs ${row.highlight ? "font-semibold text-slate-100" : "text-slate-300"}`}>
                  {row.label}
                </span>
                <span className={`shrink-0 font-pixel text-[10px] ${row.highlight ? "text-neon" : "text-slate-400"}`}>
                  {row.price}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] font-medium text-neon/80">{PARTY.rodizio.note}</p>
        </motion.div>

        <motion.div variants={item} className="mt-6 w-full space-y-3">
          <GameButton
            variant="ghost"
            sfx="click"
            icon={<Navigation className="h-4 w-4" />}
            className="w-full font-pixel !text-[9px] tracking-widest"
            onClick={() => setModal("mapa")}
          >
            VER NO GOOGLE MAPS
          </GameButton>

          {/* Depois de responder, o botao some e o recado fica fixo: ninguem
              precisa clicar de novo pra lembrar o que respondeu. */}
          {rsvp === null ? (
            <GameButton
              variant="gold"
              sfx="coin"
              icon={<Send className="h-4 w-4" />}
              className="w-full font-pixel !text-[9px] tracking-widest"
              onClick={() => setModal("rsvp")}
            >
              CONFIRMAR/NEGAR PRESENÇA
            </GameButton>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              className={`panel panel-glow w-full p-6 text-center ${
                rsvp === "sim" ? "!border-neon/40" : "!border-white/15"
              }`}
            >
              <span
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-1 ${
                  rsvp === "sim" ? "bg-neon/10 ring-neon/40" : "bg-white/[0.06] ring-white/20"
                }`}
              >
                {rsvp === "sim" ? (
                  <Trophy className="h-7 w-7 text-neon" />
                ) : (
                  <HeartCrack className="h-7 w-7 text-slate-400" />
                )}
              </span>

              <h3 className="mt-4 font-display text-2xl font-black text-glow text-slate-50">
                {rsvp === "sim" ? "PRESENÇA CONFIRMADA!" : "RESPOSTA REGISTRADA"}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {rsvp === "sim" ? (
                  <>
                    Você entrou pra party do {PARTY.name}. Guarde a data:{" "}
                    <span className="text-neon">{PARTY.dateLabel.toLowerCase()}</span>, no{" "}
                    {PARTY.venue}. Chega antes das 19h pra garantir a mesa — e prepara o
                    carisma, que a fase final é presencial. 🎉
                  </>
                ) : (
                  <>
                    Que pena que dessa vez não rola. O {PARTY.name} entendeu, e ficou o
                    recado: você chegou até o fim do jogo, e isso já vale XP. Fica pra
                    próxima fase — o LEVEL {PARTY.age + 1} vem aí. 💛
                  </>
                )}
              </p>

              <p className="mt-4 font-pixel text-[8px] uppercase tracking-widest text-slate-500">
                {rsvp === "sim" ? "★ nos vemos lá ★" : "★ obrigado por jogar ★"}
              </p>

              <button
                type="button"
                onClick={() => sendRsvp(rsvp === "sim")}
                className="mt-5 inline-flex items-center gap-2 text-[11px] text-slate-500 underline decoration-dotted underline-offset-4 transition-colors hover:text-neon"
              >
                <Send className="h-3 w-3" />
                reenviar no WhatsApp
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* ── Modal do mapa (item 1): o Google Maps embutido, sem sair do site.
              O output=embed nao precisa de chave de API. ─────────────────── */}
        <AnimatePresence>
          {modal === "mapa" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.88, y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                onClick={(e) => e.stopPropagation()}
                className="panel panel-glow relative w-full max-w-lg overflow-hidden p-4"
              >
                <div className="flex items-center gap-3 pr-10">
                  <MapPin className="h-5 w-5 shrink-0 text-neon" />
                  <div className="min-w-0 text-left">
                    <h3 className="truncate font-display text-lg font-bold text-slate-50">
                      {PARTY.venue}
                    </h3>
                    <p className="truncate text-[11px] text-slate-400">{PARTY.address}</p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Fechar mapa"
                  onClick={() => setModal(null)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>

                <iframe
                  title={`Mapa — ${PARTY.venue}`}
                  src={PARTY.mapsEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="mt-4 aspect-square w-full rounded-xl border border-white/10 bg-white/5 sm:aspect-video"
                />

                <a
                  href={PARTY.mapsUrl}
                  target="_blank"
                  rel="noopener"
                  className="mt-3 inline-flex items-center gap-2 text-[11px] text-slate-500 underline decoration-dotted underline-offset-4 transition-colors hover:text-neon"
                >
                  <ExternalLink className="h-3 w-3" />
                  traçar rota no app do Google Maps
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modal do RSVP: sim / não, centralizado, fundo escurecido ───── */}
        <AnimatePresence>
          {modal === "rsvp" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-5 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.75, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.85, y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                onClick={(e) => e.stopPropagation()}
                className="panel panel-glow relative w-full max-w-sm p-7 text-center"
              >
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setModal(null)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>

                <p className="font-pixel text-[8px] uppercase tracking-widest text-neon/80">
                  Confirmação de presença
                </p>
                <h2 className="mt-4 font-display text-2xl font-black text-glow text-slate-50">
                  VOCÊ VAI COMPARECER?
                </h2>
                <p className="mt-3 text-sm text-slate-300">
                  Sua resposta vai direto no WhatsApp do {PARTY.name}
                  {quizResult ? ", junto com o seu placar do quiz." : "."}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <GameButton
                    variant="primary"
                    sfx="none"
                    icon={<Check className="h-4 w-4" />}
                    className="w-full font-pixel !text-[9px] tracking-widest"
                    onClick={() => sendRsvp(true)}
                  >
                    SIM
                  </GameButton>
                  <GameButton
                    variant="danger"
                    sfx="wrong"
                    icon={<X className="h-4 w-4" />}
                    className="w-full font-pixel !text-[9px] tracking-widest"
                    onClick={() => sendRsvp(false)}
                  >
                    NÃO
                  </GameButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </Screen>
  );
}
