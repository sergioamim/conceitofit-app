import { Badge } from "@/components/ui/badge";
import type {
  GlobalAdminMembershipOrigin,
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminReviewStatus,
  GlobalAdminRiskLevel,
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

export function getSecurityRiskLabel(level?: GlobalAdminRiskLevel) {
  switch (level) {
    case "BAIXO":
      return "Risco baixo";
    case "MEDIO":
      return "Risco moderado";
    case "ALTO":
      return "Risco alto";
    case "CRITICO":
      return "Risco crítico";
    default:
      return "Sem risco calculado";
  }
}

export function SecurityRiskBadge({ level }: { level?: GlobalAdminRiskLevel }) {
  if (!level) return <Badge variant="outline">Sem risco calculado</Badge>;
  const className =
    level === "CRITICO"
      ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
      : level === "ALTO"
        ? "border-amber-500/30 bg-amber-50 text-amber-900"
        : level === "MEDIO"
          ? "border-sky-500/30 bg-sky-50 text-sky-900"
          : "border-emerald-500/30 bg-emerald-50 text-emerald-900";
  return (
    <Badge variant="outline" className={className}>
      {getSecurityRiskLabel(level)}
    </Badge>
  );
}

export function getSecurityReviewLabel(status?: GlobalAdminReviewStatus) {
  switch (status) {
    case "EM_DIA":
      return "Revisão em dia";
    case "PENDENTE":
      return "Revisão pendente";
    case "VENCIDA":
      return "Revisão vencida";
    default:
      return "Sem revisão";
  }
}

export function SecurityReviewBadge({ status }: { status?: GlobalAdminReviewStatus }) {
  if (!status) return <Badge variant="outline">Sem revisão</Badge>;
  const className =
    status === "VENCIDA"
      ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
      : status === "PENDENTE"
        ? "border-amber-500/30 bg-amber-50 text-amber-900"
        : "border-emerald-500/30 bg-emerald-50 text-emerald-900";
  return (
    <Badge variant="outline" className={className}>
      {getSecurityReviewLabel(status)}
    </Badge>
  );
}

export function SecurityBroadAccessBadge({ broadAccess }: { broadAccess?: boolean }) {
  return <Badge variant={broadAccess ? "destructive" : "outline"}>{broadAccess ? "Acesso amplo" : "Escopo controlado"}</Badge>;
}

export function SecurityCompatibilityBadge({ compatibilityMode }: { compatibilityMode?: boolean }) {
  return (
    <Badge variant="outline" className={compatibilityMode ? "border-sky-500/30 bg-sky-50 text-sky-900" : undefined}>
      {compatibilityMode ? "Compatibilidade transitória" : "Fluxo atual"}
    </Badge>
  );
}
