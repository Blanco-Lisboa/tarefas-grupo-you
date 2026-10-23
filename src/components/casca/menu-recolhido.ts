// Menu recolhido (item 38): lembrado entre recargas. O estado mora num atributo do <html> (data-menu), que o layout
// aplica com SCRIPT_MENU antes da tela pintar: quem deixou recolhido não vê o menu abrir e fechar ao recarregar.
// Sem React aqui: o layout (componente de servidor) importa o SCRIPT_MENU; o hook mora na Casca.

const CHAVE = "grade:menu-recolhido";
// Também tira do <body> as divs que a extensão de tradução do Chrome injeta (class translator-hidden / translate-tooltip-mtz):
// elas entram antes do React hidratar e dão "Hydration failed" no overlay (item 301). Só essas duas classes, só por 5 s.
const LIMPA = `var t=function(){document.querySelectorAll("body>.translator-hidden,body>.translate-tooltip-mtz").forEach(function(n){n.remove()})};t();var o=new MutationObserver(t);o.observe(document.body,{childList:true});setTimeout(function(){o.disconnect()},5000)`;
export const SCRIPT_MENU = `try{if(localStorage.getItem("${CHAVE}")==="1")document.documentElement.dataset.menu="recolhido"}catch(e){}${LIMPA}`;

const ouvintes = new Set<() => void>();
export const assinar = (f: () => void) => (ouvintes.add(f), () => void ouvintes.delete(f));
export const lerRecolhido = () => document.documentElement.dataset.menu === "recolhido";

export function definirRecolhido(v: boolean) {
  document.documentElement.dataset.menu = v ? "recolhido" : "aberto";
  try { localStorage.setItem(CHAVE, v ? "1" : "0"); } catch {}
  ouvintes.forEach((f) => f());
}
