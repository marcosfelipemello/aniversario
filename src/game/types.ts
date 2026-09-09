/* Tipos compartilhados entre telas e o orquestrador (App). */

export type ScreenId = "start" | "quiz" | "result" | "location";

/** Função de navegação entre telas (sempre dispara a transição global). */
export type GoFn = (screen: ScreenId) => void;

export type Rsvp = "sim" | "nao" | null;

export interface QuizResult {
  score: number;
  correct: number;
  total: number;
  best: number;
}

export interface StartScreenProps {
  /** recebe o telefone já normalizado (55 + DDD + número) */
  onStart: (telefone: string) => void;
}

export interface LocationScreenProps {
  /** placar do quiz, anexado à mensagem de WhatsApp do RSVP */
  quizResult: QuizResult | null;
  /** resposta já registrada — quando existe, a tela mostra o recado fixo */
  rsvp: Rsvp;
  onRsvp: (vai: boolean) => void;
}

export interface QuizScreenProps {
  /** chamado ao terminar todas as perguntas */
  onFinish: (result: Omit<QuizResult, "best">) => void;
}

export interface ResultScreenProps {
  go: GoFn;
  result: QuizResult;
  /** true quando o placar veio da tranca (a pessoa já tinha jogado antes) */
  jaJogou?: boolean;
}
