// Campo Ocasião VAZIO igual aos outros campos (rótulo pequeno à esquerda, "Escolher" cinza à direita). Mesmo ambiente falso de fotos.mjs.
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

for (const [largura, altura] of [[1440, 760], [390, 844]]) {
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto("http://127.0.0.1:3197/conteudos", { waitUntil: "networkidle" });
  await pagina.locator(".conteudos-cartao").filter({ hasText: "Sem ocasião ainda" }).locator(".conteudos-titulo").click();
  const ficha = pagina.locator(".ficha-cartao");
  await ficha.waitFor();
  const botao = ficha.locator(".selecao-botao").filter({ hasText: "Ocasião" });
  await botao.scrollIntoViewIfNeeded();
  const rotulo = await botao.locator(".selecao-rotulo-p").innerText();
  const valor = await botao.locator(".selecao-escolha").innerText();
  confere(rotulo === "Ocasião" && valor === "Escolher", `ocasião vazia ${largura}: rótulo pequeno "${rotulo}" e "${valor}" à direita`);
  const fonte = (loc) => loc.evaluate((e) => getComputedStyle(e).fontSize);
  const formato = ficha.locator(".selecao-botao").filter({ hasText: "Formato" }).locator(".selecao-rotulo-p");
  confere((await fonte(botao.locator(".selecao-rotulo-p"))) === (await fonte(formato)), `ocasião vazia ${largura}: rótulo com o mesmo tamanho do Formato (${await fonte(formato)})`);
  const r = await botao.locator(".selecao-rotulo-p").boundingBox(), v = await botao.locator(".selecao-escolha").boundingBox();
  confere(v.x > r.x + r.width, `ocasião vazia ${largura}: "Escolher" fica à direita do rótulo (no 390 o Tipo também corta "Postagem": o botão é estreito)`);
  await pagina.evaluate(() => {
    const d = document.createElement("div");
    d.textContent = `innerWidth ${innerWidth}`;
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  await pagina.screenshot({ path: join(pasta, `ficha-ocasiao-vazia-${largura}.png`) });
  confere(!erros.length, `ocasião vazia ${largura}: sem erro na página ${JSON.stringify(erros)}`);
  await contexto.close();
}
await navegador.close();
process.exit(falhas ? 1 : 0);
