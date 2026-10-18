/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('C:/Users/Natham Monteiro/AppData/Roaming/npm/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const pasta = __dirname;
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const resultados = [];
  for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
    for (const rota of ['conteudos', 'configuracoes']) {
      const page = await browser.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
      const erros = [];
      page.on('console', (msg) => { if (msg.type() === 'error') erros.push(`console: ${msg.text()}`); });
      page.on('pageerror', (erro) => erros.push(`page: ${erro.message}`));
      await page.goto(`http://localhost:3100/${rota}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        const marca = document.createElement('div');
        marca.textContent = `innerWidth: ${innerWidth}px`;
        Object.assign(marca.style, { position: 'fixed', right: '8px', bottom: '8px', zIndex: 9999, padding: '4px 8px', background: '#18131F', color: '#FFFDF8', font: 'bold 14px Arial', borderRadius: '2px' });
        document.body.appendChild(marca);
      });
      await page.screenshot({ path: path.join(pasta, `${rota}-${largura}.png`) });
      if (largura === 1903 && rota === 'conteudos') {
        await page.evaluate(() => console.error('PROVA-CAPTURA-INTENCIONAL'));
        if (!erros.some((erro) => erro.includes('PROVA-CAPTURA-INTENCIONAL'))) throw Error('Captura do console não funcionou');
        erros.splice(erros.findIndex((erro) => erro.includes('PROVA-CAPTURA-INTENCIONAL')), 1);
      }
      resultados.push({ rota, largura, innerWidth: await page.evaluate(() => innerWidth), erros });
      await page.close();
    }
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 760 } });
  await page.goto('http://localhost:3100/conteudos', { waitUntil: 'networkidle' });
  const total = await page.locator('.conteudos-cartao').count();
  await page.getByRole('button', { name: 'Beec', exact: true }).click();
  const filtrado = await page.locator('.conteudos-cartao').count();
  if (!filtrado || filtrado >= total || await page.locator('.conteudos-empresa').filter({ hasText: 'You' }).count()) throw Error('Filtro global não foi aplicado');
  await page.getByRole('button', { name: 'Todas', exact: true }).click();
  const cartao = page.locator('.conteudos-cartao').first();
  const titulo = await cartao.locator('.conteudos-titulo').textContent();
  await cartao.locator('.conteudos-titulo').click();
  await page.locator('dialog.ficha').waitFor({ timeout: 3000 });
  await page.locator('dialog.ficha').getByRole('button', { name: 'Fechar' }).click();
  await cartao.locator('select').selectOption('roteiro');
  await page.locator('.conteudos-coluna').nth(1).getByText(titulo, { exact: true }).waitFor({ timeout: 3000 });
  const tituloArrastado = await page.locator('.conteudos-coluna').nth(1).locator('.conteudos-cartao').first().locator('.conteudos-titulo').textContent();
  await page.locator('.conteudos-coluna').nth(1).locator('.conteudos-cartao').first().dragTo(page.locator('.conteudos-coluna').nth(2).locator('.conteudos-coluna-topo'));
  await page.locator('.conteudos-coluna').nth(2).getByText(tituloArrastado, { exact: true }).waitFor({ timeout: 3000 });
  await page.goto('http://localhost:3100/configuracoes', { waitUntil: 'networkidle' });
  await page.locator('#config-nova-empresa').fill('Empresa de prova');
  await page.getByRole('button', { name: 'Incluir', exact: true }).click();
  const empresa = page.locator('.config-empresa').last();
  if (!(await empresa.count())) throw Error('Inclusão não funcionou');
  await empresa.getByRole('button', { name: 'Renomear' }).click();
  await empresa.locator('input').fill('Empresa de teste');
  await empresa.getByRole('button', { name: 'Salvar' }).click();
  const renomeada = page.locator('.config-empresa').filter({ hasText: 'Empresa de teste' });
  if (!(await renomeada.count())) throw Error('Renomeação não funcionou');
  await renomeada.getByRole('button', { name: 'Tirar', exact: true }).click();
  if (!(await renomeada.getByText('0 tarefas serão removidas junto.').count())) throw Error('Confirmação sem contagem');
  await renomeada.getByRole('button', { name: 'Sim, tirar empresa' }).click();
  if (await page.locator('.config-empresa').filter({ hasText: 'Empresa de teste' }).count()) throw Error('Remoção não funcionou');
  resultados.push({ interacoes: 'filtro, ficha, seletor de etapa, arraste, incluir, renomear, confirmar e tirar: ok' });
  fs.writeFileSync(path.join(pasta, 'resultado.json'), JSON.stringify(resultados, null, 2));
  console.log(resultados);
  await browser.close();
})().catch((erro) => { console.error(erro); process.exit(1); });
