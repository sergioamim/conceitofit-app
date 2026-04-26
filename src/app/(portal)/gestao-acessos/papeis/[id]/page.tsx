import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { RoleEditorClient } from "./role-editor-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Papel — Gestão de Acesso",
};

export default async function PortalGestaoAcessosPapelEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <RoleEditorClient roleId={id} />
    </Suspense>
  );
}
