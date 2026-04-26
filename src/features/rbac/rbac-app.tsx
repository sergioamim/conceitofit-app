"use client";

import type { Dominio } from "./api/types";
import { RbacOverview } from "./screens/overview";

interface RbacAppProps {
  dominio: Dominio;
  tenantId?: string;
  /**
   * Tela ativa — cresce conforme as próximas waves entregam pages adicionais.
   * Por enquanto só "overview" é suportado.
   */
  screen?: "overview";
}

/**
 * Root do feature module RBAC v2.
 *
 * Recebe o contexto (dominio + tenantId) via props e despacha para a tela ativa.
 * Cada rota Next.js monta `<RbacApp>` com a `screen` correspondente — manter as
 * pages como wrappers thin permite que o feature module seja consumido pelos
 * 2 contextos (ACADEMIA via /admin/gestao-acessos, PLATAFORMA via /admin/saas/gestao-acessos).
 */
export function RbacApp({ dominio, tenantId, screen = "overview" }: RbacAppProps) {
  if (dominio === "ACADEMIA" && !tenantId) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecione uma rede para visualizar o RBAC.
      </p>
    );
  }

  switch (screen) {
    case "overview":
      return <RbacOverview dominio={dominio} tenantId={tenantId} />;
    default:
      return null;
  }
}
