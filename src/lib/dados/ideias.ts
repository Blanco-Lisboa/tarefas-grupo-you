"use client";
// Ideias de conteúdo (item 65). Modelo: as Ideias do Yougram do CRM. Sem banco ainda (Fase 2 = Supabase):
// exemplos plausíveis + o que o Natham adicionar ou editar fica no navegador (localStorage). Só este arquivo troca na Fase 2.
import { useCallback, useMemo, useSyncExternalStore } from "react";

export type Ideia = { id: string; empresaId: string; categoria: string; titulo: string; texto: string; link?: string };

const CHAVE = "grade-conteudo:ideias:v1";
const ex = (e: string, n: number, categoria: string, titulo: string, texto: string, link?: string): Ideia => ({ id: `${e}-ideia-${n}`, empresaId: e, categoria, titulo, texto, link });
const IG = "https://www.instagram.com/explore/";
const TT = "https://www.tiktok.com/discover";

function semente(e: string): Ideia[] {
  const perfis = e === "beec" ? "Perfis - Empresários sellers" : "Perfis - Contabilidade";
  return [
    ex(e, 1, "Formatos de conteúdo", "X regras para não perder [TEMA]", "Lista curta e direta. Exemplo: 5 regras pra não tomar bloqueio na sua loja.", IG),
    ex(e, 2, "Formatos de conteúdo", "Explicando assunto na lousa", "Fala para a câmera e desenha o passo a passo. Funciona bem para imposto e fluxo de caixa.", TT),
    ex(e, 3, "Formatos de conteúdo", "Rankeando o melhor e o pior", "Tier list de erros comuns do assunto da semana, do mais perigoso ao mais bobo.", IG),
    ex(e, 4, "Formatos de conteúdo", "React em tela verde", "Reage a uma notícia ou a um vídeo de concorrente, com a opinião do especialista.", TT),
    ex(e, 5, "Ganchos", "Você está pagando imposto a mais", "Abertura de 3 segundos para vídeos de economia tributária."),
    ex(e, 6, "Ganchos", "Ninguém te conta isso sobre [TEMA]", "Gancho de curiosidade para carrossel ou reels."),
    ex(e, 7, "Ganchos", "O erro que custou R$ 10 mil", "História real (sem citar o cliente) que termina numa dica prática.", IG),
    ex(e, 8, perfis, "Perfis para acompanhar", "Contas que postam bem sobre o nosso público. Olhar toda segunda e anotar o que está funcionando.", IG),
    ex(e, 9, perfis, "Referência de edição", "Perfil com cortes rápidos e legenda grande, bom modelo para os reels.", TT),
    ex(e, 10, "Datas e sazonais", "Calendário fiscal do mês", "Um post por mês com os vencimentos principais. Serve de lembrete e de gancho de conversa."),
  ];
}

type Mapa = Record<string, Ideia[]>;
// Guardado como texto no navegador; useSyncExternalStore re-renderiza quem usa quando salva (e evita erro de hidratação).
let memoria = ""; // se o navegador negar o armazenamento, vale até recarregar
const ouvintes = new Set<() => void>();
const assinar = (f: () => void) => (ouvintes.add(f), () => void ouvintes.delete(f));
const bruto = () => {
  try {
    return localStorage.getItem(CHAVE) ?? memoria;
  } catch {
    return memoria;
  }
};
const ler = (txt: string): Mapa => {
  try {
    return txt ? (JSON.parse(txt) as Mapa) : {};
  } catch {
    return {};
  }
};

/** Ideias de uma empresa (reativo ao salvar). Sem nada guardado, mostra os exemplos. */
export function useIdeias(empresaId: string) {
  const txt = useSyncExternalStore(assinar, bruto, () => "");
  const ideias = useMemo(() => ler(txt)[empresaId] ?? semente(empresaId), [txt, empresaId]);

  /** Cria (sem id) ou edita (com id existente). */
  const salvar = useCallback((nova: Omit<Ideia, "id" | "empresaId"> & { id?: string }) => {
    const todas = ler(bruto());
    const lista = todas[empresaId] ?? semente(empresaId);
    const ideia: Ideia = { ...nova, id: nova.id ?? crypto.randomUUID(), empresaId };
    todas[empresaId] = lista.some((i) => i.id === ideia.id) ? lista.map((i) => (i.id === ideia.id ? ideia : i)) : [...lista, ideia];
    memoria = JSON.stringify(todas);
    try {
      localStorage.setItem(CHAVE, memoria);
    } catch {
      /* sem armazenamento: fica na memória */
    }
    ouvintes.forEach((f) => f());
    return ideia;
  }, [empresaId]);

  return { ideias, salvar };
}
