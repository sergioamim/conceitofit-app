/**
 * Rota legada: redireciona para `/admin/gestao-acessos/papeis/{id}` (RBAC v2).
 * Story #18.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPerfilEditLegacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/gestao-acessos/papeis/${id}`);
}
