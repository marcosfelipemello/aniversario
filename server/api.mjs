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
    return responder(res, 200, { rsvp });
  }

  return responder(res, 404, { erro: "rota nao existe" });
});

servidor.listen(PORTA, "127.0.0.1", () =>
  console.log(`tranca do convite ouvindo em 127.0.0.1:${PORTA} — dados em ${ARQUIVO}`)
);
