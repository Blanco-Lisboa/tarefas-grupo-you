// Item 225: ficha com vídeo de exemplo na cópia 127.0.0.1:3101 (npm run exemplo). Uso: node provas/r225-video/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--window-position=-3000,0", "--autoplay-policy=no-user-gesture-required"] });
const pagina = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
const erros = [];
pagina.on("pageerror", (e) => erros.push(e.message));
await pagina.goto("http://127.0.0.1:3201/entrar");
await pagina.waitForURL("http://127.0.0.1:3101/**");
const selo = () => pagina.evaluate(() => { document.querySelector("nextjs-portal")?.remove(); const d = document.createElement("div"); d.textContent = `innerWidth ${innerWidth}`; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; (document.querySelector("dialog") ?? document.body).append(d); });
for (const [nome, titulo] of [["analise", "Reels: bastidores da You"], ["postado", "Reels: cliente da You conta como foi"]]) {
  await pagina.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
  const cartao = pagina.locator(".conteudos-cartao").filter({ hasText: titulo });
  await cartao.locator(".conteudos-titulo").click();
  const ficha = pagina.locator(".ficha-cartao");
  await ficha.waitFor();
  await pagina.waitForTimeout(1500);
  const capa = ficha.locator("video").first();
  await capa.scrollIntoViewIfNeeded();
  const info = await pagina.evaluate(() => [...document.querySelectorAll(".ficha-cartao video")].map((v) => ({ duracao: v.duration, w: v.videoWidth, h: v.videoHeight, erro: v.error?.code ?? null })));
  console.log(nome, JSON.stringify(info));
  await selo();
  await pagina.screenshot({ path: join(pasta, `ficha-${nome}-1440.png`) });
  // Toca o vídeo anexado (miniatura em Anexos abre o player) e fotografa com ele rodando
  await ficha.locator("video").last().click();
  const tocando = pagina.locator("video[controls]");
  await tocando.waitFor();
  await pagina.waitForTimeout(2500);
  console.log(nome, "tocando:", await tocando.evaluate((v) => ({ t: v.currentTime, pausado: v.paused })));
  await pagina.screenshot({ path: join(pasta, `ficha-${nome}-tocando-1440.png`) });
}
console.log("erros de página:", JSON.stringify(erros));
await navegador.close();
