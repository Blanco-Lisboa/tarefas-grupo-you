// PNG -> JPG só para o Instagram (a API dele só aceita JPEG). Biblioteca em JavaScript puro + WASM (roda no Deno do Supabase).
// Qualidade máxima que caiba em 8 MB: 100, depois 95, depois 92. Transparência vira fundo branco (como o app do Instagram faz).
// Prova de tempo (S4, Deno 2.9 local, 20/10): 1080x1350 em 0,19 s de CPU; 1080x1920 com transparência 0,16 s; 4K (2160x3840) 1,0 s.
// O limite do servidor é 2 s de CPU: imagem de post/Reels cabe com folga; 4K fica perto. Só roda no Deno: o Vitest injeta um conversor falso.
import { ErroLocal } from "./meta.ts";

const MODULO = "npm:imagescript@1.3.0"; // em variável para o tsc da raiz não tentar resolver o especificador do Deno
export const MAX_JPG = 8 * 1024 * 1024;

export async function paraJpg(png: Uint8Array): Promise<Uint8Array> {
  const { Image } = await import(MODULO);
  const img = await Image.decode(png);
  const fundo = new Image(img.width, img.height).fill(0xffffffff).composite(img);
  for (const q of [100, 95, 92]) {
    const jpg: Uint8Array = await fundo.encodeJPEG(q);
    if (jpg.length <= MAX_JPG) return jpg;
  }
  throw new ErroLocal("A imagem fica maior que 8 MB mesmo em JPG; o Instagram não aceita. Diminua a imagem.");
}
