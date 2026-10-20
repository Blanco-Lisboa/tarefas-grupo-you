// Fotos do item 160 com sessão e dados fictícios de provas/r7-caderno-cartao/banco-falso.mjs.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const b64 = (valor) => Buffer.from(JSON.stringify(valor)).toString("base64url");
const exp = 1893456000;
const token = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: token, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const cookie = { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
const navegador = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--window-position=-3000,0"] });
const erros = [];

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura } });
  await contexto.addCookies([cookie]);
  const pagina = await contexto.newPage();
  pagina.on("pageerror", (erro) => erros.push(`[${largura}] ${erro.message}`));
  pagina.on("console", (mensagem) => { if (mensagem.type() === "error") erros.push(`[${largura}] ${mensagem.text()}`); });
  await pagina.goto("http://127.0.0.1:3199/conteudos", { waitUntil: "networkidle" });
  if (new URL(pagina.url()).pathname !== "/conteudos") throw new Error(`A tela de Conteúdos não abriu em ${largura}px: ${pagina.url()}`);
  const dados = await pagina.evaluate(() => {
    const cartoes = [...document.querySelectorAll(".conteudos-cartao")];
    const card = cartoes.find((item) => item.querySelector(".conteudos-titulo")?.textContent?.includes("Post - Reels"));
    if (!card) throw new Error("Card Post - Reels não encontrado");
    const estilo = getComputedStyle(card);
    const coluna = card.closest(".conteudos-coluna");
    return { innerWidth, cartoes: cartoes.length, transbordando: cartoes.filter((item) => item.scrollWidth > item.clientWidth + 1).length, cardDireita: Math.round(card.getBoundingClientRect().right), colunaDireita: Math.round(coluna.getBoundingClientRect().right), fundo: estilo.backgroundColor, desfoque: estilo.backdropFilter, borda: estilo.borderTopWidth, titulo: card.querySelector(".conteudos-titulo")?.textContent?.trim() };
  });
  await pagina.evaluate(() => {
    const marca = document.createElement("div");
    marca.textContent = `innerWidth ${innerWidth}`;
    marca.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px;pointer-events:none";
    document.body.append(marca);
  });
  if (largura === 390) await pagina.locator(".conteudos-cartao", { hasText: "Post - Reels" }).scrollIntoViewIfNeeded();
  await pagina.screenshot({ path: join(pasta, `conteudos-${largura}.png`) });
  console.log(largura, JSON.stringify(dados));
  await contexto.close();
}

await navegador.close();
if (erros.length) console.log("Avisos da página:\n" + erros.join("\n"));
else console.log("Sem erros de página");
