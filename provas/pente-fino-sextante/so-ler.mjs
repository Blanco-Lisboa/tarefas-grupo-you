// Foto da ficha "só para olhar" (prop soLer, Lupa 1). Feita com um build TEMPORÁRIO em que o Calendário abre as tarefas
// do Matheus com soLer (a mudança no TelaCalendario.tsx não foi guardada; quem liga de verdade é o Caderno, da Pena).
import { createRequire } from "node:module"; import { join } from "node:path"; import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("a")].join(".");
const ses = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "a@b.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const [w, h] of [[1440, 760], [390, 844]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(ses), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage(); await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  const envios = []; p.on("request", (r) => { if (r.url().includes("/rest/v1/") && r.method() !== "GET") envios.push(r.method()); });
  await p.goto("http://127.0.0.1:3199/calendario", { waitUntil: "networkidle" }); await p.waitForTimeout(500);
  await p.locator(".evento", { hasText: "Post - Reels" }).first().click();
  const f = p.locator("dialog.ficha[open]"); await f.waitFor();
  const r = await p.evaluate(() => ({
    habilitados: [...document.querySelectorAll("dialog.ficha .ficha-corpo button, dialog.ficha .ficha-corpo input, dialog.ficha .ficha-corpo textarea")].filter((e) => !e.matches(":disabled")).length,
    tituloSoLeitura: document.querySelector(".ficha-titulo").readOnly,
    botoesPe: [...document.querySelectorAll(".ficha-pe button")].map((b) => b.textContent),
    linkAbrir: !!document.querySelector(".ficha-link a"),
    rolaLado: document.querySelector(".ficha-corpo").scrollWidth > document.querySelector(".ficha-corpo").clientWidth,
  }));
  console.log(w, JSON.stringify({ ...r, envios }));
  await p.evaluate(() => { const d = document.createElement("div"); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px"; document.body.append(d); });
  await p.screenshot({ path: join(PASTA, `ficha-so-ler-${w}.png`) });
  await ctx.close();
}
await nav.close();
