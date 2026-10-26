// Cor da MARCA de cada empresa (item 71), comum a Pastas (arte da pasta) e Calendário (fundo do bloco, item 78).
// Só a cor; nada mais da identidade delas.
// Beec: roxo do logo (ID-Visual-ALL/Beec/identidade/tokens.css, barras do logo #470E96 e #6E18E5 e o elétrico #7319F1);
//   o brilho #CDB4F8 é um tom claro derivado do mesmo roxo (a ID não tem lilás claro).
// You: laranja do CRM (CRM-You/css/you-tokens.css: --brand-orange #FE4901, --orange-600 #E0430A, --brand-orange-2 #FF9200, --orange-100 #FFE0CC).
// Tu Ecom: verde-mata do manual de identidade, "Fundo escuro principal" (#0F3D2E; origem em public/marca/LEIAME.md, item 312).
//   g = tinta #0B241B (um passo mais escuro, do mesmo manual), c = mata-3 #1E5A45 (um passo mais claro), o = nevoa-verde #A9C2B5 (texto sobre escuro do manual).
// Empresa nova ganha uma das cores suaves de OUTROS pelo nome, até a Fase 2 trazer a cor do cadastro.
// g = veia escura, r = cor principal, c = veia clara, o = brilho.
export type Tom = { g: string; r: string; c: string; o: string };
const TONS: Record<string, Tom> = {
  beec: { g: "#470E96", r: "#6E18E5", c: "#7319F1", o: "#CDB4F8" },
  you: { g: "#E0430A", r: "#FE4901", c: "#FF9200", o: "#FFE0CC" },
  "tu-ecom": { g: "#0B241B", r: "#0F3D2E", c: "#1E5A45", o: "#A9C2B5" },
};
const OUTROS: Tom[] = [
  { g: "#D79AA8", r: "#EDB8C4", c: "#F5D2DA", o: "#FDEEF1" },
  { g: "#A99BD6", r: "#C4B8EA", c: "#DAD2F3", o: "#F3F0FC" },
  { g: "#E0A98A", r: "#F2C4A8", c: "#F8D9C6", o: "#FDF0E8" },
  { g: "#8DB4D9", r: "#AECDEA", c: "#C9DFF3", o: "#EEF5FB" },
];

/** Número pequeno e estável para um texto (a arte da pasta segue o nome; a empresa nova escolhe a cor por ele). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const tomDaEmpresa = (id: string): Tom => TONS[id] ?? OUTROS[hashString(id) % OUTROS.length];
