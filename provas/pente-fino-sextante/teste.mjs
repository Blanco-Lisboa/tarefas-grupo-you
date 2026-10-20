// Pente fino do Sextante (item 175): Calendário + Ficha, de verdade, contra o banco de mentira (provas/r7-caderno-cartao/banco-falso.mjs)
// e o app em 3199 (passo a passo em docs/levas/BRIEF-2026-10-20-alvenaria-157-158.md). Nada no banco real.
// Clica em cada botão, abre cada lista, mede transbordo (scrollWidth > clientWidth e peças fora da tela) e junta erros de página/console.
// Uso: node provas/pente-fino-sextante/teste.mjs [só-estas-larguras, ex.: 390]
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const BASE = "http://127.0.0.1:3199";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const cookie = (uid) => {
  const exp = 1893456000;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  return { name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" };
};
const so = process.argv[2] ? process.argv[2].split(",").map(Number) : null;
const achados = [];
const nota = (w, msg) => { achados.push(`[${w}] ${msg}`); console.log(`  ! [${w}] ${msg}`); };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });

const foto = async (p, nome) => {
  await p.evaluate(() => { document.getElementById("prova-iw")?.remove(); const d = document.createElement("div"); d.id = "prova-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:3px 8px;pointer-events:none"; document.body.append(d); });
  await p.waitForTimeout(350);
  await p.screenshot({ path: join(PASTA, `${nome}.png`) });
};

// Transbordo: página rolando para o lado, peças visíveis saindo da tela, texto cortado dentro de botões/rótulos.
const medir = (p, onde) => p.evaluate((onde) => {
  const r = [];
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) r.push(`página rola para o lado (${de.scrollWidth} > ${de.clientWidth})`);
  const raiz = document.querySelector(onde) ?? document.body;
  const visivel = (e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0; };
  const dentroDeRolagem = (e) => { for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { const o = getComputedStyle(x).overflowX; if ((o === "auto" || o === "scroll" || o === "hidden" || o === "clip") && x.scrollWidth > x.clientWidth + 1) return true; } return false; };
  for (const e of raiz.querySelectorAll("button, a, input, h1, h2, p, label, legend, .selecao-botao, [popover]:popover-open, dialog[open]")) {
    if (!visivel(e) || e.id === "prova-iw") continue;
    const b = e.getBoundingClientRect();
    const nome = (e.getAttribute("aria-label") || e.textContent || e.className || e.tagName).trim().replace(/\s+/g, " ").slice(0, 40);
    if ((b.right > innerWidth + 1 || b.left < -1) && !dentroDeRolagem(e)) r.push(`fora da tela: "${nome}" (${Math.round(b.left)}..${Math.round(b.right)} de ${innerWidth})`);
    if (b.bottom > innerHeight + 1 && e.matches("[popover]:popover-open, dialog[open]")) r.push(`janela passa do pé da tela: "${nome}" (${Math.round(b.bottom)} de ${innerHeight})`);
    const s = getComputedStyle(e);
    if (e.matches("button, .selecao-botao") && !e.matches(".cal-criar, .evento") && e.scrollWidth > e.clientWidth + 1 && s.textOverflow !== "ellipsis" && s.overflow !== "visible") r.push(`texto cortado no botão "${nome}" (${e.scrollWidth} > ${e.clientWidth})`);
  }
  for (const e of raiz.querySelectorAll(".ficha-corpo, .cal-barra, .cal-linha-filtros, .cal-semdata, .selecao-pop:popover-open")) {
    if (visivel(e) && e.scrollWidth > e.clientWidth + 1) r.push(`"${e.className.split(" ")[0]}" rola para o lado (${e.scrollWidth} > ${e.clientWidth})`);
  }
  return r;
}, onde);
const checar = async (p, w, onde, etapa) => { for (const m of await medir(p, onde)) nota(w, `${etapa}: ${m}`); };

async function abrir(w, h, quem = "u-natham") {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  await ctx.addCookies([cookie(quem)]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") erros.push("console: " + m.text()); });
  const salvos = [];
  p.on("request", (r) => { if (r.url().includes("/rest/v1/") && r.method() !== "GET") salvos.push({ metodo: r.method(), url: r.url().replace(/^.*rest\/v1\//, ""), corpo: r.postDataJSON() }); });
  return { ctx, p, erros, salvos };
}
const fechaListas = (p) => p.evaluate(() => document.querySelectorAll(":popover-open").forEach((x) => x.hidePopover()));

for (const [w, h] of [[1903, 900], [1440, 760], [390, 844]].filter(([w]) => !so || so.includes(w))) {
  console.log(`== ${w}x${h}`);
  const { ctx, p, erros, salvos } = await abrir(w, h);
  await p.goto(BASE + "/calendario", { waitUntil: "networkidle" });
  await p.locator(".cal-barra h1").waitFor();
  await p.waitForTimeout(600);
  // Prova de que o instrumento pega erro: provoca um e confere que chegou.
  await p.evaluate(() => setTimeout(() => { throw new Error("erro-provocado-pelo-teste"); }));
  await p.waitForTimeout(200);
  if (!erros.some((e) => e.includes("erro-provocado-pelo-teste"))) nota(w, "INSTRUMENTO: o erro provocado NÃO foi capturado");
  erros.length = 0;

  // Visões pelo seletor Visão (e pela tecla, que é o mesmo estado)
  for (const [v, rotulo] of [["semana", "Semana"], ["dia", "Dia"], ["mes", "Mês"], ["ano", "Ano"]]) {
    await p.locator(".cal-acoes .selecao-botao", { hasText: "Visão" }).click();
    await p.locator(".selecao-pop:popover-open").getByText(rotulo, { exact: true }).click();
    await p.waitForTimeout(250);
    const visao = await p.locator(".cal-painel").getAttribute("data-visao");
    if (visao !== v) nota(w, `Visão ${rotulo}: painel ficou em ${visao}`);
    await checar(p, w, ".cal", `visão ${rotulo}`);
    await foto(p, `cal-${v}-${w}`);
    const antes = await p.locator(".cal-barra h1").textContent();
    await p.getByRole("button", { name: "Próximo" }).click();
    const depois = await p.locator(".cal-barra h1").textContent();
    await p.getByRole("button", { name: "Anterior" }).click();
    const volta = await p.locator(".cal-barra h1").textContent();
    if (antes === depois || volta !== antes) nota(w, `Visão ${rotulo}: Anterior/Próximo não andam certo (${antes} → ${depois} → ${volta})`);
    await p.getByRole("button", { name: "Próximo" }).click();
    await p.getByRole("button", { name: "Hoje", exact: true }).click();
    if ((await p.locator(".cal-barra h1").textContent()) !== antes) nota(w, `Visão ${rotulo}: Hoje não volta ao período de hoje`);
  }
  // Teclas D S M A T
  await p.locator("body").press("m");
  if ((await p.locator(".cal-painel").getAttribute("data-visao")) !== "mes") nota(w, "tecla M não troca para Mês");
  await p.locator("body").press("s");

  // Filtros: abre cada um, mede a lista, escolhe a 1ª opção, confere "Limpar", limpa
  for (const g of ["Pessoa", "Rede", "Etapa", "Tipo"]) {
    await p.locator(".cal-filtros .selecao-botao", { hasText: g }).click();
    const pop = p.locator(".selecao-pop:popover-open");
    await pop.waitFor();
    await checar(p, w, "body", `filtro ${g} aberto`);
    if (g === "Pessoa") await foto(p, `cal-filtro-pessoa-${w}`);
    await pop.locator("[role=option], [role=menuitemcheckbox], li button, button").first().click();
    await fechaListas(p);
  }
  if (!(await p.locator(".cal-limpar").count())) nota(w, "Limpar filtros não apareceu depois de filtrar");
  else { await checar(p, w, ".cal", "com 4 filtros"); await foto(p, `cal-filtros-ativos-${w}`); await p.locator(".cal-limpar").click(); }
  if (await p.locator(".cal-limpar").count()) nota(w, "Limpar filtros não limpou");

  // Empresa (filtro global da casca, aqui só abre e mede)
  const empresa = p.locator(".cal-quem .selecao-botao").first();
  if (await empresa.count()) { await empresa.click(); await checar(p, w, "body", "filtro Empresa aberto"); await fechaListas(p); }

  // Sem data
  await p.locator(".cal-semdata-botao").click();
  await p.locator(".cal-semdata-pop:popover-open").waitFor();
  await checar(p, w, "body", "Sem data aberto");
  await foto(p, `cal-semdata-${w}`);
  await fechaListas(p);

  // Ficha nova pelo + Nova tarefa: abre cada seletor e o Começa
  await p.locator(".cal-nova").click();
  const ficha = p.locator("dialog.ficha[open]");
  await ficha.waitFor();
  await checar(p, w, "dialog.ficha", "ficha nova");
  await foto(p, `ficha-nova-${w}`);
  const pressionado = await ficha.locator(".ficha-pessoa[aria-pressed=true]").textContent();
  if (!pressionado?.includes("Natham")) nota(w, `ficha nova (logado Natham) marcou responsável ${pressionado}`);
  for (const g of ["Tipo", "Empresa", "Rede", "Etapa", "Tags"]) {
    await ficha.locator(".selecao-botao", { hasText: g }).first().click();
    await p.locator(".selecao-pop:popover-open").waitFor();
    await checar(p, w, "body", `ficha: lista ${g}`);
    if (g === "Tipo") await foto(p, `ficha-lista-tipo-${w}`);
    await fechaListas(p);
  }
  await ficha.locator(".campo-data-botao").click();
  await p.locator(".campo-data-pop:popover-open").waitFor();
  await checar(p, w, "body", "ficha: Começa aberto");
  await foto(p, `ficha-comeca-${w}`);
  await p.locator(".campo-data-pop:popover-open .campo-data-dia", { hasText: /^22$/ }).first().click();
  const sel = p.locator(".campo-data-pop:popover-open .btn", { hasText: "Selecionar" });
  if (await sel.count()) await sel.click();
  // Tipo Postagem mostra Objetivo; tag de aprovação mostra Quem aprova
  await ficha.locator(".selecao-botao", { hasText: "Tipo" }).first().click();
  await p.locator(".selecao-pop:popover-open").getByText("Postagem", { exact: true }).click();
  if (!(await ficha.getByPlaceholder("Para que serve este conteúdo?").count())) nota(w, "Tipo Postagem não mostrou Objetivo");
  await ficha.locator(".selecao-botao", { hasText: "Tags" }).first().click();
  await p.locator(".selecao-pop:popover-open").getByText("Esperando aprovação").click();
  await fechaListas(p);
  if (!(await ficha.locator(".selecao-botao", { hasText: "Quem aprova" }).count())) nota(w, "tag de aprovação não mostrou Quem aprova");
  await ficha.getByText("+ Adicionar link").click();
  await ficha.getByLabel("Endereço do link").fill("https://drive.google.com/x");
  if (!(await ficha.getByRole("link", { name: "Abrir" }).count())) nota(w, "link válido não mostrou Abrir");
  await ficha.locator("#ficha-notas").fill("Nota de teste com https://exemplo.com.br/ref");
  await ficha.locator(".ficha-titulo").fill("Teste do pente fino");
  await checar(p, w, "dialog.ficha", "ficha preenchida");
  await foto(p, `ficha-preenchida-${w}`);
  // Nova tag: abre, cancela com Esc (a ficha tem que continuar aberta)
  await ficha.locator(".selecao-botao", { hasText: "Tags" }).first().click();
  await p.locator(".selecao-pop:popover-open").getByText("Nova tag").click();
  await checar(p, w, "dialog.ficha", "ficha: Nova tag");
  if (w === 390) await foto(p, `ficha-nova-tag-${w}`);
  await ficha.getByLabel("Nome da nova tag").press("Escape");
  if (!(await p.locator("dialog.ficha[open]").count())) nota(w, "Esc na nova tag fechou a ficha inteira");
  salvos.length = 0;
  await ficha.locator(".ficha-pe .btn", { hasText: "Salvar" }).click();
  await p.waitForTimeout(500);
  if (await p.locator("dialog.ficha[open]").count()) nota(w, "Salvar não fechou a ficha");
  const ins = salvos.find((s) => s.metodo === "POST" && s.url.startsWith("tarefas"));
  if (!ins) nota(w, "Salvar não mandou a tarefa ao banco");
  else if (w === 1903) console.log("  salvo:", JSON.stringify({ titulo: ins.corpo.titulo, inicio: ins.corpo.inicio, fim: ins.corpo.fim, tipo: ins.corpo.tipo, responsavel: ins.corpo.responsavel_id, aprovador: ins.corpo.aprovador, links: ins.corpo.links }));

  // Ficha de uma tarefa existente (Post - Reels): abre pelo bloco na semana
  await p.locator(".evento", { hasText: "Post - Reels" }).first().click();
  await ficha.waitFor();
  await checar(p, w, "dialog.ficha", "ficha existente");
  await foto(p, `ficha-existente-${w}`);
  if (!(await ficha.locator(".ficha-excluir").count())) nota(w, "ficha existente sem Excluir");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  if (await p.locator("dialog.ficha[open]").count()) nota(w, "Esc não fechou a ficha");

  // Arrastar "Vídeo institucional" (sem data) para o dia 21 às 10h: tem que salvar sem fim
  if (w === 1903) {
    salvos.length = 0;
    await p.locator(".cal-semdata-botao").click();
    const alvo = p.locator(".grade-coluna").nth(3);
    const caixa = await alvo.boundingBox();
    await p.locator(".cal-semdata-pop .evento", { hasText: "Vídeo institucional" }).dragTo(alvo, { targetPosition: { x: 20, y: Math.min(caixa.height - 5, 10 * 48 - (await p.locator(".grade-rolagem").evaluate((x) => x.scrollTop)) + 5) } });
    await p.waitForTimeout(500);
    const mov = salvos.find((s) => s.metodo === "PATCH");
    console.log("  arrastado:", mov ? JSON.stringify({ inicio: mov.corpo.inicio, fim: mov.corpo.fim, dia_inteiro: mov.corpo.dia_inteiro }) : "NADA SALVO");
    if (!mov) nota(w, "arrastar da lista Sem data para a grade não salvou");
    else if (mov.corpo.fim) nota(w, `arrastar sem data para horário criou fim ${mov.corpo.fim}`);
    await fechaListas(p);
  }

  // Mês e Ano: clique no número leva ao dia; "+N mais"; dia do ano leva ao dia
  await p.locator("body").press("m");
  await p.locator(".mes-numero").nth(10).click();
  if ((await p.locator(".cal-painel").getAttribute("data-visao")) !== "dia") nota(w, "número do dia no Mês não abriu o Dia");
  await p.locator("body").press("a");
  await p.locator(".ano-dia[data-hoje=true]").click();
  if ((await p.locator(".cal-painel").getAttribute("data-visao")) !== "dia") nota(w, "dia no Ano não abriu o Dia");
  await p.locator("body").press("a");
  await p.locator(".ano-titulo").first().click();
  if ((await p.locator(".cal-painel").getAttribute("data-visao")) !== "mes") nota(w, "mês no Ano não abriu o Mês");

  for (const e of erros) nota(w, `ERRO: ${e}`);
  await ctx.close();
}

// Matheus logado: nova tarefa pelo calendário tem que vir com ele de responsável
if (!so || so.includes(1440)) {
  const { ctx, p, salvos, erros } = await abrir(1440, 760, "u-matheus");
  await p.goto(BASE + "/calendario", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.locator(".cal-nova").click();
  const marcado = await p.locator("dialog.ficha[open] .ficha-pessoa[aria-pressed=true]").textContent();
  console.log("Matheus logado, responsável marcado na ficha nova:", marcado);
  if (!marcado.includes("Matheus")) nota(1440, `Matheus logado: ficha nova marcou ${marcado}`);
  for (const e of erros) nota(1440, `ERRO (Matheus): ${e}`);
  void salvos;
  await ctx.close();
}

await nav.close();
console.log(achados.length ? `\n${achados.length} achado(s):\n` + achados.join("\n") : "\nnenhum achado");

// Banco recusa o Salvar (item 3 da Lupa): a ficha tem que ficar aberta, com o texto e o aviso; e dois cliques em Salvar = um envio só.
{
  const nav2 = await chromium.launch({ args: ["--window-position=-3000,0"] });
  const ctx = await nav2.newContext({ viewport: { width: 1440, height: 760 } });
  await ctx.addCookies([cookie("u-natham")]);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  let recusar = true, envios = 0;
  await p.route("**/rest/v1/tarefas**", (r) => {
    if (r.request().method() === "GET") return r.continue();
    envios++;
    return recusar ? r.fulfill({ status: 500, contentType: "application/json", body: '{"message":"falha de teste"}' }) : r.continue();
  });
  await p.goto(BASE + "/calendario", { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  await p.locator(".cal-nova").click();
  await p.locator(".ficha-titulo").fill("Texto que não pode sumir");
  await p.locator(".ficha-pe .btn", { hasText: "Salvar" }).click();
  await p.waitForTimeout(600);
  const aberta = await p.locator("dialog.ficha[open]").count();
  const titulo = aberta ? await p.locator(".ficha-titulo").inputValue() : "";
  const aviso = aberta ? await p.locator(".ficha-erro").textContent().catch(() => "") : "";
  console.log("banco recusou:", JSON.stringify({ aberta: !!aberta, titulo, aviso }));
  if (!aberta || titulo !== "Texto que não pode sumir" || !aviso) nota(1440, "falha ao salvar: ficha fechou ou perdeu o texto ou não avisou");
  await foto(p, "ficha-falha-ao-salvar-1440");
  recusar = false; envios = 0;
  await p.locator(".ficha-pe .btn", { hasText: "Salvar" }).dblclick();
  await p.waitForTimeout(600);
  console.log("dois cliques em Salvar:", JSON.stringify({ envios, fechou: !(await p.locator("dialog.ficha[open]").count()) }));
  if (envios !== 1) nota(1440, `dois cliques em Salvar mandaram ${envios} envios`);
  await nav2.close();
  console.log(achados.length ? `${achados.length} achado(s) no total` : "nenhum achado no total");
}
