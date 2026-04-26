/**
 * Rota legada: redireciona para `/admin/gestao-acessos/papeis` (RBAC v2).
 * Wave 5 do plano de migração — academia-java/docs/RBAC_LEGACY_MIGRATION_PLAN.md.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminSegurancaPerfisLegacyPage() {
  redirect("/admin/gestao-acessos/papeis");
}
