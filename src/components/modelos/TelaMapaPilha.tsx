import type { CSSProperties, ReactNode } from "react";
import { BordaAnimada } from "@/components/ui/BordaAnimada";
import { IconeRede, SeloEmpresa } from "@/components/ui/Marca";
import "./mapa-pilha.css";

// Item 189: escolha do visual dos cards do Mapa. Só comparação com texto fixo: o Mapa de verdade (components/mapa) não foi tocado.
// Em todas as variações o card sozinho é o que o Natham aprovou (vidro claro + relevo azul + luz girando) e o card da pilha usa a MESMA receita (.mp-card).
type Luz = "frente" | "todos";
const VARIACOES: { n: number; nome: string; frase: string; luz: Luz }[] = [
  { n: 1, nome: "Folhas sobrepostas, luz só na frente", luz: "frente", frase: "As folhas ficam uma sobre a outra, levemente giradas, como hoje, mas agora com o mesmo vidro. Só o card da frente tem a luz girando." },
  { n: 2, nome: "Folhas sobrepostas, luz em todos", luz: "todos", frase: "Mesma pilha da 1, mas cada folha tem a sua luz girando, cada uma num ritmo um pouco diferente." },
  { n: 3, nome: "Escada aberta", luz: "todos", frase: "A pilha já nasce aberta: todos os cards inteiros, um abaixo do outro, cada um um pouco mais à direita. Todos com luz." },
  { n: 4, nome: "Pilha em degraus com contador", luz: "frente", frase: "Cards retos, só deslocados para cima, com o título à mostra. O dia ganha o aviso “4 conteúdos” e a luz fica na frente." },
  { n: 5, nome: "Frente inteira e lista compacta", luz: "frente", frase: "O card da frente aparece inteiro e os outros viram linhas finas logo abaixo, com título e etapa. Luz só na frente." },
];

type Card = { titulo: string; etapa: string };
const CARDS: Card[] = [
  { titulo: "Reels 3", etapa: "Roteiro" },
  { titulo: "Post Carrossel", etapa: "Gravação" },
  { titulo: "Reeels2222", etapa: "Edição" },
  { titulo: "reels", etapa: "Aprovado" },
]; // o último da lista fica na frente

function Folha({ c, i, n, luz }: { c: Card; i: number; n: number; luz: boolean }) {
  const frente = i === n - 1;
  return (
    <div className="mp-item" data-frente={frente} style={{ "--i": i, "--d": n - 1 - i } as CSSProperties}>
      <BordaAnimada duracao={5 + i} className={luz ? "" : "mp-sem-luz"}>
        <div className="mp-card">
          <span className="mp-faixa">{c.titulo}</span>
          <span className="mp-contagem" aria-hidden>{i + 1}/{n}</span>
          <span className="mp-titulo">{c.titulo}</span>
          <span className="mp-info">
            <SeloEmpresa empresaId="you" nome="You" tamanho={16} comNome />
            <IconeRede rede="instagram" tamanho={16} />
            <span className="mp-etapa">{c.etapa}</span>
          </span>
        </div>
      </BordaAnimada>
    </div>
  );
}

function Palco({ rotulo, dia, aviso, children }: { rotulo: string; dia: string; aviso?: string; children: ReactNode }) {
  return (
    <div className="mp-coluna">
      <h3>{rotulo}</h3>
      <div className="mp-palco">
        <span className="mp-haste" aria-hidden />
        <span className="mp-data">{dia}{aviso && <b> · {aviso}</b>}</span>
        {children}
      </div>
    </div>
  );
}

export function TelaMapaPilha() {
  return (
    <div className="mp">
      <header className="mp-topo">
        <h1>Cards do Mapa: 5 variações</h1>
        <p>Pedido: o card sozinho e os cards empilhados no mesmo dia com a mesma aparência (vidro claro, relevo azul e luz girando, cantos de 10px). Em cada variação, à esquerda o card sozinho no dia, à direita 4 cards no mesmo dia. O que muda de uma para outra é só o jeito de empilhar e de mostrar a luz. O Mapa de verdade ainda não mudou.</p>
      </header>
      {VARIACOES.map((v) => (
        <section className="mp-bloco" key={v.n}>
          <h2><span className="mp-num">{v.n}</span>{v.nome}</h2>
          <p className="mp-frase">{v.frase}</p>
          <div className="mp-par">
            <Palco rotulo="Sozinho no dia" dia="Ter, 20/10">
              <div className="mp-pilha" data-n={1} data-v={v.n}>
                <Folha c={{ titulo: "Post - Reels", etapa: "Gravação" }} i={0} n={1} luz />
              </div>
            </Palco>
            <Palco rotulo="Com outros no mesmo dia" dia="Qua, 21/10" aviso={v.n === 4 ? "4 conteúdos" : undefined}>
              <div className="mp-pilha" data-n={CARDS.length} data-v={v.n}>
                {CARDS.map((c, i) => <Folha key={c.titulo} c={c} i={i} n={CARDS.length} luz={v.luz === "todos" || i === CARDS.length - 1} />)}
              </div>
            </Palco>
          </div>
        </section>
      ))}
    </div>
  );
}
