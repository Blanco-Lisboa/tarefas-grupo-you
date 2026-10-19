// Foto lado a lado: peça da ID (prancha.html, só leitura) x a mesma peça na tela Tarefas. Servidor em 3100 ligado.
// node provas/r2-id-pena/lado-a-lado.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeFileSync, rmSync } from "node:fs";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const url = (f) => pathToFileURL(join(PASTA, f)).href;
const n = await chromium.launch({ headless: true });

// 1) tela Tarefas: barra e agenda
const t = await (await n.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
await t.goto("http://localhost:3100/tarefas", { waitUntil: "networkidle" });
await t.locator(".tarefas-data").fill("2026-10-21");
await t.waitForTimeout(800);
await t.screenshot({ path: join(PASTA, "tela-barra.png"), clip: { x: 220, y: 56, width: 1220, height: 60 } });
await t.screenshot({ path: join(PASTA, "tela-agenda.png"), clip: { x: 826, y: 118, width: 590, height: 520 } });
await t.screenshot({ path: join(PASTA, "tela-1440.png") });

// 2) pranchas da ID: botões, medidor, etiquetas, bolinhas
const p = await (await n.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("file:///C:/Users/Natham%20Monteiro/Desktop/ID-Visual-ALL/Beec/identidade/prancha.html");
await p.waitForTimeout(800);
await p.screenshot({ path: join(PASTA, "id-botoes.png"), fullPage: true, clip: { x: 128, y: 29286 + 220, width: 720, height: 380 } });
await p.screenshot({ path: join(PASTA, "id-etiquetas.png"), fullPage: true, clip: { x: 128, y: 30800 + 590, width: 1184, height: 260 } });
await p.screenshot({ path: join(PASTA, "id-medidor.png"), fullPage: true, clip: { x: 128, y: 30800 + 150, width: 600, height: 300 } });

const par = async (nome, titulo, a, b) => {
  const pg = await (await n.newContext({ viewport: { width: 1280, height: 400 } })).newPage();
  writeFileSync(join(PASTA, "_par.html"), `<body style="margin:0;padding:16px;background:#F6F2EA;font:600 14px system-ui;color:#1A1024">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">
    <div><p>ID da Beec (prancha)</p><img src="${url(a)}" style="max-width:100%;border:1px solid #ccc"></div>
    <div><p>${titulo}</p><img src="${url(b)}" style="max-width:100%;border:1px solid #ccc"></div></div></body>`);
  await pg.goto(url("_par.html"));
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: join(PASTA, nome), fullPage: true });
};
await par("lado-botoes.png", "Tarefas: barra com botões, campo e medidor", "id-botoes.png", "tela-barra.png");
await par("lado-etiquetas-medidor.png", "Tarefas: agenda (etiqueta, marcador, pontinhos)", "id-etiquetas.png", "tela-agenda.png");
await par("lado-medidor.png", "Tarefas: medidor no contador (ver barra)", "id-medidor.png", "tela-barra.png");
await n.close();
rmSync(join(PASTA, "_par.html"));
console.log("ok");
