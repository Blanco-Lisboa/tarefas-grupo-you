import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
const require=createRequire(join(process.env.APPDATA,'npm','node_modules','/'));
const {chromium}=require('playwright');
const pasta=fileURLToPath(new URL('./',import.meta.url));
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const exp=1893456000;
const jwt=[b64({alg:'HS256',typ:'JWT'}),b64({sub:'u-natham',exp,role:'authenticated',aud:'authenticated'}),b64('assinatura')].join('.');
const sessao={access_token:jwt,refresh_token:'x',expires_in:3600,expires_at:exp,token_type:'bearer',user:{id:'u-natham',aud:'authenticated',role:'authenticated',email:'natham@exemplo.invalid',app_metadata:{},user_metadata:{},created_at:'2026-10-19T00:00:00Z'}};
const base='http://127.0.0.1:3397';
const tasks=await(await fetch(`${base}/rest/v1/tarefas`)).json();
const original=tasks.find(t=>t.titulo==='Reels: bastidores do escritório');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const out=[];
const setStage=async stage=>{const r=await fetch(`${base}/rest/v1/rpc/salvar_tarefa`,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${jwt}`},body:JSON.stringify({p:{...original,etapa:stage}})});if(!r.ok)throw Error(`stage ${stage}: ${r.status}`)};
try{
 for(const [width,height] of [[1903,900],[1440,760]]){
  const ctx=await browser.newContext({viewport:{width,height}});
  await ctx.addCookies([{name:'sb-127-auth-token',value:`base64-${b64(sessao)}`,domain:'127.0.0.1',path:'/'}]);
  const pg=await ctx.newPage();await pg.clock.setFixedTime(new Date(2026,9,20,15,0));
  for(const stage of ['roteiro','gravacao','edicao','analise']){
   await setStage(stage);
   await pg.goto('http://127.0.0.1:3197/conteudos',{waitUntil:'networkidle'});
   const card=pg.locator('.conteudos-cartao').filter({hasText:original.titulo});
   const coluna=await card.evaluate(e=>e.closest('.conteudos-coluna')?.querySelector('h2')?.textContent?.trim());
   await card.locator('.conteudos-titulo').click();
   const m=await pg.locator('.ficha').evaluate(e=>({modalWidth:e.getBoundingClientRect().width,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,bodyScrollWidth:e.querySelector('.ficha-corpo')?.scrollWidth,bodyClientWidth:e.querySelector('.ficha-corpo')?.clientWidth}));
   out.push({viewport:width,stage,coluna,...m});
   await pg.keyboard.press('Escape');
  }
  await ctx.close();
 }
}finally{await setStage(original.etapa);await browser.close()}
writeFileSync(join(pasta,'medidas-etapas.json'),JSON.stringify(out,null,2));
