// Item 220 (Sextante): o campo Ocasião da ficha vira "Tema (pasta no Drive)" com frase de ajuda; "Sem tema" e "+ Novo tema" na lista.
// Mesma prévia do r208/r219 (banco falso do 196 em 3497 com PREVIA=1; app em 3297 apontando para ele):
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3497 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=falsa next dev --webpack -p 3297
// Uso: node provas/r220-tema/foto.mjs
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const banco = spawn(process.execPath, [fileURLToPath(new URL("../r196-postagem/banco-falso.mjs", import.meta.url))], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PREVIA: "1", PORTA: "3497" } });
await new Promise((ok) => banco.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(); }));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp: 1893456000, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: 1893456000, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 } });
await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
const pg = await contexto.newPage();
await pg.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
await pg.goto("http://127.0.0.1:3297/conteudos", { waitUntil: "networkidle" });
await pg.locator(".conteudos-cartao").first().waitFor();
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };

await pg.locator(".conteudos-cartao").filter({ hasText: "Reels: bastidores do escritório" }).locator(".conteudos-titulo").click();
const ficha = pg.locator(".ficha-cartao");
await ficha.waitFor();
await pg.waitForTimeout(400);
const botao = ficha.locator(".selecao-botao").filter({ hasText: "Tema (pasta no Drive)" });
confere(await botao.count() === 1, "220: campo \"Tema (pasta no Drive)\" na ficha");
confere(await ficha.getByText("Agrupa os vídeos numa pasta do Drive, ex.: Dia das Mães. Sem tema, vai direto na pasta da empresa.").count() === 1, "220: frase de ajuda embaixo do campo");
await pg.evaluate(() => {
  const d = Object.assign(document.createElement("div"), { textContent: `innerWidth ${innerWidth}` });
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
await botao.scrollIntoViewIfNeeded();
await pg.screenshot({ path: join(pasta, "220-tema-fechado-com-ajuda-1440.png") }); // a frase de ajuda (a lista aberta a cobre)
await botao.click();
await pg.waitForTimeout(300);
const lista = pg.locator(".selecao-lista:visible");
const texto = await lista.innerText();
console.log("   lista:", JSON.stringify(texto));
confere(texto.includes("Sem tema") && texto.includes("Novo tema") && texto.includes("Bastidores de outubro"), "220: lista com Sem tema, o tema da empresa e + Novo tema");
confere(!/ocasi/i.test(await ficha.innerText() + texto), "220: nenhuma \"Ocasião\" visível na ficha");
await pg.screenshot({ path: join(pasta, "220-tema-aberto-1440.png") });
await contexto.close();
await navegador.close();
banco.kill();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
