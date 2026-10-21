// Itens 208 a 211 (Sextante): Aprovar/Consertar no topo da ficha, redes da Publicação, alinhamento da ficha e "Descrição do post".
// Banco falso do 196 (PREVIA=1 por causa do Reels do Adrian) na porta 3497; app em 3297 apontando para ele:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3497 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=falsa next dev -p 3297
// Uso: node provas/r208-ficha/fotos.mjs antes   (código antigo: só fotos)
//      node provas/r208-ficha/fotos.mjs depois  (fotos + conferências)
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const fase = process.argv[2] ?? "depois";
const pasta = fileURLToPath(new URL("./", import.meta.url));
const banco = fileURLToPath(new URL("../r196-postagem/banco-falso.mjs", import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const exp = 1893456000;
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };

function subirBanco() {
  const p = spawn(process.execPath, [banco], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PREVIA: "1", PORTA: "3497" } });
  return new Promise((ok) => p.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(p); }));
}
async function abrir(largura = 1440, altura = 760) {
  const uid = "u-natham";
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura } });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const pedidos = [];
  pagina.on("request", (r) => { if (r.url().includes("/rpc/") && r.method() !== "GET") pedidos.push({ url: r.url(), corpo: r.postDataJSON?.() }); });
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto("http://127.0.0.1:3297/conteudos", { waitUntil: "networkidle" });
  await pagina.locator(".conteudos-cartao").first().waitFor();
  return { contexto, pagina, pedidos };
}
const marca = (pagina) => pagina.evaluate(() => {
  document.querySelector("#marca-largura")?.remove();
  const d = document.createElement("div");
  d.id = "marca-largura";
  d.textContent = `innerWidth ${innerWidth}`;
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
const foto = async (pagina, nome, clip) => { await marca(pagina); await pagina.screenshot({ path: join(pasta, `${nome}.png`), clip }); };
const cartao = (pg, titulo) => pg.locator(".conteudos-cartao").filter({ hasText: titulo });
async function abrirFicha(pg, titulo) {
  await cartao(pg, titulo).locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  await pg.waitForTimeout(400);
  return ficha;
}
const fechar = async (pg) => { if (await pg.locator(".ficha-cartao").isVisible()) { await pg.keyboard.press("Escape"); await pg.waitForTimeout(300); } };
/** A ficha inteira, rolando o corpo de tela em tela. */
async function fichaInteira(pg, nome) {
  const corpo = pg.locator(".ficha-corpo");
  const [alto, visivel] = await corpo.evaluate((c) => [c.scrollHeight, c.clientHeight]);
  let i = 1;
  for (let y = 0; ; y += visivel - 60, i++) {
    await corpo.evaluate((c, v) => { c.scrollTop = v; }, y);
    await pg.waitForTimeout(200);
    await foto(pg, `${nome}-${i}`);
    if (y + visivel >= alto) break;
  }
}
const BASTIDORES = "Reels: bastidores do escritório";
const ADRIAN = "Adrian Reels - Calculo do Simples Nacional";

let proc = await subirBanco();
let { contexto, pagina: pg, pedidos } = await abrir();

// 208: card da Esteira em Em análise
const card = cartao(pg, BASTIDORES);
await card.scrollIntoViewIfNeeded();
const caixa = await card.boundingBox();
await foto(pg, `208-card-${fase}-1440`);
await foto(pg, `208-card-perto-${fase}-1440`, { x: caixa.x - 16, y: Math.max(0, caixa.y - 70), width: caixa.width + 32, height: caixa.height + 90 });
if (fase === "depois") confere(await card.locator(".aprovacao-botao").count() === 0, "208: card Em análise sem Aprovar/Consertar");

// 208: topo da ficha
let ficha = await abrirFicha(pg, BASTIDORES);
await foto(pg, `208-ficha-topo-${fase}-1440`);
if (fase === "depois") {
  const topo = ficha.locator(".ficha-faixa-topo");
  const [aprovar, consertar, fecharB, comecar, titulo] = await Promise.all([
    topo.getByRole("button", { name: "Aprovar" }).boundingBox(), topo.getByRole("button", { name: "Consertar" }).boundingBox(),
    topo.getByRole("button", { name: "Fechar" }).boundingBox(), topo.getByRole("button", { name: "Começar" }).boundingBox(), ficha.locator(".ficha-titulo").boundingBox(),
  ]);
  confere(aprovar && consertar, "208: Aprovar e Consertar no topo da ficha");
  confere([aprovar, consertar].every((b) => b.height === fecharB.height && b.height === comecar.height && Math.abs(b.y - fecharB.y) < 1), `208: mesma altura e linha de Começar/Fechar (${aprovar.height}px)`);
  confere([aprovar, consertar, fecharB].every((b) => b.y + b.height <= titulo.y), "208: nada encosta no título");
  confere(fecharB.width >= 50 && consertar.x + consertar.width <= fecharB.x - 4, `208: Fechar inteiro (${Math.round(fecharB.width)}px) e separado`);
  const cores = await topo.evaluate((t) => ["aprovar", "consertar"].map((a) => getComputedStyle(t.querySelector(`[data-acao=${a}]`)).backgroundColor + " / " + getComputedStyle(t.querySelector(`[data-acao=${a}]`)).color));
  console.log("   cores:", cores.join(" | "));

  // Aprovar na ficha: grava Aprovado e a ficha mostra o novo estado (Etapa, bloco Publicação, botões somem)
  await topo.getByRole("button", { name: "Aprovar" }).click();
  await pg.waitForTimeout(800);
  const salvo = pedidos.filter((p) => p.url.includes("/rpc/salvar_tarefa")).at(-1)?.corpo?.p;
  confere(salvo?.etapa === "aprovado", "208: Aprovar grava etapa = aprovado");
  confere(await topo.getByRole("button", { name: "Aprovar" }).count() === 0 && await ficha.locator(".publicacao").count() === 1 && (await ficha.innerText()).includes("Aprovado"), "208: ficha aberta mostra Aprovado e o bloco Publicação");
  await foto(pg, "208-ficha-depois-de-aprovar-1440");
  await fechar(pg);
  confere(await cartao(pg, BASTIDORES).locator(".aprovacao-situacao").count() === 1, "208: card foi para Aprovado (linha de estado)");
  await foto(pg, "208-esteira-depois-de-aprovar-1440");

  // Consertar: banco novo (o card volta para Em análise)
  await contexto.close(); proc.kill();
  proc = await subirBanco();
  ({ contexto, pagina: pg, pedidos } = await abrir());
  ficha = await abrirFicha(pg, BASTIDORES);
  await ficha.locator(".ficha-faixa-topo").getByRole("button", { name: "Consertar" }).click();
  await pg.waitForTimeout(800);
  const conserto = pedidos.filter((p) => p.url.includes("/rpc/salvar_tarefa")).at(-1)?.corpo?.p;
  confere(conserto?.etapa === "edicao" && conserto?.conserto === true, "208: Consertar grava etapa = edição com a etiqueta Conserto");
  confere(await ficha.getByRole("button", { name: "Consertar" }).count() === 0 && (await ficha.innerText()).includes("Edição"), "208: ficha aberta mostra Edição");
  await foto(pg, "208-ficha-depois-de-consertar-1440");
  // Salvar depois de agir não desfaz a ação
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(800);
  const depois = pedidos.filter((p) => p.url.includes("/rpc/salvar_tarefa")).at(-1)?.corpo?.p;
  confere(depois?.etapa === "edicao" && depois?.conserto === true, "208: Salvar depois do Consertar mantém Edição + Conserto");
  const consertado = cartao(pg, BASTIDORES);
  await consertado.scrollIntoViewIfNeeded();
  confere(await consertado.locator(".selo-conserto").count() === 1, "208: card em Edição com a etiqueta Conserto");
  await foto(pg, "208-esteira-depois-de-consertar-1440");
} else await fechar(pg);

// 209/210/211: a ficha inteira do Reels do Adrian (Aprovado)
ficha = await abrirFicha(pg, ADRIAN);
await fichaInteira(pg, `210-ficha-${fase}-1440`);
if (fase === "depois") {
  const bloco = ficha.locator(".publicacao");
  await bloco.scrollIntoViewIfNeeded();
  const redes = bloco.locator(".aprovacao-rede");
  confere(await redes.count() === 2 && await bloco.locator(".aprovacao-rede[aria-pressed=true]").count() === 2, "209: as duas redes escolhidas");
  await foto(pg, "209-redes-as-duas-1440");
  await redes.filter({ hasText: "Instagram" }).click();
  await pg.mouse.move(5, 5); // sem o mouse em cima: a foto mostra o botão desligado como ele fica
  const [ig, fb] = await Promise.all([redes.nth(0), redes.nth(1)].map((r) => r.evaluate((b) => ({ fundo: getComputedStyle(b).backgroundColor, borda: getComputedStyle(b).boxShadow, texto: b.innerText, alto: b.getBoundingClientRect().height }))));
  console.log("   desligado:", JSON.stringify(ig), "\n   ligado:", JSON.stringify(fb));
  confere(ig.fundo !== fb.fundo && fb.texto.includes("✓") && !ig.texto.includes("✓"), "209: escolhido com cor própria e ✓; o outro sem");
  await foto(pg, "209-redes-so-facebook-1440");
  // 210: bordas esquerda e direita iguais em campos e blocos
  const medidas = await ficha.evaluate((f) => {
    const sel = ["textarea.ficha-legenda-texto", ".ficha-capa .ficha-anexo-solta", ".ficha-capa-quadro", ".publicacao-caixa", ".ficha-tags", "#ficha-notas, .ficha-notas-ver"];
    const linhas = sel.map((s) => { const r = f.querySelector(s)?.getBoundingClientRect(); return r ? [s, Math.round(r.left), Math.round(r.right)] : [s, "-", "-"]; });
    const anexos = f.querySelector(".ficha-corpo > div > .ficha-anexos"); // a linha de Anexos: da área de soltar até a última miniatura
    return [...linhas, ["Anexos", Math.round(anexos.firstElementChild.getBoundingClientRect().left), Math.round(anexos.lastElementChild.getBoundingClientRect().right)]];
  });
  console.log("   esquerda/direita:", JSON.stringify(medidas));
  const ok = medidas.filter((m) => m[1] !== "-");
  confere(ok.every((m) => m[1] === ok[0][1] && m[2] === ok[0][2]), "210: todos os campos e blocos na mesma margem esquerda e direita");
  const dentro = await bloco.evaluate((b) => {
    const caixa = b.querySelector(".publicacao-caixa").getBoundingClientRect();
    return [...b.querySelectorAll(".aprovacao-situacao, .publicacao-redes, .publicacao-acoes")].map((e) => { const r = e.getBoundingClientRect(); return [e.className, Math.round(r.left - caixa.left), Math.round(caixa.right - r.right)]; });
  });
  console.log("   dentro da Publicação:", JSON.stringify(dentro));
  confere(dentro.every((d) => d[1] === dentro[0][1] && d[2] === dentro[0][2]), "210: linha de estado, redes e data/botões com a mesma margem dentro da Publicação");
  const ultimos = await bloco.evaluate((b) => {
    const acoes = [...b.querySelectorAll(".publicacao-acoes > *")].map((e) => e.getBoundingClientRect()).filter((r) => r.width); // o painel da data (fechado) não conta
    const redes = [...b.querySelectorAll(".aprovacao-rede")].map((e) => e.getBoundingClientRect());
    return [Math.round(Math.max(...acoes.map((r) => r.right))), Math.round(Math.max(...redes.map((r) => r.right))), Math.round(Math.min(...acoes.map((r) => r.left))), Math.round(Math.min(...redes.map((r) => r.left))), [...new Set([...acoes, ...redes].map((r) => Math.round(r.height)))]];
  });
  confere(ultimos[0] === ultimos[1] && ultimos[2] === ultimos[3], `210: redes e data/botões fecham na mesma esquerda e direita (${JSON.stringify(ultimos)})`);
  // 211
  const textoFicha = await ficha.innerText();
  confere(textoFicha.includes("Descrição do post") && !/legenda/i.test(textoFicha), "211: rótulo \"Descrição do post\", nenhuma \"Legenda\" na ficha");
}
await contexto.close();
proc.kill();
await navegador.close();
console.log(fase === "depois" ? (falhas ? `${falhas} FALHA(S)` : "TUDO OK") : "fotos do antes tiradas");
process.exit(falhas ? 1 : 0);
