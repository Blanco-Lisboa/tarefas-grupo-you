import { describe, expect, it } from "vitest";
import { redeDoLink } from "./MuralIdeias";

describe("redeDoLink", () => {
  it("aceita o domínio e os subdomínios", () => {
    expect(redeDoLink("https://www.instagram.com/p/a")).toBe("instagram");
    expect(redeDoLink("https://vm.tiktok.com/x")).toBe("tiktok");
    expect(redeDoLink("https://music.youtube.com/x")).toBe("youtube");
    expect(redeDoLink("https://youtu.be/x")).toBe("youtube");
  });
  it("recusa domínio parecido", () => {
    expect(redeDoLink("https://evilinstagram.com/p")).toBeNull();
    expect(redeDoLink("https://faketiktok.com/p")).toBeNull();
    expect(redeDoLink("https://notyoutube.com/p")).toBeNull();
    expect(redeDoLink("https://evilyoutu.be/p")).toBeNull();
  });
});
