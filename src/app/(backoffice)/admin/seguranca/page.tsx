/**
 * Rota legada: redireciona para a UI nova RBAC v2 (`/admin/gestao-acessos`).
 * Wave 5 do plano de migração — academia-java/docs/RBAC_LEGACY_MIGRATION_PLAN.md.
 *
 * A "Central de Segurança" original era um hub de cards que linkava para as
 * páginas legadas (já redirecionadas individualmente). A visão geral canônica
 * passa a ser a do RBAC v2.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminSegurancaLegacyPage() {
  redirect("/admin/gestao-acessos");
}
