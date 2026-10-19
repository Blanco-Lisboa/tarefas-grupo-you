// Fontes dos 5 modelos (item 57). Só aqui, no território de /modelos: o resto do sistema continua com as da ID atual.
import { Geist, Geist_Mono, Inter, Inter_Tight, Instrument_Serif, Plus_Jakarta_Sans, Sora } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--f-inter" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--f-inter-tight" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--f-serif" });
const geist = Geist({ subsets: ["latin"], variable: "--f-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--f-geist-mono" });
const sora = Sora({ subsets: ["latin"], variable: "--f-sora" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--f-jakarta" });

export const FONTES = [inter, interTight, serif, geist, geistMono, sora, jakarta].map((f) => f.variable).join(" ");
