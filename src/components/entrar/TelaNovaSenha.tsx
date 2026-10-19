"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/cliente";
import { CampoEntrar, CartaoEntrar } from "./CartaoEntrar";

const MINIMO = 8;

export function TelaNovaSenha() {
  const [pronto, setPronto] = useState<"carregando" | "sim" | "nao">("carregando");
  const [senha, setSenha] = useState("");
  const [repetida, setRepetida] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Só quem chegou pelo convite (ou já está logado) tem sessão aqui.
  useEffect(() => {
    void supabase().auth.getSession().then(({ data }) => setPronto(data.session ? "sim" : "nao"));
  }, []);

  async function definir(e: FormEvent) {
    e.preventDefault();
    if (senha.length < MINIMO) return setErro(`A senha precisa ter pelo menos ${MINIMO} caracteres.`);
    if (senha !== repetida) return setErro("As duas senhas não são iguais.");
    setEnviando(true);
    setErro("");
    const { error } = await supabase().auth.updateUser({ password: senha });
    if (error) {
      setErro("Não consegui salvar a senha. Tente de novo.");
      setEnviando(false);
      return;
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa de propósito: limpa a memória da sessão anterior
    window.location.href = "/";
  }

  return (
    <CartaoEntrar
      titulo="Escolha sua senha"
      texto={pronto === "nao" ? "Este link venceu ou não é seu. Peça um novo convite ao Natham." : `Use pelo menos ${MINIMO} caracteres.`}
    >
      {pronto === "nao" ? (
        <Link className="lnk" href="/entrar">Voltar para Entrar</Link>
      ) : (
        <form className="entrar-form" onSubmit={definir}>
          <CampoEntrar rotulo="Nova senha" icone="senha" type="password" name="senha" autoComplete="new-password" required minLength={MINIMO} value={senha} onChange={(e) => setSenha(e.target.value)} />
          <CampoEntrar rotulo="Repita a senha" icone="senha" type="password" name="repetida" autoComplete="new-password" required value={repetida} onChange={(e) => setRepetida(e.target.value)} />
          {erro && <p className="entrar-erro" role="alert">{erro}</p>}
          <button type="submit" className="btn" disabled={enviando || pronto !== "sim"}>{enviando ? "Salvando…" : "Salvar e entrar"}</button>
        </form>
      )}
    </CartaoEntrar>
  );
}
