// Checagem da tranca. Roda sozinho: node server/test-api.mjs
// O que precisa valer: o placar so entra uma vez por telefone, e o mesmo numero
// digitado de jeitos diferentes tem que cair no MESMO jogador.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const arquivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lv31-")), "jogadores.json");
const porta = 3999;
const proc = spawn(process.execPath, [new URL("./api.mjs", import.meta.url).pathname], {
  env: {
    ...process.env,
    PORTA: String(porta),
    ARQUIVO: arquivo,
    FICHAS_INFINITAS: "5521983591892",
  },
  stdio: "ignore",
});

const post = async (rota, corpo) => {
  const r = await fetch(`http://127.0.0.1:${porta}${rota}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  return { status: r.status, body: await r.json() };
};

try {
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${porta}/api/lista`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // TRAVA DO TAMANHO: so passa DDD (11-99) + 9 digitos comecando em 9
  for (const torto of [
    "123",                 // curto demais
    "2198359189",          // 10 digitos (fixo antigo)
    "219835918922",        // 12 digitos
    "0998359189",          // DDD invalido
    "2183591892x",         // sem o 9 do celular
    "",
  ]) {
    assert.equal(
      (await post("/api/entrar", { telefone: torto })).status,
      400,
      `deveria recusar "${torto}"`
    );
  }

  // primeira entrada: nunca jogou
  assert.deepEqual((await post("/api/entrar", { telefone: "21988887777" })).body.jaJogou, false);

  // grava o placar
  const p1 = await post("/api/placar", { telefone: "21988887777", score: 900, correct: 7, total: 8 });
  assert.equal(p1.body.gravado, true);

  // A TRANCA: segundo placar do mesmo numero e ignorado, e o placar antigo volta
  const p2 = await post("/api/placar", { telefone: "21988887777", score: 9999, correct: 8, total: 8 });
  assert.equal(p2.body.gravado, false);
  assert.equal(p2.body.resultado.score, 900);

  // e o mesmo numero escrito de outro jeito cai no mesmo jogador
  for (const jeito of ["(21) 98888-7777", "5521988887777", "+55 21 98888 7777"]) {
    const r = await post("/api/entrar", { telefone: jeito });
    assert.equal(r.body.jaJogou, true, `deveria reconhecer "${jeito}"`);
    assert.equal(r.body.resultado.score, 900);
  }

  // rsvp entra e pode mudar de ideia
  assert.equal((await post("/api/rsvp", { telefone: "21988887777", vai: true })).body.rsvp, "sim");
  assert.equal((await post("/api/rsvp", { telefone: "21988887777", vai: false })).body.rsvp, "nao");
  assert.equal((await post("/api/entrar", { telefone: "21988887777" })).body.rsvp, "nao");

  // FICHA INFINITA (a lista vem da env acima): o dono rejoga sempre, e o placar novo sobrescreve o velho
  const dono = "21983591892";
  assert.equal((await post("/api/entrar", { telefone: dono })).body.jaJogou, false);
  assert.equal((await post("/api/placar", { telefone: dono, score: 100, correct: 1, total: 8 })).body.gravado, true);
  const r2 = await post("/api/placar", { telefone: dono, score: 800, correct: 7, total: 8 });
  assert.equal(r2.body.gravado, true, "ficha infinita tem que poder regravar");
  assert.equal(r2.body.resultado.score, 800);
  const volta = await post("/api/entrar", { telefone: dono });
  assert.equal(volta.body.jaJogou, false, "ficha infinita nunca pode dar jaJogou");
  assert.equal(volta.body.resultado, null, "e a tela tem que abrir limpa");

  const lista = await (await fetch(`http://127.0.0.1:${porta}/api/lista`)).json();
  assert.equal(lista.total, 2);
  assert.equal(lista.naoVao, 1);

  console.log("OK — convidado tem 1 ficha, dono tem infinitas, numero normaliza igual");
} finally {
  proc.kill();
}
