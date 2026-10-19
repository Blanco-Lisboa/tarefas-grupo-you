// Menu recolhido (item 38): lembrado entre recargas. O estado mora num atributo do <html> (data-menu), que o layout
// aplica com SCRIPT_MENU antes da tela pintar: quem deixou recolhido não vê o menu abrir e fechar ao recarregar.
// Sem React aqui: o layout (componente de servidor) importa o SCRIPT_MENU; o hook mora na Casca.

const CHAVE = "grade:menu-recolhido";
export const SCRIPT_MENU = `try{if(localStorage.getItem("${CHAVE}")==="1")document.documentElement.dataset.menu="recolhido"}catch(e){}`;

const ouvintes = new Set<() => void>();
export const assinar = (f: () => void) => (ouvintes.add(f), () => void ouvintes.delete(f));
export const lerRecolhido = () => document.documentElement.dataset.menu === "recolhido";

export function definirRecolhido(v: boolean) {
  document.documentElement.dataset.menu = v ? "recolhido" : "aberto";
  try { localStorage.setItem(CHAVE, v ? "1" : "0"); } catch {}
  ouvintes.forEach((f) => f());
}
