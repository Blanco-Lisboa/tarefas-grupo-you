import Image from "next/image";
import type { InputHTMLAttributes, ReactNode } from "react";
import "./entrar.css";

// Cartão das telas /entrar e /entrar/nova-senha (item 150, opção 1 "Cartão claro"; protótipo em prototipos/login/opcao-1).
export function CartaoEntrar({ titulo, texto, children }: { titulo: string; texto?: ReactNode; children: ReactNode }) {
  return (
    <main className="entrar">
      <div className="entrar-cartao">
        <div className="entrar-selo"><Image src="/marca/fivecon.png" alt="" width={483} height={512} priority /></div>
        <div className="entrar-topo">
          <p className="entrar-nome">Tarefas</p>
          <h1 className="entrar-titulo">{titulo}</h1>
          {texto && <p className="entrar-texto">{texto}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}

const ICONES = {
  email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  senha: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
};

// Campo com ícone à esquerda; o rótulo fica para o leitor de tela e aparece como dica dentro do campo.
export function CampoEntrar({ rotulo, icone, ...input }: { rotulo: string; icone: keyof typeof ICONES } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="entrar-campo">
      <span className="entrar-oculto">{rotulo}</span>
      <svg viewBox="0 0 24 24" aria-hidden>{ICONES[icone]}</svg>
      <input placeholder={rotulo} {...input} />
    </label>
  );
}
