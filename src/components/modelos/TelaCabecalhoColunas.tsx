import type { CSSProperties } from "react";
import "@/components/conteudos/conteudos.css";
import "./cabecalho-colunas.css";

// Item 168b: 4 opções de cabeçalho das colunas, ao lado do "Hoje". Só comparação: o cabeçalho de verdade não mudou.
// Por dentro (vidro, trilha, brilho) tudo igual ao quadro real, com a paleta C.
const ETAPAS = ["roteiro", "gravacao", "edicao", "analise", "aprovado", "postado"] as const;
const NOMES = ["Roteiro", "Gravação", "Edição", "Análise", "Aprovado", "Postado"];
// Opção 3: a cor de cada etapa escurecida e fosca (marinho, petróleo, verde garrafa, cobre, oliva escuro, verde floresta). Branco sobre elas: 10,03 / 7,22 / 8,04 / 6,81 / 7,46 / 7,75
const FOSCAS = ["#25407A", "#1F5F6B", "#1F5A47", "#8A4A22", "#4F5A1E", "#1B5E3A"];

const OPCOES = [
  { cls: "", nome: "Hoje · meio-termo atual", frase: "Fundo tingido com 28% da cor, letra escura, fio de 3px embaixo. É o que está no sistema." },
  { cls: "cab-1", nome: "Opção 1 · Grafite com barra", frase: "Cabeçalho grafite escuro igual em todas, letra branca, número em tom claro da etapa e barra grossa de 4px na cor da etapa embaixo. Número: 6,3 a 6,8; nome: 13,4." },
  { cls: "cab-2", nome: "Opção 2 · Branco com faixa lateral", frase: "Cabeçalho branco, faixa grossa de 5px da cor da etapa na esquerda e nome em texto escuro pesado. Nome: 16,8; número: 6,0." },
  { cls: "cab-3", nome: "Opção 3 · Cor fechada e fosca", frase: "Cabeçalho na cor da etapa escurecida (sem roxo), letra branca, menos saturado que a C cheia. Branco sobre elas: 6,8 a 10,0." },
  { cls: "cab-4", nome: "Opção 4 · Branco com fio no topo", frase: "Cabeçalho branco, fio de 4px da cor da etapa em cima, nome escuro e contador numa pastilha na cor da etapa com número branco. Contador: 5,4 a 7,0." },
];

function Quadro({ cls }: { cls: string }) {
  return (
    <div className={`conteudos-quadro cab-quadro ${cls}`}>
      {ETAPAS.map((etapa, i) => (
        <section key={etapa} className="conteudos-coluna" style={{ "--etapa": `var(--etapa-${etapa})`, "--cab": FOSCAS[i] } as CSSProperties}>
          <div className="conteudos-coluna-topo">
            <span className="conteudos-numero">{String(i + 1).padStart(2, "0")}</span>
            <h2>{NOMES[i]}</h2>
            <span className="conteudos-contagem">{i === 1 ? 2 : 1}</span>
            <button className="conteudos-novo" type="button" tabIndex={-1} aria-hidden>+</button>
          </div>
          <div className="conteudos-pilha">
            <article className="conteudos-cartao">
              <span className="conteudos-tipo">Reels</span>
              <span className="conteudos-titulo">Bastidores do fechamento do mês</span>
              <div className="conteudos-trilha" role="img" aria-label={`Etapa ${i + 1} de 6`}>
                {ETAPAS.map((e, j) => <i key={e} data-feita={j <= i} />)}
                <span>{i + 1}/6</span>
              </div>
            </article>
          </div>
        </section>
      ))}
    </div>
  );
}

export function TelaCabecalhoColunas() {
  return (
    <div className="cab">
      <header className="cab-topo">
        <h1>Cabeçalho das colunas</h1>
        <p>O quadro inteiro de Conteúdos, igual em todos, só o cabeçalho muda. Para escolher, diga o número: &ldquo;quero a 2&rdquo;.</p>
      </header>
      {OPCOES.map((o) => (
        <section key={o.nome} className="cab-bloco">
          <h2>{o.nome}</h2>
          <p>{o.frase}</p>
          <Quadro cls={o.cls} />
        </section>
      ))}
    </div>
  );
}
