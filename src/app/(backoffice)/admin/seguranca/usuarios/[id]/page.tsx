/**
 * Rota legada: redireciona para `/admin/gestao-acessos/usuarios/{id}` (RBAC v2).
 * Wave 5 do plano de migração — academia-java/docs/RBAC_LEGACY_MIGRATION_PLAN.md.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default function AdminSegurancaUsuarioDetalheLegacyPage({ params }: PageProps) {
  redirect(`/admin/gestao-acessos/usuarios/${params.id}`);
}
