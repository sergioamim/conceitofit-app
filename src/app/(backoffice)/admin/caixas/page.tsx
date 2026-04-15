/**
 * Tela de supervisão dos caixas operacionais para gerentes (CXO-203).
 *
 * RSC mínimo: a interação (tabs, filtros, paginação) e o data-fetching
 * acontecem no client wrapper `CaixasContent`, que consome o cliente
 * tipado em `@/lib/api/caixa.ts` (CXO-105). O guard de role é aplicado
 * dentro do wrapper porque os roles vivem na sessão client-side.
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { CaixasContent } from "./components/caixas-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Caixas operacionais — Backoffice",
};

export default function AdminCaixasPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <CaixasContent />
    </Suspense>
  );
}
