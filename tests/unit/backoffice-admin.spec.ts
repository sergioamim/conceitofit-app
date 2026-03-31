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

const envSnapshot = {
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

type AcademiaRecord = {
  id: string;
  nome: string;
  documento?: string;
  ativo: boolean;
};

type UnidadeRecord = {
  id: string;
  academiaId: string;
  nome: string;
  groupId: string;
  subdomain?: string;
  ativo: boolean;
  configuracoes?: {
    impressaoCupom?: {
      modo: string;
      larguraCustomMm?: number;
    };
  };
};

function installBackofficeFetchMock() {
  const previousFetch = global.fetch;
  let sequence = 10;
  const currentTenantId = "tn-active";

  const academias: AcademiaRecord[] = [
    {
      id: "acd-active",
      nome: "Rede Atual",
      ativo: true,
    },
  ];

  const unidades: UnidadeRecord[] = [
    {
      id: currentTenantId,
      academiaId: "acd-active",
      nome: "Unidade Ativa",
      groupId: "GRP-ACTIVE",
      subdomain: "ativa",
      ativo: true,
      configuracoes: {
        impressaoCupom: {
          modo: "80MM",
          larguraCustomMm: 80,
        },
      },
    },
  ];

  function nextId(prefix: string) {
    sequence += 1;
    return `${prefix}-${sequence}`;
  }

  function json(body: unknown, status = 200) {
    if (status === 204) {
      return new Response(null, { status });
    }
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.replace(/^\/undefined(?=\/api\/v1\/admin\/)/, "");
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : null;

    if (path === "/api/v1/admin/academias" && method === "POST") {
      const created = {
        id: nextId("acd"),
        nome: String(body?.nome ?? ""),
        documento: body?.documento ? String(body.documento) : undefined,
        ativo: body?.ativo !== false,
      };
      academias.push(created);
      return json(created);
    }

    if (path.startsWith("/api/v1/admin/academias/") && method === "PUT") {
      const id = path.split("/")[5] ?? "";
      const current = academias.find((item) => item.id === id);
      if (!current) return json({ message: "Academia não encontrada." }, 404);
      Object.assign(current, body ?? {});
      return json(current);
    }

    if (path.startsWith("/api/v1/admin/academias/") && method === "GET") {
      const id = path.split("/")[5] ?? "";
      const current = academias.find((item) => item.id === id);
      if (!current) return json({ message: "Academia não encontrada." }, 404);
      return json(current);
    }

    if (path === "/api/v1/admin/unidades" && method === "POST") {
      const created = {
        id: nextId("tn"),
        academiaId: String(body?.academiaId ?? ""),
        nome: String(body?.nome ?? ""),
        groupId: String(body?.groupId ?? ""),
        subdomain: body?.subdomain ? String(body.subdomain) : undefined,
        ativo: body?.ativo !== false,
        configuracoes: body?.configuracoes ?? {
          impressaoCupom: {
            modo: "80MM",
            larguraCustomMm: 80,
          },
        },
      };
      unidades.push(created);
      return json(created);
    }

    if (path.startsWith("/api/v1/admin/unidades/") && method === "PUT") {
      const id = path.split("/")[5] ?? "";
      const current = unidades.find((item) => item.id === id);
      if (!current) return json({ message: "Unidade não encontrada." }, 404);
      Object.assign(current, body ?? {});
      return json(current);
    }

    if (path.endsWith("/toggle") && path.startsWith("/api/v1/admin/unidades/") && method === "PATCH") {
      const id = path.split("/")[5] ?? "";
      if (id === currentTenantId) {
        return json({ message: "Não é permitido desativar a unidade ativa." }, 400);
      }
      const current = unidades.find((item) => item.id === id);
      if (!current) return json({ message: "Unidade não encontrada." }, 404);
      current.ativo = !current.ativo;
      return json(current);
    }

    if (path.startsWith("/api/v1/admin/unidades/") && method === "DELETE") {
      const id = path.split("/")[5] ?? "";
      if (id === currentTenantId) {
        return json({ message: "Não é permitido remover a unidade ativa." }, 400);
      }
      const index = unidades.findIndex((item) => item.id === id);
      if (index < 0) return json({ message: "Unidade não encontrada." }, 404);
      unidades.splice(index, 1);
      return json({}, 204);
    }

    throw new Error(`Unexpected fetch ${method} ${url.pathname}`);
  }) as typeof global.fetch;

  return {
    currentTenantId,
    unidades,
    restore() {
      global.fetch = previousFetch;
    },
  };
}

test.describe("backoffice admin api services", () => {
  test.beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  });

  test.afterEach(() => {
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
  });

  test("cria e atualiza academia via endpoint dedicado", async () => {
    const { restore } = installBackofficeFetchMock();
    try {
      const created = await createGlobalAcademia({
        nome: "Rede QA",
        documento: "11.111.111/0001-11",
      });

      expect(created.id).toBeTruthy();

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
    } finally {
      restore();
    }
  });

  test("cria, atualiza, desativa e remove unidade sem store legado", async () => {
    const { unidades, restore } = installBackofficeFetchMock();
    try {
      const academia = await createGlobalAcademia({ nome: "Rede Backoffice" });
      const created = await createGlobalUnidade({
        nome: "Unidade QA",
        academiaId: academia.id,
        groupId: "GRP-QA",
        subdomain: "qa-unit",
      });

      expect(unidades.some((item) => item.id === created.id)).toBeTruthy();

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
      expect(unidades.some((item) => item.id === created.id)).toBeFalsy();
    } finally {
      restore();
    }
  });

  test("protege a unidade ativa de desativação e remoção", async () => {
    const { currentTenantId, restore } = installBackofficeFetchMock();
    try {
      await expect(toggleGlobalUnidade(currentTenantId)).rejects.toThrow("unidade ativa");
      await expect(deleteGlobalUnidade(currentTenantId)).rejects.toThrow("unidade ativa");
    } finally {
      restore();
    }
  });
});
