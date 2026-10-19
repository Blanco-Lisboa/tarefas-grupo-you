import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { semLinks, TextoComLinks } from "./links";

const html = (texto: string) => renderToStaticMarkup(createElement(TextoComLinks, { texto }));

describe("links nas pastas", () => {
  it("troca o endereço por Ver referência clicável, em aba nova, sem a pontuação final", () => {
    const h = html("1) Ganchos https://www.instagram.com/p/Db7/. Veja também http://a.com/x");
    expect(h).toContain('href="https://www.instagram.com/p/Db7/"');
    expect(h).toContain('target="_blank"');
    expect(h).toContain('rel="noopener noreferrer"');
    expect(h).not.toContain(">https://");
    expect(h).toContain("</a>. Veja também");
    expect(h.match(/Ver referência/g)).toHaveLength(2);
  });
  it("texto com HTML não vira marcação; título fica sem link", () => {
    expect(html("<img src=x onerror=alert(1)>")).not.toContain("<img");
    expect(semLinks("Veja https://a.com/b")).toBe("Veja Ver referência");
  });
});
