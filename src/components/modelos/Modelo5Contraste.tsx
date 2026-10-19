import { Vitrine } from "./Vitrine";
import "./modelo-5-contraste.css";

// Modelo 5 · Contraste: branco com blocos pretos (ref-5 e ref-6). O verde-lima só aparece sobre o preto.
export function Modelo5Contraste() {
  return (
    <Vitrine
      numero={5}
      id="contraste"
      nome="Contraste"
      ideia="Branco com blocos pretos e cantos bem redondos. Um verde-lima que só aparece sobre o preto."
      cores={[
        { nome: "Fundo", hex: "#F1F1F1" },
        { nome: "Superfície", hex: "#FFFFFF" },
        { nome: "Texto", hex: "#0A0A0A" },
        { nome: "Texto fraco", hex: "#6B6B6B" },
        { nome: "Borda", hex: "#E3E3E3" },
        { nome: "Acento", hex: "#D7FF3A" },
      ]}
    />
  );
}
