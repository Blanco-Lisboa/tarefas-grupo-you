import { afterEach, beforeEach, expect, it, vi } from "vitest";

const ouvidas: Array<{ table: string; cb: () => void }> = [];
const removeChannel = vi.fn();
const canal: { on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> } = {
  on: vi.fn((_t: string, filtro: { table: string }, cb: () => void) => { ouvidas.push({ table: filtro.table, cb }); return canal; }),
  subscribe: vi.fn(() => canal),
};
vi.mock("@/lib/supabase/cliente", () => ({ supabase: () => ({ channel: () => canal, removeChannel }) }));

import { ligarTempoReal } from "./tempo-real";

beforeEach(() => { ouvidas.length = 0; vi.useFakeTimers(); vi.stubGlobal("window", {}); vi.stubGlobal("document", { hidden: false }); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("assina cada tabela, junta avisos seguidos numa releitura e desliga ao sair", () => {
  const aoMudar = vi.fn();
  const desligar = ligarTempoReal("t", ["tarefas", "tags"], aoMudar);
  expect(ouvidas.map((o) => o.table)).toEqual(["tarefas", "tags"]);
  ouvidas[0].cb(); ouvidas[1].cb(); ouvidas[0].cb();
  vi.advanceTimersByTime(300);
  expect(aoMudar).toHaveBeenCalledTimes(1);
  desligar();
  expect(removeChannel).toHaveBeenCalledWith(canal);
});
