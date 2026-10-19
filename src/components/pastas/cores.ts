import { RECEITAS, type ArtRecipe } from "./arte";
import { tomDaEmpresa, type Tom } from "@/lib/cores-empresa";

// Cor de cada empresa na pasta = a cor DA MARCA (item 71). As cores moram em @/lib/cores-empresa (o Calendário usa as mesmas).
export { tomDaEmpresa };

const AZUIS: Record<string, keyof Tom> = { "#003F80": "g", "#0064CC": "r", "#1F86F0": "c", "#9CC8FF": "o" };
/** A receita azul da Névoa, repintada no tom da empresa. */
export const receitaDaEmpresa = (tipo: keyof typeof RECEITAS, id: string): ArtRecipe => {
  const t = tomDaEmpresa(id);
  const r: ArtRecipe = RECEITAS[tipo];
  return { ...r, colors: r.colors.map((c) => t[AZUIS[c.toUpperCase()]] ?? c) };
};
