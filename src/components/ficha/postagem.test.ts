import { describe, expect, it } from "vitest";
import type { Arquivo } from "@/lib/dados";
import { faltaParaPostar, redesValidas, situacao } from "./postagem";

const img: Arquivo = { nome: "a.png", tipo: "imagem" }, vid: Arquivo = { nome: "b.mp4", tipo: "video" }, capa: Arquivo = { nome: "c.jpg", tipo: "imagem", papel: "capa" };
const card = (arquivos: Arquivo[], legenda = "Texto") => ({ arquivos, legenda, empresaId: "you" });

describe("o que falta para postar (196)", () => {
  it("cada formato com a sua quantidade; a capa não conta como mídia", () => {
    expect(faltaParaPostar(card([img]), "post", ["instagram"])).toEqual([]);
    expect(faltaParaPostar(card([vid, capa]), "reels", ["instagram"])).toEqual([]);
    expect(faltaParaPostar(card([img]), "reels", ["instagram"])).toEqual(["Reels leva 1 vídeo."]);
    expect(faltaParaPostar(card([img]), "carrossel", ["instagram"])).toEqual(["Carrossel leva de 2 a 10 imagens ou vídeos."]);
    expect(faltaParaPostar(card([vid], ""), "story", ["instagram", "facebook"])).toEqual([]); // story não leva legenda
  });
  it("sem legenda, sem rede, sem formato e empresa que não é a You", () => {
    expect(faltaParaPostar(card([img], " "), "post", [])).toEqual(["Escolha pelo menos uma rede.", "Falta a legenda: escreva na ficha do card."]);
    expect(faltaParaPostar(card([img]), undefined, ["instagram"])).toEqual(["Escolha o formato."]);
    expect(faltaParaPostar({ ...card([img]), empresaId: "beec" }, "post", ["instagram"])).toEqual(["A Beec ainda não está ligada à postagem automática."]);
  });
  it("carrossel com vídeo perde o Facebook", () => {
    expect(redesValidas({ arquivos: [img, vid] }, "carrossel", ["instagram", "facebook"])).toEqual(["instagram"]);
    expect(redesValidas({ arquivos: [img, img] }, "carrossel", ["instagram", "facebook"])).toEqual(["instagram", "facebook"]);
  });
});

describe("situação do card Aprovado", () => {
  it("postando vence erro; saiu numa e falhou na outra só refaz a que falhou", () => {
    expect(situacao({ postagens: [{ rede: "instagram", status: "enviando" }, { rede: "facebook", status: "erro" }] })).toEqual({ tipo: "postando" });
    expect(situacao({ postagens: [{ rede: "instagram", status: "postado", link: "x" }, { rede: "facebook", status: "erro", erro: "imagem grande" }] }))
      .toMatchObject({ tipo: "erro", texto: "Saiu no Instagram, falhou no Facebook: imagem grande", refazer: ["facebook"], incerto: false });
    expect(situacao({ postagens: [{ rede: "facebook", status: "erro", erro: "estado incerto: confira a rede antes de tentar de novo" }] })).toMatchObject({ incerto: true });
  });
  it("programado mostra data e redes; sem data e sem postagem, nada", () => {
    expect(situacao({ postarEm: "2026-10-25T18:00", postarRedes: ["instagram"] })).toEqual({ tipo: "programado", texto: "Programado · 25/10 18:00 · Instagram" });
    expect(situacao({})).toBeNull();
  });
});
