// Item 242 (Sextante): editar e excluir tag pela lista de Tags da ficha; a tag do sistema só tem cadeado.
// Cópia de exemplo (3101, banco falso 3201 com /entrar, como Natham). Nada é gravado no banco de exemplo: as duas tags do print do Natham
// entram pela rede do navegador (page.route na leitura de tags e tarefas), e o PATCH/DELETE de tags é respondido aqui, com o pedido conferido.
// Uso: node provas/r242-tags/fotos.mjs
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
const CARD = "Carrossel: calendário fiscal de novembro";
const TAGS = [{ id: "tag-reel", nome: "reel 1 - 19hrs terça", cor: "etiqueta-13", aprovacao: false }, { id: "tag-drive", nome: "teste do drive", cor: "etiqueta-13", aprovacao: false }];
const COM_TAG = ["Carrossel: calendário fiscal de novembro", "Reels: dica rápida de IR", "Reels: bastidores da You"]; // "teste do drive" em 3 cards

const pg = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
const escritas = [];
await pg.route("**/rest/v1/tags*", async (r) => {
  const m = r.request().method();
  if (m === "GET") { const res = await r.fetch(); return r.fulfill({ response: res, json: [...(await res.json()), ...TAGS] }); }
  if (m === "PATCH" || m === "DELETE") { escritas.push({ m, url: r.request().url(), corpo: r.request().postDataJSON?.() ?? null }); return r.fulfill({ status: 204, headers: CORS }); }
  return r.fallback();
});
await pg.route("**/rest/v1/tarefas*", async (r) => {
  if (r.request().method() !== "GET") return r.fallback();
  const res = await r.fetch();
  await r.fulfill({ response: res, json: (await res.json()).map((t) => (COM_TAG.includes(t.titulo) ? { ...t, tarefa_tags: [...(t.tarefa_tags ?? []), { tag_id: "tag-drive" }, ...(t.titulo === CARD ? [{ tag_id: "tag-reel" }] : [])] } : t)) });
});
await pg.goto("http://127.0.0.1:3201/entrar");
await pg.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
await pg.locator(".conteudos-cartao").filter({ hasText: CARD }).locator(".conteudos-titulo").click();
const ficha = pg.locator(".ficha-cartao");
await ficha.waitFor();
await pg.waitForTimeout(600);
const botaoTags = ficha.locator(".ficha-tags .selecao-botao").filter({ hasText: "Tags" });
await botaoTags.scrollIntoViewIfNeeded();
await botaoTags.click();
await pg.waitForTimeout(400);
const lista = pg.locator(".ficha-tags .selecao-pop:popover-open");
const sistema = lista.locator(".selecao-linha").filter({ hasText: "Esperando aprovação" });
confere(await sistema.locator(".ficha-tag-sistema").count() === 1 && await sistema.locator(".ficha-tag-acao").count() === 0, "242: Esperando aprovação só com cadeado, sem editar nem excluir");
const linha = lista.locator(".selecao-linha").filter({ hasText: "teste do drive" });
await linha.hover();
await pg.waitForTimeout(250);
const visiveis = await linha.locator(".ficha-tag-acao").evaluateAll((bs) => bs.map((b) => [b.getAttribute("aria-label"), getComputedStyle(b).opacity]));
confere(visiveis.length === 2 && visiveis.every(([, o]) => o === "1"), `242: lápis e lixeira aparecem ao passar o mouse (${JSON.stringify(visiveis)})`);
await pg.evaluate(() => {
  const d = Object.assign(document.createElement("div"), { textContent: `innerWidth ${innerWidth}` });
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
await pg.screenshot({ path: join(pasta, "242-tags-editar-excluir-1440.png") });

// Editar: o lápis abre a linha da Nova tag preenchida; Salvar manda nome e cor
await linha.getByRole("button", { name: "Editar a tag teste do drive" }).click();
const nome = ficha.getByRole("textbox", { name: "Nome da tag" });
confere(await nome.inputValue() === "teste do drive", "242: editar abre com o nome da tag");
await nome.fill("Drive conferido");
await ficha.locator(".ficha-cores .ficha-cor").nth(2).click();
await pg.screenshot({ path: join(pasta, "242-tag-editando-1440.png") });
await ficha.getByRole("button", { name: "Salvar" }).first().click();
await pg.waitForTimeout(500);
const patch = escritas.find((x) => x.m === "PATCH");
confere(patch?.url.includes("id=eq.tag-drive") && patch.corpo?.nome === "Drive conferido" && /^etiqueta-\d+$/.test(patch.corpo?.cor), `242: PATCH em tags com nome e cor (${JSON.stringify(patch?.corpo)})`);
confere((await botaoTags.innerText()).includes("Drive conferido"), "242: o nome novo aparece na ficha");

// Excluir: confirmação com quantos cards; Excluir manda DELETE e a tag some da lista e da ficha
await botaoTags.click();
await pg.waitForTimeout(400);
await lista.locator(".selecao-linha").filter({ hasText: "Drive conferido" }).hover();
await lista.getByRole("button", { name: "Excluir a tag Drive conferido" }).click();
const dialogo = pg.locator("dialog.confirmar[open]");
const texto = (await dialogo.innerText()).replace(/\s+/g, " ");
confere(texto.includes("Excluir a tag Drive conferido?") && texto.includes("Ela sai de 3 cards que você vê (e de outros que só o dono vê)."), `242: confirmação "${texto}"`);
await pg.screenshot({ path: join(pasta, "242-tag-excluir-confirmacao-1440.png") });
await dialogo.getByRole("button", { name: "Excluir" }).click();
await pg.waitForTimeout(500);
const del = escritas.find((x) => x.m === "DELETE");
confere(del?.url.includes("id=eq.tag-drive"), "242: DELETE em tags da tag certa");
confere(!(await botaoTags.innerText()).includes("Drive conferido"), "242: a tag sai da ficha");
await botaoTags.click();
await pg.waitForTimeout(300);
confere(await lista.locator(".selecao-opcao").filter({ hasText: "Drive conferido" }).count() === 0, "242: a tag sai da lista");

await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
