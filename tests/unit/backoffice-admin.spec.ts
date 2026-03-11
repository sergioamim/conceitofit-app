import { expect, test } from "@playwright/test";
import {
  createGlobalAcademia,
  createGlobalUnidade,
  deleteGlobalUnidade,
  getGlobalAcademiaById,
  toggleGlobalUnidade,
  updateGlobalAcademia,
  updateGlobalUnidade,
} from "../../src/lib/backoffice/admin";
import { getStore, resetStore } from "../../src/lib/mock/store";

const envSnapshot = {
  useRealApi: process.env.NEXT_PUBLIC_USE_REAL_API,
};

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_USE_REAL_API = "false";
  resetStore();
});

test.afterEach(() => {
  process.env.NEXT_PUBLIC_USE_REAL_API = envSnapshot.useRealApi;
  resetStore();
});

test.describe("backoffice admin local services", () => {
  test("cria e atualiza academia fora do mock/services", async () => {
    const created = await createGlobalAcademia({
      nome: "Rede QA",
      documento: "11.111.111/0001-11",
    });

    expect(created.id).toBeTruthy();
    expect(getStore().academias.some((item) => item.id === created.id)).toBeTruthy();

    const updated = await updateGlobalAcademia(created.id, {
      nome: "Rede QA Atualizada",
      email: "contato@qa.local",
      ativo: false,
    });

    expect(updated.nome).toBe("Rede QA Atualizada");
    expect(updated.email).toBe("contato@qa.local");
    expect(updated.ativo).toBeFalsy();

    const byId = await getGlobalAcademiaById(created.id);
    expect(byId?.nome).toBe("Rede QA Atualizada");
  });

  test("cria, atualiza, desativa e remove unidade sem dados vinculados", async () => {
    const academia = await createGlobalAcademia({ nome: "Rede Backoffice" });
    const created = await createGlobalUnidade({
      nome: "Unidade QA",
      academiaId: academia.id,
      groupId: "GRP-QA",
      subdomain: "qa-unit",
    });

    expect(getStore().tenants.some((item) => item.id === created.id)).toBeTruthy();

    const updated = await updateGlobalUnidade(created.id, {
      nome: "Unidade QA Editada",
      academiaId: academia.id,
      groupId: "GRP-QA-2",
      configuracoes: {
        impressaoCupom: {
          modo: "CUSTOM",
          larguraCustomMm: 91,
        },
      },
    });

    expect(updated.nome).toBe("Unidade QA Editada");
    expect(updated.groupId).toBe("GRP-QA-2");
    expect(updated.configuracoes?.impressaoCupom?.larguraCustomMm).toBe(91);

    const toggled = await toggleGlobalUnidade(created.id);
    expect(toggled.ativo).toBeFalsy();

    await deleteGlobalUnidade(created.id);
    expect(getStore().tenants.some((item) => item.id === created.id)).toBeFalsy();
  });

  test("protege a unidade ativa de desativação e remoção", async () => {
    const currentTenantId = getStore().currentTenantId;

    await expect(toggleGlobalUnidade(currentTenantId)).rejects.toThrow("unidade ativa");
    await expect(deleteGlobalUnidade(currentTenantId)).rejects.toThrow("unidade ativa");
  });
});
