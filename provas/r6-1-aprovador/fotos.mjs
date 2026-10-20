// Lupa R6-1: tirar a tag "Esperando aprovação" e salvar faz o aprovador sumir; título com espaços vai aparado.
// Banco falso de provas/r191-esteira (3299), app em 3199, login do Natham, "Post - Reels" (tag + aprovador Natham).
// Uso: node provas/r6-1-aprovador/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const exp = 1893456000;
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--window-position=-3000,0"] });
const uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 }, deviceScaleFactor: 1 });
await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
const pagina = await contexto.newPage();
const erros = [];
const corpos = [];
pagina.on("pageerror", (e) => erros.push(e.message));
pagina.on("request", (r) => { if (r.method() === "POST" && /\/rest\/v1\/rpc\/salvar_tarefa/.test(r.url())) corpos.push(r.postDataJSON()); });
await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
await pagina.goto("http://127.0.0.1:3199/calendario", { waitUntil: "networkidle" });
await pagina.keyboard.press("d");
await pagina.locator(".evento").filter({ hasText: "Post - Reels" }).first().click();
const ficha = pagina.locator("dialog.ficha[open]");
await ficha.waitFor();
const antes = await ficha.getByText("Quem aprova").count();
await ficha.getByLabel("Título").fill("  Post - Reels  ");
await ficha.locator(".selecao-botao").filter({ hasText: "Tags" }).click();
await pagina.locator(".selecao-opcao").filter({ hasText: "Esperando aprovação" }).click();
await pagina.keyboard.press("Escape"); // fecha só a lista
const depois = await ficha.getByText("Quem aprova").count();
await pagina.evaluate(() => {
  const d = document.createElement("div");
  d.textContent = `innerWidth ${innerWidth}`;
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px";
  document.querySelector("dialog")?.append(d);
});
await pagina.screenshot({ path: join(pasta, "sem-tag-1440.png") });
await ficha.getByRole("button", { name: "Salvar", exact: true }).click();
await ficha.waitFor({ state: "detached" });
const p = corpos.at(-1)?.p ?? {};
const tags = corpos.at(-1)?.p_tags;
const ok = antes === 1 && depois === 0 && p.aprovador === null && p.titulo === "Post - Reels" && Array.isArray(tags) && tags.length === 0 && !erros.length;
console.log(`${ok ? "OK" : "FALHA"}: quemAprovaAntes=${antes}, depois=${depois}, enviado aprovador=${JSON.stringify(p.aprovador)} titulo=${JSON.stringify(p.titulo)} tags=${JSON.stringify(tags)}, erros=${JSON.stringify(erros)}`);
await navegador.close();
process.exit(ok ? 0 : 1);
