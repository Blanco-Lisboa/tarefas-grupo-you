// Prova do item 190: página da direita do Caderno com os compromissos do Google (só leitura), reunião em âmbar nas duas folhas.
// Banco-falso DESTA pasta em 3299 + app em 3199. Casos: Natham, Natham olhando o caderno do Matheus, Matheus. Só PC (1440 e 1903).
// Uso: node provas/r28-agenda-caderno/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000;
const jwt = (uid) => [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = (uid) => ({ access_token: jwt(uid), refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } });
const CASOS = [
  { nome: "natham", uid: "u-natham", ver: null,
    deve: ["Dentista", "Clínica Sorriso", "Reunião de pauta - Caderno", "Ocupado", "Almoço com o contador", "Aniversário da Beec", "dia inteiro", "08:00 às 09:00"],
    nao: ["Gravação dos stories", "Folga do Matheus", "Agenda da equipe Beec", "Amanhã: consulta"], reunioesAgenda: 1, reunioesFolha: 1 },
  { nome: "natham-ve-matheus", uid: "u-natham", ver: "Matheus",
    deve: ["Gravação dos stories", "reunião de alinhamento com a equipe", "Entrega do roteiro", "Folga do Matheus"],
    nao: ["Dentista", "Ocupado", "Almoço com o contador", "Aniversário da Beec", "Reunião de pauta - Caderno"], reunioesAgenda: 1, reunioesFolha: 1 },
  { nome: "matheus", uid: "u-matheus", ver: null,
    deve: ["Gravação dos stories", "reunião de alinhamento com a equipe", "Entrega do roteiro", "Folga do Matheus"],
    nao: ["Dentista", "Clínica Sorriso", "Ocupado", "Almoço com o contador", "Aniversário da Beec", "Reunião de pauta - Caderno", "Amanhã: consulta"], reunioesAgenda: 1, reunioesFolha: 1 },
];
let falhou = false;
const marca = () => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1903, 900], [1440, 760]]) {
  for (const c of CASOS) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao(c.uid)), domain: "127.0.0.1", path: "/" }]);
    const p = await ctx.newPage();
    const erros = [];
    p.on("pageerror", (e) => erros.push(e.message));
    p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
    await p.goto(`${BASE}/tarefas`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    if (c.ver) {
      await p.getByRole("button", { name: /Caderno de/ }).first().click();
      await p.locator(".selecao-opcao", { hasText: c.ver }).first().click();
      await p.waitForTimeout(800);
    }
    const agenda = await p.locator(".agenda").innerText();
    const pagina = await p.locator("main").innerText();
    const faltou = c.deve.filter((x) => !agenda.includes(x));
    const vazou = c.nao.filter((x) => pagina.includes(x));
    const rAg = await p.locator(".ag-evento[data-reuniao]").evaluateAll((els) => els.map((e) => ({ t: e.textContent, anim: getComputedStyle(e).animationName, fundo: getComputedStyle(e).backgroundColor })));
    const rFo = await p.locator(".linha-miolo[data-reuniao]").evaluateAll((els) => els.map((e) => ({ t: e.textContent, anim: getComputedStyle(e).animationName, fundo: getComputedStyle(e).backgroundColor })));
    const ordem = await p.locator(".ag-evento-hora").allInnerTexts();
    const editavel = await p.locator(".ag-eventos input, .ag-eventos textarea, .ag-eventos button").count();
    const ok = !faltou.length && !vazou.length && rAg.length === c.reunioesAgenda && rFo.length === c.reunioesFolha
      && [...rAg, ...rFo].every((r) => r.anim === "menu-brilho") && new Set([...rAg, ...rFo].map((r) => r.fundo)).size === 1 && editavel === 0 && !erros.length;
    if (!ok) falhou = true;
    console.log(ok ? "OK   " : "FALHA", w, c.nome.padEnd(18), "| faltou:", JSON.stringify(faltou), "| vazou:", JSON.stringify(vazou), "| âmbar agenda:", rAg.length, "folha:", rFo.length, "| horas:", JSON.stringify(ordem), "| editáveis:", editavel, "| erros:", erros.length ? erros : "nenhum");
    await p.evaluate(marca);
    await p.screenshot({ path: join(PASTA, `caderno-${c.nome}-${w}.png`) });
    await ctx.close();
  }
}
await nav.close();
process.exit(falhou ? 1 : 0);
