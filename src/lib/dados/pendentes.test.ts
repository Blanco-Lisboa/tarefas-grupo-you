import { afterEach, describe, expect, it, vi } from "vitest";

const consulta = vi.fn(async () => ({ data: [{ id: "a", video_pendente_desde: "2026-10-22T10:00:00Z" }], error: null }));
vi.mock("@/lib/supabase/cliente", () => ({ supabase: () => ({ from: () => ({ select: () => ({ not: consulta }) }) }) }));
vi.mock("./envios", () => ({ useEnvios: () => [] }));

import { haQuanto, reler } from "./pendentes";

afterEach(() => vi.useRealTimers());

describe("pendentes (Lupa re-revisão 3)", () => {
  it("vários pedidos no mesmo instante (um por card) viram UMA consulta", async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 20; i++) reler();
    await vi.advanceTimersByTimeAsync(200);
    expect(consulta).toHaveBeenCalledTimes(1);
  });
  it("haQuanto: minutos, horas e dias", () => {
    const agora = Date.parse("2026-10-22T12:00:00Z");
    expect(haQuanto("2026-10-22T11:55:00Z", agora)).toBe("há 5 min");
    expect(haQuanto("2026-10-22T09:00:00Z", agora)).toBe("há 3 h");
    expect(haQuanto("2026-10-21T12:00:00Z", agora)).toBe("há 1 dia");
    expect(haQuanto("2026-10-19T12:00:00Z", agora)).toBe("há 3 dias");
  });
});
