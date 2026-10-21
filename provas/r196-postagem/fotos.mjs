// Item 196 (Sextante): tela da postagem automática com o banco falso (banco-falso.mjs, 3397) e o app construído apontando para ele (3197).
// Desde 23/10 (pedido do Natham): o card Aprovado tem UMA linha de estado; Programar, Postar agora, Tentar de novo e as redes ficam na
// ficha, no bloco Publicação; os links do post (Postado) também. Cada largura sobe um banco falso novo. Nada real: sem Meta, sem Drive.
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

async function abrir(pessoa, largura, altura, escala = 1) {
  const uid = `u-${pessoa}`;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: `${pessoa}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: escala });
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
const ultimo = (n, rpc) => n.pedidos.filter((p) => p.url.includes(`/rpc/${rpc}`)).at(-1)?.corpo;
/** Abre a ficha do card e devolve o bloco Publicação (e a ficha). */
async function publicacao(pg, titulo) {
  await cartao(pg, titulo).locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  return { ficha, bloco: ficha.locator(".publicacao") };
}
const fechar = async (pg) => { if (await pg.locator(".ficha-cartao").isVisible()) { await pg.keyboard.press("Escape"); await pg.waitForTimeout(250); } };

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  const banco = await subirBanco();
  const n = await abrir("natham", largura, altura);
  const pg = n.pagina;

  // CARD: uma linha só, sem botões (pedido do Natham)
  const dica = cartao(pg, "Dica rápida de IR");
  confere((await texto(dica.locator(".aprovacao-situacao"))) === "Programado · 25/10 18:00 · Instagram + Facebook" && await dica.locator(".aprovacao-botao").count() === 0, `${largura}: card programado = 1 linha, sem botões`);
  confere((await texto(cartao(pg, "Carrossel: prazo do MEI").locator(".aprovacao-situacao"))) === "Erro ao postar: abra o card", `${largura}: card com erro = "Erro ao postar: abra o card"`);
  confere((await texto(cartao(pg, "Story: último dia do DAS").locator(".aprovacao-situacao"))) === "Postando…", `${largura}: card postando`);
  const beec = cartao(pg, "Reels da Beec");
  confere((await texto(beec.locator(".aprovacao-situacao"))) === "Postagem automática só para a You (por enquanto)" && !(await beec.innerText()).includes("Programado"), `${largura}: Beec sem "Programado", só o aviso`);
  confere(await cartao(pg, "Depoimento de cliente").locator(".aprovacao-link, .aprovacao-links").count() === 0, `${largura}: card Postado sem a linha de links`);
  const selo = cartao(pg, "Reels: 5 erros no IR").locator(".selo-conserto");
  confere(await selo.locator("img").count() === 1 && (await selo.innerText()).trim() === "" && await selo.getAttribute("title") === "Conserto"
    && await selo.locator("img").evaluate((i) => i.complete && i.naturalWidth === 1080 && i.getBoundingClientRect().width === 20), `${largura}: Conserto só com o ícone do Natham (PNG original, 20px, title "Conserto")`);
  const [fita, logo] = [await selo.boundingBox(), await cartao(pg, "Reels: 5 erros no IR").locator(".conteudos-empresa").boundingBox()];
  confere(fita.y + fita.height <= logo.y || fita.x + fita.width <= logo.x, `${largura}: a fita do Conserto não encosta no logo da empresa`);
  if (largura === 1440) { // foto de perto: o mesmo card a 3x, para ver o ícone
    const perto = await abrir("natham", 1440, 760, 3);
    const caixa = await cartao(perto.pagina, "Reels: 5 erros no IR").boundingBox(); // a fita fica 10px acima do card: a foto pega uma margem
    await perto.pagina.screenshot({ path: join(pasta, "conserto-perto-1440.png"), clip: { x: caixa.x - 12, y: caixa.y - 24, width: caixa.width + 24, height: 130 } });
    await perto.contexto.close();
  }
  await dica.scrollIntoViewIfNeeded();
  await foto(pg, `card-aprovado-${largura}`);
  await cartao(pg, "Depoimento de cliente").scrollIntoViewIfNeeded();
  await foto(pg, `card-postado-${largura}`);

  // FICHA: Publicação do card programado; Postar agora com confirmação grava a ficha e chama postar_agora
  let { bloco } = await publicacao(pg, "Dica rápida de IR");
  confere((await texto(bloco.locator(".aprovacao-situacao"))).includes("Programado · 25/10 18:00") && await bloco.locator(".aprovacao-rede[aria-pressed=true]").count() === 2
    && await bloco.getByRole("button", { name: "Reprogramar postagem" }).count() === 1 && await bloco.getByRole("button", { name: "Postar agora" }).count() === 1, `${largura}: ficha com Publicação (estado, redes, Reprogramar, Postar agora)`);
  await bloco.scrollIntoViewIfNeeded();
  await foto(pg, `ficha-publicacao-${largura}`);
  await bloco.getByRole("button", { name: "Postar agora" }).click();
  const dialogo = pg.locator(".confirmar[open]");
  await dialogo.waitFor();
  confere((await dialogo.innerText()).includes("Postar agora no Instagram + Facebook da You?"), `${largura}: confirmação do Postar agora`);
  await dialogo.getByRole("button", { name: "Postar" }).click();
  await pg.waitForTimeout(700);
  confere(!!ultimo(n, "salvar_tarefa") && ultimo(n, "postar_agora")?.p_tarefa && (await texto(dica.locator(".aprovacao-situacao"))) === "Postando…", `${largura}: Postar agora grava a ficha, chama postar_agora e o card mostra Postando…`);
  await fechar(pg);

  // Checagem na ficha: sem legenda não posta; escreve a legenda e posta (a legenda vai junto no salvar)
  ({ bloco } = await publicacao(pg, "Post sem legenda"));
  await bloco.getByRole("button", { name: "Postar agora" }).click();
  confere((await texto(bloco.locator(".aprovacao-falta"))).includes("Falta a legenda") && await pg.locator(".confirmar[open]").count() === 0, `${largura}: sem legenda a ficha diz o que falta e não posta`);
  await bloco.scrollIntoViewIfNeeded();
  await foto(pg, `ficha-falta-${largura}`);
  await pg.locator("textarea.ficha-legenda-texto").fill("Legenda escrita na ficha");
  await bloco.getByRole("button", { name: "Postar agora" }).click();
  await pg.locator(".confirmar[open]").getByRole("button", { name: "Postar" }).click();
  await pg.waitForTimeout(700);
  confere(ultimo(n, "salvar_tarefa")?.p?.legenda === "Legenda escrita na ficha" && ultimo(n, "postar_agora")?.p_tarefa, `${largura}: a legenda escrita vai no salvar antes do Postar agora`);
  await fechar(pg);

  // Erro: na ficha, a faixa completa, o link do que saiu, as redes e "Tentar de novo só no Facebook"
  ({ bloco } = await publicacao(pg, "Carrossel: prazo do MEI"));
  confere((await texto(bloco.locator(".aprovacao-erro"))).includes("Saiu no Instagram, falhou no Facebook") && await bloco.locator(".aprovacao-rede").count() === 2
    && await bloco.getByRole("button", { name: "Tentar de novo só no Facebook" }).count() === 1 && await bloco.getByRole("button", { name: "Postar agora" }).count() === 0, `${largura}: erro na ficha com redes e só Tentar de novo`);
  await bloco.scrollIntoViewIfNeeded();
  await foto(pg, `ficha-erro-${largura}`);
  await fechar(pg);
  ({ bloco } = await publicacao(pg, "Reels: vale a pena abrir MEI?"));
  confere((await texto(bloco.locator(".aprovacao-incerto"))).includes("Olhe o perfil") && await bloco.getByRole("button", { name: "Já olhei o perfil: tentar de novo" }).count() === 1, `${largura}: estado incerto pede para olhar o perfil`);
  await bloco.getByRole("button", { name: "Já olhei o perfil: tentar de novo" }).click();
  await pg.waitForTimeout(700);
  confere(!!ultimo(n, "tentar_de_novo"), `${largura}: Tentar de novo grava a ficha e chama tentar_de_novo`);
  await fechar(pg);

  // Achado 6 (3ª volta): só Facebook + vídeo. Salvar a ficha CANCELA a programação; card e ficha avisam; redes e Programar à mão.
  let ficha;
  confere((await texto(cartao(pg, "Carrossel só Facebook").locator(".aprovacao-situacao"))) === "Precisa de ajuste: abra o card", `${largura}: programado só Facebook com vídeo (dado antigo) = "Precisa de ajuste", nunca "Programado"`);
  ({ ficha, bloco } = await publicacao(pg, "Carrossel só Facebook"));
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(600);
  confere(ultimo(n, "salvar_tarefa")?.p?.postar_em === null && JSON.stringify(ultimo(n, "salvar_tarefa")?.p?.postar_redes) === '["facebook"]', `${largura}: salvar tira a programação e NÃO troca a rede (postar_em nulo, só Facebook)`);
  confere((await texto(cartao(pg, "Carrossel só Facebook").locator(".aprovacao-situacao"))) === "Programação cancelada: abra o card", `${largura}: card mostra "Programação cancelada: abra o card"`);
  ({ bloco } = await publicacao(pg, "Carrossel só Facebook"));
  confere((await texto(bloco.locator(".aprovacao-erro"))).includes("Programação cancelada") && await bloco.getByRole("button", { name: "Programar postagem" }).count() === 1
    && await bloco.getByRole("button", { name: "Instagram" }).isEnabled(), `${largura}: ficha mostra o porquê, as redes e o Programar`);
  await bloco.getByRole("button", { name: "Instagram" }).click();
  confere(await bloco.getByRole("button", { name: "Facebook" }).isDisabled(), `${largura}: acendeu o Instagram, o Facebook sai (carrossel com vídeo)`);
  await bloco.scrollIntoViewIfNeeded();
  await foto(pg, `ficha-cancelada-${largura}`);
  await fechar(pg);

  // Beec e Postado na ficha
  ({ bloco } = await publicacao(pg, "Reels da Beec"));
  confere((await texto(bloco)).includes("Postagem automática só para a You") && await bloco.locator(".aprovacao-botao").count() === 0, `${largura}: Beec na ficha só com o aviso`);
  await fechar(pg);
  ({ bloco } = await publicacao(pg, "Depoimento de cliente"));
  confere(await bloco.getByRole("link", { name: "Ver no Instagram" }).count() === 1 && await bloco.getByRole("link", { name: "Ver no Facebook" }).count() === 1, `${largura}: links do post dentro da ficha (Postado)`);
  await bloco.scrollIntoViewIfNeeded();
  await foto(pg, `ficha-postado-${largura}`);
  await fechar(pg);

  // Programar na ficha: aprova o Reels, abre a ficha, escolhe data e hora e programa (o quadro da capa vai junto)
  await cartao(pg, "Reels: bastidores do escritório").getByRole("button", { name: "Aprovar" }).click();
  await pg.waitForTimeout(400);
  ({ ficha, bloco } = await publicacao(pg, "Reels: bastidores do escritório"));
  confere((await texto(bloco.locator(".aprovacao-situacao"))) === "Sem programação." && (await texto(cartao(pg, "Reels: bastidores do escritório").locator(".aprovacao-situacao"))) === "Sem programação", `${largura}: aprovado sem data = "Sem programação"`);
  const barra = ficha.getByRole("slider", { name: "Quadro da capa" });
  await pg.waitForFunction(() => !document.querySelector('.ficha-capa-quadro input[type="range"]')?.disabled, null, { timeout: 8000 }).catch(() => {});
  await barra.fill("3000");
  await bloco.locator(".campo-data-botao").click();
  const painel = pg.locator(".campo-data-pop:popover-open");
  await painel.waitFor();
  await painel.locator('[data-dia="2026-10-22"]').click();
  await pg.waitForTimeout(300);
  await painel.getByRole("button", { name: "Selecionar" }).click();
  await pg.waitForTimeout(300);
  await bloco.getByRole("button", { name: "Programar postagem" }).click();
  await pg.waitForTimeout(700);
  const prog = ultimo(n, "salvar_tarefa")?.p;
  confere(prog?.postar_em?.startsWith("2026-10-22T") && prog?.capa_quadro_ms === 3000 && (await texto(cartao(pg, "Reels: bastidores do escritório").locator(".aprovacao-situacao"))).startsWith("Programado · 22/10"),
    `${largura}: Programar na ficha grava data ${prog?.postar_em} e o quadro da capa junto`);
  await fechar(pg);

  // Carrossel com vídeo marcado com as duas redes: salvar tira só o Facebook (com aviso), sem cancelar
  ({ ficha } = await publicacao(pg, "Carrossel com vídeo antigo"));
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(500);
  confere(JSON.stringify(ultimo(n, "salvar_tarefa")?.p?.postar_redes) === '["instagram"]' && ultimo(n, "salvar_tarefa")?.p?.postar_em === "2026-10-27T10:00", `${largura}: Instagram + Facebook com vídeo vira só Instagram e continua programado`);

  // Concluir num card que não é post: confirmação e apaga
  const visita = cartao(pg, "Visita ao cliente 2");
  await visita.getByRole("button", { name: "Concluir" }).click();
  await pg.locator(".confirmar[open]").getByRole("button", { name: "Concluir" }).click();
  await pg.waitForTimeout(500);
  confere(await cartao(pg, "Visita ao cliente 2").count() === 0, `${largura}: Concluir apaga o card`);
  confere(!n.erros.length, `natham ${largura}: sem erro na página ${JSON.stringify(n.erros)}`);
  await n.contexto.close();

  // Matheus (não aprova a "Dica"): vê o estado no card e na ficha, sem controles; ficha travada
  const m = await abrir("matheus", largura, altura);
  const { ficha: fm, bloco: bm } = await publicacao(m.pagina, "Carrossel com vídeo antigo"); // aprovado pelo Natham, programado (a "Dica" o Natham já postou)
  confere((await texto(bm.locator(".aprovacao-situacao"))).includes("Programado") && await bm.locator(".aprovacao-botao, .aprovacao-rede").count() === 0
    && (await fm.innerText()).includes("Aprovado: legenda, formato, arquivos e capa só mudam pelo Natham"), `matheus ${largura}: Publicação só leitura e ficha travada (card que o Natham aprova)`);
  await bm.scrollIntoViewIfNeeded();
  await foto(m.pagina, `matheus-ficha-${largura}`);
  confere(!m.erros.length, `matheus ${largura}: sem erro na página ${JSON.stringify(m.erros)}`);
  await m.contexto.close();
  banco.kill();
}

await navegador.close();
process.exit(falhas ? 1 : 0);
