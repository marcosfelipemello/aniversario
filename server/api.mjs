// Tranca do convite LEVEL 31 (09/09/2026).
//
// POR QUE ISTO EXISTE: o quiz vale como placar de verdade. Sem um guardiao do
// lado do servidor, qualquer pessoa aperta F5, limpa o navegador e joga de novo
// ate tirar rank S. Aqui o numero de WhatsApp e a identidade: jogou uma vez,
// o placar fica gravado e o jogo nao recomeca.
//
// Sem dependencia nenhuma de proposito — so o http do Node, num arquivo JSON.
// A VPS ja sofre com OOM, este processo fica na casa dos poucos MB.
//
// Rotas (o proxy reverso publica em /api/*):
//   POST /api/entrar  -> publico. {telefone} -> diz se a pessoa ja jogou e,
//                        se sim, devolve o placar e o RSVP que ela deixou.
//   POST /api/placar  -> publico. Grava o resultado do quiz. So a PRIMEIRA vez
//                        conta: repeticao e ignorada (e a tranca).
//   POST /api/rsvp    -> publico. Grava "vou"/"nao vou". Este pode ser trocado
//                        de ideia, entao sobrescreve.
//   GET  /api/lista   -> PROTEGIDO por basic auth NO PROXY. Telefone de convidado
//                        e dado pessoal, nao sai em rota publica.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORTA = Number(process.env.PORTA ?? 3022);
const ARQUIVO = process.env.ARQUIVO ?? "./dados/jogadores.json";
const LIMITE_CORPO = 8 * 1024;

// Fichas infinitas (09/09/2026): o aniversariante precisa poder rejogar quantas
// vezes quiser pra conferir o quiz. Todo o resto do mundo tem UMA ficha.
// Quem entra na lista vem da variavel de ambiente FICHAS_INFINITAS (numeros
// separados por virgula). Vazio por padrao: ninguem ganha passe de graca.
const FICHAS_INFINITAS = new Set(
  (process.env.FICHAS_INFINITAS ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
);

fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });

function ler() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO, "utf8"));
  } catch {
    return {};
  }
}

// Grava via arquivo temporario + rename: se a VPS cair no meio da escrita,
// o jogadores.json nao fica pela metade.
function gravar(dados) {
  const tmp = `${ARQUIVO}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2));
  fs.renameSync(tmp, ARQUIVO);
}

/** Celular BR: DDD 11-99 + 9 dígitos começando em 9. Mesma regra do cliente —
    a conferência do navegador é conforto, esta aqui é a que vale. */
function normalizar(bruto) {
  const d = String(bruto ?? "")
    .replace(/\D/g, "")
    .replace(/^55(?=\d{11}$)/, "");
  if (d.length !== 11) return null;
  if (Number(d.slice(0, 2)) < 11) return null;
  if (d[2] !== "9") return null;
  return `55${d}`;
}

function responder(res, status, corpo) {
  const txt = JSON.stringify(corpo);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(txt);
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let bruto = "";
    req.on("data", (p) => {
      bruto += p;
      if (bruto.length > LIMITE_CORPO) {
        reject(new Error("corpo grande demais"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(bruto ? JSON.parse(bruto) : {});
      } catch {
        reject(new Error("json invalido"));
      }
    });
    req.on("error", reject);
  });
}

const inteiro = (v, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.trunc(n))) : 0;
};

/* ── Aviso no Telegram ─────────────────────────────────────────────────
   Quem organiza precisa saber da confirmacao na hora, nao no fim da noite
   olhando /api/lista. Token e chat vem do ambiente: se faltar qualquer um
   dos dois, a funcao vira no-op e o convite segue funcionando igual —
   aviso e conforto, nao pode derrubar RSVP de ninguem. */
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_CHAT = process.env.TELEGRAM_CHAT_ID ?? "";

const RANKS = [
  [1, "S"], [0.75, "A"], [0.5, "B"], [0.25, "C"], [0, "D"],
];
const letraDoRank = (c, t) => (RANKS.find(([min]) => (t ? c / t : 0) >= min) ?? [0, "D"])[1];

const bonito = (tel) => {
  const n = tel.slice(2);
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};

async function avisarTelegram(texto) {
  if (!TG_TOKEN || !TG_CHAT) return;
  for (const tentativa of [1, 2]) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: TG_CHAT, text: texto, parse_mode: "HTML" }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) return;
    } catch {
      /* rede caiu; tenta de novo */
    }
    if (tentativa === 1) await new Promise((r) => setTimeout(r, 3000));
  }
  console.error("falha ao avisar no Telegram:", texto.slice(0, 60));
}

/** Monta o recado de um RSVP, com o placar do quiz e o total ate agora. */
function recadoDeRsvp(telefone, registro, todos) {
  const vai = registro.rsvp === "sim";
  const r = registro.resultado;
  const placar = r
    ? `🎯 Quiz: <b>${r.score}</b> pts · ${r.correct}/${r.total} acertos · Rank ${letraDoRank(r.correct, r.total)}`
    : "🎯 Quiz: não terminou";
  const lista = Object.values(todos);
  const sim = lista.filter((j) => j.rsvp === "sim").length;
  const nao = lista.filter((j) => j.rsvp === "nao").length;
  return [
    vai ? "🎉 <b>CONFIRMOU PRESENÇA</b>" : "😔 <b>NÃO VAI PODER IR</b>",
    "",
    `📱 <code>${bonito(telefone)}</code>`,
    placar,
    "",
    `📊 Até agora: <b>${sim}</b> confirmado(s) · ${nao} recusa(s)`,
  ].join("\n");
}

const servidor = http.createServer(async (req, res) => {
  const rota = (req.url ?? "").split("?")[0].replace(/\/+$/, "") || "/";

  if (req.method === "GET" && rota === "/api/lista") {
    const dados = ler();
    const jogadores = Object.entries(dados).map(([telefone, j]) => ({ telefone, ...j }));
    jogadores.sort((a, b) => (b.jogouEm ?? "").localeCompare(a.jogouEm ?? ""));
    return responder(res, 200, {
      total: jogadores.length,
      vao: jogadores.filter((j) => j.rsvp === "sim").length,
      naoVao: jogadores.filter((j) => j.rsvp === "nao").length,
      jogadores,
    });
  }

  if (req.method !== "POST") return responder(res, 404, { erro: "rota nao existe" });

  let corpo;
  try {
    corpo = await lerCorpo(req);
  } catch (e) {
    return responder(res, 400, { erro: e.message });
  }

  const telefone = normalizar(corpo.telefone);
  if (!telefone) return responder(res, 400, { erro: "telefone invalido" });

  const dados = ler();
  const atual = dados[telefone];
  const infinita = FICHAS_INFINITAS.has(telefone);

  if (rota === "/api/entrar") {
    // Ficha infinita entra sempre como se fosse a primeira vez: quiz do zero,
    // sem o placar velho e sem o RSVP velho travando a tela.
    if (infinita) {
      dados[telefone] = { ...atual, infinita: true, entrouEm: new Date().toISOString() };
      gravar(dados);
      return responder(res, 200, { jaJogou: false, resultado: null, rsvp: null });
    }
    if (atual?.resultado) {
      return responder(res, 200, {
        jaJogou: true,
        resultado: atual.resultado,
        rsvp: atual.rsvp ?? null,
      });
    }
    dados[telefone] = { ...atual, entrouEm: atual?.entrouEm ?? new Date().toISOString() };
    gravar(dados);
    return responder(res, 200, { jaJogou: false, resultado: null, rsvp: null });
  }

  if (rota === "/api/placar") {
    // A tranca: o primeiro placar e o unico que vale (menos pra ficha infinita,
    // que sobrescreve — senao o dono nunca veria o resultado da rodada nova).
    if (atual?.resultado && !infinita) {
      return responder(res, 200, { gravado: false, resultado: atual.resultado });
    }
    const resultado = {
      score: inteiro(corpo.score, 999999),
      correct: inteiro(corpo.correct, 999),
      total: inteiro(corpo.total, 999),
    };
    dados[telefone] = {
      ...atual,
      resultado,
      jogouEm: new Date().toISOString(),
      ...(infinita ? { infinita: true, partidas: (atual?.partidas ?? 0) + 1 } : {}),
    };
    gravar(dados);
    return responder(res, 200, { gravado: true, resultado });
  }

  if (rota === "/api/rsvp") {
    const rsvp = corpo.vai === true ? "sim" : corpo.vai === false ? "nao" : null;
    if (!rsvp) return responder(res, 400, { erro: "campo vai precisa ser true ou false" });
    dados[telefone] = { ...atual, rsvp, rsvpEm: new Date().toISOString() };
    gravar(dados);
    // Ficha infinita e o proprio anfitriao testando — nao vale avisar.
    if (!infinita) void avisarTelegram(recadoDeRsvp(telefone, dados[telefone], dados));
    return responder(res, 200, { rsvp });
  }

  return responder(res, 404, { erro: "rota nao existe" });
});

servidor.listen(PORTA, "127.0.0.1", () =>
  console.log(`tranca do convite ouvindo em 127.0.0.1:${PORTA} — dados em ${ARQUIVO}`)
);
