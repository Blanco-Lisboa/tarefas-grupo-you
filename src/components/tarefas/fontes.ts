// Letras de mão (exceção aprovada: só a tela Tarefas). Todas têm acentuação PT-BR no subset latin.
import { Caveat, Kalam, Patrick_Hand } from "next/font/google";

export const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });
export const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
export const patrick = Patrick_Hand({ subsets: ["latin"], weight: ["400"] });

export const OPCOES = [
  { id: "caveat", nome: "Caveat", jeito: "caneta esferográfica, corrida", fonte: caveat, escala: 1.12 },
  { id: "kalam", nome: "Kalam", jeito: "caneta de ponta porosa, redonda", fonte: kalam, escala: 0.92 },
  { id: "patrick", nome: "Patrick Hand", jeito: "lápis, letra de caderno", fonte: patrick, escala: 1 },
] as const;
export type OpcaoLetra = (typeof OPCOES)[number];

/** A letra que a tela principal usa (a recomendada; o Natham escolhe em /tarefas/letras). */
export const LETRA_PRINCIPAL: OpcaoLetra = OPCOES[2]; // Patrick Hand: o 1 não vira I como em Kalam e Caveat
