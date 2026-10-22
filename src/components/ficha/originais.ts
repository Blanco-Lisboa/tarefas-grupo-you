import type { Arquivo } from "@/lib/dados";

/** 270 · Onde abrir o vídeo sem legenda que ficou guardado (link do Drive que o banco deu, ou o do arquivo). */
export const linkDoDrive = (a: Arquivo) => a.driveLink ?? `https://drive.google.com/file/d/${a.driveId}/view`;
