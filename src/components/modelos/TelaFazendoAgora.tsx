import type { CSSProperties, ReactNode } from "react";
import { IconeRede, SeloEmpresa } from "@/components/ui/Marca";
import { Pessoa } from "@/components/ui/Pessoa";
import "@/components/conteudos/conteudos.css";
import "./fazendo-agora.css";

// Item 167: 5 desenhos de selo "fazendo agora" no card de Conteúdos. Só comparação: o card de verdade não mudou.
// O card abaixo repete a marcação de TelaConteudos (mesmas classes, de conteudos.css), com texto fixo.
const SELOS: { n: number; nome: string; frase: string }[] = [
  { n: 1, nome: "Opção 1", frase: "Bolinha verde que pulsa e “Matheus fazendo agora”, no topo do card." },
  { n: 2, nome: "Opção 2", frase: "Selo azul com o mesmo brilho que corre no item ativo do menu lateral." },
  { n: 3, nome: "Opção 3", frase: "Foto de quem está fazendo com um anel girando em volta e “Matheus está nisso” (ou Natham)." },
  { n: 4, nome: "Opção 4", frase: "Faixa fina animada colada no topo do card e o nome de quem está fazendo." },
  { n: 5, nome: "Opção 5", frase: "Selo com foto, relógio e o tempo desde que começou: “Matheus há 25 min”." },
];

type Quem = "natham" | "matheus";
const NOME: Record<Quem, string> = { natham: "Natham", matheus: "Matheus" };

function Selo({ n, quem }: { n: number; quem: Quem }): ReactNode {
  const nome = NOME[quem];
  if (n === 1) return <span className="fa-selo fa-1"><i className="fa-bolinha" aria-hidden />{nome} fazendo agora</span>;
  if (n === 2) return <span className="fa-selo fa-2"><Pessoa quem={quem} tamanho={18} />{nome} fazendo agora</span>;
  if (n === 3) return <span className="fa-selo fa-3"><span className="fa-anel"><Pessoa quem={quem} tamanho={24} /></span>{nome} está nisso</span>;
  if (n === 4) return <span className="fa-selo fa-4">{nome} fazendo agora</span>;
  if (n === 5) return <span className="fa-selo fa-5"><Pessoa quem={quem} tamanho={18} /><svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9" /><path className="fa-ponteiro" d="M12 12V6" /></svg>{nome} há 25 min</span>;
  return null;
}

function Cartao({ n, quem }: { n: number; quem: Quem }) {
  return (
    <div className="conteudos-pilha fa-pilha" style={{ "--etapa": "var(--etapa-gravacao)" } as CSSProperties}>
      <article className="conteudos-cartao fa-cartao" data-fa={n || undefined}>
        {n === 4 && <span className="fa-faixa" role="status" aria-label="Fazendo agora" />}
        {n > 0 && <div className="fa-linha"><Selo n={n} quem={quem} /></div>}
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
        <h1>Selo “fazendo agora” no card</h1>
        <p>O mesmo card de Conteúdos em cada coluna, só muda o selo que mostra qual tarefa cada pessoa está executando e quem é. Todos veem a de todos: um card do Matheus e um do Natham em cada opção. Para escolher, diga o número: “quero a 2”.</p>
      </header>
      <div className="fa-colunas">
        <section className="fa-bloco">
          <h2>Hoje</h2>
          <p>Como está: nada no card diz que alguém está nessa tarefa.</p>
          <Cartao n={0} quem="matheus" />
        </section>
        {SELOS.map((s) => (
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
