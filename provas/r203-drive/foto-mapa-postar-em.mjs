// Mapa desenha o card de Postagem pela data de POSTAR quando existe (card programado sem início não cai em "Sem data"). Mesmo ambiente falso de fotos.mjs (porta 3197).
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, t) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${t}`); };

for (const [largura, altura] of [[1440, 760]]) {
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto("http://127.0.0.1:3197/mapa", { waitUntil: "networkidle" });
  const marco = pagina.locator('.mapa-marco[data-dia="2026-10-24"]');
  await marco.waitFor({ state: "attached" });
  confere(await marco.locator(".mapa-card").filter({ hasText: "Programado sem início" }).count() === 1, `mapa ${largura}: o card programado sem início está na linha, no dia 24 (data de postar)`);
  confere(await pagina.locator(".mapa-sem-data").getByText("Programado sem início").count() === 0, `mapa ${largura}: e não está em "Sem data"`);
  confere(await pagina.locator('.mapa-marco[data-dia="2026-10-22"]').getByText("Programado sem início").count() === 0, `mapa ${largura}: nem no dia do início (não tem)`);
  await pagina.evaluate(() => {
    const d = document.createElement("div");
    d.textContent = `innerWidth ${innerWidth}`;
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  await pagina.screenshot({ path: join(pasta, `mapa-postar-em-${largura}.png`) });
  confere(!erros.length, `mapa ${largura}: sem erro na página ${JSON.stringify(erros)}`);
  await contexto.close();
}
await navegador.close();
process.exit(falhas ? 1 : 0);
