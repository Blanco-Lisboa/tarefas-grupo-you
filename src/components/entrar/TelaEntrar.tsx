"use client";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/cliente";
import { CampoEntrar, CartaoEntrar } from "./CartaoEntrar";

// O convite do Supabase chega aqui com a sessão no endereço (#access_token=...&type=invite): a pessoa vai definir a senha.
const veioDeConvite = () => /type=(invite|recovery)/.test(window.location.hash);
const semAssinar = () => () => {};
const linkVencido = () => /error_code=otp_expired|error=access_denied/.test(window.location.hash);

export function TelaEntrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroForm, setErro] = useState("");
  const vencido = useSyncExternalStore(semAssinar, linkVencido, () => false);
  const erro = erroForm || (vencido ? "Este link venceu ou já foi usado. Peça um novo convite ao Natham." : "");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!veioDeConvite()) return;
    const { data } = supabase().auth.onAuthStateChange((_evento, sessao) => {
      if (sessao) router.replace("/entrar/nova-senha");
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setErro("E-mail ou senha incorretos.");
      setEnviando(false);
      return;
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa de propósito: limpa a memória da sessão anterior
    window.location.href = "/"; // recarrega inteiro: nada da pessoa anterior fica na memória
  }

  return (
    <CartaoEntrar titulo="Entrar" texto="Só entra quem foi convidado. Esqueceu a senha? Peça um novo convite ao Natham.">
      <form className="entrar-form" onSubmit={entrar}>
        <CampoEntrar rotulo="E-mail" icone="email" type="email" name="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <CampoEntrar rotulo="Senha" icone="senha" type="password" name="senha" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        {erro && <p className="entrar-erro" role="alert">{erro}</p>}
        <button type="submit" className="btn" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
      </form>
    </CartaoEntrar>
  );
}
