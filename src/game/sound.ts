/* Motor de som 8-bit — 100% sintetizado via Web Audio API (sem assets).
   O contexto é criado no primeiro gesto do usuário (sound.unlock()). */

import { LS } from "./config";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted =
  typeof localStorage !== "undefined" && localStorage.getItem(LS.muted) === "1";

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  dur?: number;
  vol?: number;
  /** desliza até esta frequência durante o tom */
  slideTo?: number;
  /** atraso em segundos antes de tocar */
  at?: number;
}

function tone(freq: number, { type = "square", dur = 0.08, vol = 1, slideTo, at = 0 }: ToneOpts = {}) {
  const audio = ensureCtx();
  if (!audio || !master || muted) return;
  const t0 = audio.currentTime + at;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function seq(notes: Array<[number, ToneOpts?]>, gap = 0.09) {
  notes.forEach(([f, opts], i) => tone(f, { ...opts, at: (opts?.at ?? 0) + i * gap }));
}

export const sound = {
  /** chamar no primeiro clique/toque (libera o áudio no mobile) */
  unlock() {
    ensureCtx();
  },
  setMuted(m: boolean) {
    muted = m;
    try {
      localStorage.setItem(LS.muted, m ? "1" : "0");
    } catch {
      /* noop */
    }
  },
  isMuted() {
    return muted;
  },
  /** clique de UI */
  click() {
    tone(620, { dur: 0.05, vol: 0.7 });
  },
  /** hover/seleção de menu */
  select() {
    tone(440, { dur: 0.06, vol: 0.6, slideTo: 880 });
  },
  /** ficha inserida 🪙 */
  coin() {
    seq([
      [988, { dur: 0.07, vol: 0.9 }],
      [1319, { dur: 0.22, vol: 0.9 }],
    ], 0.07);
  },
  /** resposta certa */
  correct() {
    seq([
      [523, { dur: 0.08, vol: 0.8 }],
      [659, { dur: 0.08, vol: 0.8 }],
      [784, { dur: 0.16, vol: 0.9 }],
    ], 0.07);
  },
  /** resposta errada */
  wrong() {
    tone(220, { type: "sawtooth", dur: 0.22, vol: 0.7, slideTo: 110 });
  },
  /** tic do timer */
  tick() {
    tone(1100, { dur: 0.03, vol: 0.35 });
  },
  /** fanfarra de conquista */
  fanfare() {
    seq(
      [
        [523, { dur: 0.1, vol: 0.85 }],
        [659, { dur: 0.1, vol: 0.85 }],
        [784, { dur: 0.1, vol: 0.85 }],
        [1047, { dur: 0.3, vol: 1 }],
      ],
      0.11
    );
    seq(
      [
        [784, { type: "triangle", dur: 0.1, vol: 0.5 }],
        [1047, { type: "triangle", dur: 0.3, vol: 0.6 }],
      ],
      0.11
    );
  },
  /** level up / sweep ascendente */
  levelup() {
    tone(330, { type: "triangle", dur: 0.35, vol: 0.8, slideTo: 1320 });
  },
  /** game over */
  gameover() {
    seq(
      [
        [392, { dur: 0.14, vol: 0.8 }],
        [370, { dur: 0.14, vol: 0.8 }],
        [349, { dur: 0.14, vol: 0.8 }],
        [330, { dur: 0.34, vol: 0.9 }],
      ],
      0.16
    );
  },
};
