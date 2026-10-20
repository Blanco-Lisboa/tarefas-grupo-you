// Item 190: compromissos do Google no Calendário, só leitura. Banco-falso desta pasta em 3299 + app em 3199, como Natham e
// como Matheus (que não vê a agenda pessoal do Natham). Uso: node provas/r28-calendario-agenda/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000;
const sessao = (uid) => {
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  return { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
};
const DO_NATHAM = ["Dentista", "Viagem do Natham", "REUNIAO - LUCAS E NATHAM"];
const DE_TODOS = ["Aniversário da Beec", "Gravação no estúdio", "Reunião - Caderno TOP", "Treino", "Ocupado"];
let falhou = false;
const confere = (ok, msg) => { if (!ok) falhou = true; console.log(ok ? "OK   " : "FALHA", msg); };
const marca = () => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });

async function abrir(quem, rota, formato) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao(`u-${quem}`)), domain: "127.0.0.1", path: "/" }]);
  if (formato) await ctx.addInitScript((f) => localStorage.setItem("grade:mapa-formato", f), formato);
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await p.goto(`${BASE}/${rota}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  return { p, erros, fechar: () => ctx.close() };
}
const compromissos = (p) => p.locator(".compromisso").evaluateAll((els) => els.map((e) => ({
  titulo: e.querySelector(".evento-titulo").textContent,
  marcas: [...e.querySelectorAll(".pessoa, .cal-equipe")].map((m) => m.getAttribute("aria-label") ?? m.textContent).sort(),
  reuniao: e.classList.contains("evento-reuniao"),
  animacao: getComputedStyle(e).animationName,
  topo: !!e.closest(".grade-topo"),
  arrasta: e.draggable,
})));

for (const quem of ["natham", "matheus"]) {
  const { p, erros, fechar } = await abrir(quem, "calendario");
  await p.evaluate(marca);
  await p.screenshot({ path: join(PASTA, `calendario-${quem}-1440.png`) });
  const lista = await compromissos(p);
  const titulos = lista.map((c) => c.titulo);
  const por = (t) => lista.find((c) => c.titulo === t);
  console.log(quem, JSON.stringify(lista));
  if (quem === "natham") {
    confere([...DE_TODOS, ...DO_NATHAM].every((t) => titulos.includes(t)), "Natham vê os 8 compromissos (contato@, Natham, Matheus)");
    confere(por("Reunião - Caderno TOP").marcas.join() === "Equipe,Natham", "evento em 2 agendas: 1 bloco com Equipe + foto do Natham");
  } else {
    confere(DE_TODOS.every((t) => titulos.includes(t)) && !DO_NATHAM.some((t) => titulos.includes(t)), "Matheus NÃO vê a agenda pessoal do Natham");
    confere(por("Reunião - Caderno TOP").marcas.join() === "Equipe", "evento em 2 agendas: Matheus vê só a marca Equipe");
  }
  const reunioes = lista.filter((c) => c.reuniao).map((c) => c.titulo).sort();
  confere(reunioes.join() === (quem === "natham" ? "REUNIAO - LUCAS E NATHAM,Reunião - Caderno TOP" : "Reunião - Caderno TOP") && lista.filter((c) => c.reuniao).every((c) => c.animacao === "menu-brilho"),
    "reuniões do Google no âmbar com brilho: " + reunioes.join(" | "));
  confere(por("Aniversário da Beec").topo && (quem === "matheus" || por("Viagem do Natham").topo) && !por("Treino").topo, "dia inteiro na faixa DIA INTEIRO, com hora na grade");
  confere(por("Ocupado").marcas.join() === "Matheus", "particular aparece como Ocupado, com a foto do Matheus");
  confere(lista.every((c) => !c.arrasta), "compromisso não arrasta");
  // Filtro Agendas
  await p.getByRole("button", { name: /^Agendas/ }).click();
  const opcoes = await p.locator('.selecao-lista[aria-label="Agendas"] .selecao-opcao:not(.selecao-todos) .selecao-opcao-rotulo').allInnerTexts();
  confere(opcoes.join() === (quem === "natham" ? "Natham,Matheus,Adrian,Lucas,Equipe" : "Matheus,Adrian,Lucas,Equipe"), "filtro Agendas: " + opcoes.join(", "));
  await p.locator('.selecao-lista[aria-label="Agendas"] .selecao-opcao', { hasText: "Matheus" }).click();
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  const filtrado = (await compromissos(p)).map((c) => c.titulo).sort();
  confere(filtrado.join() === "Ocupado,Treino", "Agendas = Matheus: só os compromissos dele (" + filtrado.join(", ") + "), tarefas continuam: " + (await p.locator(".evento:not(.compromisso)").count()));
  if (quem === "natham") await p.screenshot({ path: join(PASTA, "calendario-natham-filtro-matheus-1440.png") });
  await p.getByRole("button", { name: /^Limpar/ }).click();
  await p.waitForTimeout(300);
  // Clique: cartão simples, sem abrir a ficha
  await p.locator(".compromisso", { hasText: "Reunião - Caderno TOP" }).click();
  await p.waitForTimeout(400);
  const cartao = await p.locator(".cal-compromisso-pop:popover-open").innerText().catch(() => "");
  const ficha = await p.locator("dialog[open], .ficha").count();
  confere(cartao.includes("Reunião - Caderno TOP") && cartao.includes("14:00 às 15:00") && cartao.includes("Google Meet") && ficha === 0, "clique abre o cartão (título, horário, local, agenda) e não a ficha: " + JSON.stringify(cartao));
  await p.evaluate(marca);
  await p.screenshot({ path: join(PASTA, `cartao-${quem}-1440.png`) });
  await p.keyboard.press("Escape");
  if (quem === "natham") {
    await p.getByRole("button", { name: /^Visão/ }).click();
    await p.locator(".selecao-opcao", { hasText: "Mês" }).click();
    await p.waitForTimeout(600);
    await p.evaluate(marca);
    await p.screenshot({ path: join(PASTA, "calendario-natham-mes-1440.png") });
    confere((await p.locator(".mes .compromisso").count()) >= 8, "visão Mês mostra os compromissos junto das tarefas");
  }
  confere(!erros.length, `${quem}: sem erros no console: ` + (erros.join("|") || "nenhum"));
  await fechar();
}

// Esteira (Conteúdos), Mapa e Fila: nenhum compromisso do Google
for (const [rota, formato, nome] of [["conteudos", null, "Esteira"], ["mapa", "linha", "Mapa"], ["mapa", "fila", "Fila"]]) {
  const { p, fechar } = await abrir("natham", rota, formato);
  const texto = await p.locator("main").innerText();
  confere(![...DE_TODOS, ...DO_NATHAM].some((t) => texto.includes(t)) && texto.length > 200, `${nome}: nenhum compromisso do Google`);
  await fechar();
}
await nav.close();
process.exit(falhou ? 1 : 0);
