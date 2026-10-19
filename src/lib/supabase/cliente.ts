// Cliente do navegador: guarda a sessão em cookie e fala com o banco COMO a pessoa logada (as travas do banco valem para ela).
// Só a chave PUBLICÁVEL entra aqui. A chave de serviço (service_role) nunca passa por este projeto.
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | undefined;

export const supabase = () =>
  (cliente ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!));
