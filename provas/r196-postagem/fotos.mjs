// Item 196 (Sextante): tela da postagem automática com o banco falso (banco-falso.mjs, 3397) e o app construído apontando para ele (3197).
// Cada largura sobe um banco falso novo (os cliques de uma largura não sujam a outra). Nada real: sem Meta, sem Drive, sem Supabase.
// App: cópia do HEAD fora do repo, NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3397 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=falsa next build/start -p 3197.
// Uso: node provas/r196-postagem/fotos.mjs
import { spawn } from "node:child_process";
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

function subirBanco() {
  const p = spawn(process.execPath, [join(pasta, "banco-falso.mjs")], { stdio: ["ignore", "pipe", "inherit"] });
  return new Promise((ok) => p.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(p); }));
}

async function abrir(pessoa, largura, altura) {
  const uid = `u-${pessoa}`;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: `${pessoa}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const erros = [], pedidos = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  pagina.on("request", (r) => { if (/\/rpc\/|\/functions\/v1\/|rest\/v1\/tarefas\?/.test(r.url()) && r.method() !== "GET") pedidos.push({ url: r.url(), metodo: r.method(), corpo: r.postDataJSON?.() }); });
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto("http://127.0.0.1:3197/conteudos", { waitUntil: "networkidle" });
  await pagina.locator(".conteudos-cartao").first().waitFor();
  return { contexto, pagina, erros, pedidos };
}
const marca = (pagina) => pagina.evaluate(() => {
  document.querySelector("#marca-largura")?.remove();
  const d = document.createElement("div");
  d.id = "marca-largura";
  d.textContent = `innerWidth ${innerWidth}`;
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
const foto = async (pagina, nome) => { await marca(pagina); await pagina.screenshot({ path: join(pasta, `${nome}.png`) }); };
const cartao = (pagina, titulo) => pagina.locator(".conteudos-cartao").filter({ hasText: titulo });
const texto = async (loc) => (await loc.count()) ? loc.first().innerText() : "";
// Conserto 1 do Maestro: nome e data do rodapé nunca se encostam (caixas sem sobreposição).
const separados = async (a, b) => { const x = await a.boundingBox(), y = await b.boundingBox(); return !!x && !!y && (x.x + x.width <= y.x || y.x + y.width <= x.x || x.y + x.height <= y.y || y.y + y.height <= x.y); };

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  const banco = await subirBanco();
  const n = await abrir("natham", largura, altura);
  const pg = n.pagina;

  // Card Aprovado programado: situação + Reprogramar + Postar agora
  const dica = cartao(pg, "Dica rápida de IR");
  confere((await texto(dica.locator(".aprovacao-situacao"))).includes("Programado · 25/10 18:00 · Instagram + Facebook"), `${largura}: programado mostra data e as duas redes`);
  confere(await dica.getByRole("button", { name: "Postar agora" }).count() === 1 && await dica.getByRole("button", { name: "Reprogramar postagem" }).count() === 1, `${largura}: Reprogramar e Postar agora no card programado`);
  await dica.scrollIntoViewIfNeeded();
  await foto(pg, `aprovado-${largura}`);

  // Erro parcial: faixa vermelha, link do que saiu, só "Tentar de novo só no Facebook" (sem Postar agora, aviso da Alvenaria)
  const carrossel = cartao(pg, "Carrossel: prazo do MEI");
  confere((await texto(carrossel.locator(".aprovacao-erro"))).includes("Saiu no Instagram, falhou no Facebook"), `${largura}: faixa do erro parcial`);
  confere(await carrossel.getByRole("button", { name: "Tentar de novo só no Facebook" }).count() === 1 && await carrossel.getByRole("button", { name: "Postar agora" }).count() === 0, `${largura}: com erro, só Tentar de novo`);
  confere(await carrossel.getByRole("link", { name: "Ver no Instagram" }).count() === 1, `${largura}: link do post que saiu`);
  // Estado incerto: pede para olhar o perfil antes
  const incerto = cartao(pg, "Reels: vale a pena abrir MEI?");
  confere((await texto(incerto.locator(".aprovacao-incerto"))).includes("Olhe o perfil da You no Instagram") && await incerto.getByRole("button", { name: "Já olhei o perfil: tentar de novo" }).count() === 1, `${largura}: estado incerto manda olhar o perfil`);
  confere((await texto(cartao(pg, "Story: último dia do DAS").locator(".aprovacao-situacao"))) === "Postando…", `${largura}: Postando…`);
  confere((await texto(cartao(pg, "Reels da Beec").locator(".aprovacao-aviso"))).includes("A Beec ainda não está ligada"), `${largura}: Beec sem botões, com aviso`);
  await carrossel.scrollIntoViewIfNeeded();
  confere(await separados(carrossel.locator(".conteudos-quem-faz"), carrossel.locator(".conteudos-cartao-rodape time")), `${largura}: nome e data do rodapé não se encostam`);
  confere(await carrossel.locator(".conteudos-contagem-dias").count() === 0 && await cartao(pg, "Story: último dia do DAS").locator(".conteudos-contagem-dias").count() === 0, `${largura}: com erro ou postando, sem "posta em X" / "hoje"`);
  await foto(pg, `erro-${largura}`);
  await carrossel.getByRole("button", { name: "Tentar de novo só no Facebook" }).click();
  await pg.waitForTimeout(400);
  confere(n.pedidos.some((p) => p.url.includes("/rpc/tentar_de_novo")), `${largura}: Tentar de novo chama tentar_de_novo`);

  // Postado: links
  const postado = cartao(pg, "Depoimento de cliente");
  confere(await postado.getByRole("link", { name: "Ver no Instagram" }).count() === 1 && await postado.getByRole("link", { name: "Ver no Facebook" }).count() === 1, `${largura}: Postado com os dois links`);
  // Conserto com a chave inglesa
  confere(await cartao(pg, "Reels: 5 erros no IR").locator(".selo-conserto svg").count() === 1, `${largura}: Conserto com ícone`);

  // Checagem: Postar agora sem legenda não abre a confirmação, mostra o que falta
  const semLegenda = cartao(pg, "Post sem legenda");
  await semLegenda.getByRole("button", { name: "Postar agora" }).click();
  confere((await texto(semLegenda.locator(".aprovacao-falta"))).includes("Falta a legenda") && await pg.locator(".confirmar[open]").count() === 0, `${largura}: sem legenda não posta e diz o que falta`);
  await semLegenda.scrollIntoViewIfNeeded();
  await foto(pg, `falta-${largura}`);

  // Postar agora com confirmação
  await dica.getByRole("button", { name: "Postar agora" }).click();
  const dialogo = pg.locator(".confirmar[open]");
  await dialogo.waitFor();
  confere((await dialogo.innerText()).includes("Postar agora no Instagram + Facebook da You?"), `${largura}: confirmação do Postar agora`);
  await pg.waitForTimeout(250);
  await foto(pg, `postar-agora-${largura}`);
  await dialogo.getByRole("button", { name: "Postar" }).click();
  await pg.waitForTimeout(600);
  confere(n.pedidos.some((p) => p.url.includes("/rpc/postar_agora") && p.corpo?.p_tarefa) && (await texto(dica.locator(".aprovacao-situacao"))) === "Postando…", `${largura}: Postar agora chama postar_agora e mostra Postando…`);
  confere(await dica.locator(".conteudos-contagem-dias").count() === 0, `${largura}: Postando… sem "posta em 5 dias" junto`);

  // Aprovar o Reels e abrir o Programar: formato, Instagram/Facebook; carrossel com vídeo apaga o Facebook
  const reels = cartao(pg, "Reels: bastidores do escritório");
  await reels.getByRole("button", { name: "Aprovar" }).click();
  await pg.waitForTimeout(400);
  const aprovado = pg.locator('[data-etapa="aprovado"] .conteudos-cartao').filter({ hasText: "Reels: bastidores do escritório" });
  await aprovado.getByRole("button", { name: "Programar postagem" }).click();
  confere(await aprovado.locator(".aprovacao-rede[aria-pressed=true]").count() === 2, `${largura}: Programar abre com Instagram e Facebook acesos`);
  await pg.keyboard.press("Escape"); // fecha o calendário que abre sozinho com o formato já escolhido
  await aprovado.getByRole("radio", { name: "Carrossel" }).click();
  await pg.keyboard.press("Escape");
  confere(await aprovado.getByRole("button", { name: "Facebook" }).isDisabled() && (await texto(aprovado.locator(".aprovacao-nota"))).includes("só vai para o Instagram"), `${largura}: carrossel com vídeo apaga o Facebook`);
  await aprovado.scrollIntoViewIfNeeded();
  await pg.waitForTimeout(300);
  const botaoData = aprovado.locator(".campo-data-botao");
  confere(await botaoData.evaluate((b) => { const s = b.querySelector("span"); return s.scrollWidth <= s.clientWidth + 1 && b.scrollWidth <= b.clientWidth + 1; }) && (await botaoData.innerText()).includes("Quando?"), `${largura}: botão de data inteiro, sem corte`);
  await foto(pg, `programar-${largura}`);
  await aprovado.getByRole("button", { name: "Cancelar" }).click();

  // Ficha do Reels (dono Matheus): Formato, Ocasião, Legenda, Capa com a barrinha; lixeira para o Natham (019)
  await aprovado.locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  const barra = ficha.getByRole("slider", { name: "Quadro da capa" });
  await barra.waitFor();
  await pg.waitForFunction(() => !document.querySelector('.ficha-capa-quadro input[type="range"]')?.disabled, null, { timeout: 8000 }).catch(() => {});
  await barra.fill("3000");
  await pg.waitForTimeout(500);
  confere((await texto(ficha.locator(".ficha-capa-texto").first())).includes("Capa: quadro em 0:03,0"), `${largura}: barrinha escolhe o quadro da capa`);
  confere(await ficha.locator("textarea.ficha-legenda-texto").evaluate((t) => t.clientHeight >= 5 * parseFloat(getComputedStyle(t).lineHeight)), `${largura}: legenda com caixa de 5 linhas ou mais`);
  confere((await texto(ficha.locator(".ficha-legenda-post"))).includes("/2200") && await ficha.locator(".ficha-lixeira").count() === 1, `${largura}: legenda com contador e lixeira do Natham no card do Matheus`);
  await ficha.locator(".ficha-legenda-post").scrollIntoViewIfNeeded();
  await foto(pg, `ficha-legenda-${largura}`);
  await ficha.locator(".ficha-capa").scrollIntoViewIfNeeded();
  await foto(pg, `ficha-capa-${largura}`);
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(500);
  const salvo = n.pedidos.filter((p) => p.url.includes("/rpc/salvar_tarefa")).at(-1)?.corpo?.p;
  confere(salvo?.capa_quadro_ms === 3000 && salvo?.legenda?.startsWith("Um dia na You"), `${largura}: Salvar grava capa_quadro_ms ${salvo?.capa_quadro_ms} e a legenda`);

  // Concluir num card que não é post: confirmação e apaga
  const visita = cartao(pg, "Visita ao cliente 2");
  await visita.getByRole("button", { name: "Concluir" }).click();
  const concluir = pg.locator(".confirmar[open]");
  await concluir.waitFor();
  await pg.waitForTimeout(250);
  await foto(pg, `concluir-${largura}`);
  await concluir.getByRole("button", { name: "Concluir" }).click();
  await pg.waitForTimeout(500);
  confere(await cartao(pg, "Visita ao cliente 2").count() === 0 && n.pedidos.some((p) => p.metodo === "DELETE"), `${largura}: Concluir apaga o card`);
  confere(!n.erros.length, `natham ${largura}: sem erro na página ${JSON.stringify(n.erros)}`);
  await n.contexto.close();

  // Matheus: não aprova a "Dica" (aprovador Natham): só vê a situação; ficha do card aprovado travada
  const m = await abrir("matheus", largura, altura);
  const dicaM = cartao(m.pagina, "Reels: vale a pena abrir MEI?");
  confere(await dicaM.locator(".aprovacao-botao").count() === 0 && (await texto(dicaM.locator(".aprovacao-erro"))).includes("estado incerto"), `matheus ${largura}: vê o erro, sem botões`);
  await cartao(m.pagina, "Post sem legenda").locator(".conteudos-titulo").click();
  const fichaM = m.pagina.locator(".ficha-cartao");
  await fichaM.waitFor();
  confere(await fichaM.locator("textarea[readonly]").filter({ hasText: "" }).count() >= 1 && (await fichaM.innerText()).includes("Aprovado: legenda, formato, arquivos e capa só mudam pelo Natham"), `matheus ${largura}: ficha do card aprovado travada para ele`);
  await fichaM.locator(".ficha-legenda-post").scrollIntoViewIfNeeded();
  await foto(m.pagina, `matheus-ficha-${largura}`);
  confere(!m.erros.length, `matheus ${largura}: sem erro na página ${JSON.stringify(m.erros)}`);
  await m.contexto.close();
  banco.kill();
}

await navegador.close();
process.exit(falhas ? 1 : 0);
