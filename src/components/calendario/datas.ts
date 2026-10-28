// Datas importantes do Brasil (feriados nacionais e datas de conteúdo), calculadas para qualquer ano.
// Fonte e decisões do Natham: docs/levas/2026-10-27-datas-importantes.md.
import { deTexto, diaCurto, paraDia, somarDias } from "./logica";

export type DataImportante = { dia: string; nome: string; tipo: "feriado" | "comemorativa" | "destaque"; aviso?: string };

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const ORDEM = { destaque: 0, feriado: 1, comemorativa: 2 };
const data = (ano: number, mes: number, dia: number) => paraDia(new Date(ano, mes - 1, dia));

/** Domingo de Páscoa pelo cálculo gregoriano (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano: number) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return data(ano, Math.floor(n / 31), (n % 31) + 1);
}

/** O n-ésimo dia da semana (0 = domingo) do mês. Ex.: 2º domingo de maio = enesimo(ano, 5, 0, 2). */
const enesimo = (ano: number, mes: number, semana: number, n: number) => {
  const primeiro = new Date(ano, mes - 1, 1).getDay();
  return data(ano, mes, 1 + ((semana - primeiro + 7) % 7) + 7 * (n - 1));
};

export function datasDoAno(ano: number): DataImportante[] {
  const p = pascoa(ano);
  const fer = (dia: string, nome: string, aviso?: string): DataImportante => ({ dia, nome, tipo: "feriado", ...(aviso ? { aviso } : {}) });
  const com = (dia: string, nome: string, aviso?: string): DataImportante => ({ dia, nome, tipo: "comemorativa", ...(aviso ? { aviso } : {}) });
  /** Destaque: as datas que mais vendem para quem faz conteúdo de contabilidade e marketplace (Grupo You e Beec). */
  const des = (dia: string, nome: string, aviso?: string): DataImportante => ({ dia, nome, tipo: "destaque", ...(aviso ? { aviso } : {}) });
  /** Data dupla de marketplace (dia igual ao mês, como 11.11). */
  const dupla = (mes: number, quem: string, destaque = false) => (destaque ? des : com)(data(ano, mes, mes), `${mes}.${mes} (data dupla)`, `Campanha de marketplace: ${quem}.`);

  const feriados = [
    fer(data(ano, 1, 1), "Confraternização Universal"),
    fer(somarDias(p, -2), "Paixão de Cristo"),
    fer(data(ano, 4, 21), "Tiradentes"),
    fer(data(ano, 5, 1), "Dia Mundial do Trabalho"),
    fer(data(ano, 9, 7), "Independência do Brasil"),
    fer(data(ano, 10, 12), "Nossa Senhora Aparecida"),
    fer(data(ano, 11, 2), "Finados"),
    fer(data(ano, 11, 15), "Proclamação da República"),
    fer(data(ano, 11, 20), "Consciência Negra"),
    fer(data(ano, 12, 25), "Natal"),
  ];
  // Dia útil: segunda a sexta e fora dos feriados nacionais (ponto facultativo conta como útil).
  const nomeFeriado = new Map(feriados.map((f) => [f.dia, f.nome]));
  const util = (dia: string) => ![0, 6].includes(deTexto(dia).getDay()) && !nomeFeriado.has(dia);
  const antesUtil = (dia: string) => { while (!util(dia)) dia = somarDias(dia, -1); return dia; };
  const ultimoUtil = (mes: number) => antesUtil(data(ano, mes + 1, 0));
  /** Prazo que cai em fim de semana ou feriado vai para o dia útil anterior, com aviso (decisão 2 do Natham). */
  const prazo = (legal: string, nome: string) => {
    if (util(legal)) return com(legal, nome);
    const dia = antesUtil(legal), semana = deTexto(legal).getDay();
    const motivo = nomeFeriado.has(legal) ? `no feriado (${nomeFeriado.get(legal)})` : `no ${SEMANA[semana]}`;
    return com(dia, nome, `Prazo legal ${diaCurto(legal)} cai ${motivo}, antecipe para ${SEMANA[deTexto(dia).getDay()]} ${diaCurto(dia)}.`);
  };
  const campanha = (mes: number, nome: string) => com(data(ano, mes, 1), nome, `Campanha do mês inteiro de ${MESES[mes - 1]}.`);
  const acaoDeGracas = enesimo(ano, 11, 4, 4);

  const lista = [
    ...feriados,
    fer(somarDias(p, -48), "Carnaval", "Ponto facultativo"),
    fer(somarDias(p, -47), "Carnaval", "Ponto facultativo"),
    fer(somarDias(p, -46), "Quarta-Feira de Cinzas", "Ponto facultativo até 14h"),
    fer(somarDias(p, 60), "Corpus Christi", "Ponto facultativo"),
    fer(data(ano, 10, 28), "Dia do Servidor Público", "Ponto facultativo"),
    fer(data(ano, 12, 24), "Véspera de Natal", "Ponto facultativo após 13h"),
    fer(data(ano, 12, 31), "Véspera de Ano Novo", "Ponto facultativo após 13h"),

    des(data(ano, 1, 1), "Ano Novo"),
    com(data(ano, 3, 8), "Dia Internacional da Mulher"),
    des(data(ano, 3, 15), "Dia do Consumidor", "Semana do Consumidor: os marketplaces fazem campanha nos dias em volta."),
    com(p, "Páscoa"),
    com(data(ano, 4, 25), "Dia da Contabilidade"),
    com(data(ano, 5, 1), "Dia do Trabalhador"),
    com(data(ano, 5, 25), "Dia do Respeito ao Contribuinte"),
    des(enesimo(ano, 5, 0, 2), "Dia das Mães"),
    des(data(ano, 6, 12), "Dia dos Namorados"),
    des(enesimo(ano, 8, 0, 2), "Dia dos Pais"),
    com(data(ano, 9, 9), "Dia do Administrador"),
    des(data(ano, 9, 15), "Dia do Cliente"),
    des(data(ano, 9, 22), "Dia do Contador"),
    des(data(ano, 10, 5), "Dia da Micro e Pequena Empresa"),
    des(data(ano, 10, 12), "Dia das Crianças"),
    com(data(ano, 11, 19), "Dia do Empreendedorismo Feminino"),
    des(somarDias(acaoDeGracas, 1), "Black Friday"),
    des(somarDias(acaoDeGracas, 4), "Cyber Monday"),
    des(data(ano, 12, 25), "Natal", "Feriado nacional."),

    ...[2, 3, 4, 5, 6, 8].map((m) => dupla(m, "Shopee")),
    dupla(7, "Shopee (aniversário no Brasil)", true),
    dupla(9, "Shopee, Mercado Livre e Shein", true),
    dupla(10, "Shopee", true),
    dupla(11, "Shopee e AliExpress (Dia dos Solteiros, esquenta da Black Friday)", true),
    dupla(12, "Shopee", true),

    campanha(1, "Janeiro Branco"),
    campanha(5, "Maio Amarelo"),
    campanha(9, "Setembro Amarelo"),
    campanha(10, "Outubro Rosa"),
    campanha(11, "Novembro Azul"),

    com(ultimoUtil(1), "Prazo de opção pelo Simples Nacional"),
    prazo(data(ano, 3, 31), "Entrega da DEFIS"),
    des(ultimoUtil(5), "Fim da entrega do IRPF"),
    prazo(data(ano, 5, 31), "Entrega da DASN-SIMEI"),
    prazo(data(ano, 11, 30), "13º salário, 1ª parcela"),
    prazo(data(ano, 12, 20), "13º salário, 2ª parcela"),
    ...Array.from({ length: 12 }, (_, i) => prazo(data(ano, i + 1, 20), "DAS do Simples Nacional e do MEI")),
  ];
  // No mesmo dia: destaque, depois feriado, depois comemorativa (a etiqueta mostra a primeira; Natal fica dourado com o aviso de feriado).
  return lista.sort((a, b) => a.dia.localeCompare(b.dia) || ORDEM[a.tipo] - ORDEM[b.tipo]);
}

// Cada ano é calculado uma vez, quando a tela chega nele (só os anos que aparecem; nada de banco).
const porAno = new Map<number, Map<string, DataImportante[]>>();
/** Datas de um dia, destaque primeiro. O mesmo nome repetido (Natal destaque e feriado) aparece uma vez só, a primeira. */
export function datasDoDia(dia: string) {
  const ano = Number(dia.slice(0, 4));
  if (!porAno.has(ano)) {
    const mapa = new Map<string, DataImportante[]>();
    for (const d of datasDoAno(ano)) {
      const lista = mapa.get(d.dia) ?? [];
      if (!lista.some((x) => x.nome === d.nome)) mapa.set(d.dia, [...lista, d]);
    }
    porAno.set(ano, mapa);
  }
  return porAno.get(ano)!.get(dia) ?? [];
}
