// Item 223 (Sextante): logado como Matheus, "Quem aprova" escolhe Natham, Matheus, Adrian ou Ninguém e o valor volta depois de recarregar.
// Confere também que Consertar/Aprovar têm meia largura cada com Tags e Quem aprova preenchidos (o caso do print do Natham).
// Banco falso do 196 com APROVACAO=1 (tag "Esperando aprovação" no card Em análise; regra do 021 sobre quem troca o aprovador) em 3497;
// app em 3297 apontando para ele: NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3497 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=falsa next dev --webpack -p 3297
// Uso: node provas/r223-quem-aprova/matheus.mjs
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const banco = spawn(process.execPath, [fileURLToPath(new URL("../r196-postagem/banco-falso.mjs", import.meta.url))], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PREVIA: "1", PORTA: "3497", APROVACAO: "1" } });
await new Promise((ok) => banco.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(); }));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const uid = "u-matheus";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp: 1893456000, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: 1893456000, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "matheus@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 } });
await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
const pg = await contexto.newPage();
const respostas = [];
pg.on("response", (r) => { if (r.url().includes("/rpc/salvar_tarefa")) respostas.push(r.status()); });
await pg.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const marca = () => pg.evaluate(() => {
  document.querySelector("#marca-largura")?.remove();
  const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth} · logado como Matheus` });
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
async function abrir() {
  await pg.goto("http://127.0.0.1:3297/conteudos", { waitUntil: "networkidle" });
  await pg.locator(".conteudos-cartao").first().waitFor();
  await pg.locator(".conteudos-cartao").filter({ hasText: "Reels: bastidores do escritório" }).locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  await pg.waitForTimeout(400);
  return ficha;
}
const campo = (ficha) => ficha.locator(".ficha-tags .ficha-escolha").filter({ hasText: "Quem aprova" });

let ficha = await abrir();
confere(await campo(ficha).evaluate((c) => !c.inert && !c.closest("[inert]")), "223: Quem aprova liberado para o Matheus em card do Natham");

// Pedido 3: Consertar/Aprovar com Tags e Quem aprova preenchidos (como no print). Matheus só os vê se for o aprovador; isso vem depois.
for (const [escolha, rotulo] of [["Matheus", "Matheus"], ["Adrian", "Adrian"], ["Ninguém", null], ["Natham", "Natham"], ["Matheus", "Matheus"]]) {
  await campo(ficha).locator(".selecao-botao").click();
  await pg.locator(".selecao-lista:visible").locator(".selecao-opcao").filter({ has: pg.getByText(escolha, { exact: true }) }).click();
  await pg.waitForTimeout(200);
  const antes = respostas.length;
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(800);
  confere(respostas.length > antes && respostas.at(-1) < 300, `223: ${escolha} gravado (resposta ${respostas.at(-1)})`);
  ficha = await abrir(); // recarrega a página inteira e reabre
  const texto = (await campo(ficha).locator(".selecao-botao").innerText()).replace(/\s+/g, " ").trim();
  confere(rotulo ? texto.endsWith(rotulo) : !/Natham|Matheus|Adrian/.test(texto), `223: depois de recarregar, Quem aprova = ${escolha} ("${texto}")`);
}

// Matheus agora é o aprovador: aparecem Consertar/Aprovar no fim da ficha, com Tags e Quem aprova preenchidos
await pg.locator(".ficha-corpo").evaluate((c) => { c.scrollTop = c.scrollHeight; });
await pg.waitForTimeout(300);
const m = await ficha.evaluate((f) => {
  const r = (s) => f.querySelector(s)?.getBoundingClientRect();
  return { consertar: r("[data-acao=consertar]"), aprovar: r("[data-acao=aprovar]"), notas: r("#ficha-notas, .ficha-notas-ver"), estilo: f.querySelector(".ficha-decidir") && getComputedStyle(f.querySelector(".ficha-decidir")).display };
});
console.log("   botões:", JSON.stringify({ display: m.estilo, consertar: m.consertar && [m.consertar.left, m.consertar.width], aprovar: m.aprovar && [m.aprovar.right, m.aprovar.width], notas: m.notas && [m.notas.left, m.notas.right] }));
confere(m.consertar && m.aprovar && Math.abs(m.consertar.width - m.aprovar.width) < 1 && Math.round(m.consertar.left) === Math.round(m.notas.left) && Math.round(m.aprovar.right) === Math.round(m.notas.right),
  "223: com Tags e Quem aprova preenchidos, Consertar e Aprovar com meia largura cada, nas bordas dos campos");
await campo(ficha).scrollIntoViewIfNeeded();
await marca();
await pg.screenshot({ path: join(pasta, "223-matheus-quem-aprova-1440.png") });
await contexto.close();
await navegador.close();
banco.kill();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
