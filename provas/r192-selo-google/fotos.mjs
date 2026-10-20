// Item 192: selo "Na agenda do Google" na ficha. Banco falso de provas/r191-esteira (porta 3299), app em 3199.
// Cria pelo Calendário (selo na ficha nova, o POST leva vai_pro_google: true) e abre uma tarefa antiga (sem selo). Uso: node provas/r192-selo-google/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const exp = 1893456000;
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--window-position=-3000,0"] });
let falhas = 0;
const marca = (pagina) => pagina.evaluate(() => {
  const d = document.createElement("div");
  d.textContent = `innerWidth ${innerWidth}`;
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px";
  document.querySelector("dialog")?.append(d);
});

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  const uid = "u-natham";
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const erros = [];
  const corpos = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  pagina.on("request", (r) => { if (r.method() === "POST" && /\/rest\/v1\/(tarefas|rpc\/salvar_tarefa)/.test(r.url())) corpos.push(r.postDataJSON()); });
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto("http://127.0.0.1:3199/calendario", { waitUntil: "networkidle" });
  const ficha = pagina.locator("dialog.ficha[open]");
  const selo = ficha.locator(".ficha-google");

  // 1. Nova pelo Calendário: selo já na ficha nova
  await pagina.getByRole("button", { name: "+ Nova tarefa" }).first().click();
  await ficha.waitFor();
  await ficha.getByLabel("Título").fill("Gravar com o cliente");
  const seloNova = await selo.count();
  await marca(pagina);
  await pagina.screenshot({ path: join(pasta, `nova-${largura}.png`) });
  await ficha.getByRole("button", { name: "Salvar", exact: true }).click();
  await ficha.waitFor({ state: "detached" });
  const foi = corpos.some((c) => (c.p ?? c).vai_pro_google === true);

  // 2. A tarefa antiga (criada no Caderno) não tem selo
  await pagina.locator(".evento").filter({ hasText: "Ligar para o contador" }).first().click();
  await ficha.waitFor();
  const seloAntiga = await selo.count();
  await pagina.keyboard.press("Escape");
  await ficha.waitFor({ state: "detached" });

  const ok = seloNova === 1 && foi && seloAntiga === 0 && !erros.length;
  if (!ok) falhas++;
  console.log(`${ok ? "OK" : "FALHA"} ${largura}: seloNaNova=${seloNova}, postComVaiProGoogle=${foi}, seloNaAntiga=${seloAntiga}, erros=${JSON.stringify(erros)}`);
  await contexto.close();
}

await navegador.close();
process.exit(falhas ? 1 : 0);
