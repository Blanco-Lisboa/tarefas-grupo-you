// Item 238, achado 1 da Re-revisão 1 (Sextante): o bloco Publicação com a postagem automática DESLIGADA não promete post real.
// Cópia de exemplo (3101, banco falso 3201 com /entrar), que roda DESLIGADA. Para "ligada" a prova responde a pergunta
// postagem_automatica_ligada com true pela rede do navegador (page.route): a 3101 não é religada. Só olha; nada é gravado.
// Uso: node provas/r238-publicacao/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const CORS = { "access-control-allow-origin": "http://127.0.0.1:3101", "access-control-allow-credentials": "true" };
const AVISO = "Postagem automática ainda desligada: na hora marcada o card vira Postado e você publica nas redes.";

async function estado(nome, ligada, semProgramacao = false) {
  const pg = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
  if (ligada) await pg.route("**/rest/v1/rpc/postagem_automatica_ligada*", (r) => r.fulfill({ json: true, headers: CORS }));
  if (semProgramacao) await pg.route("**/rest/v1/tarefas*", async (r) => {
    if (r.request().method() !== "GET") return r.fallback();
    const res = await r.fetch();
    await r.fulfill({ response: res, json: (await res.json()).map((t) => (t.titulo === "Carrossel: calendário fiscal de novembro" ? { ...t, postar_em: null } : t)) });
  });
  await pg.goto("http://127.0.0.1:3201/entrar");
  await pg.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
  await pg.locator(".conteudos-cartao").filter({ hasText: "Carrossel: calendário fiscal de novembro" }).locator(".conteudos-titulo").click();
  const bloco = pg.locator(".ficha-cartao .publicacao");
  await bloco.waitFor();
  await pg.waitForTimeout(800);
  await bloco.evaluate((b) => b.scrollIntoView({ block: "center" }));
  await pg.mouse.move(5, 5);
  const m = await bloco.evaluate((b) => {
    const r = (e) => { const x = e.getBoundingClientRect(); return [Math.round(x.left * 10) / 10, Math.round(x.right * 10) / 10]; };
    return {
      texto: b.innerText, redes: [...b.querySelectorAll(".aprovacao-rede")].map(r),
      acoes: [...b.querySelectorAll(".publicacao-acoes > *")].filter((e) => e.getBoundingClientRect().width).map((e) => ({ t: e.innerText.trim(), x: r(e) })),
    };
  });
  console.log(`   ${nome}:`, JSON.stringify(m.acoes));
  const larg = m.acoes.map((a) => a.x[1] - a.x[0]);
  const alinhado = Math.abs(m.acoes[0].x[0] - m.redes[0][0]) < 1 && Math.abs(m.acoes.at(-1).x[1] - m.redes.at(-1)[1]) < 1 && Math.max(...larg) - Math.min(...larg) < 1;
  if (ligada) {
    confere(m.acoes.length === 3 && m.acoes.some((a) => a.t === "Postar agora") && m.acoes.some((a) => a.t === (semProgramacao ? "Programar postagem" : "Reprogramar postagem")), `238 ${nome}: 3 botões com Postar agora, como hoje`);
    confere(!m.texto.includes(AVISO) && (semProgramacao || m.texto.includes("Programado ·")), `238 ${nome}: sem aviso; "Programado"`);
  } else {
    confere(m.acoes.length === 2 && !m.texto.includes("Postar agora") && m.acoes[1].t === (semProgramacao ? "Marcar hora" : "Remarcar hora"), `238 ${nome}: sem Postar agora; ${semProgramacao ? "Marcar hora" : "Remarcar hora"} (${m.acoes.map((a) => a.t).join(" | ")})`);
    confere(m.texto.includes(AVISO) && (semProgramacao || (m.texto.includes("Hora marcada ·") && !m.texto.includes("Programado"))), `238 ${nome}: aviso da publicação à mão; "Hora marcada"`);
  }
  confere(alinhado, `238 ${nome}: botões com a mesma largura, nas bordas das redes (${larg.join(", ")})`);
  confere(await bloco.locator(".aprovacao-rede").count() === 2, `238 ${nome}: os botões de rede continuam`);
  await pg.evaluate(() => document.getAnimations().filter((a) => a.animationName === "menu-brilho").forEach((a) => { a.pause(); a.currentTime = 1800; }));
  await pg.evaluate(() => {
    const d = Object.assign(document.createElement("div"), { textContent: `innerWidth ${innerWidth}` });
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  const c = await bloco.boundingBox();
  await pg.screenshot({ path: join(pasta, `238-${nome}-perto-1440.png`), clip: { x: c.x - 12, y: c.y - 8, width: c.width + 24, height: c.height + 16 } });
  await pg.context().close();
}

await estado("desligada-programado", false);
await estado("desligada-sem-programacao", false, true);
await estado("ligada-programado", true);
await estado("ligada-sem-programacao", true, true);
await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
