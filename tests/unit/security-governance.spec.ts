import { expect, test } from "@playwright/test";
import {
  buildSecurityFeatureCatalog,
  buildStandardizedProfiles,
  estimateProfileImpact,
} from "../../src/lib/backoffice/security-governance";

test.describe("security governance helpers", () => {
  test("normaliza catálogo de funcionalidades com leitura de negócio", () => {
    const catalog = buildSecurityFeatureCatalog(
      [
        { featureKey: "feature.financeiro", enabled: true, rollout: 25 },
        { featureKey: "feature.treinos", enabled: true, rollout: 100 },
      ],
      [
        { roleName: "ADMIN", featureKey: "feature.financeiro", permission: "MANAGE", allowed: true },
        { roleName: "ADMIN", featureKey: "feature.treinos", permission: "VIEW", allowed: true },
      ]
    );

    expect(catalog).toHaveLength(2);
    expect(catalog[0]).toEqual(
      expect.objectContaining({
        featureKey: "feature.financeiro",
        businessLabel: "Gestão financeira",
        riskLevel: "CRITICO",
        requiresAudit: true,
      })
    );
    expect(catalog[1]).toEqual(
      expect.objectContaining({
        featureKey: "feature.treinos",
        businessLabel: "Gestão de treinos",
        moduleLabel: "Treinos",
      })
    );
  });

  test("estima impacto por perfil a partir do resumo global de usuários", () => {
    const impact = estimateProfileImpact(
      [
        {
          id: "user-ana",
          name: "Ana Admin",
          email: "ana@qa.local",
          status: "ATIVO",
          active: true,
          academias: [{ id: "academia-norte", nome: "Rede Norte" }],
          membershipsAtivos: 2,
          membershipsTotal: 2,
          perfis: ["Administrador"],
          eligibleForNewUnits: true,
          broadAccess: true,
          exceptionsCount: 1,
          reviewStatus: "PENDENTE",
        },
        {
          id: "user-bia",
          name: "Bia Gerente",
          email: "bia@qa.local",
          status: "ATIVO",
          active: true,
          academias: [{ id: "academia-norte", nome: "Rede Norte" }],
          membershipsAtivos: 1,
          membershipsTotal: 1,
          perfis: ["Gerente"],
          eligibleForNewUnits: false,
          broadAccess: false,
          exceptionsCount: 0,
          reviewStatus: "EM_DIA",
        },
      ],
      "ADMIN",
      "Administrador"
    );

    expect(impact).toEqual({
      users: 1,
      memberships: 2,
      academias: 1,
      exceptions: 1,
      broadAccessUsers: 1,
      pendingReviews: 1,
    });
  });

  test("monta perfis padronizados com matriz completa e permissões concedidas", () => {
    const catalog = buildSecurityFeatureCatalog(
      [
        { featureKey: "feature.financeiro", enabled: true, rollout: 25 },
        { featureKey: "feature.treinos", enabled: true, rollout: 100 },
      ],
      [
        { roleName: "ADMIN", featureKey: "feature.financeiro", permission: "MANAGE", allowed: true },
        { roleName: "ADMIN", featureKey: "feature.treinos", permission: "VIEW", allowed: true },
      ]
    );

    const profiles = buildStandardizedProfiles({
      perfis: [
        {
          id: "perfil-admin",
          tenantId: "tenant-centro",
          roleName: "ADMIN",
          displayName: "Administrador",
          description: "Governança da unidade",
          active: true,
        },
      ],
      grants: [
        { roleName: "ADMIN", featureKey: "feature.financeiro", permission: "MANAGE", allowed: true },
        { roleName: "ADMIN", featureKey: "feature.treinos", permission: "VIEW", allowed: true },
      ],
      catalog,
      users: [
        {
          id: "user-ana",
          name: "Ana Admin",
          email: "ana@qa.local",
          status: "ATIVO",
          active: true,
          academias: [{ id: "academia-norte", nome: "Rede Norte" }],
          membershipsAtivos: 2,
          membershipsTotal: 2,
          perfis: ["Administrador"],
          eligibleForNewUnits: true,
          broadAccess: true,
          exceptionsCount: 1,
          reviewStatus: "PENDENTE",
        },
      ],
    });

    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toEqual(
      expect.objectContaining({
        displayName: "Administrador",
        featureCount: 2,
        usersImpacted: 1,
      })
    );
    expect(profiles[0]?.matrix).toHaveLength(2);
    expect(profiles[0]?.matrix.find((item) => item.featureKey === "feature.financeiro")?.permissions).toEqual([
      "MANAGE",
    ]);
  });
});
