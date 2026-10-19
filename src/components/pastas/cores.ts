import { hashString, RECEITAS, type ArtRecipe } from "./arte";

// Cor de cada empresa na pasta = a cor DA MARCA (item 71). Só a cor; nada mais da identidade delas.
// Beec: roxo do logo (ID-Visual-ALL/Beec/identidade/tokens.css, barras do logo #470E96 e #6E18E5 e o elétrico #7319F1);
//   o brilho #CDB4F8 é um tom claro derivado do mesmo roxo (a ID não tem lilás claro).
// You: laranja do CRM (CRM-You/css/you-tokens.css: --brand-orange #FE4901, --orange-600 #E0430A, --brand-orange-2 #FF9200, --orange-100 #FFE0CC).
// Empresa nova ganha uma das cores suaves de OUTROS pelo nome, até a Fase 2 trazer a cor do cadastro.
// g = veia escura, r = líquido, c = veia clara, o = brilho (substituem os 4 azuis da arte).
type Tom = { g: string; r: string; c: string; o: string };
const TONS: Record<string, Tom> = {
  beec: { g: "#470E96", r: "#6E18E5", c: "#7319F1", o: "#CDB4F8" },
  you: { g: "#E0430A", r: "#FE4901", c: "#FF9200", o: "#FFE0CC" },
};
const OUTROS: Tom[] = [
  { g: "#D79AA8", r: "#EDB8C4", c: "#F5D2DA", o: "#FDEEF1" },
  { g: "#A99BD6", r: "#C4B8EA", c: "#DAD2F3", o: "#F3F0FC" },
  { g: "#E0A98A", r: "#F2C4A8", c: "#F8D9C6", o: "#FDF0E8" },
  { g: "#8DB4D9", r: "#AECDEA", c: "#C9DFF3", o: "#EEF5FB" },
];
export const tomDaEmpresa = (id: string): Tom => TONS[id] ?? OUTROS[hashString(id) % OUTROS.length];

const AZUIS: Record<string, keyof Tom> = { "#003F80": "g", "#0064CC": "r", "#1F86F0": "c", "#9CC8FF": "o" };
/** A receita azul da Névoa, repintada no tom da empresa. */
export const receitaDaEmpresa = (tipo: keyof typeof RECEITAS, id: string): ArtRecipe => {
  const t = tomDaEmpresa(id);
  const r: ArtRecipe = RECEITAS[tipo];
  return { ...r, colors: r.colors.map((c) => t[AZUIS[c.toUpperCase()]] ?? c) };
};
