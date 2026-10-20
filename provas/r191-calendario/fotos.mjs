// Item 191 (Lupa R4-2) no Calendário. Banco falso de provas/r191-esteira (porta 3299), app em 3199.
// "Post - Reels" foi enviada pelo Natham ao Matheus: Matheus só lê (não arrasta, ficha travada); Natham arrasta e edita.
// Uso: node provas/r191-calendario/fotos.mjs
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
    const gravou = [];
    pagina.on("pageerror", (e) => erros.push(e.message));
    pagina.on("request", (r) => { if (r.method() !== "GET" && /\/rest\/v1\/(tarefas|rpc\/salvar_tarefa)/.test(r.url())) gravou.push(r.method()); });
    await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
    await pagina.goto("http://127.0.0.1:3199/calendario", { waitUntil: "networkidle" });
    await pagina.keyboard.press("d"); // visão Dia: a tarefa e o destino do arraste ficam na mesma coluna em toda largura
    const cartao = pagina.locator(".evento").filter({ hasText: "Post - Reels" });
    await cartao.waitFor();
    await cartao.scrollIntoViewIfNeeded();
    const arrastavel = await cartao.getAttribute("draggable");
    // Tenta arrastar para 1 h abaixo. Quem só lê não deve gravar nada.
    const caixa = await cartao.boundingBox();
    await cartao.dragTo(pagina.locator(".grade-coluna").first(), { targetPosition: { x: 10, y: caixa.y - (await pagina.locator(".grade-coluna").first().boundingBox()).y + 90 } });
    await pagina.waitForTimeout(300);
    // Sem arraste, o soltar do mouse vira clique no vazio da grade e abre "Nova tarefa": fecha antes de abrir o cartão.
    if (await pagina.locator("dialog.ficha[open]").count()) await pagina.keyboard.press("Escape");
    await pagina.locator("dialog.ficha[open]").waitFor({ state: "detached" });
    await cartao.click();
    const ficha = pagina.locator(".ficha-cartao");
    await ficha.waitFor();
    const salvar = await ficha.getByRole("button", { name: "Salvar", exact: true }).count();
    const apagar = await ficha.getByRole("button", { name: "Apagar tarefa" }).count();
    const somenteLeitura = (await ficha.locator(".ficha-corpo").getAttribute("disabled")) !== null;
    const ok = arrastavel === String(editavel) && (gravou.length > 0) === editavel
      && somenteLeitura === !editavel && salvar === Number(editavel) && apagar === Number(editavel) && !erros.length;
    if (!ok) falhas++;
    console.log(`${ok ? "OK" : "FALHA"} ${pessoa} ${largura}: draggable=${arrastavel}, gravouAoArrastar=${JSON.stringify(gravou)}, fichaSoLer=${somenteLeitura}, salvar=${salvar}, apagar=${apagar}, erros=${JSON.stringify(erros)}`);
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
