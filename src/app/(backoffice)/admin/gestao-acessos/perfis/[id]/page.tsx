/**
 * Tela de edição de um perfil de acesso (GA-003).
 *
 * Mostra capacidades organizadas por grupo com checkboxes para toggle.
 * Capacidades de módulos ADDON desabilitados ficam esmaecidas.
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { PerfilEditContent } from "./components/perfil-edit-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editar Perfil — Backoffice",
};

export default function AdminPerfilEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <PerfilEditLoader params={params} />
    </Suspense>
  );
}

async function PerfilEditLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PerfilEditContent perfilId={id} />;
}
