// Prova do item 88 (Sextante): o número na faixa do meio é o azul e é o que salva, girando as horas e os minutos para cima
// e para baixo, várias voltas (passando por 23 -> 00 e 55 -> 00). Arraste real com page.mouse em passos, no Chrome instalado,
// janela fora da tela (nunca usa o mouse/teclado de verdade do Natham). Servidor em 3100.
// Causa do defeito: as 7 linhas desenhadas passavam da caixa da roda (160px), sobrando 32px de rolagem escondida; quando o
// navegador rolava a caixa, o desenho subia uma linha e a conta não. O "empurrão" abaixo rola a caixa como o navegador fazia.
//   node provas/r4-sextante/roda-alinhada.mjs          -> confere 1903, 1440 e 390 e grava as fotos
//   node provas/r4-sextante/roda-alinhada.mjs antes    -> só a foto do defeito (rodar no código antigo)
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const REF = fileURLToPath(new URL("../../docs/referencias/2026-10-19-rodada-4/", import.meta.url));
const antes = process.argv[2] === "antes";
const erros = [];
const b = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-position=-3000,0"] });
const pop = ".campo-data-pop:popover-open";

for (const [w, h] of antes ? [[1440, 760]] : [[1903, 900], [1440, 760], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.clock.setFixedTime(new Date(2026, 9, 19, 15, 0));
  p.on("pageerror", (e) => erros.push(`[${w}] pageerror: ${e.message}`));
  const roda = (r) => p.locator(`${pop} [role=spinbutton][aria-label="${r}"]`);
  // Para cada roda: o número cujo centro está no meio da janela da roda (onde fica a faixa), o azul e o do aria (o que vai para o "Selecionar")
  const ler = () => p.evaluate((pop) => {
    return Object.fromEntries([...document.querySelectorAll(`${pop} .roda`)].map((r) => {
      const itens = [...r.querySelectorAll(".roda-item")];
      const c = r.getBoundingClientRect(), faixa = c.top + c.height / 2;
      const dist = (el) => Math.abs(el.getBoundingClientRect().top + el.offsetHeight / 2 - faixa);
      const naFaixa = itens.reduce((a, el) => (dist(el) < dist(a) ? el : a));
      return [r.ariaLabel, { faixa: naFaixa.textContent, azul: r.querySelector("[data-meio]").textContent, valor: r.ariaValueText, rolagem: r.scrollTop }];
    }));
  }, pop);
  const conferir = async (onde) => {
    for (const [r, v] of Object.entries(await ler()))
      if (v.faixa !== v.azul || v.azul !== v.valor) erros.push(`[${w}] ${onde}: ${r} faixa ${v.faixa}, azul ${v.azul}, valor ${v.valor}, rolagem ${v.rolagem}`);
  };
  const foto = async (caminho) => {
    await p.evaluate(() => {
      document.getElementById("prova-iw")?.remove();
      const s = document.createElement("div");
      s.id = "prova-iw";
      s.popover = "manual";
      s.textContent = `innerWidth ${innerWidth}`;
      s.style.cssText = "inset:auto 6px 6px auto;margin:0;border:0;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
      document.body.append(s);
      s.showPopover();
    });
    await p.screenshot({ path: caminho });
  };
  // Arraste real: aperta, sobe/desce em passos de 16ms, para e solta (sem inércia), espera o encaixe
  async function arrastar(r, linhas) {
    const c = await roda(r).boundingBox();
    const x = c.x + c.width / 2, y = c.y + c.height / 2, dy = -linhas * 32;
    await p.mouse.move(x, y);
    await p.mouse.down();
    for (let i = 1; i <= 12; i++) { await p.mouse.move(x, y + (dy * i) / 12); await p.waitForTimeout(16); }
    await p.waitForTimeout(150);
    await p.mouse.up();
    await p.waitForTimeout(600);
  }
  const empurrar = () => p.evaluate((pop) => document.querySelectorAll(`${pop} .roda`).forEach((r) => { r.scrollTop = 32; }), pop);

  await p.goto("http://127.0.0.1:3100/calendario", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.locator(".cal-nova").click();
  await p.locator(".ficha").waitFor();
  await p.locator(".ficha-titulo").fill(`Roda alinhada ${w}`);
  await p.locator(".campo-data-botao").first().click();
  await p.waitForTimeout(400);
  await p.locator(`${pop} [data-dia="2026-10-22"]`).click();

  if (antes) {
    await arrastar("Hora", -2); // 00 -> 22, como na foto 36
    await empurrar();
    await p.waitForTimeout(200);
    console.log(JSON.stringify(await ler()));
    await foto(join(REF, "36-antes-faixa-23-azul-22.png"));
    await p.close();
    continue;
  }

  // Horas: sobe e desce várias voltas (00 -> 07 -> 19 -> 03 -> 22 -> 13 -> 23), passando por 23 -> 00 nos dois sentidos
  let esperado = 0;
  for (const linhas of [7, 12, 8, -5, -9, 10]) {
    await arrastar("Hora", linhas);
    esperado = (esperado + linhas + 240) % 24;
    const v = (await ler()).Hora.valor;
    if (v !== String(esperado).padStart(2, "0")) erros.push(`[${w}] hora ${linhas > 0 ? "subindo" : "descendo"} ${Math.abs(linhas)}: ${v}, esperado ${esperado}`);
    await conferir(`hora ${linhas}`);
    await empurrar(); // o navegador tenta rolar a caixa: a faixa continua no azul
    await conferir(`hora ${linhas} depois do empurrão`);
  }
  // Minutos: idem (00 -> 35 -> 15 -> 50 -> 45 -> 40), passando por 55 -> 00 nos dois sentidos
  let m = 0;
  for (const linhas of [7, 8, -5, 11, -13]) {
    await arrastar("Minuto", linhas);
    m = (m + linhas + 120) % 12;
    const v = (await ler()).Minuto.valor;
    if (v !== String(m * 5).padStart(2, "0")) erros.push(`[${w}] minuto ${linhas}: ${v}, esperado ${m * 5}`);
    await conferir(`minuto ${linhas}`);
    await empurrar();
    await conferir(`minuto ${linhas} depois do empurrão`);
  }
  const { Hora, Minuto } = await ler();
  await foto(join(PASTA, `${w}-roda-alinhada.png`));
  if (w === 1440) await foto(join(REF, "36-depois-faixa-igual-azul.png"));

  await p.locator(pop).getByRole("button", { name: "Selecionar" }).click();
  await p.waitForTimeout(300);
  const comeca = await p.locator(".campo-data-botao").first().innerText();
  if (comeca !== `22/10/2026 · ${Hora.faixa}:${Minuto.faixa}`) erros.push(`[${w}] salvou ${comeca}, faixa mostrava ${Hora.faixa}:${Minuto.faixa}`);
  console.log(`[${w}] faixa ${Hora.faixa}:${Minuto.faixa} -> botão ${comeca}`);
  await p.close();
}
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
