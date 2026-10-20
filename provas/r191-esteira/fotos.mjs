// Item 191: banco falso local, app em 3199. Uso: node provas/r191-esteira/fotos.mjs
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

for (const [pessoa, editavel] of [["matheus", false], ["natham", true]]) {
  for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
    const uid = `u-${pessoa}`;
    const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
    const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: `${pessoa}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
    const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
    await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
    const pagina = await contexto.newPage();
    const erros = [];
    pagina.on("pageerror", (e) => erros.push(e.message));
    await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
    await pagina.goto("http://127.0.0.1:3199/conteudos", { waitUntil: "networkidle" });
    const cartao = pagina.locator(".conteudos-cartao").filter({ hasText: "Post - Reels" });
    await cartao.waitFor();
    const atributo = await cartao.getAttribute("data-editavel");
    const titulo = cartao.locator(".conteudos-titulo");
    await titulo.scrollIntoViewIfNeeded();
    const caixa = await titulo.boundingBox();
    await pagina.mouse.move(caixa.x + 25, caixa.y + caixa.height / 2);
    await pagina.mouse.down();
    await pagina.mouse.move(caixa.x + 55, caixa.y + caixa.height / 2 + 15, { steps: 4 });
    await pagina.waitForTimeout(100);
    const arrastando = await cartao.getAttribute("data-arrastando");
    await pagina.mouse.up();
    if (!(await pagina.locator(".ficha-cartao").count())) await titulo.click();
    const ficha = pagina.locator(".ficha-cartao");
    await ficha.waitFor();
    const salvar = await ficha.getByRole("button", { name: "Salvar", exact: true }).count();
    const apagar = await ficha.getByRole("button", { name: "Apagar tarefa" }).count();
    const somenteLeitura = (await ficha.locator(".ficha-corpo").getAttribute("disabled")) !== null;
    const ok = atributo === String(editavel) && arrastando === String(editavel)
      && somenteLeitura === !editavel && salvar === Number(editavel) && apagar === Number(editavel) && !erros.length;
    if (!ok) falhas++;
    console.log(`${ok ? "OK" : "FALHA"} ${pessoa} ${largura}: editavel=${atributo}, arrastando=${arrastando}, fichaSoLer=${somenteLeitura}, salvar=${salvar}, apagar=${apagar}, erros=${JSON.stringify(erros)}`);
    await pagina.evaluate(() => {
      const d = document.createElement("div");
      d.textContent = `innerWidth ${innerWidth}`;
      d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px";
      document.querySelector("dialog")?.append(d);
    });
    await pagina.screenshot({ path: join(pasta, `${pessoa}-${largura}.png`) });
    await contexto.close();
  }
}

await navegador.close();
process.exit(falhas ? 1 : 0);
