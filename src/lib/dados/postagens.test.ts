import { describe, expect, it } from "vitest";
import { redesQueValem } from "./postagens";
import type { Arquivo } from "./tipos";

const img: Arquivo = { nome: "a.jpg", tipo: "imagem" }, vid: Arquivo = { nome: "b.mp4", tipo: "video" };

describe("postar_redes gravado (achado 3 da Lupa no Correio)", () => {
  it("carrossel com vídeo grava só o Instagram, também quando as redes estão no padrão (nulo = as duas)", () => {
    expect(redesQueValem({ formato: "carrossel", arquivos: [img, vid], postarRedes: ["instagram", "facebook"] })).toEqual(["instagram"]);
    expect(redesQueValem({ formato: "carrossel", arquivos: [img, vid] })).toEqual(["instagram"]);
    expect(redesQueValem({ formato: "carrossel", arquivos: [img, { ...vid, pendente: {} as File }] })).toEqual(["instagram"]); // vídeo subindo agora conta
  });
  it("o resto fica como está: carrossel só de fotos, outro formato, capa e arquivo removido; só Facebook não vira Instagram", () => {
    expect(redesQueValem({ formato: "carrossel", arquivos: [img, img], postarRedes: ["instagram", "facebook"] })).toEqual(["instagram", "facebook"]);
    expect(redesQueValem({ formato: "reels", arquivos: [vid] })).toBeUndefined();
    expect(redesQueValem({ formato: "carrossel", arquivos: [img, { ...vid, removido: true }], postarRedes: ["facebook"] })).toEqual(["facebook"]);
    expect(redesQueValem({ formato: "carrossel", arquivos: [img, vid], postarRedes: ["facebook"] })).toEqual(["facebook"]);
  });
});
