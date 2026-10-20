// Item 193 (Pena): anotações do Caderno no banco; Natham lê as do Matheus. Banco falso (3293), app construído apontando para ele e servido em 3193.
// Uso: node provas/r193-caderno/fotos.mjs
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
const banco = async () => (await fetch("http://127.0.0.1:3293/__registro")).json();

async function abrir(pessoa, largura, altura, antigas = {}) {
  const uid = `u-${pessoa}`;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: `${pessoa}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  await contexto.addInitScript((m) => { for (const [k, v] of Object.entries(m)) if (!localStorage.getItem(`__visto:${k}`)) { localStorage.setItem(k, v); localStorage.setItem(`__visto:${k}`, "1"); } }, antigas);
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto("http://127.0.0.1:3193/tarefas", { waitUntil: "networkidle" });
  await pagina.locator(".agenda").waitFor();
  return { contexto, pagina, erros };
}
const marca = (pagina) => pagina.evaluate(() => {
  const d = document.createElement("div");
  d.textContent = `innerWidth ${innerWidth}`;
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
const notas = (p) => p.locator(".ag-bloco-notas textarea");
const lembrar = (p) => p.locator(".ag-blocos label.ag-bloco:not(.ag-bloco-notas) textarea");

for (const [largura, altura] of [[1903, 900], [1440, 760]]) {
  // Natham: abre com anotações antigas do navegador (dia 21) para provar que sobem; vê a dele; espia a do Matheus.
  const n = await abrir("natham", largura, altura, { "grade:caderno:2026-10-21:notas": "Lembrar de pedir o orçamento da gráfica (do navegador)" });
  await n.pagina.waitForFunction(() => document.querySelector(".ag-bloco-notas textarea")?.value.includes("Natham"));
  confere((await notas(n.pagina).inputValue()).includes("Revisar a aprovação"), `natham ${largura}: anotação dele vem do banco`);
  await n.pagina.waitForTimeout(800);
  const sobiu = (await banco()).anotacoes_dia.find((l) => l.dono_id === "p-natham" && l.dia === "2026-10-21");
  confere(sobiu?.texto.includes("orçamento da gráfica") && await n.pagina.evaluate(() => localStorage.getItem("grade:caderno:2026-10-21:notas")) === null, `natham ${largura}: anotação do navegador subiu para o banco e saiu do navegador`);
  await notas(n.pagina).fill("Revisar a aprovação dos reels (Natham). Editado agora.");
  await n.pagina.waitForTimeout(1200);
  confere((await banco()).anotacoes_dia.find((l) => l.dono_id === "p-natham" && l.dia === "2026-10-20")?.texto.endsWith("Editado agora."), `natham ${largura}: o que ele escreve é gravado no banco`);
  await marca(n.pagina);
  await n.pagina.screenshot({ path: join(pasta, `natham-dele-${largura}.png`) });

  await n.pagina.getByRole("button", { name: /Caderno de/ }).click();
  await n.pagina.locator(".selecao-pop:popover-open .selecao-opcao", { hasText: "Matheus" }).click();
  await n.pagina.waitForFunction(() => document.querySelector(".ag-bloco-notas textarea")?.value.includes("Ligar para o cliente"));
  confere(await notas(n.pagina).evaluate((e) => e.readOnly) && await lembrar(n.pagina).evaluate((e) => e.readOnly), `natham ${largura}: no caderno do Matheus as anotações são só leitura`);
  confere((await lembrar(n.pagina).inputValue()).includes("Canva"), `natham ${largura}: "Não esquecer" do Matheus aparece`);
  confere(await n.pagina.locator(".ag-evento", { hasText: "Alinhamento de pauta com a Beec" }).count() === 1, `natham ${largura}: agenda do Matheus aparece (com dado no banco)`);
  const antes = (await banco()).registro.length;
  await notas(n.pagina).press("End").catch(() => {});
  await n.pagina.keyboard.type("x");
  await n.pagina.waitForTimeout(900);
  confere((await banco()).registro.length === antes, `natham ${largura}: digitar no caderno do Matheus não grava nada`);
  await marca(n.pagina);
  await n.pagina.screenshot({ path: join(pasta, `natham-ve-matheus-${largura}.png`) });
  confere(!n.erros.length, `natham ${largura}: sem erro na página ${JSON.stringify(n.erros)}`);
  await n.contexto.close();

  // Matheus: vê as dele, sem o seletor "Caderno de"; e o banco não entrega as do Natham.
  const m = await abrir("matheus", largura, altura);
  await m.pagina.waitForFunction(() => document.querySelector(".ag-bloco-notas textarea")?.value.includes("Ligar para o cliente"));
  confere(await m.pagina.getByRole("button", { name: /Caderno de/ }).count() === 0, `matheus ${largura}: sem seletor Caderno de`);
  confere(!(await notas(m.pagina).inputValue()).includes("Natham") && !(await notas(m.pagina).evaluate((e) => e.readOnly)), `matheus ${largura}: vê só as dele, e pode escrever`);
  await marca(m.pagina);
  await m.pagina.screenshot({ path: join(pasta, `matheus-dele-${largura}.png`) });
  confere(!m.erros.length, `matheus ${largura}: sem erro na página ${JSON.stringify(m.erros)}`);
  await m.contexto.close();
}

await navegador.close();
process.exit(falhas ? 1 : 0);
