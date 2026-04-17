/**
 * Tela de Feature Modules por tenant (GA-004).
 *
 * Permite equipe SaaS habilitar/desabilitar add-ons por tenant.
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { FeaturesContent } from "./components/features-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Feature Modules — Plataforma",
};

export default function PlataformaFeaturesPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <FeaturesContent />
    </Suspense>
  );
}
