import { expect, test } from "@playwright/test";
import {
  validateAcademiaUserCreateDraft,
  validateGlobalUserCreateDraft,
} from "../../src/lib/security-user-create";

test.describe("security user create validators", () => {
  test("monta payload global com escopo de rede e política opcional", () => {
    const payload = validateGlobalUserCreateDraft({
      name: "Ana Admin",
      email: "ana@qa.local",
      cpf: "111.222.333-44",
      scopeType: "REDE",
      academiaId: "academia-norte",
      tenantIds: ["tenant-centro", "tenant-barra"],
      defaultTenantId: "tenant-centro",
      eligibleForNewUnits: true,
      policyScope: "REDE",
    });

    expect(payload).toEqual({
      name: "Ana Admin",
      fullName: "Ana Admin",
      email: "ana@qa.local",
      userKind: "COLABORADOR",
      scopeType: "REDE",
      academiaId: "academia-norte",
      tenantIds: ["tenant-centro", "tenant-barra"],
      defaultTenantId: "tenant-centro",
      broadAccess: false,
      eligibleForNewUnits: true,
      policyScope: "REDE",
      loginIdentifiers: [
        { label: "E-mail", value: "ana@qa.local" },
        { label: "CPF", value: "111.222.333-44" },
      ],
    });
  });

  test("bloqueia política de novas unidades em escopo global", () => {
    expect(() =>
      validateGlobalUserCreateDraft({
        name: "Root Admin",
        email: "root@qa.local",
        scopeType: "GLOBAL",
        eligibleForNewUnits: true,
      })
    ).toThrow("Propagação para novas unidades só pode ser definida em escopo de rede.");
  });

  test("monta payload restrito à academia e valida tenants/perfis permitidos", () => {
    const payload = validateAcademiaUserCreateDraft({
      name: "Carla Operações",
      email: "carla@qa.local",
      networkId: "rede-norte",
      networkName: "Rede Norte",
      networkSubdomain: "rede-norte",
      tenantIds: ["tenant-centro", "tenant-barra"],
      defaultTenantId: "tenant-barra",
      initialPerfilIds: ["perfil-admin", "perfil-gerente"],
      allowedTenantIds: ["tenant-centro", "tenant-barra"],
      allowedPerfilIds: ["perfil-admin", "perfil-gerente"],
    });

    expect(payload).toEqual({
      name: "Carla Operações",
      fullName: "Carla Operações",
      email: "carla@qa.local",
      userKind: "COLABORADOR",
      networkId: "rede-norte",
      networkName: "Rede Norte",
      networkSubdomain: "rede-norte",
      tenantIds: ["tenant-centro", "tenant-barra"],
      defaultTenantId: "tenant-barra",
      initialPerfilIds: ["perfil-admin", "perfil-gerente"],
      loginIdentifiers: [{ label: "E-mail", value: "carla@qa.local" }],
    });
  });

  test("bloqueia tentativa de criar usuário fora da rede corrente", () => {
    expect(() =>
      validateAcademiaUserCreateDraft({
        name: "Carla Operações",
        email: "carla@qa.local",
        networkId: "rede-norte",
        tenantIds: ["tenant-outra-rede"],
        allowedTenantIds: ["tenant-centro"],
      })
    ).toThrow("A academia só pode criar usuários dentro das unidades da própria rede.");
  });
});
