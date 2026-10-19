import { Vitrine } from "./Vitrine";
import "./modelo-2-editorial.css";

// Modelo 2 · Editorial: papel claro, preto e serifa itálica (ref-3). Sem acento: o contraste é a cor.
export function Modelo2Editorial() {
  return (
    <Vitrine
      numero={2}
      id="editorial"
      nome="Editorial"
      ideia="Papel claro e preto, com serifa itálica nos títulos. Sem cor de acento: o preto faz esse papel."
      cores={[
        { nome: "Fundo", hex: "#ECEAE5" },
        { nome: "Superfície", hex: "#F6F5F1" },
        { nome: "Texto", hex: "#141414" },
        { nome: "Texto fraco", hex: "#66635D" },
        { nome: "Borda", hex: "#D3CFC6" },
        { nome: "Acento", hex: null },
      ]}
    />
  );
}
