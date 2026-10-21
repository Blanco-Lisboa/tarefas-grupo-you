// Régua 215, volta 2 (Sextante), em 1440 x 760 e 1903 x 900. Mesma prévia do fotos.mjs (banco falso 3497 com PREVIA=1 e data
// fixa em 20/10, app 3297). Uso: node provas/r208-ficha/regua-215-v2.mjs antes|depois
// 1 Calendário (semana): cards curtos no mesmo horário mostram o título inteiro ou pelo menos 18 caracteres; com 3 no mesmo
//   horário, o que não cabe vira "+N" e a lista mostra os nomes inteiros e abre a ficha.
// 2 Ficha de Reels Postado COM capa própria: a miniatura da capa continua abrindo a capa grande; editar (soltar, ×) não aparece.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const fase = process.argv[2] ?? "depois";
const pasta = fileURLToPath(new URL("./", import.meta.url));
const caminhoBanco = fileURLToPath(new URL("../r196-postagem/banco-falso.mjs", import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp: 1893456000, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: 1893456000, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", ignoreDefaultArgs: ["--hide-scrollbars"] });
const banco = spawn(process.execPath, ["--import", new URL("./data-fixa.mjs", import.meta.url).href, caminhoBanco], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PREVIA: "1", PORTA: "3497" } });
await new Promise((ok) => banco.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(); }));
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${fase}: ${texto}`); };
const TERCEIRO = "Reels: dica de pró-labore";

/** Página nova. `terceiro`: mais um card às 09:00 de 20/10 (cópia do Carrossel). `capa`: capa própria no Reels Postado (Depoimento). */
async function abrir(largura, altura, { terceiro = false, capa = false } = {}) {
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura } });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pg = await contexto.newPage();
  await pg.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  if (terceiro) await pg.route(/\/rest\/v1\/tarefas\?/, async (rota) => {
    if (rota.request().method() !== "GET") return rota.continue();
    const r = await rota.fetch(), linhas = await r.json();
    const base = linhas.find((l) => l.titulo === "Carrossel: prazo do MEI");
    return rota.fulfill({ response: r, json: base ? [...linhas, { ...base, id: "t99", titulo: TERCEIRO, formato: "reels" }] : linhas });
  });
  if (capa) await pg.route(/\/rest\/v1\/arquivos\?/, async (rota) => {
    if (rota.request().method() !== "GET") return rota.continue();
    const r = await rota.fetch(), linhas = await r.json();
    return rota.fulfill({ response: r, json: [...linhas, { id: "a-capa", tarefa_id: "t6", caminho: null, drive_id: "drive-capa", nome: "capa-depoimento.png", tipo: "imagem", tamanho: 1, ordem: 0, papel: "capa" }] });
  });
  await pg.goto(`http://127.0.0.1:3297/${capa ? "conteudos" : "calendario"}`, { waitUntil: "networkidle" });
  const marca = () => pg.evaluate(() => {
    document.querySelector("#marca-largura")?.remove();
    const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth}` });
    d.style.cssText = "position:fixed;left:4px;top:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  return { pg, marca, fim: () => contexto.close() };
}
/** Quantos caracteres do título aparecem inteiros dentro da caixa do título (antes de ser cortado ou esmaecer). */
const visiveis = (pg) => pg.evaluate(() => [...document.querySelectorAll(".evento-bloco.evento-curto")].map((b) => {
  const t = b.querySelector(".evento-titulo"), no = t.firstChild, limite = t.getBoundingClientRect().right - 4, r = document.createRange();
  let n = 0;
  for (; n < no.length; n++) { r.setStart(no, n); r.setEnd(no, n + 1); if (r.getBoundingClientRect().right > limite + 0.5) break; }
  const caixa = b.getBoundingClientRect();
  return { titulo: t.textContent, tamanho: t.textContent.length, visiveis: n, largura: Math.round(caixa.width), topo: Math.round(caixa.top) };
}));

for (const [largura, altura] of [[1440, 760], [1903, 900]]) {
  // 1a) dois às 09:00
  let { pg, marca, fim } = await abrir(largura, altura);
  await pg.locator(".evento-bloco").first().waitFor();
  const dois = (await visiveis(pg)).filter((c) => ["Carrossel: prazo do MEI", "Depoimento de cliente"].includes(c.titulo));
  console.log(`   ${largura} dois às 09:00:`, JSON.stringify(dois));
  confere(dois.length === 2 && dois.every((c) => c.visiveis === c.tamanho || c.visiveis >= 18), `${largura} dois no mesmo horário: título inteiro ou ≥ 18 caracteres (${dois.map((c) => `${c.visiveis}/${c.tamanho}`).join(", ")})`);
  const caixa = await pg.locator(".evento-bloco").filter({ hasText: "Carrossel: prazo do MEI" }).boundingBox();
  await marca();
  await pg.screenshot({ path: join(pasta, `215r2-calendario-dois-${fase}-${largura}.png`), clip: { x: caixa.x - 110, y: caixa.y - 70, width: Math.min(420, largura - caixa.x + 110), height: 150 } });
  await fim();

  // 1b) três às 09:00: pilha + "+N" com a lista
  ({ pg, marca, fim } = await abrir(largura, altura, { terceiro: true }));
  await pg.locator(".evento-bloco").first().waitFor();
  const tres = (await visiveis(pg)).filter((c) => ["Carrossel: prazo do MEI", "Depoimento de cliente", TERCEIRO].includes(c.titulo));
  const mais = pg.locator(".grade-mais");
  console.log(`   ${largura} três às 09:00:`, JSON.stringify(tres), "mais:", await mais.count() ? await mais.innerText() : "nenhum");
  confere(tres.every((c) => c.visiveis === c.tamanho || c.visiveis >= 18) && await mais.count() === 1, `${largura} três no mesmo horário: os visíveis legíveis e um "+N" (${tres.map((c) => `${c.visiveis}/${c.tamanho}`).join(", ")}; ${await mais.count() ? await mais.innerText() : "sem +N"})`);
  if (await mais.count()) {
    const b = await mais.boundingBox();
    await marca();
    await pg.screenshot({ path: join(pasta, `215r2-calendario-tres-${fase}-${largura}.png`), clip: { x: b.x - 110, y: b.y - 100, width: Math.min(420, largura - b.x + 110), height: 170 } });
    await mais.click();
    const lista = pg.locator(".selecao-pop:popover-open");
    await lista.waitFor();
    const nomes = await lista.locator(".selecao-opcao").allInnerTexts();
    confere(nomes.length === Number((await mais.innerText()).match(/\d+/)[0]) && nomes.every((n) => /^\d\d:\d\d\s+\S/.test(n)), `${largura} lista do "+N" com hora e nome inteiro (${nomes.join(" | ")})`);
    const l = await lista.boundingBox();
    await marca();
    await pg.screenshot({ path: join(pasta, `215r2-calendario-lista-${fase}-${largura}.png`), clip: { x: Math.max(0, Math.min(b.x, l.x) - 20), y: b.y - 60, width: Math.min(460, largura - Math.min(b.x, l.x) + 20), height: Math.min(altura - b.y + 60, l.y + l.height - b.y + 80) } });
    await lista.locator(".selecao-opcao").first().click();
    await pg.locator(".ficha-cartao").waitFor({ timeout: 3000 }).catch(() => {});
    confere(await pg.locator(".ficha-cartao").isVisible(), `${largura} clicar na lista abre a ficha`);
  }
  await fim();

  // 2) Reels Postado com capa própria: miniatura abre a capa grande; sem área de soltar nem ×
  ({ pg, marca, fim } = await abrir(largura, altura, { capa: true }));
  await pg.locator(".conteudos-cartao").filter({ hasText: "Depoimento de cliente" }).locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  const bloco = ficha.locator(".ficha-capa");
  await bloco.scrollIntoViewIfNeeded();
  const mini = bloco.locator(".ficha-anexo-mini");
  const estado = { mini: await mini.count(), desligada: await mini.isDisabled().catch(() => null), soltar: await bloco.locator(".ficha-anexo-solta").isVisible(), tirar: await bloco.locator(".ficha-anexo-tirar").isVisible().catch(() => false) };
  estado.texto = await bloco.locator(".ficha-dica").first().innerText().catch(() => "");
  confere(estado.mini === 1 && estado.desligada === false && !estado.soltar && !estado.tirar, `${largura} Postado com capa própria: miniatura ligada, sem soltar nem × (${JSON.stringify(estado)})`);
  const c = await bloco.boundingBox();
  await marca();
  await pg.screenshot({ path: join(pasta, `215r2-ficha-postado-capa-${fase}-${largura}.png`), clip: { x: c.x - 24, y: Math.max(0, c.y - 24), width: c.width + 48, height: c.height + 48 } });
  if (estado.desligada === false) {
    await mini.click();
    await pg.locator(".ficha-grande[open]").waitFor({ timeout: 3000 }).catch(() => {});
    confere(await pg.locator(".ficha-grande[open]").isVisible(), `${largura} clicar na miniatura abre a capa grande`);
  } else confere(false, `${largura} clicar na miniatura abre a capa grande (botão desligado)`);
  await fim();
}

banco.kill();
await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(0);
