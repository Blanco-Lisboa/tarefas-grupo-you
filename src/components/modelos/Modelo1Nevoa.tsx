import { Vitrine } from "./Vitrine";
import "./modelo-1-nevoa.css";

// Modelo 1 · Névoa: claro de vidro, como o Mac (ref-4). Cinza claro, painéis translúcidos, azul só no que se clica.
export function Modelo1Nevoa() {
  return (
    <Vitrine
      numero={1}
      id="nevoa"
      nome="Névoa"
      ideia="Claro de vidro, como o Mac. Cinza claro, painéis translúcidos e um azul só no que se clica."
      cores={[
        { nome: "Fundo", hex: "#E8E9EC" },
        { nome: "Superfície", hex: "#F7F7F9" },
        { nome: "Texto", hex: "#1D1D1F" },
        { nome: "Texto fraco", hex: "#636366" },
        { nome: "Borda", hex: "#D2D2D7" },
        { nome: "Acento", hex: "#0071E3" },
      ]}
    />
  );
}
