// Itens 198 e 199 (Vitral). Banco falso em 3298 (banco-falso.mjs), app construído apontando para ele e servido em 3198.
// Uso: node provas/r198-199-anexos/fotos.mjs   (só PC: 1903 e 1440)
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const exp = 1893456000;
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const marca = (pagina) => pagina.evaluate(() => {
  document.getElementById("marca-w")?.remove();
  const d = document.createElement("div");
  d.id = "marca-w"; d.textContent = `innerWidth ${innerWidth}`;
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});

for (const [largura, altura] of [[1903, 900], [1440, 760]]) {
  const uid = "u-natham";
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  const abrirMapa = async () => { await pagina.goto("http://127.0.0.1:3198/mapa", { waitUntil: "networkidle" }); await pagina.locator(".mapa-sem-data").waitFor(); };

  // ---- 198: Postagem sem data aparece no Mapa; reunião e caderno não ----
  await abrirMapa();
  const botoes = pagina.locator(".mapa-sem-data button");
  const nomes = await botoes.allInnerTexts();
  confere(nomes.length === 2 && nomes.includes("Reels: bastidores do escritório") && nomes.includes("Carrossel: prazo do MEI"), `${largura}: faixa Sem data mostra as 2 Postagens ${JSON.stringify(nomes)}`);
  confere(!nomes.some((x) => /Reunião|caderno/i.test(x)), `${largura}: reunião e tarefa de caderno ficam fora`);
  await marca(pagina);
  await pagina.screenshot({ path: join(pasta, `mapa-sem-data-${largura}.png`) });
  await pagina.getByRole("button", { name: "Fila" }).click();
  confere(await pagina.locator(".mapa-sem-data button").count() === 2, `${largura}: faixa também aparece na Fila`);
  await pagina.getByRole("button", { name: "Linha do tempo" }).click();

  // ---- 199: anexar, salvar, F5, o arquivo continua ----
  await botoes.filter({ hasText: "Reels: bastidores" }).click();
  const ficha = pagina.locator("dialog.ficha, dialog[open]").first();
  await ficha.locator('input[type="file"]').setInputFiles(join(pasta, "anexo-teste.png"));
  confere(await ficha.locator(".ficha-anexo").count() === 1, `${largura}: anexo aparece na ficha antes de salvar`);
  await ficha.getByRole("button", { name: /^Salvar/ }).click();
  await pagina.waitForTimeout(800);
  confere(await pagina.locator("dialog[open]").count() === 0, `${largura}: ficha fechou ao salvar (sem erro)`);

  await pagina.reload({ waitUntil: "networkidle" }); // F5
  await pagina.locator(".mapa-sem-data").waitFor();
  await pagina.locator(".mapa-sem-data button").filter({ hasText: "Reels: bastidores" }).click();
  const depois = pagina.locator("dialog[open]").first();
  await depois.locator(".ficha-anexo").waitFor();
  const img = depois.locator(".ficha-anexo-mini img");
  await img.waitFor();
  const carregou = await img.evaluate((i) => i.complete && i.naturalWidth > 0);
  confere(await depois.locator(".ficha-anexo").count() === 1 && carregou, `${largura}: depois do F5 o anexo continua e a imagem abre (link assinado)`);
  await marca(pagina);
  await pagina.screenshot({ path: join(pasta, `anexo-depois-f5-${largura}.png`) });

  // tirar o anexo e salvar apaga do Storage
  await depois.locator(".ficha-anexo-tirar").click();
  await depois.getByRole("button", { name: /^Salvar/ }).click();
  await pagina.waitForTimeout(800);
  await pagina.reload({ waitUntil: "networkidle" });
  await pagina.locator(".mapa-sem-data button").filter({ hasText: "Reels: bastidores" }).click();
  confere(await pagina.locator("dialog[open] .ficha-anexo").count() === 0, `${largura}: tirar o anexo e salvar apaga de vez`);
  // ---- achado 5: anexo removido do Storage abre o link do Drive e mostra o aviso ----
  const pedidos = [];
  pagina.on("request", (r) => { if (r.url().includes("ja-saiu-do-storage")) pedidos.push(r.url()); });
  await pagina.goto("http://127.0.0.1:3198/mapa", { waitUntil: "networkidle" });
  await pagina.locator(".mapa-card", { hasText: "Post com data" }).first().click();
  const fr = pagina.locator("dialog[open]").first();
  await fr.locator(".ficha-anexo-doc", { hasText: "Drive" }).waitFor();
  confere(await fr.locator(".ficha-anexo-aviso").innerText().then((x) => x.includes("saiu daqui depois de 3 dias")), `${largura}: aviso do banco aparece na ficha`);
  const [popup] = await Promise.all([pagina.waitForEvent("popup"), fr.locator(".ficha-anexo-mini").click()]);
  confere(popup.url().startsWith("http://127.0.0.1:3298/drive-falso"), `${largura}: clicar abre o drive_link (${popup.url()})`);
  confere(!pedidos.length, `${largura}: nenhum pedido ao objeto apagado do Storage ${JSON.stringify(pedidos)}`);
  await popup.close();
  await marca(pagina);
  await pagina.screenshot({ path: join(pasta, `anexo-no-drive-${largura}.png`) });
  confere(!erros.length, `${largura}: sem erro na página ${JSON.stringify(erros)}`);
  await contexto.close();
}
await navegador.close();
process.exit(falhas ? 1 : 0);
