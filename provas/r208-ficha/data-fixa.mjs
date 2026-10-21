// Carregado antes do banco falso (node --import): o "hoje" do banco fica em 20/10/2026 15:00, a data da cena da Régua 215,
// para os cards de "hoje" da prévia caírem no mesmo dia (dois cards às 09:00 na terça 20/10) qualquer que seja o dia real.
const fixo = new Date(2026, 9, 20, 15, 0).getTime();
const Real = Date;
globalThis.Date = class extends Real {
  constructor(...a) { super(...(a.length ? a : [fixo])); }
  static now() { return fixo; }
};
