/**
 * Rota legada: redireciona para a UI nova `/admin/gestao-acessos/permissoes`
 * (RBAC v2). Wave 5 do plano de migração — academia-java/docs/RBAC_LEGACY_MIGRATION_PLAN.md.
 *
 * Componentes em `./components/` permanecem por compat com imports residuais;
 * removidos na Wave 7 quando os controllers backend forem dropados.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminSegurancaCatalogoLegacyPage() {
  redirect("/admin/gestao-acessos/permissoes");
}
