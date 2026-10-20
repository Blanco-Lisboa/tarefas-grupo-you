// Item 195 (Sextante): Aprovar/Consertar em "Em análise" e etiqueta Conserto. Banco falso (banco-falso.mjs, 3295), app construído
// apontando para ele e servido em 3195. Uso: node provas/r195-aprovacao/fotos.mjs
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

async function abrir(pessoa, largura, altura) {
  const uid = `u-${pessoa}`;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: `${pessoa}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  const rpc = [];
  pagina.on("request", (r) => { if (r.url().includes("/rpc/salvar_tarefa")) rpc.push(r.postDataJSON()); });
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto("http://127.0.0.1:3195/conteudos", { waitUntil: "networkidle" });
  await pagina.locator(".conteudos-cartao").first().waitFor();
  return { contexto, pagina, erros, rpc };
}
const marca = (pagina) => pagina.evaluate(() => {
  const d = document.createElement("div");
  d.textContent = `innerWidth ${innerWidth}`;
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
const cartao = (pagina, titulo) => pagina.locator(".conteudos-cartao").filter({ hasText: titulo });

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  // Natham: botões no card que ele aprova e no do Matheus também (Natham aprova tudo); etiqueta Conserto na Edição.
  const n = await abrir("natham", largura, altura);
  const reels = cartao(n.pagina, "Post - Reels");
  confere(await reels.locator(".aprovacao-botao").count() === 2, `natham ${largura}: Aprovar e Consertar no card em análise`);
  confere(await cartao(n.pagina, "Carrossel: prazo do MEI").locator(".aprovacao-botao").count() === 2, `natham ${largura}: Natham também aprova card de outro aprovador`);
  confere(await cartao(n.pagina, "Reels: 5 erros no IR").locator(".selo-conserto").isVisible(), `natham ${largura}: etiqueta Conserto na Edição`);
  confere((await cartao(n.pagina, "Dica rápida de IR").locator("time").innerText()).includes("21/10 · 18:30"), `natham ${largura}: Aprovado mostra a data e hora do post`);
  await reels.scrollIntoViewIfNeeded();
  await marca(n.pagina);
  await n.pagina.screenshot({ path: join(pasta, `natham-${largura}.png`) });
  // Aprovar (item 200): vai direto para Aprovado; lá, Programar postagem abre data e hora.
  await reels.getByRole("button", { name: "Aprovar" }).click();
  await n.pagina.waitForTimeout(300);
  const aprovado = n.pagina.locator('[data-etapa="aprovado"] .conteudos-cartao').filter({ hasText: "Post - Reels" });
  confere(await aprovado.count() === 1 && n.rpc.at(-1)?.p?.etapa === "aprovado" && n.rpc.at(-1)?.p?.postar_em === null, `natham ${largura}: Aprovar leva a Aprovado sem data`);
  await aprovado.getByRole("button", { name: "Programar postagem" }).click();
  const painel = n.pagina.locator(".campo-data-pop:popover-open");
  await painel.waitFor();
  await n.pagina.waitForTimeout(400); // o painel entra com transição
  await marca(n.pagina);
  await n.pagina.screenshot({ path: join(pasta, `programar-${largura}.png`) });
  await painel.locator('[data-dia="2026-10-22"]').click();
  await n.pagina.waitForTimeout(300); // o card desce do "hover" e o painel, preso a ele, acompanha
  await painel.getByRole("button", { name: "Selecionar" }).click();
  await n.pagina.waitForTimeout(300);
  confere(n.rpc.at(-1)?.p?.etapa === "aprovado" && n.rpc.at(-1)?.p?.postar_em === "2026-10-22T00:00" && await aprovado.getByRole("button", { name: "Reprogramar postagem" }).count() === 1
    && (await aprovado.locator("time").innerText()).includes("22/10 · 00:00"), `natham ${largura}: Programar grava postar_em ${n.rpc.at(-1)?.p?.postar_em} e o card mostra a data`);
  // Consertar: volta para Edição com a etiqueta.
  await cartao(n.pagina, "Carrossel: prazo do MEI").getByRole("button", { name: "Consertar" }).click();
  await n.pagina.waitForTimeout(300);
  const consertado = n.pagina.locator('[data-etapa="edicao"] .conteudos-cartao').filter({ hasText: "Carrossel: prazo do MEI" });
  confere(await consertado.locator(".selo-conserto").count() === 1 && n.rpc.at(-1)?.p?.conserto === true && n.rpc.at(-1)?.p?.etapa === "edicao", `natham ${largura}: Consertar leva a Edição com Conserto`);
  await consertado.scrollIntoViewIfNeeded();
  await marca(n.pagina);
  await n.pagina.screenshot({ path: join(pasta, `depois-${largura}.png`) });
  confere(!n.erros.length, `natham ${largura}: sem erro na página ${JSON.stringify(n.erros)}`);
  await n.contexto.close();

  // Matheus: só vê os botões no card em que ELE é o aprovador.
  const m = await abrir("matheus", largura, altura);
  confere(await cartao(m.pagina, "Post - Reels").locator(".aprovacao-botao").count() === 0, `matheus ${largura}: sem botões no card que o Natham aprova`);
  confere(await cartao(m.pagina, "Carrossel: prazo do MEI").locator(".aprovacao-botao").count() === 2, `matheus ${largura}: botões no card que ele aprova`);
  await cartao(m.pagina, "Carrossel: prazo do MEI").scrollIntoViewIfNeeded();
  await marca(m.pagina);
  await m.pagina.screenshot({ path: join(pasta, `matheus-${largura}.png`) });
  confere(!m.erros.length, `matheus ${largura}: sem erro na página ${JSON.stringify(m.erros)}`);
  await m.contexto.close();
}

await navegador.close();
process.exit(falhas ? 1 : 0);
