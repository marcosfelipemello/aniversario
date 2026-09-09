/* Orquestrador: máquina de estados das telas + transições globais,
   flash de navegação, toast de conquista, mute e persistência local. */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { Atmosphere } from "./components/Atmosphere";
import { Particles } from "./components/Particles";
import { ScreenFlash } from "./components/ScreenFlash";
import { AchievementToast } from "./components/AchievementToast";
import { StartScreen } from "./screens/StartScreen";
import { LocationScreen } from "./screens/LocationScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { LS } from "./game/config";
import { sound } from "./game/sound";
import { entrar, salvarPlacar, salvarRsvp } from "./game/api";
import type { QuizResult, Rsvp, ScreenId } from "./game/types";

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export default function App() {
  const [screen, setScreen] = useState<ScreenId>("start");
  const [flashKey, setFlashKey] = useState(0);
  const [quizSession, setQuizSession] = useState(0);
  const [best, setBest] = useState(() => Number(readLS(LS.bestScore) ?? 0));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [phone, setPhone] = useState<string | null>(() => readLS(LS.phone));
  const [rsvp, setRsvp] = useState<Rsvp>(null);
  const [jaJogou, setJaJogou] = useState(false);
  const [muted, setMuted] = useState(() => sound.isMuted());
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  /** navegação global — dispara o flash/faixa de transição */
  const go = useCallback((s: ScreenId) => {
    if (s === "quiz") setQuizSession((n) => n + 1);
    setFlashKey((k) => k + 1);
    setScreen(s);
    window.scrollTo({ top: 0 });
  }, []);

  /* auto-dismiss do toast de conquista */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  /* A ficha do fliperama: o servidor diz se este numero ja gastou a dele.
     Se a API estiver fora do ar, o jogo segue sem trava — melhor um convidado
     jogar duas vezes do que ninguem conseguir entrar. */
  const handleStart = useCallback(
    async (telefone: string) => {
      sound.unlock();
      setPhone(telefone);
      try {
        localStorage.setItem(LS.phone, telefone);
      } catch {
        /* noop */
      }

      const registro = await entrar(telefone);

      if (registro?.jaJogou && registro.resultado) {
        const r = registro.resultado;
        setResult({ ...r, best: Math.max(best, r.score) });
        setRsvp(registro.rsvp);
        setJaJogou(true);
        setToast({
          title: "Você já usou sua ficha!",
          subtitle: `Placar travado em ${r.score} pts · sem repeteco 😉`,
        });
        go("result");
        return;
      }

      setJaJogou(false);
      setRsvp(null);
      sound.coin();
      go("quiz");
    },
    [best, go]
  );

  const handleRsvp = useCallback(
    (vai: boolean) => {
      setRsvp(vai ? "sim" : "nao");
      if (phone) void salvarRsvp(phone, vai);
    },
    [phone]
  );

  const handleQuizFinish = useCallback(
    (r: Omit<QuizResult, "best">) => {
      const newBest = Math.max(best, r.score);
      if (newBest > best) {
        setBest(newBest);
        try {
          localStorage.setItem(LS.bestScore, String(newBest));
        } catch {
          /* noop */
        }
      }
      setResult({ ...r, best: newBest });
      if (phone) void salvarPlacar(phone, r);
      go("result");
    },
    [best, go, phone]
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      sound.setMuted(!m);
      return !m;
    });
    sound.click();
  }, []);

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-base">
      <Atmosphere />
      <Particles count={20} />

      {/* botão de som */}
      <motion.button
        aria-label={muted ? "Ativar som" : "Silenciar"}
        onClick={toggleMute}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed right-4 top-4 z-[55] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur-sm transition-colors hover:border-neon/40 hover:text-neon"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </motion.button>

      <AnimatePresence mode="wait">
        {screen === "start" && <StartScreen key="start" onStart={handleStart} />}
        {screen === "quiz" && (
          <QuizScreen key={`quiz-${quizSession}`} onFinish={handleQuizFinish} />
        )}
        {screen === "result" &&
          (result ? (
            <ResultScreen key="result" go={go} result={result} jaJogou={jaJogou} />
          ) : (
            <StartScreen key="start-fallback" onStart={handleStart} />
          ))}
        {screen === "location" && (
          <LocationScreen key="location" quizResult={result} rsvp={rsvp} onRsvp={handleRsvp} />
        )}
      </AnimatePresence>

      <ScreenFlash k={flashKey} />
      <AchievementToast
        show={toast !== null}
        title={toast?.title ?? ""}
        subtitle={toast?.subtitle ?? ""}
      />
    </div>
  );
}
