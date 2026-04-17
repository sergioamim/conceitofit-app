/**
 * Tela de Grupos de Tenants (GA-004).
 *
 * Lista grupos (beta-testers, parceiros-gold, etc.) e permite
 * editar membros e features do grupo.
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { GruposContent } from "./components/grupos-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Grupos de Tenants — Plataforma",
};

export default function PlataformaGruposPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <GruposContent />
    </Suspense>
  );
}
