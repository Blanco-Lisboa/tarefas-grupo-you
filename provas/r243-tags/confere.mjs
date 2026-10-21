// Item 243 (Sextante), achado 4 da Re-revisão 4: a ficha aberta com uma tag que OUTRA pessoa excluiu salva sem ela (o salvar não falha).
// Cópia de exemplo (3101, banco falso 3201 com /entrar). A tag "Velha" entra pela rede do navegador (page.route); depois de a ficha abrir,
// a leitura de tags passa a vir sem ela (= alguém excluiu em outro computador). O salvar_tarefa é respondido aqui e conferido. Nada é gravado.
// Uso: node provas/r243-tags/confere.mjs
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const CORS = { "access-control-allow-origin": "http://127.0.0.1:3101", "access-control-allow-credentials": "true" };
const CARD = "Carrossel: calendário fiscal de novembro";
let excluida = false;

const pg = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
const salvos = [];
await pg.route("**/rest/v1/tags*", async (r) => {
  if (r.request().method() !== "GET") return r.fallback();
  const res = await r.fetch();
  const base = await res.json();
  await r.fulfill({ response: res, json: excluida ? base : [...base, { id: "tag-velha", nome: "Velha", cor: "etiqueta-13", aprovacao: false }] });
});
await pg.route("**/rest/v1/tarefas*", async (r) => {
  if (r.request().method() !== "GET") return r.fallback();
  const res = await r.fetch();
  await r.fulfill({ response: res, json: (await res.json()).map((t) => (t.titulo === CARD ? { ...t, tarefa_tags: [...(t.tarefa_tags ?? []), { tag_id: "tag-velha" }] } : t)) });
});
await pg.route("**/rest/v1/rpc/salvar_tarefa*", (r) => { salvos.push(r.request().postDataJSON()); return r.fulfill({ status: 204, headers: CORS }); });
await pg.goto("http://127.0.0.1:3201/entrar");
await pg.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
await pg.locator(".conteudos-cartao").filter({ hasText: CARD }).locator(".conteudos-titulo").click();
const ficha = pg.locator(".ficha-cartao");
await ficha.waitFor();
await pg.waitForTimeout(600);
confere((await ficha.locator(".ficha-tags .selecao-botao").first().innerText()).includes("Velha"), "243: a ficha abre com a tag Velha marcada");
excluida = true; // alguém excluiu a tag em outro computador; esta aba não sabe
await ficha.locator(".ficha-titulo").fill(`${CARD} (título novo)`);
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(1000);
const p = salvos.at(-1);
confere(!!p && p.p?.titulo?.endsWith("(título novo)") && !(p.p_tags ?? []).includes("tag-velha"), `243: o salvar vai com o título novo e sem a tag excluída (p_tags ${JSON.stringify(p?.p_tags)})`);
await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
