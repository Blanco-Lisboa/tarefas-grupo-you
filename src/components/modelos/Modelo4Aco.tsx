import { Vitrine } from "./Vitrine";
import "./modelo-4-aco.css";

// Modelo 4 · Aço: cinza-azulado técnico, bordas finas, seta em círculo (ref-7). Sem acento.
export function Modelo4Aco() {
  return (
    <Vitrine
      numero={4}
      id="aco"
      nome="Aço"
      ideia="Cinza-azulado técnico, bordas de 1px, rótulos em caixa alta e a seta dentro de um círculo."
      cores={[
        { nome: "Fundo", hex: "#DCE2E9" },
        { nome: "Superfície", hex: "#E9EDF2" },
        { nome: "Texto", hex: "#0D1015" },
        { nome: "Texto fraco", hex: "#525C6A" },
        { nome: "Borda", hex: "#A9B3BF" },
        { nome: "Acento", hex: null },
      ]}
    />
  );
}
