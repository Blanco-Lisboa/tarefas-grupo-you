import type { CSSProperties } from "react";
import { IconeRede, SeloEmpresa } from "@/components/ui/Marca";
import { Pessoa } from "@/components/ui/Pessoa";
import "@/components/conteudos/conteudos.css";
import "./fazendo-agora.css";

// Item 167d: marcador final (orelha 5b) para "fazendo agora". Só comparação: o card de verdade não mudou.
// O card abaixo repete a marcação de TelaConteudos (mesmas classes, de conteudos.css), com texto fixo.
const OPCOES: { n: string; nome: string; frase: string }[] = [
  { n: "5b", nome: "Final (5b, um pouco maior)", frase: "Só a foto num marcador estreito descendo do topo. O nome aparece ao passar o mouse." },
];

type Quem = "natham" | "matheus";
const NOME: Record<Quem, string> = { natham: "Natham", matheus: "Matheus" };

function Orelha({ n, quem }: { n: string; quem: Quem }) {
  const nome = NOME[quem];
  return (
    <span className="fa-orelha" role="status" aria-label={`${nome} está fazendo agora`} title={`${nome} está fazendo agora`}>
      <Pessoa quem={quem} tamanho={22} />
      <span className="fa-so-leitor">{nome}</span>
    </span>
  );
}

function Cartao({ n, quem }: { n: string; quem: Quem }) {
  return (
    <div className="conteudos-pilha fa-pilha" data-fa={n || undefined} style={{ "--etapa": "var(--etapa-roteiro)" } as CSSProperties}>
      <article className="conteudos-cartao fa-cartao" data-fa={n || undefined}>
        {n && <Orelha n={n} quem={quem} />}
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
        <h1>Marcador “fazendo agora” no card</h1>
        <p>O mesmo card da Esteira em cada coluna. O marcador verde mostra qual tarefa cada pessoa está executando e quem é; todos veem a de todos, então aparece um card do Matheus e um do Natham. Passe o mouse no marcador para ver o nome.</p>
      </header>
      <div className="fa-colunas">
        <section className="fa-bloco">
          <h2>Hoje</h2>
          <p>Como está: nada no card diz que alguém está nessa tarefa.</p>
          <Cartao n="" quem="matheus" />
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
