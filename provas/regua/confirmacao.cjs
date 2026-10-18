/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('C:/Users/Natham Monteiro/AppData/Roaming/npm/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const resultados = [];
  for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
    const erros = [];
    page.on('console', (msg) => { if (msg.type() === 'error') erros.push(msg.text()); });
    page.on('pageerror', (erro) => erros.push(erro.message));
    await page.goto('http://localhost:3100/configuracoes', { waitUntil: 'networkidle' });
    const empresa = page.locator('.config-empresa').filter({ hasText: 'Beec' });
    await empresa.getByRole('button', { name: 'Tirar', exact: true }).click();
    const aviso = await empresa.locator('.config-confirmacao p').innerText();
    if (!aviso.includes('23 tarefas') || !aviso.includes('9 peças') || !aviso.includes('Não dá para recuperar depois.')) throw Error(`Aviso incompleto: ${aviso}`);
    await page.evaluate(() => {
      const marca = document.createElement('div');
      marca.textContent = `innerWidth: ${innerWidth}px`;
      Object.assign(marca.style, { position: 'fixed', right: '8px', bottom: '8px', zIndex: 9999, padding: '4px 8px', background: '#18131F', color: '#FFFDF8', font: 'bold 14px Arial', borderRadius: '2px' });
      document.body.appendChild(marca);
    });
    await page.screenshot({ path: path.join(__dirname, `confirmacao-${largura}.png`) });
    if (largura === 1903) {
      await page.evaluate(() => console.error('PROVA-CAPTURA-INTENCIONAL'));
      if (!erros.some((erro) => erro.includes('PROVA-CAPTURA-INTENCIONAL'))) throw Error('Captura do console falhou');
      erros.splice(erros.findIndex((erro) => erro.includes('PROVA-CAPTURA-INTENCIONAL')), 1);
    }
    resultados.push({ largura, innerWidth: await page.evaluate(() => innerWidth), aviso, erros });
    await page.close();
  }
  fs.writeFileSync(path.join(__dirname, 'confirmacao.json'), JSON.stringify(resultados, null, 2));
  console.log(resultados);
  await browser.close();
})().catch((erro) => { console.error(erro); process.exit(1); });
