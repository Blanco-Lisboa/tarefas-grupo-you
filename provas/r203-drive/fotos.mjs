// Item 203/204 (Vitral): Configurações (Google Drive), Pastas (ocasiões), Mapa (links do Postado) e Anexos no Drive, TUDO contra banco, funções e Drive FALSOS.
// Uso: node banco-falso.mjs (3296) + next dev -p 3196 apontando para ele; depois node provas/r203-drive/fotos.mjs. Nada real é tocado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { statSync } from "node:fs";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const video = join(pasta, "../r196-postagem/video-falso.mp4");
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const exp = 1893456000;
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const banco = (c) => fetch(`http://127.0.0.1:3296/${c}`).then((r) => r.json());

async function abrir(pessoa, largura, altura, rota) {
  const uid = `u-${pessoa}`;
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: `${pessoa}@exemplo.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  await pagina.route(/(google|googleapis|gstatic)\.com/, (r) => r.abort()); // nada de Google real: o player do Drive fica em branco, só o endereço é conferido
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto(`http://127.0.0.1:3196${rota}`, { waitUntil: "networkidle" });
  return { contexto, pagina, erros };
}
const marca = (pagina) => pagina.evaluate(() => {
  const d = document.createElement("div");
  d.textContent = `innerWidth ${innerWidth}`;
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  // Configurações: só o Natham vê o bloco; ligado e desligado
  await banco("__google?ligado=1");
  const n = await abrir("natham", largura, altura, "/configuracoes");
  await n.pagina.getByText("Ligado como nathamsud@gmail.com").waitFor();
  confere(await n.pagina.getByRole("button", { name: "Ligar Google Drive" }).count() === 0, `config ${largura}: ligado mostra o e-mail e esconde o botão`);
  await marca(n.pagina); await n.pagina.screenshot({ path: join(pasta, `config-ligado-${largura}.png`) });
  await banco("__google?ligado=0");
  await n.pagina.reload({ waitUntil: "networkidle" });
  await n.pagina.getByRole("button", { name: "Ligar Google Drive" }).waitFor();
  await marca(n.pagina); await n.pagina.screenshot({ path: join(pasta, `config-desligado-${largura}.png`) });
  confere(!n.erros.length, `config ${largura}: sem erro na página ${JSON.stringify(n.erros)}`);
  await n.contexto.close();
  const m = await abrir("matheus", largura, altura, "/configuracoes");
  await m.pagina.getByRole("heading", { name: "Empresas" }).waitFor();
  confere(await m.pagina.getByText("Google Drive").count() === 0, `config ${largura}: o Matheus não vê o bloco do Google Drive`);
  await m.contexto.close();

  // Pastas: as ocasiões viram pastas da empresa, com os cards dela
  const p = await abrir("natham", largura, altura, "/pastas");
  await p.pagina.getByText("Dia das Mães").first().waitFor();
  confere(await p.pagina.getByText("2 cards").count() >= 1 && await p.pagina.getByText("Natal").count() >= 1, `pastas ${largura}: ocasiões aparecem como pastas com a contagem de cards`);
  await p.pagina.getByText("Dia das Mães").first().scrollIntoViewIfNeeded();
  await p.pagina.waitForTimeout(2500); // a entrada das pastas é escalonada
  await marca(p.pagina); await p.pagina.screenshot({ path: join(pasta, `pastas-${largura}.png`) });
  confere(!p.erros.length, `pastas ${largura}: sem erro na página ${JSON.stringify(p.erros)}`);
  await p.contexto.close();

  // Mapa: card Postado mostra formato, redes, data e os links; sem arquivo
  const mp = await abrir("natham", largura, altura, "/mapa");
  const card = mp.pagina.locator(".mapa-card[data-postado='true']").first();
  await card.waitFor();
  await card.hover();
  const painel = mp.pagina.locator(".mapa-postado").first();
  confere(await painel.count() === 1, `mapa ${largura}: card Postado tem o painel de links`);
  confere((await painel.innerText()).includes("Reels · Instagram + Facebook"), `mapa ${largura}: painel mostra formato e redes (${JSON.stringify(await painel.innerText())})`);
  confere(await painel.getByRole("link", { name: "Ver no Instagram" }).getAttribute("href") === "https://www.instagram.com/p/exemplo/" && await painel.getByRole("link", { name: "Ver no Facebook" }).count() === 1, `mapa ${largura}: links Ver no Instagram e Ver no Facebook`);
  await marca(mp.pagina); await mp.pagina.screenshot({ path: join(pasta, `mapa-${largura}.png`) });
  confere(!mp.erros.length, `mapa ${largura}: sem erro na página ${JSON.stringify(mp.erros)}`);
  await mp.contexto.close();

  // Ficha: anexo do Drive (vídeo) no player do Drive; ocasião do card
  const f = await abrir("natham", largura, altura, "/conteudos");
  await f.pagina.locator(".conteudos-cartao").filter({ hasText: "Reels: 5 erros no IR" }).locator(".conteudos-titulo").click();
  const ficha = f.pagina.locator(".ficha-cartao");
  await ficha.waitFor();
  confere(await ficha.getByRole("button", { name: /Abrir reels-ir.mp4/ }).count() === 1, `ficha ${largura}: o anexo do Drive aparece (sem baixar nada)`);
  await marca(f.pagina); await f.pagina.screenshot({ path: join(pasta, `ficha-${largura}.png`) });
  await ficha.getByRole("button", { name: /Abrir reels-ir.mp4/ }).click();
  const iframe = f.pagina.locator("dialog.ficha-grande iframe");
  confere(await iframe.getAttribute("src") === "https://drive.google.com/file/d/drive-video-1/preview", `ficha ${largura}: abre no player do Drive`);
  await f.pagina.locator("dialog.ficha-grande").getByRole("button", { name: "Fechar" }).click(); // com o foco dentro do player do Google o Esc não chega à página: o Fechar sempre fecha
  confere(await ficha.getByText("Dia das Mães").count() >= 1, `ficha ${largura}: o campo Ocasião mostra a do card`);
  if (largura === 1440) {
    // envio direto: escolhe o vídeo no computador, salva e confere a sequência navegador -> função -> Drive -> função
    await ficha.locator('input[type="file"][accept*="video"]').first().setInputFiles(video);
    await ficha.getByRole("button", { name: "Salvar" }).click();
    await f.pagina.waitForTimeout(2000);
    const r = await banco("__registro");
    const ordem = r.filter((x) => ["sessao_envio", "upload-direto", "confirmar_envio"].includes(x.acao ?? x.funcao)).map((x) => x.acao ?? x.funcao).slice(-3);
    confere(JSON.stringify(ordem) === JSON.stringify(["sessao_envio", "upload-direto", "confirmar_envio"]), `envio: ordem sessao_envio, upload direto ao Drive, confirmar_envio (${ordem})`);
    const up = r.find((x) => x.funcao === "upload-direto");
    confere(!!up && up.bytes === statSync(video).size && /^bytes 0-\d+\/\d+$/.test(up.faixa), `envio: o arquivo inteiro (${up?.bytes} bytes) foi para o endereço da sessão do Drive (${up?.faixa})`);
  }
  confere(!f.erros.length, `ficha ${largura}: sem erro na página ${JSON.stringify(f.erros)}`);
  await f.contexto.close();
}
await navegador.close();
process.exit(falhas ? 1 : 0);
