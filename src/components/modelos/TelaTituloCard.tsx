"use client";

import type { CSSProperties } from "react";
import { IconeRede, SeloEmpresa } from "@/components/ui/Marca";
import { TagChip } from "@/components/ui/Tag";
import { Pessoa } from "@/components/ui/Pessoa";
import "@/components/conteudos/conteudos.css";
import "./titulo-card.css";

const OPCOES = [
  { numero: 0, nome: "Hoje", frase: "Título como está no card atual." },
  { numero: 1, nome: "Opção 1", frase: "Um pequeno card branco sólido em volta do título." },
  { numero: 2, nome: "Opção 2", frase: "Contorno fino na cor da etapa, com cantos de 8px." },
  { numero: 3, nome: "Opção 3", frase: "Faixa suave da etapa atrás de um título maior." },
  { numero: 4, nome: "Opção 4", frase: "Título maior e mais forte, com barra da etapa à esquerda." },
] as const;

function Cartao() {
  return (
    <article className="conteudos-cartao tc-cartao">
      <div className="conteudos-cartao-topo">
        <span className="conteudos-empresa">
          <SeloEmpresa empresaId="you" nome="You Contabilidade" tamanho={20} />
          <span className="conteudos-empresa-nome">You Contabilidade</span>
        </span>
        <span className="conteudos-rede"><IconeRede rede="instagram" tamanho={18} /></span>
      </div>
      <span className="conteudos-tipo">Postagem</span>
      <button className="conteudos-titulo" type="button">Post - Reels</button>
      <p className="conteudos-objetivo">Mostrar os bastidores do escritório e gerar contato no direct</p>
      <div className="conteudos-trilha" role="img" aria-label="Etapa 4 de 6: Em análise">
        {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} data-feita={i <= 3} />)}
        <span>4/6</span>
      </div>
      <div className="conteudos-tags">
        <TagChip tag={{ id: "tag-esperando-aprovacao", nome: "Esperando aprovação", cor: "etiqueta-1", aprovacao: true }} aprovador="Natham" />
      </div>
      <div className="conteudos-cartao-rodape">
        <span className="conteudos-quem-faz"><Pessoa quem="matheus" tamanho={24} />Matheus</span>
        <time dateTime="2026-10-20T08:30">20/10 · 08:30</time>
      </div>
      <div className="conteudos-prazo"><a className="conteudos-drive" href="https://drive.google.com" target="_blank" rel="noopener noreferrer">Drive</a></div>
    </article>
  );
}

export function TelaTituloCard() {
  return (
    <div className="tc">
      <header className="tc-topo">
        <h1>Título do card de conteúdo</h1>
        <p>O mesmo conteúdo, na mesma coluna, com cinco formas de mostrar o título. Para escolher, diga o número da opção.</p>
      </header>
      <div className="tc-opcoes">
        {OPCOES.map((opcao) => (
          <section className="tc-bloco" data-opcao={opcao.numero} key={opcao.numero}>
            <h2>{opcao.nome}</h2>
            <p>{opcao.frase}</p>
            <div className="conteudos-coluna" data-etapa="analise" style={{ "--etapa": "var(--etapa-analise)" } as CSSProperties}>
              <div className="conteudos-coluna-topo">
                <span className="conteudos-numero">04</span>
                <h2>Em análise</h2>
                <span className="conteudos-contagem">1</span>
                <button className="conteudos-novo" type="button" aria-label="Novo conteúdo em Em análise">+</button>
              </div>
              <div className="conteudos-pilha"><Cartao /></div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
