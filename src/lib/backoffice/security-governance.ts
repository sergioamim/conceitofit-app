import type {
  GlobalAdminRiskLevel,
  GlobalAdminUserSummary,
  RbacFeature,
  RbacGrant,
  RbacPerfil,
  RbacPermission,
  SecurityBusinessScope,
  SecurityFeatureCatalogItem,
  SecurityProfileImpactSummary,
  SecurityProfileMatrixItem,
  SecurityStandardizedProfile,
} from "@/lib/types";

const MODULE_LABELS: Record<string, string> = {
  administrativo: "Administrativo",
  alunos: "Alunos",
  aulas: "Aulas",
  bi: "BI",
  catraca: "Catraca",
  clientes: "Clientes",
  comercial: "Comercial",
  crm: "CRM",
  dashboard: "Dashboard",
  financeiro: "Financeiro",
  grade: "Grade",
  importacao: "Importação",
  matriculas: "Matrículas",
  pagamentos: "Pagamentos",
  planos: "Planos",
  prospects: "Prospects",
  reservas: "Reservas",
  seguranca: "Segurança",
  treinos: "Treinos",
  vendas: "Vendas",
};

const FEATURE_OVERRIDES: Record<
  string,
  Partial<
    Pick<
      SecurityFeatureCatalogItem,
      | "moduleKey"
      | "moduleLabel"
      | "capabilityLabel"
      | "businessLabel"
      | "description"
      | "riskLevel"
      | "scopes"
      | "requiresAudit"
      | "requiresApproval"
      | "requiresMfa"
      | "dependencies"
    >
  >
> = {
  "feature.financeiro": {
    moduleKey: "financeiro",
    moduleLabel: "Financeiro",
    capabilityLabel: "Operações financeiras",
    businessLabel: "Gestão financeira",
    description: "Controla operações financeiras, recebimentos, ajustes e leituras sensíveis.",
    riskLevel: "CRITICO",
    scopes: ["UNIDADE", "ACADEMIA"],
    requiresAudit: true,
    requiresApproval: true,
    requiresMfa: true,
  },
  "feature.seguranca": {
    moduleKey: "seguranca",
    moduleLabel: "Segurança",
    capabilityLabel: "Governança de acessos",
    businessLabel: "Governança de acessos",
    description: "Libera gestão de perfis, acessos, exceções e políticas de segurança.",
    riskLevel: "CRITICO",
    scopes: ["UNIDADE", "ACADEMIA", "REDE"],
    requiresAudit: true,
    requiresApproval: true,
    requiresMfa: true,
  },
  "feature.treinos": {
    moduleKey: "treinos",
    moduleLabel: "Treinos",
    capabilityLabel: "Operação de treinos",
    businessLabel: "Gestão de treinos",
    description: "Organiza cadastro, prescrição e manutenção operacional de treinos.",
    riskLevel: "MEDIO",
    scopes: ["UNIDADE"],
    requiresAudit: false,
    requiresApproval: false,
    requiresMfa: false,
  },
};

const PROFILE_TEMPLATES: Array<{
  matcher: RegExp;
  objective: string;
  recommendedScope: SecurityBusinessScope;
  riskLevel: GlobalAdminRiskLevel;
}> = [
  {
    matcher: /(owner|root|rede|regional|global|compliance|auditor)/i,
    objective: "Governar políticas amplas, exceções e mudanças sensíveis de acesso.",
    recommendedScope: "REDE",
    riskLevel: "CRITICO",
  },
  {
    matcher: /(admin|administrador)/i,
    objective: "Operar fluxos sensíveis com visão ampla e suporte de governança.",
    recommendedScope: "ACADEMIA",
    riskLevel: "ALTO",
  },
  {
    matcher: /(gerente|supervisor)/i,
    objective: "Coordenar a operação com autonomia ampliada no escopo local.",
    recommendedScope: "UNIDADE",
    riskLevel: "ALTO",
  },
  {
    matcher: /(financeiro|fiscal)/i,
    objective: "Executar rotinas financeiras com trilha e criticidade reforçadas.",
    recommendedScope: "UNIDADE",
    riskLevel: "CRITICO",
  },
  {
    matcher: /(comercial|consultor|vendas)/i,
    objective: "Conduzir relacionamento, proposta e fechamento sem expor governança global.",
    recommendedScope: "UNIDADE",
    riskLevel: "MEDIO",
  },
  {
    matcher: /(recepcao|recepção|atendente)/i,
    objective: "Cobrir atendimento e operação diária com menor alcance possível.",
    recommendedScope: "UNIDADE",
    riskLevel: "BAIXO",
  },
];

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function prettifyToken(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function inferModuleKey(featureKey: string) {
  const raw = featureKey.replace(/^feature\./, "");
  return raw.split(/[._-]/).filter(Boolean)[0] ?? "geral";
}

function inferRiskLevel(featureKey: string, permissions: RbacPermission[]): GlobalAdminRiskLevel {
  const normalized = normalizeText(featureKey);
  if (normalized.includes("seguranca") || normalized.includes("financeiro") || normalized.includes("fiscal")) {
    return "CRITICO";
  }
  if (permissions.includes("MANAGE")) {
    return "ALTO";
  }
  if (permissions.includes("EDIT")) {
    return "MEDIO";
  }
  return "BAIXO";
}

function inferScopes(moduleKey: string, riskLevel: GlobalAdminRiskLevel): SecurityBusinessScope[] {
  if (moduleKey === "seguranca") return ["UNIDADE", "ACADEMIA", "REDE"];
  if (moduleKey === "financeiro" || moduleKey === "bi") return ["UNIDADE", "ACADEMIA"];
  if (riskLevel === "CRITICO") return ["UNIDADE", "ACADEMIA"];
  return ["UNIDADE"];
}

function inferCapabilityLabel(featureKey: string) {
  const raw = featureKey.replace(/^feature\./, "");
  const segments = raw.split(/[._-]/).filter(Boolean);
  const capabilitySegments = segments.length > 1 ? segments.slice(1) : segments;
  return prettifyToken(capabilitySegments.join(" "));
}

function inferBusinessLabel(moduleLabel: string, capabilityLabel: string) {
  const normalizedCapability = normalizeText(capabilityLabel);
  const normalizedModule = normalizeText(moduleLabel);
  if (!normalizedCapability || normalizedCapability === normalizedModule) {
    return `Gestão de ${moduleLabel.toLowerCase()}`;
  }
  return `${capabilityLabel} em ${moduleLabel.toLowerCase()}`;
}

function permissionPriority(permission: RbacPermission) {
  if (permission === "MANAGE") return 3;
  if (permission === "EDIT") return 2;
  return 1;
}

function permissionLabel(permission: RbacPermission) {
  if (permission === "MANAGE") return "Administrar";
  if (permission === "EDIT") return "Editar";
  return "Visualizar";
}

function buildVersionLabel(lastUpdatedAt: string | undefined, featureCount: number) {
  if (!lastUpdatedAt) {
    return `v1.${featureCount}`;
  }
  const match = lastUpdatedAt.match(/^(\d{4})-(\d{2})/);
  if (!match) {
    return `v1.${featureCount}`;
  }
  return `v${Number(match[2])}.${featureCount}`;
}

function resolveProfileTemplate(profile: Pick<RbacPerfil, "roleName" | "displayName">) {
  const candidate = `${profile.roleName} ${profile.displayName}`;
  return (
    PROFILE_TEMPLATES.find((item) => item.matcher.test(candidate)) ?? {
      objective: "Cobrir uma responsabilidade operacional reutilizável sem depender de exceções individuais.",
      recommendedScope: "UNIDADE" as SecurityBusinessScope,
      riskLevel: "MEDIO" as GlobalAdminRiskLevel,
    }
  );
}

function profileMatchesUser(
  user: GlobalAdminUserSummary,
  roleName: string,
  displayName: string
) {
  const normalizedRole = normalizeText(roleName);
  const normalizedDisplay = normalizeText(displayName);
  return user.perfis.some((perfil) => {
    const normalizedPerfil = normalizeText(perfil);
    return normalizedPerfil === normalizedRole || normalizedPerfil === normalizedDisplay;
  });
}

export function buildSecurityFeatureCatalog(
  features: RbacFeature[],
  grants: RbacGrant[]
): SecurityFeatureCatalogItem[] {
  const featureMap = new Map(features.map((feature) => [feature.featureKey, feature]));
  const keys = uniqueStrings([
    ...features.map((feature) => feature.featureKey),
    ...grants.map((grant) => grant.featureKey),
  ]);

  return keys
    .map((featureKey) => {
      const feature = featureMap.get(featureKey);
      const relatedGrants = grants.filter((grant) => grant.featureKey === featureKey && grant.allowed);
      const permissionLevels = uniqueStrings(relatedGrants.map((grant) => grant.permission)).sort(
        (left, right) =>
          permissionPriority(right as RbacPermission) - permissionPriority(left as RbacPermission)
      ) as RbacPermission[];
      const moduleKey = inferModuleKey(featureKey);
      const moduleLabel = MODULE_LABELS[moduleKey] ?? prettifyToken(moduleKey);
      const capabilityLabel = inferCapabilityLabel(featureKey);
      const riskLevel = inferRiskLevel(featureKey, permissionLevels);
      const override = FEATURE_OVERRIDES[featureKey];

      return {
        featureKey,
        moduleKey: override?.moduleKey ?? moduleKey,
        moduleLabel: override?.moduleLabel ?? moduleLabel,
        capabilityLabel: override?.capabilityLabel ?? capabilityLabel,
        businessLabel:
          override?.businessLabel ??
          inferBusinessLabel(override?.moduleLabel ?? moduleLabel, override?.capabilityLabel ?? capabilityLabel),
        description:
          override?.description ??
          `Capacidade do módulo ${moduleLabel.toLowerCase()} exposta para perfis e governança técnica.`,
        actionLabels:
          permissionLevels.length > 0 ? permissionLevels.map(permissionLabel) : ["Visualizar"],
        permissionLevels: permissionLevels.length > 0 ? permissionLevels : ["VIEW"],
        riskLevel: override?.riskLevel ?? riskLevel,
        scopes: override?.scopes ?? inferScopes(override?.moduleKey ?? moduleKey, override?.riskLevel ?? riskLevel),
        requiresAudit: override?.requiresAudit ?? ["ALTO", "CRITICO"].includes(override?.riskLevel ?? riskLevel),
        requiresApproval: override?.requiresApproval ?? (override?.riskLevel ?? riskLevel) === "CRITICO",
        requiresMfa:
          override?.requiresMfa ??
          (normalizeText(override?.moduleKey ?? moduleKey) === "seguranca" ||
            (override?.riskLevel ?? riskLevel) === "CRITICO"),
        dependencies: override?.dependencies ?? [],
        enabled: feature?.enabled ?? true,
        rollout: feature?.rollout ?? 100,
        assignedProfiles: uniqueStrings(relatedGrants.map((grant) => grant.roleName)).sort((left, right) =>
          left.localeCompare(right, "pt-BR")
        ),
      } satisfies SecurityFeatureCatalogItem;
    })
    .sort((left, right) => {
      if (left.moduleLabel !== right.moduleLabel) {
        return left.moduleLabel.localeCompare(right.moduleLabel, "pt-BR");
      }
      return left.businessLabel.localeCompare(right.businessLabel, "pt-BR");
    });
}

export function estimateProfileImpact(
  users: GlobalAdminUserSummary[],
  roleName: string,
  displayName: string
): SecurityProfileImpactSummary {
  const impactedUsers = users.filter((user) => profileMatchesUser(user, roleName, displayName));
  const academias = new Set(impactedUsers.flatMap((user) => user.academias.map((academia) => academia.id)));

  return {
    users: impactedUsers.length,
    memberships: impactedUsers.reduce((total, user) => total + user.membershipsAtivos, 0),
    academias: academias.size,
    exceptions: impactedUsers.reduce((total, user) => total + (user.exceptionsCount ?? 0), 0),
    broadAccessUsers: impactedUsers.filter((user) => user.broadAccess).length,
    pendingReviews: impactedUsers.filter((user) => user.reviewStatus === "PENDENTE" || user.reviewStatus === "VENCIDA").length,
  };
}

export function buildStandardizedProfiles(input: {
  perfis: RbacPerfil[];
  grants: RbacGrant[];
  catalog: SecurityFeatureCatalogItem[];
  users: GlobalAdminUserSummary[];
}): SecurityStandardizedProfile[] {
  return input.perfis
    .map((profile) => {
      const impact = estimateProfileImpact(input.users, profile.roleName, profile.displayName);
      const relatedGrants = input.grants.filter((grant) => grant.roleName === profile.roleName && grant.allowed);
      const matrix = input.catalog
        .map((item) => {
          const permissions = uniqueStrings(
            relatedGrants
              .filter((grant) => grant.featureKey === item.featureKey)
              .map((grant) => grant.permission)
          ).sort(
            (left, right) =>
              permissionPriority(right as RbacPermission) - permissionPriority(left as RbacPermission)
          ) as RbacPermission[];

          return {
            ...item,
            permissions,
            impactedUsers: impact.users,
            impactedMemberships: impact.memberships,
          } satisfies SecurityProfileMatrixItem;
        })
        .sort((left, right) => {
          if (left.moduleLabel !== right.moduleLabel) {
            return left.moduleLabel.localeCompare(right.moduleLabel, "pt-BR");
          }
          return left.businessLabel.localeCompare(right.businessLabel, "pt-BR");
        });
      const template = resolveProfileTemplate(profile);
      const grantedMatrix = matrix.filter((item) => item.permissions.length > 0);
      const modules = uniqueStrings(grantedMatrix.map((item) => item.moduleLabel));
      const criticalFeatureCount = grantedMatrix.filter((item) => item.riskLevel === "ALTO" || item.riskLevel === "CRITICO").length;
      const lastUpdatedAt = profile.updatedAt ?? profile.createdAt;

      return {
        id: profile.id,
        tenantId: profile.tenantId,
        roleName: profile.roleName,
        displayName: profile.displayName,
        description: profile.description,
        active: profile.active,
        objective: template.objective,
        recommendedScope: template.recommendedScope,
        riskLevel:
          criticalFeatureCount > 0 && template.riskLevel === "MEDIO" ? "ALTO" : template.riskLevel,
        modules,
        versionLabel: buildVersionLabel(lastUpdatedAt, grantedMatrix.length),
        lastUpdatedAt,
        featureCount: grantedMatrix.length,
        criticalFeatureCount,
        usersImpacted: impact.users,
        membershipsImpacted: impact.memberships,
        impact,
        matrix,
      } satisfies SecurityStandardizedProfile;
    })
    .sort((left, right) => {
      if (left.active !== right.active) return left.active ? -1 : 1;
      if (left.usersImpacted !== right.usersImpacted) return right.usersImpacted - left.usersImpacted;
      return left.displayName.localeCompare(right.displayName, "pt-BR");
    });
}
