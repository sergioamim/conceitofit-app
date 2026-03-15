"use client";

import { Badge } from "@/components/ui/badge";
import type {
  GlobalAdminMembershipOrigin,
  GlobalAdminNewUnitsPolicyScope,
} from "@/lib/types";

function activeVariant(active: boolean) {
  return active ? "default" : "secondary";
}

export function SecurityActiveBadge({
  active,
  activeLabel = "Ativo",
  inactiveLabel = "Inativo",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return <Badge variant={activeVariant(active)}>{active ? activeLabel : inactiveLabel}</Badge>;
}

export function getSecurityAccessOriginLabel(origin?: GlobalAdminMembershipOrigin) {
  switch (origin) {
    case "MANUAL":
      return "Manual";
    case "HERDADO_POLITICA":
      return "Herdado";
    case "PERFIL_ADMIN":
      return "Perfil admin";
    case "IMPORTACAO":
      return "Importação";
    case "SISTEMA":
      return "Sistema";
    default:
      return "Sem origem";
  }
}

export function SecurityAccessOriginBadge({ origin }: { origin?: GlobalAdminMembershipOrigin }) {
  const label = getSecurityAccessOriginLabel(origin);
  const variant =
    origin === "MANUAL"
      ? "default"
      : origin === "HERDADO_POLITICA"
        ? "secondary"
        : "outline";

  return <Badge variant={variant}>{label}</Badge>;
}

export function SecurityEligibilityBadge({
  eligible,
  activeLabel = "Recebe novas unidades",
  inactiveLabel = "Sem propagação",
}: {
  eligible: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return <Badge variant={eligible ? "default" : "outline"}>{eligible ? activeLabel : inactiveLabel}</Badge>;
}

export function getSecurityPolicyScopeLabel(scope?: GlobalAdminNewUnitsPolicyScope) {
  switch (scope) {
    case "ACADEMIA_ATUAL":
      return "Mesma academia";
    case "REDE":
      return "Rede inteira";
    default:
      return "Sem escopo";
  }
}

export function SecurityPolicyScopeBadge({ scope }: { scope?: GlobalAdminNewUnitsPolicyScope }) {
  return <Badge variant="secondary">{getSecurityPolicyScopeLabel(scope)}</Badge>;
}
