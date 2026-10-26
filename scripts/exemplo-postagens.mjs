// Calendário de postagens (315) NO BANCO FALSO do modo exemplo (porta 3101): pauta inventada, só na memória. Responde como as funções do SQL
// 2026-10-26-315-01-pauta.sql (postagens_calendario, salvar_planejada, apagar_planejada) e a leitura da tabela postagens_planejadas.
// Nada daqui vai ao banco real. Os dias contam a partir de HOJE, então a tela sempre abre com exemplos.
const pad = (n) => String(n).padStart(2, "0");
const dia = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoje = new Date();
const deslocar = (n) => dia(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + n));
const diaDaSemana = (s) => new Date(`${s}T12:00:00`).getDay();
const somar = (s, n) => dia(new Date(new Date(`${s}T12:00:00`).getTime() + n * 864e5));
const HOJE = dia(hoje);
const INICIO = deslocar(-35);

let seq = 0;
const nova = (p) => ({ id: `pp-${++seq}`, titulo: null, redes: ["instagram", "facebook"], responsavel: "matheus", fim: null, data: null, dias_semana: null, ...p });
const series = [
  nova({ empresa_id: "you", formato: "reels", hora: "17:00", repete: "semana", dias_semana: [1, 3], inicio: INICIO, titulo: "Dica rápida do MEI" }),
  nova({ empresa_id: "beec", formato: "reels", hora: "12:00", repete: "semana", dias_semana: [1], inicio: INICIO }),
  nova({ empresa_id: "tu-ecom", formato: "reels", hora: "10:00", repete: "semana", dias_semana: [2], inicio: INICIO }),
  nova({ empresa_id: "you", formato: "carrossel", hora: "18:00", repete: "semana", dias_semana: [2, 5], inicio: INICIO }),
  nova({ empresa_id: "beec", formato: "story", hora: "09:00", repete: "semana", dias_semana: [4], inicio: INICIO, responsavel: "natham" }),
  nova({ empresa_id: "tu-ecom", formato: "post", hora: "15:00", repete: "data", data: deslocar(3), inicio: deslocar(3), titulo: "Lançamento da semana" }),
];
const excecoes = new Map(); // "id|dia" -> { pula?, hora?, titulo?, responsavel? }

// Posts reais (cards em Postado): o que casa com a pauta vira "feita"; o que sobra vira "extra".
// Semana passada: segunda (You 17h e Beec 12h saíram), quarta (You faltou), sexta (carrossel saiu), um story solto na quarta. Esta semana: a Beec de segunda já saiu.
const segundaPassada = deslocar(-((hoje.getDay() + 6) % 7) - 7);
const segundaDestaSemana = deslocar(-((hoje.getDay() + 6) % 7));
const posts = [];
posts.push(
  { id: "card-1", titulo: "Reels: 3 erros do MEI", empresa_id: "you", formato: "reels", quando: `${segundaPassada}T17:05` },
  { id: "card-2", titulo: "Reels: bastidores da Beec", empresa_id: "beec", formato: "reels", quando: `${segundaPassada}T12:10` },
  { id: "card-3", titulo: "Carrossel: preços", empresa_id: "you", formato: "carrossel", quando: `${somar(segundaPassada, 4)}T18:00` },
  { id: "card-4", titulo: "Reels: bastidores da Beec", empresa_id: "beec", formato: "reels", quando: `${segundaDestaSemana}T12:05` },
  { id: "card-5", titulo: "Story solto da You", empresa_id: "you", formato: "story", quando: `${somar(segundaPassada, 2)}T11:30` },
);

const ocorrenciasDe = (de, ate) => {
  const lista = [];
  for (const s of series) {
    for (let d = de; d <= ate; d = somar(d, 1)) {
      const vale = s.repete === "data" ? d === s.data : d >= s.inicio && (!s.fim || d <= s.fim) && s.dias_semana.includes(diaDaSemana(d));
      const ex = excecoes.get(`${s.id}|${d}`);
      if (!vale || ex?.pula) continue;
      lista.push({ ...s, planejada_id: s.id, dia: d, hora: ex?.hora ?? s.hora, titulo: ex?.titulo ?? s.titulo, responsavel: ex?.responsavel ?? s.responsavel });
    }
  }
  return lista;
};

function calendario(de, ate) {
  const plano = ocorrenciasDe(de, ate).sort((a, b) => a.hora.localeCompare(b.hora));
  const usados = new Set();
  const saida = plano.map((o) => {
    const par = posts.filter((p) => p.empresa_id === o.empresa_id && p.formato === o.formato && p.quando.slice(0, 10) === o.dia && !usados.has(p.id)).sort((a, b) => a.quando.localeCompare(b.quando))[0];
    if (par) usados.add(par.id);
    const estado = par ? "feita" : o.dia < HOJE ? "faltou" : "planejada";
    return { planejada_id: o.planejada_id, dia: o.dia, hora: o.hora, empresa_id: o.empresa_id, formato: o.formato, redes: o.redes, responsavel: o.responsavel, titulo: o.titulo, repete: o.repete, estado, card_id: par?.id ?? null, card_titulo: par?.titulo ?? null };
  });
  for (const p of posts) {
    const d = p.quando.slice(0, 10);
    if (usados.has(p.id) || d < de || d > ate) continue;
    saida.push({ planejada_id: null, dia: d, hora: p.quando.slice(11, 16), empresa_id: p.empresa_id, formato: p.formato, redes: null, responsavel: null, titulo: null, repete: null, estado: "extra", card_id: p.id, card_titulo: p.titulo });
  }
  return saida.sort((a, b) => a.dia.localeCompare(b.dia) || a.hora.localeCompare(b.hora));
}

const campos = (p) => ({ empresa_id: p.empresa_id, formato: p.formato, redes: p.redes ?? ["instagram", "facebook"], hora: p.hora, responsavel: p.responsavel || "matheus", titulo: p.titulo ?? null, repete: p.repete, data: p.data ?? null, dias_semana: p.repete === "semana" ? p.dias_semana : null, inicio: p.inicio ?? (p.repete === "data" ? p.data : HOJE), fim: p.repete === "semana" ? p.fim ?? null : null });

/** Devolve true se tratou o pedido. `corpo()` lê o JSON do pedido. */
export async function postagensExemplo({ res, url, rpc, metodo, corpo }) {
  const json = (v) => res.writeHead(200).end(JSON.stringify(v));
  if (rpc === "postagens_calendario") { const { p_de, p_ate } = await corpo(); json(calendario(p_de, p_ate)); return true; }
  if (rpc === "salvar_planejada") {
    const { p, p_escopo, p_dia } = await corpo();
    const antiga = series.find((s) => s.id === p.id);
    if (!antiga) { const s = nova(campos(p)); series.push(s); json(s.id); return true; }
    if (p_escopo === "dia") { excecoes.set(`${antiga.id}|${p_dia}`, { hora: p.hora, titulo: p.titulo, responsavel: p.responsavel }); json(antiga.id); return true; }
    if (p_escopo === "proximos" && antiga.repete === "semana" && p_dia > antiga.inicio) {
      antiga.fim = somar(p_dia, -1);
      const s = nova({ ...campos(p), inicio: p.repete === "data" ? p.data : p_dia }); series.push(s); json(s.id); return true;
    }
    Object.assign(antiga, campos(p)); json(antiga.id); return true;
  }
  if (rpc === "apagar_planejada") {
    const { p_id, p_escopo, p_dia } = await corpo();
    const i = series.findIndex((s) => s.id === p_id);
    if (i < 0) return res.writeHead(204).end(), true;
    if (p_escopo === "dia" && series[i].repete === "semana") excecoes.set(`${p_id}|${p_dia}`, { pula: true });
    else if (p_escopo === "proximos" && series[i].repete === "semana" && p_dia > series[i].inicio) series[i].fim = somar(p_dia, -1);
    else series.splice(i, 1);
    return res.writeHead(204).end(), true;
  }
  if (metodo === "GET" && url.pathname === "/rest/v1/postagens_planejadas") {
    const id = url.searchParams.get("id")?.replace(/^eq\./, "");
    json(series.filter((s) => !id || s.id === id).map((s) => ({ ...s, pessoas: { slug: s.responsavel } })));
    return true;
  }
  return false;
}
