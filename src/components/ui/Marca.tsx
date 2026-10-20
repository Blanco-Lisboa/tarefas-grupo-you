import Image from "next/image";
import type { Rede } from "@/lib/dados";
import "./marca.css";

// Logo da empresa e ícone da rede (item 98). Peça ÚNICA: toda tela que mostra "de qual empresa/rede é" usa estes dois.
// Os arquivos moram em public/marca/ (origem anotada em public/marca/LEIAME.md). tamanho = altura em px.
const EMPRESAS_COM_LOGO = new Set(["beec", "you"]); // arquivo public/marca/empresas/<id>.svg
export const temLogo = (empresaId: string) => EMPRESAS_COM_LOGO.has(empresaId);
const ESCALA_LOGO: Record<string, number> = { beec: 0.8 }; // símbolo menor dentro da mesma caixa (item 131); a caixa e o alinhamento não mudam
const NOME_REDE: Record<Rede, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", kwai: "Kwai" };

/** Logo da empresa. `nome` vira o texto alternativo (leitor de tela e dica ao parar o mouse).
    comNome = logo + nome escrito. Empresa sem arquivo de logo aparece só com o nome em texto. */
export function SeloEmpresa({ empresaId, nome, tamanho = 20, comNome = false }: { empresaId: string; nome: string; tamanho?: number; comNome?: boolean }) {
  if (!EMPRESAS_COM_LOGO.has(empresaId)) return <span className="marca-texto">{nome}</span>;
  const logo = <Image className="marca-logo" src={`/marca/empresas/${empresaId}.svg`} alt={comNome ? "" : nome} title={nome} width={tamanho} height={tamanho} style={{ width: tamanho, height: tamanho, transform: ESCALA_LOGO[empresaId] ? `scale(${ESCALA_LOGO[empresaId]})` : undefined }} />;
  return comNome ? <span className="marca-com-nome">{logo}<span>{nome}</span></span> : logo;
}

/** Ícone oficial da rede social, com o nome da rede como texto alternativo. */
export function IconeRede({ rede, tamanho = 16 }: { rede: Rede; tamanho?: number }) {
  return <Image className="marca-rede" src={`/marca/redes/${rede}.svg`} alt={NOME_REDE[rede]} title={NOME_REDE[rede]} width={tamanho} height={tamanho} style={{ width: tamanho, height: tamanho }} />;
}
