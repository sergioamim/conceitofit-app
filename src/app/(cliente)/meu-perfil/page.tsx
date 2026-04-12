import { Suspense } from "react";
import { MeuPerfilContent } from "./components/meu-perfil-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

export const dynamic = "force-dynamic";

/**
 * Meu Perfil — Server Component
 *
 * Esta page &eacute; um Server Component que delega a interatividade
 * (avatar upload, invalida&ccedil;&atilde;o de queries) para o Client Island.
 *
 * O data fetching do contexto operacional permanece client-side via React Query
 * pois o endpoint requer userId no path (sem equivalente "me" no backend).
 * O benef&iacute;cio RSC vem de remover "use client" da page, permitindo
 * que o shell inicial seja renderizado no servidor.
 */
export default function MeuPerfilPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <MeuPerfilContent />
    </Suspense>
  );
}
