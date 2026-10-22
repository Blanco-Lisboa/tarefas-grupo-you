// Prova do Alvenaria 269-273 na cópia de exemplo (banco falso) como o Matheus: cópia própria em 3111/3211.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
const marca = () => p.evaluate(() => { document.getElementById("m")?.remove(); const d = document.createElement("div"); d.id = "m"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
const foto = async (nome) => { await marca(); await p.screenshot({ path: PASTA + nome }); };
await p.goto("http://127.0.0.1:3211/entrar?quem=matheus", { waitUntil: "networkidle" });
await p.goto("http://127.0.0.1:3111/conteudos", { waitUntil: "networkidle" });
await p.waitForTimeout(3000);
await foto("0-esteira-antes-1440.png");

// 269 + 271: o Matheus abre um card em análise, escreve o Conserto e manda consertar
await p.getByText("Reels: contabilidade sem mistério").first().click();
await p.locator("dialog.ficha[open]").waitFor();
const campo = p.locator("dialog.ficha textarea[placeholder^='O que precisa']");
console.log("campo Conserto visível:", await campo.count());
await campo.fill("Cortar a pausa do começo e trocar a música.");
await p.locator("dialog.ficha .ficha-decidir").scrollIntoViewIfNeeded();
await foto("1-conserto-escrito-1440.png");
await p.locator("dialog.ficha [data-acao=consertar]").click();
await p.waitForTimeout(1200);
await foto("2-depois-de-consertar-1440.png");
await p.keyboard.press("Escape");
await p.waitForTimeout(600);
await foto("3-esteira-com-tag-conserto-1440.png");
console.log("selos Conserto na esteira:", await p.locator(".selo-conserto").count());

// 269 + 272: o Matheus aprova outro card; a tag "Esperando aprovação" sai
await p.getByText("Carrossel: guia do pró-labore").first().click();
await p.locator("dialog.ficha[open]").waitFor();
console.log("botões Consertar/Aprovar:", await p.locator("dialog.ficha .ficha-decidir button").allInnerTexts());
await p.locator("dialog.ficha [data-acao=aprovar]").click();
await p.waitForTimeout(1500);
console.log("tags no card aberto depois de aprovar:", await p.locator("dialog.ficha .ficha-tags .tag-chip, dialog.ficha .ficha-tags [class*=chip]").allInnerTexts());
await p.keyboard.press("Escape");
await p.waitForTimeout(600);
const cartao = p.locator(".conteudos-cartao-sombra", { hasText: "Carrossel: guia do pró-labore" });
console.log("card aprovado está em:", await cartao.evaluate((e) => e.closest("[data-etapa]")?.dataset.etapa), "| tags do card:", await cartao.locator(".conteudos-tags").allInnerTexts());
await foto("4-esteira-depois-de-aprovar-1440.png");

// 270 + 273: card Aprovado com o vídeo sem legenda guardado; o Matheus vê e abre os vídeos e tem onde subir o legendado
await p.getByText("Reels: dica rápida de IR").first().click();
await p.locator("dialog.ficha[open]").waitFor();
const anexos = p.locator("dialog.ficha .ficha-anexos-trava");
await anexos.scrollIntoViewIfNeeded();
await p.waitForTimeout(500);
console.log("trava nos anexos:", await anexos.getAttribute("data-travada"), "| zona de soltar visível:", await anexos.locator(".ficha-anexo-solta").isVisible());
await foto("5-aprovado-video-legendado-1440.png");
await anexos.locator(".ficha-anexo-mini").first().click();
await p.waitForTimeout(500);
console.log("player grande abriu:", await p.locator("dialog.ficha-grande[open]").count());
await foto("6-video-aberto-1440.png");
await nav.close();
