import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Screen } from "../components/Screen";
import { Chip } from "../components/Chip";
import { PARTY, QUIZ, QUIZ_TIME_SECONDS } from "../game/config";
import type { Question } from "../game/config";
import { sound } from "../game/sound";
import type { QuizScreenProps } from "../game/types";

const LETTERS = ["A", "B", "C", "D"] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizScreen({ onFinish }: QuizScreenProps) {
  /* embaralha tudo, menos as perguntas marcadas com pinLast — essas fecham o quiz */
  const questions = useMemo<Question[]>(
    () => [...shuffle(QUIZ.filter((q) => !q.pinLast)), ...QUIZ.filter((q) => q.pinLast)],
    []
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_TIME_SECONDS);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [lastGain, setLastGain] = useState<number | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const finishedRef = useRef(false);

  const question = questions[index];
  const total = questions.length;

  useEffect(() => {
    sound.select();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish({ score, correct: correctCount, total });
  };

  /* timer da pergunta */
  useEffect(() => {
    if (locked || finishedRef.current) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          handleAnswer(-1, true);
          return 0;
        }
        if (s <= 6) sound.tick();
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, locked]);

  /* avanço após resposta */
  useEffect(() => {
    if (!locked) return;
    const t = setTimeout(() => {
      if (index + 1 >= total) {
        finish();
        return;
      }
      setIndex((i) => i + 1);
      setSecondsLeft(QUIZ_TIME_SECONDS);
      setLocked(false);
      setSelected(null);
      setLastGain(null);
    }, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const handleAnswer = (optionIndex: number, isTimeout = false) => {
    if (locked || finishedRef.current) return;
    setLocked(true);
    setSelected(optionIndex >= 0 ? optionIndex : null);

    if (!isTimeout && optionIndex === question.answer) {
      sound.correct();
      const gain = Math.round((100 + secondsLeft * 10) * (1 + combo * 0.5));
      setScore((s) => s + gain);
      setCorrectCount((c) => c + 1);
      setCombo((c) => c + 1);
      setLastGain(gain);
    } else {
      sound.wrong();
      setCombo(0);
      setErrorKey((k) => k + 1);
    }
  };

  const timePct = (secondsLeft / QUIZ_TIME_SECONDS) * 100;

  return (
    <Screen className="justify-start pt-10">
      <div className="mb-3 flex w-full justify-center">
        <Chip>FASE 1 · O QUANTO VOCÊ ME CONHECE?</Chip>
      </div>

      {/* HUD */}
      <div className="flex w-full items-center justify-between">
        <span className="font-pixel text-[8px] text-slate-400">
          PERGUNTA {index + 1}/{total}
        </span>
        <div className="text-right">
          <motion.span
            key={score}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="block font-pixel text-[10px] text-neon"
          >
            {score}
          </motion.span>
          <span className="text-[8px] uppercase tracking-widest text-slate-500">score</span>
        </div>
      </div>

      {/* progresso das perguntas */}
      <div className="mt-3 flex w-full gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < index ? "bg-neon" : i === index ? "bg-neon/50" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* timer */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${secondsLeft <= 5 ? "bg-bad" : "bg-neon"}`}
          animate={{ width: `${timePct}%` }}
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </div>

      {/* combo */}
      <div className="mt-2 h-5">
        {combo >= 2 && (
          <span className="animate-blink font-pixel text-[8px] text-neon">
            COMBO x{combo}
          </span>
        )}
      </div>

      {/* pergunta */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ x: 70, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -70, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="panel relative mt-3 w-full p-6"
        >
          <AnimatePresence>
            {lastGain !== null && (
              <motion.span
                key={`gain-${index}`}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -34, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="absolute right-5 top-4 font-pixel text-[10px] text-good"
              >
                +{lastGain}
              </motion.span>
            )}
          </AnimatePresence>

          <p className="mb-1 font-pixel text-[7px] uppercase tracking-widest text-slate-500">
            {PARTY.name} quiz · pergunta {index + 1}
          </p>
          <h2 className="font-display text-xl font-bold leading-snug text-slate-50 sm:text-2xl">
            {question.q}
          </h2>

          <motion.div
            key={errorKey}
            animate={{ x: [0, -8, 8, -5, 5, 0] }}
            transition={{ duration: 0.35 }}
            className="mt-5 space-y-3"
          >
            {question.options.map((opt, i) => {
              const isCorrect = i === question.answer;
              const isPicked = i === selected;
              let cls =
                "border-white/10 bg-white/[0.03] hover:border-neon/40 hover:bg-white/[0.06]";
              let badge = "border border-white/15 text-neon";
              if (locked) {
                if (isCorrect) {
                  cls = "border-good/60 bg-good/10";
                  badge = "bg-good text-[#0b1226] border-transparent";
                } else if (isPicked) {
                  cls = "border-bad/60 bg-bad/10";
                  badge = "bg-bad text-white border-transparent";
                } else {
                  cls = "border-white/10 bg-white/[0.02] opacity-40";
                }
              }
              return (
                <motion.button
                  key={i}
                  type="button"
                  disabled={locked}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: locked && !isCorrect && !isPicked ? 0.4 : 1, y: 0 }}
                  transition={{
                    delay: locked ? 0 : 0.06 * i,
                    type: "spring",
                    stiffness: 300,
                    damping: 22,
                  }}
                  whileHover={locked ? undefined : { scale: 1.02, x: 4 }}
                  whileTap={locked ? undefined : { scale: 0.97 }}
                  onClick={() => handleAnswer(i)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm text-slate-100 transition-colors ${cls}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-pixel text-[8px] ${badge}`}
                  >
                    {LETTERS[i]}
                  </span>
                  {opt}
                </motion.button>
              );
            })}
          </motion.div>

          <AnimatePresence>
            {locked && question.fact && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 border-t border-white/10 pt-3 text-xs italic text-slate-400"
              >
                💡 {question.fact}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </Screen>
  );
}
