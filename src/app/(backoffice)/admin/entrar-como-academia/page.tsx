import { Suspense } from "react";
import { EntrarContent } from "./components/entrar-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

export const dynamic = "force-dynamic";

/**
 * Entrar como Academia — Server Component
 *
 * Page is a Server Component that delegates interactivity
 * (academia search, unidade selection, impersonation) to the Client Island.
 */
export default function AdminEntrarComoAcademiaPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <EntrarContent />
    </Suspense>
  );
}
