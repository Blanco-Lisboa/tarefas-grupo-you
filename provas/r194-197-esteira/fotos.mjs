// Prova dos itens 194 e 197 com o banco falso do Sextante (3295) e o app local (3195).
// Uso: node provas/r194-197-esteira/fotos.mjs
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

for (const [largura, altura] of [[1903, 900], [1440, 760]]) {
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const erros = [];
  const rpc = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  pagina.on("request", (r) => { if (r.url().includes("/rpc/salvar_tarefa")) rpc.push(r.postDataJSON()); });
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto("http://127.0.0.1:3195/conteudos", { waitUntil: "networkidle" });
  await pagina.locator(".conteudos-cartao").first().waitFor();
  await pagina.evaluate(() => {
    const d = document.createElement("div");
    d.textContent = `innerWidth ${innerWidth}`;
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });

  // 194: o + de Postado abre a ficha com Postagem e as quatro opções permitidas.
  await pagina.getByRole("button", { name: "Novo conteúdo em Postado" }).click();
  const ficha = pagina.locator(".ficha");
  await ficha.waitFor();
  const tipo = ficha.locator(".selecao-botao").first();
  confere((await tipo.innerText()).includes("Postagem"), `194 ${largura}: + de Postado já seleciona Postagem`);
  await tipo.click();
  const lista = pagina.locator(".selecao-pop:popover-open").first();
  await lista.waitFor();
  const opcoes = await lista.locator(".selecao-opcao-rotulo").allInnerTexts();
  confere(JSON.stringify(opcoes) === JSON.stringify(["Roteiro", "Gravação", "Edição", "Postagem"]), `194 ${largura}: menu Tipo = ${opcoes.join(", ")}`);
  await pagina.screenshot({ path: join(pasta, `194-tipo-${largura}.png`) });
  await ficha.getByRole("button", { name: "Fechar" }).click();

  // 197: arraste de Aprovado para Postado não grava antes de confirmar.
  const quadro = pagina.locator(".conteudos-quadro");
  await quadro.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
  const card = pagina.locator('[data-etapa="aprovado"] .conteudos-cartao').filter({ hasText: "Dica rápida de IR" });
  const alvo = pagina.locator('[data-etapa="postado"]');
  await card.scrollIntoViewIfNeeded();
  const origem = await card.locator(".conteudos-titulo").boundingBox();
  const destino = await alvo.boundingBox();
  if (!origem || !destino) throw new Error("Card ou coluna Postado não está visível para arrastar");
  const arrastar = async () => {
    await pagina.mouse.move(origem.x + origem.width / 2, origem.y + origem.height / 2);
    await pagina.mouse.down();
    await pagina.mouse.move(origem.x + origem.width / 2 + 20, origem.y + origem.height / 2 + 10, { steps: 4 });
    await pagina.mouse.move(destino.x + destino.width / 2, destino.y + 90, { steps: 12 });
    await pagina.mouse.up();
  };
  await arrastar();
  const dialogo = pagina.getByRole("dialog", { name: "Confirmar mudança para Postado?" });
  await dialogo.waitFor();
  const antes = rpc.length;
  confere(await dialogo.getByText("Dica rápida de IR").isVisible(), `197 ${largura}: confirmação mostra o card certo`);
  confere(!rpc.some((r) => r.p?.etapa === "postado"), `197 ${largura}: ainda não gravou Postado`);
  await pagina.screenshot({ path: join(pasta, `197-confirmar-${largura}.png`) });
  await dialogo.getByRole("button", { name: "Cancelar" }).click();
  await dialogo.waitFor({ state: "hidden" });
  confere(rpc.length === antes && await card.count() === 1, `197 ${largura}: cancelar conserva o card em Aprovado`);
  await arrastar();
  await dialogo.waitFor();
  await dialogo.getByRole("button", { name: "Confirmar Postado" }).click();
  await pagina.waitForTimeout(200);
  confere(rpc.at(-1)?.p?.etapa === "postado", `197 ${largura}: confirmar grava Postado`);
  confere(!erros.length, `${largura}: sem erro na página ${JSON.stringify(erros)}`);
  await contexto.close();
}

await navegador.close();
process.exit(falhas ? 1 : 0);
