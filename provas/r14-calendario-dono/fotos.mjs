// Fotos do item 177 no Calendário e na Ficha, com o banco-falso.mjs imitando o 006 (o Natham recebe também as privadas do Matheus).
// 1) Calendário do Natham (semana de 20/10): sem "Gravar stories da semana" (privada do Matheus) nem "Mandar a logo" (do caderno do Matheus).
// 2) + Nova tarefa com responsável Matheus: o pedido ao banco vai com dono = Matheus e enviada_por = Natham (enviarPara), e a tarefa sai do
//    calendário do Natham. 3) Tarefa privada já existente, troca o responsável: aparece o aviso de que continua no caderno do Natham (não salva).
// Uso: node provas/r14-calendario-dono/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000;
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const cookie = { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
const erros = [];
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const foto = async (p, nome) => {
  await p.evaluate(() => { document.getElementById("prova-iw")?.remove(); const d = document.createElement("div"); d.id = "prova-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px;pointer-events:none"; document.body.append(d); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: join(PASTA, `${nome}.png`) });
};
const tem = (p, texto) => p.locator(".cal").getByText(texto, { exact: false }).count();
const PRIVADAS_DO_MATHEUS = ["Gravar stories da semana", "Mandar a logo da Beec"];
const MEUS = ["Ligar para o contador", "Conferir o roteiro do Reels"];

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([cookie]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  p.on("pageerror", (e) => erros.push(`[${w}] ${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && erros.push(`[${w}] console: ${m.text()}`));
  const pedidos = [];
  p.on("request", (r) => r.url().includes("/rest/v1/rpc/salvar_tarefa") && pedidos.push(r.postDataJSON()));
  await p.goto(BASE + "/calendario", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  for (const x of PRIVADAS_DO_MATHEUS) console.log(w, `privada do Matheus "${x}":`, await tem(p, x), "na tela (esperado 0)");
  for (const x of MEUS) console.log(w, `minha "${x}":`, await tem(p, x), "na tela (esperado ≥1)");
  await foto(p, `calendario-natham-${w}`);

  // Nova tarefa para o Matheus
  await p.getByRole("button", { name: "+ Nova tarefa" }).click();
  await p.locator("dialog.ficha[open]").waitFor();
  await p.getByLabel("Título").fill("Prova 177: tarefa para o Matheus");
  await p.locator(".ficha-pessoa", { hasText: "Matheus" }).click();
  await p.getByRole("button", { name: "Salvar" }).click();
  await p.locator("dialog.ficha").waitFor({ state: "detached" });
  await p.waitForTimeout(300);
  const ultimo = pedidos.at(-1)?.p;
  console.log(w, "pedido ao banco:", ultimo ? `dono_id=${ultimo.dono_id} enviada_por=${ultimo.enviada_por} responsavel_id=${ultimo.responsavel_id}` : "nenhum");
  console.log(w, "a nova sai do meu calendário:", (await tem(p, "Prova 177")) === 0);

  // Tarefa minha já existente: trocar o responsável mostra o aviso (Cancelar, nada salvo)
  await p.locator(".cal").getByText("Ligar para o contador").first().click();
  await p.locator("dialog.ficha[open]").waitFor();
  await p.locator(".ficha-pessoa", { hasText: "Matheus" }).click();
  await p.locator(".ficha-dica-fica").scrollIntoViewIfNeeded();
  console.log(w, "aviso:", await p.locator(".ficha-dica-fica").innerText());
  await foto(p, `ficha-troca-responsavel-${w}`);
  await p.locator(".ficha-pessoa", { hasText: "Natham" }).click();
  console.log(w, "voltou para Natham, aviso some:", (await p.locator(".ficha-dica-fica").count()) === 0);
  await p.keyboard.press("Escape");
  await ctx.close();
}
await nav.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros de página");
