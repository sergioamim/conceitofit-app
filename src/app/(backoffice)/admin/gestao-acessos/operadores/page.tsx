/**
 * Tela de operadores da academia com perfil atribuído (GA-003).
 *
 * Lista operadores do tenant com select inline para trocar perfil
 * e modal de detalhes com capacidades efetivas + overrides.
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { OperadoresContent } from "./components/operadores-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operadores — Backoffice",
};

export default function AdminOperadoresPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <OperadoresContent />
    </Suspense>
  );
}
