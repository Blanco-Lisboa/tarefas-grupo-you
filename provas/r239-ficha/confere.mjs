// Item 239 (Sextante), achados 1 e 2 da Re-revisão 2. Cópia de exemplo (3101, banco falso 3201 com /entrar); nada é gravado:
// salvar_tarefa, postagem_automatica_ligada e o "modo" da postar-meta respondem pela rede do navegador (page.route).
// (2) trocar a Empresa tira o Tema: a ficha mostra "Sem tema" e o salvar manda ocasiao_id null.
// (1) ligada com a função em modo de teste: aviso e confirmação do Postar agora dizem que cria rascunho e não publica; de verdade: como antes.
// Uso: node provas/r239-ficha/confere.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const CORS = { "access-control-allow-origin": "http://127.0.0.1:3101", "access-control-allow-credentials": "true" };
const TESTE = "Modo de teste: cria um rascunho na Meta, não publica.";

async function abrir(titulo, { ligada = false, deVerdade = false } = {}) {
  const pg = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
  const salvos = [];
  await pg.route("**/rest/v1/rpc/salvar_tarefa*", (r) => { salvos.push(r.request().postDataJSON()); return r.fulfill({ status: 204, headers: CORS }); });
  if (ligada) {
    await pg.route("**/rest/v1/rpc/postagem_automatica_ligada*", (r) => r.fulfill({ json: true, headers: CORS }));
    await pg.route("**/functions/v1/postar-meta", (r) => (r.request().method() === "POST" ? r.fulfill({ json: { deVerdade }, headers: CORS }) : r.fulfill({ status: 204, headers: { ...CORS, "access-control-allow-headers": "*", "access-control-allow-methods": "POST" } })));
  }
  await pg.goto("http://127.0.0.1:3201/entrar");
  await pg.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
  await pg.locator(".conteudos-cartao").filter({ hasText: titulo }).locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  await pg.waitForTimeout(800);
  return { pg, ficha, salvos };
}
const marca = (pg) => pg.evaluate(() => {
  document.querySelector("#marca-largura")?.remove();
  const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth}` });
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});

// (2) Card da You no tema "Reunião de outubro" passa para a Beec
let { pg, ficha, salvos } = await abrir("Reels: contabilidade sem mistério");
const tema = () => ficha.locator(".ficha-tema .selecao-botao").innerText();
confere((await tema()).includes("Reunião de outubro"), `(2) antes: Tema da You ("${(await tema()).replace(/\s+/g, " ")}")`);
await ficha.locator(".ficha-grade .selecao-botao").filter({ hasText: "Empresa" }).click();
await pg.locator(".selecao-pop:popover-open .selecao-opcao").filter({ hasText: "Beec" }).click();
await pg.waitForTimeout(300);
const depois = (await tema()).replace(/\s+/g, " ");
confere(!depois.includes("Reunião de outubro") && depois.includes("Escolher"), `(2) trocou para a Beec: Tema vazio ("${depois}")`);
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(800);
const enviado = salvos.at(-1)?.p;
confere(enviado?.empresa_id === "beec" && "ocasiao_id" in (enviado ?? {}) && enviado.ocasiao_id === null, `(2) o salvar manda empresa beec e ocasiao_id null (${JSON.stringify({ empresa_id: enviado?.empresa_id, ocasiao_id: enviado?.ocasiao_id })})`);
await pg.context().close();

// (1) Ligada, função em modo de teste e de verdade
for (const deVerdade of [false, true]) {
  ({ pg, ficha } = await abrir("Reels: dica rápida de IR", { ligada: true, deVerdade })); // Reels pronto (vídeo e descrição): o Postar agora abre a confirmação
  const bloco = ficha.locator(".publicacao");
  await bloco.evaluate((b) => b.scrollIntoView({ block: "center" }));
  const aviso = (await bloco.innerText()).includes(TESTE);
  confere(deVerdade ? !aviso : aviso, `(1) ${deVerdade ? "de verdade: sem aviso de teste" : "modo de teste: aviso no bloco"}`);
  await bloco.getByRole("button", { name: "Postar agora" }).click();
  const dialogo = pg.locator("dialog.confirmar[open]");
  const texto = (await dialogo.innerText().catch(() => "")).replace(/\s+/g, " ");
  confere(deVerdade ? texto.includes("vai para o ar agora") : texto.includes(TESTE) && !texto.includes("vai para o ar"), `(1) ${deVerdade ? "de verdade" : "modo de teste"}: confirmação "${texto}"`);
  if (!deVerdade) {
    await marca(pg);
    await pg.screenshot({ path: join(pasta, "239-modo-de-teste-confirmacao-1440.png") });
  }
  await pg.context().close();
}
await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
