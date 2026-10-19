// Fotos da tela de Entrar e da Nova senha no visual da opção 1 (item 150), pelo servidor real 127.0.0.1:3100.
// Chrome fora da tela. Uso: node provas/r6-login-final/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const URL_BASE = "http://127.0.0.1:3100";
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const marca = (p) => p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;color:#000;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
const foto = async (p, nome, w) => { await marca(p); await p.waitForTimeout(700); await p.screenshot({ path: join(PASTA, `${nome}-${w}.png`), fullPage: true }); };
// Sessão de mentira só no navegador (o servidor não a aceita), para a Nova senha mostrar o formulário como faz para quem veio do convite.
const sessaoFalsa = () => {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "0", exp, role: "authenticated" }), "x"].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: "0", aud: "authenticated", role: "authenticated", email: "foto@exemplo.com", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  document.cookie = "sb-uruhjlurcxpjhhgvuzwt-auth-token=base64-" + b64(sessao) + "; path=/";
};
for (const [w, h] of [[1903, 910], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto(URL_BASE + "/entrar", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await foto(p, "entrar", w);
  await p.getByPlaceholder("E-mail").fill("foto@exemplo.com");
  await p.getByPlaceholder("Senha").fill("senha-errada");
  await p.getByRole("button", { name: "Entrar" }).click();
  await p.locator(".entrar-erro").waitFor();
  await foto(p, "entrar-erro", w);
  await p.goto(URL_BASE + "/entrar/nova-senha", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await foto(p, "nova-senha-sem-convite", w);
  await p.close();

  const q = await nav.newPage({ viewport: { width: w, height: h } });
  await q.addInitScript(sessaoFalsa);
  await q.goto(URL_BASE + "/entrar/nova-senha", { waitUntil: "networkidle" });
  await q.getByPlaceholder("Nova senha").waitFor();
  await q.waitForTimeout(800);
  console.log(w, "nova-senha formulário:", await q.getByRole("button", { name: "Salvar e entrar" }).isEnabled() ? "liberado" : "travado");
  await foto(q, "nova-senha", w);
  await q.getByPlaceholder("Nova senha").fill("12345678");
  await q.getByPlaceholder("Repita a senha").fill("87654321");
  await q.getByRole("button", { name: "Salvar e entrar" }).click();
  await q.locator(".entrar-erro").waitFor();
  await foto(q, "nova-senha-erro", w);
  await q.close();
}
await nav.close();
