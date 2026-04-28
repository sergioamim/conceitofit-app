import { getCaixaAtivo } from "@/lib/api/caixa";
import { CaixaContent, type CaixaAtivo } from "./components/caixa-content";

export const dynamic = "force-dynamic";

/**
 * Tela "Meu Caixa" do operador (CXO-202).
 *
 * Server Component fininho que tenta o fetch inicial via `getCaixaAtivo()`.
 * Em caso de qualquer erro (rede, auth, contexto não resolvido) entrega o
 * estado neutro (`null`) ao client wrapper, que exibe o CTA "Abrir caixa"
 * e ainda assim faz polling para sincronizar.
 */
export default async function CaixaPage() {
  let initial: CaixaAtivo | null = null;
  try {
    initial = await getCaixaAtivo();
  } catch {
    initial = null;
  }
  return <CaixaContent initial={initial} />;
}
