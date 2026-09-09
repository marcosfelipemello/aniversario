/* ════════════════════════════════════════════════════════════════════
   ✏️  EDITE AQUI — todos os dados da festa e do quiz ficam neste arquivo.
   Troque nome, data, local, WhatsApp e as perguntas sem tocar no resto.
   ════════════════════════════════════════════════════════════════════ */

export const PARTY = {
  /** Nome do aniversariante */
  name: "Marcos",
  /** Idade que está completando (vira o "LEVEL") */
  age: 31,
  /** Data/hora da comemoração (formato ISO com fuso) */
  dateISO: "2026-09-19T18:00:00-03:00",
  /** Data por extenso para exibição */
  dateLabel: "Sábado · 19 de setembro · a partir das 18h",
  /** Aniversário real (fica só de curiosidade) */
  birthdayNote: "O aniversário é dia 18/09, mas comemoramos no sábado 19/09 pra ninguém faltar!",
  /** Nome do local */
  venue: "Ex2.0 Pizzaria",
  /** Endereço completo */
  address: "R. Catiri, 880 — Bangu, Rio de Janeiro · CEP 21863-005",
  /** Mapa embutido no modal (não precisa de chave de API) */
  mapsEmbedUrl:
    "https://www.google.com/maps?q=Ex2.0+Pizzaria+R.+Catiri+880+Bangu+Rio+de+Janeiro&output=embed",
  /** Link do app do Google Maps (traçar rota de verdade) */
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Ex2.0+Pizzaria+R.+Catiri+880+Bangu+Rio+de+Janeiro",
  /** WhatsApp do aniversariante (DDI+DDD+número, só dígitos) — botão de RSVP */
  whatsapp: "5521983591892",
  /** Traje / observação */
  dressCode: "Traje livre · bônus de carisma para look retrô 🕹️",
  /** Info do rodízio (box de preço na tela de local) */
  rodizio: {
    title: "Rodízio de Pizza",
    items: [
      {
        label: "Rodízio completo · por pessoa",
        price: "R$ 79,90",
        highlight: true,
      },
    ],
    note: "⚠️ Cheguem antes das 19h para garantir a mesa! Rodízio completo 🍕 · bebidas à parte",
  }
};

/* ── Quiz: "O quanto você me conhece?" ─────────────────────────────── */

export interface Question {
  q: string;
  options: [string, string, string, string];
  /** índice (0–3) da resposta certa */
  answer: 0 | 1 | 2 | 3;
  /** curiosidade exibida após responder */
  fact?: string;
  /** força esta pergunta a ser sempre a última, mesmo com o embaralhamento */
  pinLast?: boolean;
}

export const QUIZ_TIME_SECONDS = 15;

export const QUIZ: Question[] = [
  {
    q: "Qual comida o Marcos pediria sem pensar duas vezes?",
    options: ["Pizza de calabresa", "Sushi", "Churrasco completo", "Lanche podrão"],
    answer: 2,
    fact: "Churrasco é praticamente uma religião.",
  },
  {
    q: "Qual é o rolê favorito dele?",
    options: ["Balada até de manhã", "Barzinho com os amigos", "Cinema sozinho", "Ficar em casa maratonando"],
    answer: 3,
    fact: "Cobertor, sofá e uma maratona — paz absoluta.",
  },
  {
    q: "Se o Marcos fosse um personagem de RPG, qual classe seria?",
    options: ["Mago", "Guerreiro", "Ladino", "Paladino"],
    answer: 3,
    fact: "Sempre protegendo a party e defendendo a galera.",
  },
  {
    q: "Qual a desculpa clássica quando ele se atrasa?",
    options: ["“Tô saindo já”", "“O trânsito travou”", "“Acordei agora”", "“Eu estava raspando a cabeça”"],
    answer: 3,
    fact: "A precisão dos horários é lendária (no mau sentido).",
  },
  {
    q: "Qual o desenho favorito do Marcos?",
    options: ["Ben 10", "Tom & Jerry", "Dragon Ball", "Naruto"],
    answer: 2,
    fact: "Kamehameha desde a infância — e o treino nunca parou.",
  },
  {
    q: "Qual dessas skills está no nível máximo?",
    options: ["Cozinhar miojo gourmet", "Rir alto demais", "Resolver treta do grupo", "Sumir e voltar do nada"],
    answer: 2,
    fact: "Mediador oficial desde o level 15.",
  },
  {
    q: "Num videogame, ele é do tipo que…",
    options: ["Rusha sem medo", "Explora cada canto do mapa", "Faz 100% das side quests", "Joga no modo fácil mesmo"],
    answer: 2,
    fact: "Completista assumido. 100% ou nada.",
  },
  {
    q: "O que ele mais quer ganhar de presente?",
    options: ["Dinheiro", "Uma viagem", "Game novo", "Sua presença na festa"],
    answer: 3,
    fact: "Presença vale mais que qualquer loot. 🎁",
    pinLast: true,
  },
];

/* ── Ranks do quiz (por % de acertos) ──────────────────────────────── */

export interface Rank {
  min: number; // fração de acertos (0–1)
  letter: "S" | "A" | "B" | "C" | "D";
  /** emoji do placar — aparece na tela de resultado */
  emoji: string;
  title: string;
  message: string;
}

export const RANKS: Rank[] = [
  { min: 1, letter: "S", emoji: "👑", title: "ALMA GÊMEA", message: "Você conhece o Marcos melhor que ele mesmo. Impressionante." },
  { min: 0.75, letter: "A", emoji: "🔥", title: "MELHOR AMIGO(A)", message: "Amizade de anos. Você claramente faz parte da party principal." },
  { min: 0.5, letter: "B", emoji: "🎯", title: "AMIGO(A) PRÓXIMO(A)", message: "Bom conhecimento! Falta pouco pra virar NPC importante." },
  { min: 0.25, letter: "C", emoji: "🎲", title: "CONHECIDO(A) VIP", message: "Dá pra melhorar — a festa é a chance perfeita de subir de rank." },
  { min: 0, letter: "D", emoji: "👾", title: "NPC ALEATÓRIO", message: "Quem é você mesmo? Brincadeira — venha pra festa e bora mudar isso!" },
];

export const rankFor = (correct: number, total: number): Rank => {
  const ratio = total === 0 ? 0 : correct / total;
  return RANKS.find((r) => ratio >= r.min) ?? RANKS[RANKS.length - 1];
};

/* ── Mensagens de WhatsApp (RSVP) ──────────────────────────────────
   O placar do quiz é anexado automaticamente no fim das duas. */

export const RSVP_MSG = {
  yes: `✅ BORA! Confirmando presença no LEVEL ${PARTY.age} do ${PARTY.name}! ⭐
▶ ${PARTY.venue} · ${PARTY.dateLabel}
Pode contar comigo, tô dentro!`,
  no: `❌ Poxa, não vou conseguir ir no LEVEL ${PARTY.age} do ${PARTY.name}...
Mas fica o abraço e os parabéns! Arrasa na festa ⭐`,
};

/* ── Chaves de armazenamento local ─────────────────────────────────── */

export const LS = {
  bestScore: "lv31_best_score",
  phone: "lv31_phone",
  muted: "lv31_muted",
};
