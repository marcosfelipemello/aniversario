# 🎮 LEVEL 31 — Convite de Aniversário Gamificado

Convite de aniversário que não é uma imagem no grupo do WhatsApp: é um
fliperama. O convidado insere uma ficha, encara um quiz cronometrado sobre o
aniversariante, recebe um rank de S a D e confirma presença — a resposta chega
no WhatsApp do anfitrião já com o placar anexado.

Feito em React 18, Vite 6, Tailwind 4 e Framer Motion, com um serviço Node sem
dependência nenhuma cuidando de uma regra só: **cada pessoa joga uma vez**.

---

## ✨ O que tem dentro

- **Quiz cronometrado** — 15 segundos por pergunta, combo que multiplica pontos,
  curiosidade revelada depois de cada resposta.
- **Ranks** — de 👑 S ("alma gêmea") a 👾 D ("NPC aleatório"), cada um com emoji,
  cor e recado próprios.
- **Sons de 8 bits** sintetizados na Web Audio API — moeda, acerto, erro,
  fanfarra. Nenhum arquivo de áudio no projeto.
- **Mapa embutido** — o endereço abre num modal sobre a própria tela, sem jogar
  o convidado pra fora do convite.
- **RSVP por WhatsApp** — "sim" e "não" montam mensagens diferentes, ambas com o
  placar do quiz, e abrem a conversa já preenchida.
- **Contagem regressiva** ao vivo até a hora da festa.
- **Prévia de link** pronta para WhatsApp e redes sociais (Open Graph, 1200×630).

---

## 🎯 Como o convite se comporta

```
START — o convidado digita o WhatsApp
  ↓            já jogou? → vai direto ao placar travado, o quiz não abre
QUIZ — 8 perguntas embaralhadas
  ↓            a pergunta do presente fecha a rodada sempre
RESULTADO — rank, acertos, pontos, recorde
  ↓
LOCAL — endereço, contagem regressiva, valor do rodízio
  ├─ ver no mapa            → modal com o mapa, sem sair do site
  └─ confirmar / negar      → modal sim/não → WhatsApp com o placar junto
       ↓
     recado fixo na tela — não dá pra responder duas vezes
```

Não existe "voltar ao menu". O caminho é de mão única de propósito: com um
botão de voltar, a pessoa refaz o quiz e o placar deixa de valer.

---

## 🔒 Uma ficha por pessoa

O placar só significa alguma coisa se ninguém puder repetir. Guardar isso no
`localStorage` não resolve — F5, aba anônima ou navegador limpo derrubam a
trava em segundos. Por isso ela vive no servidor.

O número de WhatsApp é a identidade. `(21) 99999-9999`, `21999999999` e
`+5521999999999` são a mesma pessoa.

| Rota | Acesso | O que faz |
|---|---|---|
| `POST /api/entrar` | público | diz se o número já gastou a ficha; se sim, devolve o placar |
| `POST /api/placar` | público | grava o resultado — **só a primeira vez conta** |
| `POST /api/rsvp` | público | grava "vou" / "não vou"; este pode mudar de ideia |
| `GET /api/lista` | protegido | quem jogou e quem confirmou |

`/api/lista` devolve telefone de convidado, que é dado pessoal. O serviço
**assume que o proxy à frente dele exige autenticação nessa rota** e não
implementa senha própria — quem publica escolhe o mecanismo.

Cliente e servidor validam o telefone com a mesma regra: DDD de 11 a 99 mais
nove dígitos começando em 9. A do navegador é conforto; a que vale é a do
servidor. O campo também não corta dígito sobrando em silêncio — truncar
deixaria alguém gastar a ficha com um número que não é o dele.

**Se a API cair, o jogo continua** funcionando sem a trava. Melhor um convidado
jogar duas vezes do que ninguém conseguir entrar na festa.

---

## ⚙️ Configuração

### O convite

Quase tudo vive em **`src/game/config.ts`**: nome, idade, data, local, endereço,
WhatsApp de destino, valor do rodízio, as perguntas, os ranks e os dois
templates de mensagem.

Duas regras que não são óbvias:

- **`pinLast: true`** prende uma pergunta no fim, mesmo com o embaralhamento.
  Serve para a pergunta cuja resposta certa emenda no convite.
- **Nada de emoji fora do BMP nos templates de WhatsApp.** 🎮 🎉 🏆 ocupam quatro
  bytes (par surrogate) e chegam como `�` no destino. Use os de dois bytes:
  ✅ ❌ ⭐ ⚡ ▶ ✨ ⚠. Na tela do site, qualquer emoji funciona.

### O site

| Variável | Para que serve |
|---|---|
| `VITE_SITE_URL` | endereço público, sem barra no fim — entra nas meta tags de prévia |

Copie `.env.example` para `.env` e ajuste.

### A tranca

| Variável | Padrão | Para que serve |
|---|---|---|
| `PORTA` | `3022` | porta local onde o serviço escuta (só `127.0.0.1`) |
| `ARQUIVO` | `./dados/jogadores.json` | onde os jogadores são gravados |
| `FICHAS_INFINITAS` | vazio | números que podem rejogar sempre, separados por vírgula |

`FICHAS_INFINITAS` existe para quem organiza testar o quiz sem queimar a ficha.
Vazio por padrão: ninguém ganha passe de graça sem alguém declarar.

A gravação é atômica — arquivo temporário e `rename` — para que uma queda no
meio da escrita não deixe o arquivo pela metade.

---

## 🚀 Rodando

```bash
npm install
cp .env.example .env

npm run dev            # http://localhost:5173
node server/api.mjs    # a tranca, noutro terminal

node server/test-api.mjs   # checa a trava e a validação do telefone
```

O `vite.config.ts` já encaminha `/api/*` para a tranca durante o
desenvolvimento.

---

## 🌐 Publicando

`npm run build` gera `dist/`, que qualquer servidor web entrega. Só a tranca
precisa de Node.

O que o servidor precisa fazer:

1. servir `dist/` com **fallback de SPA** — qualquer rota cai no `index.html`;
2. encaminhar `/api/*` para a tranca em `127.0.0.1:$PORTA`;
3. **exigir autenticação em `/api/lista`**, que expõe telefone de convidado;
4. manter `server/api.mjs` de pé como serviço, com as variáveis acima.

Serve nginx, Caddy, Apache, Traefik — o que já estiver na casa. A tranca escuta
apenas em `127.0.0.1`, então nunca fica exposta direto na internet.

---

## 📁 Organização

```
├── index.html              # fontes, favicon, meta tags de prévia
├── public/
│   ├── favicon.svg         # chapéu de aniversário
│   └── og.jpg              # 1200×630, a imagem da prévia
├── server/
│   ├── api.mjs             # a tranca — Node puro, zero dependências
│   └── test-api.mjs        # checagem executável da trava
└── src/
    ├── App.tsx             # máquina de estados das telas
    ├── game/
    │   ├── config.ts       # ⭐ os dados da festa e do quiz
    │   ├── api.ts          # cliente da tranca + validação do telefone
    │   ├── sound.ts        # sons de 8 bits (Web Audio, sem arquivos)
    │   └── confetti.ts
    ├── components/         # Screen, GameButton, Chip, Particles, Atmosphere…
    └── screens/            # Start, Quiz, Result, Location
```

---

## 🔧 Problemas comuns

| Sintoma | Causa |
|---|---|
| Emoji vira `�` no WhatsApp | emoji de quatro bytes no template — veja a nota acima |
| Prévia do link sem imagem | `VITE_SITE_URL` em branco, ou cache do WhatsApp: mande com `?1` no fim |
| Botão START não libera | o número não tem 11 dígitos ou não começa com 9 depois do DDD |
| Som mudo no celular | esperado — o áudio só libera após o primeiro toque, é política dos navegadores |
| Alguém travado sem ter jogado | digitou o número errado; apague a entrada dele do `jogadores.json` |

---

Feito com ☕ para um aniversário de verdade.
