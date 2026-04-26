/**
 * Rota legada: redireciona para `/admin/gestao-acessos/usuarios` (RBAC v2).
 * Wave 5 do plano de migração — academia-java/docs/RBAC_LEGACY_MIGRATION_PLAN.md.
 *
 * Componentes (`use-usuarios-workspace.ts`, `usuarios-create-form.tsx`,
 * `usuarios-filters.tsx`, `usuarios-table.tsx`, `usuarios-types.tsx`) e a
 * subrota `[id]` permanecem por compat com imports residuais; removidos
 * na Wave 7.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminSegurancaUsuariosLegacyPage() {
  redirect("/admin/gestao-acessos/usuarios");
}
