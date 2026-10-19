// Porteiro (Next 16: "proxy" substitui o antigo middleware). Renova a sessão e manda para /entrar quem não está logado.
// Só a entrada é pública. A trava de verdade dos dados é do banco; este porteiro só evita mostrar tela vazia para quem não entrou.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await sb.auth.getClaims();
  const caminho = request.nextUrl.pathname;
  const naEntrada = caminho === "/entrar" || caminho.startsWith("/entrar/");
  if (!data?.claims && !naEntrada) {
    const para = request.nextUrl.clone();
    para.pathname = "/entrar";
    para.search = "";
    return NextResponse.redirect(para);
  }
  if (data?.claims && caminho === "/entrar") {
    const para = request.nextUrl.clone();
    para.pathname = "/";
    para.search = "";
    return NextResponse.redirect(para);
  }
  return resposta;
}

export const config = {
  // Tudo, menos arquivos do Next e imagens/fontes da pasta public.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)"],
};
