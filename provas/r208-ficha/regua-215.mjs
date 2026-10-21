// Pente fino da Régua 215, achados 1 a 5 (Sextante): fotos e medidas no navegador, em 1440 x 760 e 1903 x 900.
// Mesma prévia do fotos.mjs (banco falso 3497 com PREVIA=1, app 3297). Uso: node provas/r208-ficha/regua-215.mjs antes|depois
// 1 Esteira: as 6 colunas cabem (scrollWidth == clientWidth do quadro) e nada transborda dentro das colunas.
// 2 Calendário: título dos blocos curtos lado a lado com pelo menos a 1ª palavra inteira à vista.
// 3 Ficha Postado: sem "Começar" e sem "Anexe o vídeo..."; Aprovado sem "Começar".
// 4 Capa do Reels: miniatura com a altura dos controles (sem vão).
// 5 Descrição do post: 2 linhas com texto curto, cresce com o texto até o limite.
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
const medidas = {};

for (const [largura, altura] of [[1440, 760], [1903, 900]]) {
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura } });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pg = await contexto.newPage();
  await pg.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  const marca = () => pg.evaluate(() => {
    document.querySelector("#marca-largura")?.remove();
    const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth}` });
    d.style.cssText = "position:fixed;left:4px;top:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  const foto = async (nome, clip) => { await marca(); await pg.screenshot({ path: join(pasta, `215r-${nome}-${fase}-${largura}.png`), clip }); };
  const m = (medidas[largura] = {});

  // 1) Esteira
  await pg.goto("http://127.0.0.1:3297/conteudos", { waitUntil: "networkidle" });
  await pg.locator(".conteudos-cartao").first().waitFor();
  m.esteira = await pg.evaluate(() => {
    const q = document.querySelector(".conteudos-quadro");
    const colunas = [...q.querySelectorAll(".conteudos-coluna")];
    const transborda = [...q.querySelectorAll(".conteudos-coluna-topo, .conteudos-coluna h2, .conteudos-cartao, .conteudos-cartao-rodape, .conteudos-cartao-topo")]
      .filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => `${e.className.split(" ")[0]}:${e.textContent.trim().slice(0, 20)}`);
    const titulos = [...q.querySelectorAll(".conteudos-titulo")].map((t) => parseFloat(getComputedStyle(t).fontSize));
    return { clientWidth: q.clientWidth, scrollWidth: q.scrollWidth, coluna: Math.round(colunas[0].getBoundingClientRect().width), fimUltima: Math.round(colunas.at(-1).getBoundingClientRect().right), fimQuadro: Math.round(q.getBoundingClientRect().right), transborda, fonteTitulo: Math.min(...titulos) };
  });
  console.log(`   esteira ${largura}:`, JSON.stringify(m.esteira));
  confere(m.esteira.scrollWidth <= m.esteira.clientWidth && m.esteira.fimUltima <= m.esteira.fimQuadro, `${largura} Esteira: as 6 colunas cabem (scroll ${m.esteira.scrollWidth} / visível ${m.esteira.clientWidth}, coluna ${m.esteira.coluna}px)`);
  confere(m.esteira.transborda.length === 0, `${largura} Esteira: nada transborda nas colunas e cards (${m.esteira.transborda.join(", ") || "nenhum"})`);
  await foto("1-esteira");

  // 2) Calendário semanal: blocos curtos
  await pg.goto("http://127.0.0.1:3297/calendario", { waitUntil: "networkidle" });
  await pg.locator(".evento-bloco").first().waitFor();
  m.calendario = await pg.evaluate(() => [...document.querySelectorAll(".evento-bloco.evento-curto")].map((b) => {
    const t = b.querySelector(".evento-titulo");
    const medir = document.createElement("span");
    medir.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${getComputedStyle(t).font}`;
    medir.textContent = t.textContent.split(" ")[0];
    document.body.append(medir);
    const palavra = medir.getBoundingClientRect().width; medir.remove();
    return { titulo: t.textContent, bloco: Math.round(b.getBoundingClientRect().width), visivel: Math.round(t.clientWidth), primeiraPalavra: Math.round(palavra) };
  }));
  console.log(`   calendário ${largura}:`, JSON.stringify(m.calendario));
  confere(m.calendario.length > 0 && m.calendario.every((c) => c.visivel >= c.primeiraPalavra), `${largura} Calendário: todo bloco curto mostra ao menos a 1ª palavra inteira do título`);
  const bloco = await pg.locator(".evento-bloco.evento-curto").filter({ hasText: "Carrossel: prazo do MEI" }).first().boundingBox();
  if (bloco) await foto("2-calendario-9h", { x: bloco.x - 110, y: bloco.y - 70, width: Math.min(360, largura - bloco.x + 110), height: 140 });

  // 3) Ficha Postado e Aprovado
  await pg.goto("http://127.0.0.1:3297/conteudos", { waitUntil: "networkidle" });
  await pg.locator(".conteudos-cartao").first().waitFor();
  const abrir = async (titulo) => {
    await pg.locator(".conteudos-cartao").filter({ hasText: titulo }).locator(".conteudos-titulo").click();
    await pg.locator(".ficha-cartao").waitFor();
    await pg.waitForTimeout(400);
    return pg.locator(".ficha-cartao");
  };
  const fechar = async () => { await pg.keyboard.press("Escape"); await pg.waitForTimeout(300); };
  let ficha = await abrir("Depoimento de cliente");
  m.postado = { comecar: await ficha.getByRole("button", { name: "Começar" }).count(), anexeVideo: (await ficha.innerText()).includes("Anexe o vídeo"), links: await ficha.locator(".publicacao a").count() };
  m.postado.vaoCapa = await ficha.locator(".ficha-capa").evaluate((f) => Math.round(f.querySelector(".ficha-dica").getBoundingClientRect().top - f.querySelector("legend").getBoundingClientRect().bottom));
  confere(m.postado.vaoCapa <= 16, `${largura} ficha Postado: sem vão entre "Capa do Reels" e o aviso (${m.postado.vaoCapa}px)`);
  confere(m.postado.comecar === 0 && !m.postado.anexeVideo && m.postado.links === 2, `${largura} ficha Postado: sem Começar, sem "Anexe o vídeo", com os 2 links (${JSON.stringify(m.postado)})`);
  await foto("3-ficha-postado");
  await pg.locator(".ficha-corpo").evaluate((c) => { c.scrollTop = c.scrollHeight; });
  await foto("3-ficha-postado-fim");
  await fechar();
  ficha = await abrir("Dica rápida de IR");
  m.aprovado = { comecar: await ficha.getByRole("button", { name: "Começar" }).count(), situacao: await ficha.locator(".publicacao .aprovacao-situacao").first().innerText().catch(() => "") };
  confere(m.aprovado.comecar === 0, `${largura} ficha Aprovado/Programado: sem Começar (${JSON.stringify(m.aprovado)})`);
  await fechar();

  // 4) e 5) Capa do Reels e Descrição do post (Reels em análise, descrição curta; Reels do Adrian, descrição longa)
  ficha = await abrir("Reels: bastidores do escritório");
  await ficha.locator(".ficha-capa-quadro").scrollIntoViewIfNeeded();
  await pg.waitForTimeout(300);
  m.capa = await ficha.evaluate((f) => {
    const v = f.querySelector(".ficha-capa-quadro video, .ficha-capa-vazio").getBoundingClientRect(), c = f.querySelector(".ficha-capa-controles").getBoundingClientRect();
    return { miniatura: [Math.round(v.width), Math.round(v.height)], controles: Math.round(c.height), vao: Math.round(v.height - c.height) };
  });
  confere(Math.abs(m.capa.vao) <= 8, `${largura} Capa do Reels: miniatura com a altura dos controles (${JSON.stringify(m.capa)})`);
  const descricao = async () => ficha.locator("textarea.ficha-legenda-texto").evaluate((t) => {
    const s = getComputedStyle(t), linha = parseFloat(s.lineHeight);
    return { altura: Math.round(t.getBoundingClientRect().height), linhasCabem: Math.round((t.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)) / linha), linhasTexto: Math.round((t.scrollHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)) / linha) };
  });
  m.descricaoCurta = await descricao();
  confere(m.descricaoCurta.linhasCabem <= 2, `${largura} Descrição curta: começa com 2 linhas (${JSON.stringify(m.descricaoCurta)})`);
  const caixa = await ficha.locator(".ficha-capa").boundingBox();
  const campo = await ficha.locator("textarea.ficha-legenda-texto").boundingBox();
  await foto("4-5-descricao-e-capa", { x: caixa.x - 24, y: Math.max(0, campo.y - 40), width: caixa.width + 48, height: Math.min(altura - Math.max(0, campo.y - 40), caixa.y + caixa.height - campo.y + 60) });
  await ficha.locator("textarea.ficha-legenda-texto").fill(Array.from({ length: 20 }, (_, i) => `Linha ${i + 1} da descrição do post`).join("\n"));
  m.descricaoLonga = await descricao();
  confere(m.descricaoLonga.linhasCabem >= 10 && m.descricaoLonga.linhasCabem < 20, `${largura} Descrição longa: cresce até o limite e depois rola (${JSON.stringify(m.descricaoLonga)})`);
  await fechar();
  await contexto.close();
}

banco.kill();
await navegador.close();
console.log(JSON.stringify(medidas));
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(0);
