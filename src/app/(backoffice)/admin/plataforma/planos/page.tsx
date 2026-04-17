/**
 * Tela de Planos SaaS (GA-004).
 *
 * Lista planos com features incluidas e permite editar via checkboxes.
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { PlanosContent } from "./components/planos-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Planos SaaS — Plataforma",
};

export default function PlataformaPlanosPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <PlanosContent />
    </Suspense>
  );
}
