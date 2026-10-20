// Fotos dos itens 155 (Caderno de quem) e 156 (card dos Conteúdos) com sessão de mentira no banco-falso.mjs.
// Antes: node provas/r7-caderno-cartao/banco-falso.mjs  e o app construído/servido em 3199 apontando para 127.0.0.1:3299:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3299 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=falsa npx next build && (mesmas variáveis) npx next start -p 3199
// Chrome headless fora da tela. Uso: node provas/r7-caderno-cartao/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const cookie = (uid) => {
  const exp = 1893456000; // 2030
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join("."); // assinatura de mentira, mas em base64url válido
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
const titulos = (p) => p.evaluate(() => [...document.querySelectorAll(".folha .risco")].filter((e) => e.offsetHeight).map((e) => e.textContent.trim()).filter(Boolean));

for (const [quem, uid] of [["natham", "u-natham"], ["matheus", "u-matheus"]]) {
  for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h } });
    await ctx.addCookies([cookie(uid)]);
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
    p.on("pageerror", (e) => erros.push(`[${quem} ${w}] ${e.message}`));
    p.on("console", (m) => m.type() === "error" && erros.push(`[${quem} ${w}] console: ${m.text()}`));
    await p.goto(BASE + "/tarefas", { waitUntil: "networkidle" });
    if (new URL(p.url()).pathname !== "/tarefas") { erros.push(`[${quem} ${w}] não entrou: ${p.url()}`); await ctx.close(); continue; }
    await p.waitForTimeout(800);
    const seletor = p.getByRole("button", { name: /Caderno de/ });
    console.log(quem, w, "caderno:", JSON.stringify(await titulos(p)), "| seletor 'Caderno de':", await seletor.count(),
      "| sai da tela:", (await seletor.count()) ? await seletor.evaluate((b) => b.getBoundingClientRect().right > innerWidth) : "-");
    await foto(p, `caderno-${quem}-${w}`);
    if (quem === "natham" && (await seletor.count())) {
      await seletor.click();
      await p.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Matheus" }).click();
      await p.waitForTimeout(500);
      const escrever = await p.locator(".folha input.campo").count();
      console.log(quem, w, "vendo Matheus:", JSON.stringify(await titulos(p)), "| campos de escrever:", escrever, "| caixas habilitadas:", await p.locator(".folha button.caixa:not([disabled])").count());
      await foto(p, `caderno-natham-vendo-matheus-${w}`);
    }
    await p.goto(BASE + "/conteudos", { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    const cartoes = await p.evaluate(() => [...document.querySelectorAll(".conteudos-cartao")].map((c) => ({ t: c.querySelector(".conteudos-titulo")?.textContent, transborda: c.scrollWidth > c.clientWidth + 1 })));
    console.log(quem, w, "cartões:", cartoes.length, "transbordando:", cartoes.filter((c) => c.transborda).map((c) => c.t));
    await foto(p, `conteudos-${quem}-${w}`);
    await ctx.close();
  }
}
await nav.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros de página");
