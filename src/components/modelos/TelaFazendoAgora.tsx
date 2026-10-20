import type { CSSProperties } from "react";
import { IconeRede, SeloEmpresa } from "@/components/ui/Marca";
import { Pessoa } from "@/components/ui/Pessoa";
import "@/components/conteudos/conteudos.css";
import "./fazendo-agora.css";

// Item 167b: 6 desenhos de ORELHA (aba que sai da borda do card) para "fazendo agora". Só comparação: o card de verdade não mudou.
// O card abaixo repete a marcação de TelaConteudos (mesmas classes, de conteudos.css), com texto fixo.
const OPCOES: { n: number; nome: string; frase: string }[] = [
  { n: 1, nome: "Opção 1 · a sua", frase: "Orelha verde no topo à esquerda, com o vidro brilhando do menu lateral correndo por cima." },
  { n: 2, nome: "Opção 2", frase: "A mesma orelha, no topo à direita." },
  { n: 3, nome: "Opção 3", frase: "Orelha na lateral direita, saindo para fora do card, com o nome na vertical." },
  { n: 4, nome: "Opção 4", frase: "Orelha no topo à direita com a ponta dobrada, como fita presa no canto." },
  { n: 5, nome: "Opção 5", frase: "Marcador de página verde descendo do topo, com foto e nome." },
  { n: 6, nome: "Opção 6 · com pino", frase: "Orelha levemente torta, presa no card por um pino (tachinha)." },
];

type Quem = "natham" | "matheus";
const NOME: Record<Quem, string> = { natham: "Natham", matheus: "Matheus" };

function Orelha({ n, quem }: { n: number; quem: Quem }) {
  const nome = NOME[quem];
  return (
    <span className="fa-orelha" role="status" aria-label={`${nome} está fazendo agora`}>
      {n === 6 && <i className="fa-pino" aria-hidden />}
      <Pessoa quem={quem} tamanho={n === 5 ? 28 : 20} />
      <span>{n === 3 || n === 5 ? nome : `${nome} fazendo agora`}</span>
    </span>
  );
}

function Cartao({ n, quem }: { n: number; quem: Quem }) {
  return (
    <div className="conteudos-pilha fa-pilha" data-fa={n || undefined} style={{ "--etapa": "var(--etapa-roteiro)" } as CSSProperties}>
      <article className="conteudos-cartao fa-cartao" data-fa={n || undefined}>
        {n > 0 && <Orelha n={n} quem={quem} />}
        <div className="conteudos-cartao-topo">
          <span className="conteudos-empresa">
            <SeloEmpresa empresaId="beec" nome="Beec" tamanho={20} />
            <span className="conteudos-empresa-nome">Beec</span>
          </span>
          <span className="conteudos-rede"><IconeRede rede="instagram" tamanho={18} /></span>
        </div>
        <span className="conteudos-tipo">Reels</span>
        <button className="conteudos-titulo" type="button">3 erros que o MEI comete no imposto</button>
        <p className="conteudos-objetivo">Mostrar o erro mais comum e levar o público para a conversa no direct.</p>
        <div className="conteudos-trilha" role="img" aria-label="Etapa 2 de 6: Gravação">
          {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} data-feita={i <= 1} />)}
          <span>2/6</span>
        </div>
        <div className="conteudos-cartao-rodape">
          <span className="conteudos-quem-faz"><Pessoa quem={quem} tamanho={24} />{NOME[quem]}</span>
          <time>22/10 · 14:00</time>
        </div>
        <div className="conteudos-prazo"><span className="conteudos-contagem-dias" data-tom="perto">posta em 2 dias</span></div>
      </article>
    </div>
  );
}

export function TelaFazendoAgora() {
  return (
    <div className="fa">
      <header className="fa-topo">
        <h1>Orelha “fazendo agora” no card</h1>
        <p>O mesmo card de Conteúdos em cada coluna. A orelha verde mostra qual tarefa cada pessoa está executando e quem é; todos veem a de todos, então cada opção tem um card do Matheus e um do Natham. Para escolher, diga o número: “quero a 3”.</p>
      </header>
      <div className="fa-colunas">
        <section className="fa-bloco">
          <h2>Hoje</h2>
          <p>Como está: nada no card diz que alguém está nessa tarefa.</p>
          <Cartao n={0} quem="matheus" />
        </section>
        {OPCOES.map((s) => (
          <section className="fa-bloco" key={s.n}>
            <h2>{s.nome}</h2>
            <p>{s.frase}</p>
            <Cartao n={s.n} quem="matheus" />
            <Cartao n={s.n} quem="natham" />
          </section>
        ))}
      </div>
    </div>
  );
}
