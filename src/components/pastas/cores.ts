import { hashString, RECEITAS, type ArtRecipe } from "./arte";

// Cor de cada empresa na pasta: tom suave (pastel). Os dados não guardam cor da empresa ainda; Beec e You têm a sua,
// as empresas novas ganham uma da lista pela ordem do nome. Fica aqui até a Fase 2 trazer a cor do cadastro.
// g = veia escura, r = líquido, c = veia clara, o = brilho (substituem os 4 azuis da arte).
type Tom = { g: string; r: string; c: string; o: string };
const TONS: Record<string, Tom> = {
  beec: { g: "#E6C98A", r: "#F5DDA0", c: "#F9E8BC", o: "#FFF8E4" },
  you: { g: "#96CDBC", r: "#B1E0D2", c: "#CDEEE3", o: "#EEFAF6" },
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
