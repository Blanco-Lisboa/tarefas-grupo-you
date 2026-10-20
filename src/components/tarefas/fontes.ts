// Letra de mão do caderno (exceção aprovada: só a tela Tarefas). Acentuação PT-BR no subset latin.
import { Patrick_Hand } from "next/font/google";

const patrick = Patrick_Hand({ subsets: ["latin"], weight: ["400"] });

export type OpcaoLetra = { fonte: typeof patrick; escala: number };

/** Patrick Hand, a letra escolhida: lápis, letra de caderno; o 1 não vira I. */
export const LETRA_PRINCIPAL: OpcaoLetra = { fonte: patrick, escala: 1 };
