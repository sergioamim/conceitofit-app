/**
 * Tela de listagem de perfis de acesso da academia (GA-003).
 *
 * Lista perfis do domínio ACADEMIA para o tenant ativo, permite criar
 * perfil customizado, importar de outra unidade e navegar para edição.
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { PerfisContent } from "./components/perfis-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Perfis de Acesso — Backoffice",
};

export default function AdminPerfisPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <PerfisContent />
    </Suspense>
  );
}
