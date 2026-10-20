// Prova do item 159 (ficha só com Começa, sem Termina), com o banco de mentira de provas/r7-caderno-cartao/banco-falso.mjs
// e o app em 3199 (ver docs/levas/BRIEF-2026-10-20-alvenaria-157-158.md, "Como fotografar tela logada").
// O "Post - Reels" ganha aqui um fim (08:30 às 10:00) para provar que, ao mudar o Começa, o fim anda junto.
// Uso: node provas/r9-so-comeca/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const cookie = (uid) => {
  const exp = 1893456000;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  return { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
};
const erros = [];
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const foto = async (p, nome) => {
  await p.evaluate(() => { document.getElementById("prova-iw")?.remove(); const d = document.createElement("div"); d.id = "prova-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px;pointer-events:none"; document.body.append(d); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: join(PASTA, `${nome}.png`) });
};
// Linha da data: rótulos visíveis e se o bloco "Quando" sobra vazio ao lado de Responsável.
const quando = (p) => p.evaluate(() => {
  const q = document.querySelector(".ficha-quem-quando > :last-child").getBoundingClientRect();
  const botao = document.querySelector(".ficha-quando .campo-data-botao").getBoundingClientRect();
  return { rotulos: [...document.querySelectorAll(".ficha-mini")].map((m) => m.firstChild.textContent.trim()), termina: !!document.querySelector('[aria-label^="Termina"]'), larguraQuando: Math.round(q.width), larguraBotao: Math.round(botao.width) };
});

async function abrir(w, h) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([cookie("u-natham")]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  p.on("pageerror", (e) => erros.push(`[${w}] ${e.message}`));
  const salvos = [];
  await p.route("**/rest/v1/tarefas**", async (r) => {
    if (r.request().method() !== "GET") { salvos.push({ metodo: r.request().method(), corpo: r.request().postDataJSON() }); return r.continue(); }
    const res = await r.fetch();
    const lista = (await res.json()).map((t) => (t.titulo === "Post - Reels" ? { ...t, fim: "2026-10-20T10:00" } : t));
    return r.fulfill({ response: res, json: lista });
  });
  return { ctx, p, salvos };
}

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  // Tarefa existente (com fim) aberta pelos Conteúdos
  let { ctx, p, salvos } = await abrir(w, h);
  await p.goto(BASE + "/conteudos", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.locator(".conteudos-titulo", { hasText: "Post - Reels" }).first().click();
  await p.locator("dialog.ficha[open]").waitFor();
  console.log(w, "existente:", JSON.stringify(await quando(p)));
  await foto(p, `ficha-existente-${w}`);
  if (w === 1903) {
    // Muda o Começa para 22/10 (mesma hora) e salva: o fim tem que ir para 22/10 10:00.
    await p.locator(".ficha-quando .campo-data-botao").click();
    await p.locator(".campo-data-pop:popover-open .campo-data-dia", { hasText: /^22$/ }).first().click();
    const sel = p.locator(".campo-data-pop:popover-open .btn", { hasText: "Selecionar" });
    if (await sel.count()) await sel.click();
    await p.locator(".ficha-pe .btn", { hasText: "Salvar" }).click();
    await p.waitForTimeout(800);
    console.log("salvo ao mudar o Começa:", JSON.stringify(salvos.map((s) => [s.metodo, ...[s.corpo].flat().map((c) => ({ titulo: c.titulo, inicio: c.inicio, fim: c.fim }))])));
  }
  await ctx.close();

  // Tarefa nova pelo botão "+ Nova tarefa" do calendário
  ({ ctx, p, salvos } = await abrir(w, h));
  await p.goto(BASE + "/calendario", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.locator(".cal-nova").click();
  await p.locator("dialog.ficha[open]").waitFor();
  console.log(w, "nova:", JSON.stringify(await quando(p)));
  await foto(p, `ficha-nova-${w}`);
  await ctx.close();
}

// Tarefa nova pelo vazio das 9h no calendário (o calendário manda fim 10:00): tem que salvar sem fim.
const { ctx, p, salvos } = await abrir(1903, 900);
await p.goto(BASE + "/calendario", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.getByRole("button", { name: /^Nova tarefa: .*09:00$/ }).first().evaluate((b) => b.click());
await p.locator("dialog.ficha[open]").waitFor();
await p.locator(".ficha-titulo").fill("Teste nova às 9h");
console.log("nova às 9h:", JSON.stringify(await quando(p)));
await foto(p, "ficha-nova-9h-1903");
await p.locator(".ficha-pe .btn", { hasText: "Salvar" }).click();
await p.waitForTimeout(800);
console.log("salvo da nova às 9h:", JSON.stringify(salvos.map((s) => [s.metodo, ...[s.corpo].flat().map((c) => ({ titulo: c.titulo, inicio: c.inicio, fim: c.fim }))])));
await ctx.close();

await nav.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros de página");
