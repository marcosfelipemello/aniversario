/* Conversa com a tranca (server/api.mjs, publicada pelo proxy reverso em /api/*).
   Se a API estiver fora do ar o jogo continua funcionando — só perde a trava. */

import type { QuizResult } from "./types";

export interface Entrada {
  jaJogou: boolean;
  resultado: Omit<QuizResult, "best"> | null;
  rsvp: "sim" | "nao" | null;
}

async function post<T>(rota: string, corpo: unknown): Promise<T | null> {
  try {
    const r = await fetch(`/api/${rota}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corpo),
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/* Celular brasileiro é sempre DDD (2) + 9 dígitos começando em 9 — desde 2016
   não existe WhatsApp fora desse formato. Trancar no tamanho exato evita o
   convidado gastar a ficha com um número torto e ficar sem poder jogar. */
export const DIGITOS_ESPERADOS = 11;

/** Só os dígitos do número, sem o DDI. NÃO corta o excesso de propósito: cortar
    em silêncio deixaria um número errado passar como se estivesse certo. */
export const soDigitos = (bruto: string) =>
  bruto.replace(/\D/g, "").replace(/^55(?=\d{11}$)/, "").slice(0, 15);

/** Devolve o porquê de o número não servir, ou "" se estiver certo. */
export function conferirTelefone(bruto: string): string {
  const d = soDigitos(bruto);
  if (d.length < DIGITOS_ESPERADOS) {
    const faltam = DIGITOS_ESPERADOS - d.length;
    return `Faltam ${faltam} dígito${faltam > 1 ? "s" : ""} — são 11 no total, com o DDD.`;
  }
  if (d.length > DIGITOS_ESPERADOS) {
    const sobram = d.length - DIGITOS_ESPERADOS;
    return `${sobram} dígito${sobram > 1 ? "s" : ""} a mais — são 11 no total, com o DDD.`;
  }
  if (Number(d.slice(0, 2)) < 11) return "DDD inválido — os DDDs vão de 11 a 99.";
  if (d[2] !== "9") return "Celular brasileiro começa com 9 depois do DDD.";
  return "";
}

/** 55 + DDD + número. null = não passou na conferência. */
export function normalizarTelefone(bruto: string): string | null {
  return conferirTelefone(bruto) ? null : `55${soDigitos(bruto)}`;
}

export const entrar = (telefone: string) => post<Entrada>("entrar", { telefone });

export const salvarPlacar = (telefone: string, r: Omit<QuizResult, "best">) =>
  post("placar", { telefone, ...r });

export const salvarRsvp = (telefone: string, vai: boolean) => post("rsvp", { telefone, vai });
