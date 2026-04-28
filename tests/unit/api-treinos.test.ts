import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createExercicioApi,
  createTreinoApi,
  duplicateTreinoTemplateApi,
  getTreinoApi,
  listExerciciosApi,
  listGruposMuscularesApi,
  listTreinoTemplatesApi,
  listTreinosApi,
  toggleExercicioApi,
  updateExercicioApi,
  updateTreinoApi,
} from "@/lib/api/treinos";
import * as http from "@/lib/api/http";

describe("api/treinos", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listTreinosApi", () => {
    it("GET /treinos array direto", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([{ id: "t1" }, { id: "t2" }] as never);
      const result = await listTreinosApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/treinos");
      expect(result.items).toHaveLength(2);
      expect(result.hasNext).toBe(false);
    });

    it("envelope com content", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        content: [{ id: "t1" }],
        page: 0,
        size: 10,
        total: 1,
      } as never);
      const result = await listTreinosApi({ tenantId: "t1" });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasNext).toBe(false);
    });

    it("hasNext calculado via total", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "t1" }],
        page: 0,
        size: 10,
        total: 25,
      } as never);
      const result = await listTreinosApi({ tenantId: "t1" });
      expect(result.hasNext).toBe(true);
    });

    it("hasNext boolean explícito preservado", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [],
        hasNext: true,
      } as never);
      const result = await listTreinosApi({ tenantId: "t1" });
      expect(result.hasNext).toBe(true);
    });

    it("resposta não-array sem items → items vazio", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      const result = await listTreinosApi({ tenantId: "t1" });
      expect(result.items).toEqual([]);
    });

    it("envia filtros de query", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([] as never);
      await listTreinosApi({
        tenantId: "t1",
        clienteId: "c1",
        professorId: "p1",
        status: "ATIVO",
        search: "abc",
      });
      expect(spy.mock.calls[0][0].query).toMatchObject({
        tenantId: "t1",
        clienteId: "c1",
        professorId: "p1",
        status: "ATIVO",
        search: "abc",
      });
    });
  });

  describe("listTreinoTemplatesApi", () => {
    it("GET /treinos/templates", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "tmpl1", nome: "T" }],
        page: 0,
        size: 10,
        total: 1,
        totais: {
          totalTemplates: 5,
          publicados: 3,
          emRevisao: 1,
          comPendencias: 1,
        },
      } as never);
      const result = await listTreinoTemplatesApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/treinos/templates");
      expect(result.items).toHaveLength(1);
      expect(result.totais.totalTemplates).toBe(5);
      expect(result.totais.publicados).toBe(3);
    });

    it("fallback de totais", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "t1", nome: "N" }],
      } as never);
      const result = await listTreinoTemplatesApi({ tenantId: "t1" });
      expect(result.totais.publicados).toBe(0);
    });
  });

  describe("getTreinoApi", () => {
    it("GET /treinos/{id}", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "t1" } as never);
      await getTreinoApi({ tenantId: "t1", id: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/treinos/t1");
    });
  });

  describe("createTreinoApi", () => {
    it("POST /treinos", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "t1" } as never);
      await createTreinoApi({
        tenantId: "t1",
        data: { nome: "T1" },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({ nome: "T1" });
    });
  });

  describe("updateTreinoApi", () => {
    it("PUT /treinos/{id}", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "t1" } as never);
      await updateTreinoApi({
        tenantId: "t1",
        id: "t1",
        data: { nome: "Edit" },
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/treinos/t1");
    });
  });

  describe("duplicateTreinoTemplateApi", () => {
    it("POST /treinos/{id}/duplicar-template", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "t1" } as never);
      await duplicateTreinoTemplateApi({ tenantId: "t1", id: "t1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/treinos/t1/duplicar-template",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });
  });

  describe("exercicios CRUD", () => {
    it("listExerciciosApi array direto", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([{ id: "e1" }] as never);
      const result = await listExerciciosApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/exercicios");
      expect(result).toHaveLength(1);
    });

    it("listExerciciosApi extrai envelope items", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "e1" }],
      } as never);
      const result = await listExerciciosApi();
      expect(result).toHaveLength(1);
    });

    it("listExerciciosApi extrai envelope content", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        content: [{ id: "e1" }],
      } as never);
      const result = await listExerciciosApi();
      expect(result).toHaveLength(1);
    });

    it("createExercicioApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "e1" } as never);
      await createExercicioApi({
        tenantId: "t1",
        data: { nome: "Ex" },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("updateExercicioApi PUT", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "e1" } as never);
      await updateExercicioApi({
        tenantId: "t1",
        id: "e1",
        data: { nome: "Edit" },
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/exercicios/e1");
    });

    it("toggleExercicioApi PATCH", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "e1" } as never);
      await toggleExercicioApi({ tenantId: "t1", id: "e1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/exercicios/e1/toggle",
      );
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
    });
  });

  describe("grupos musculares CRUD", () => {
    it("listGruposMuscularesApi array", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([{ id: "g1" }] as never);
      const result = await listGruposMuscularesApi();
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/grupos-musculares");
      expect(result).toHaveLength(1);
    });

    it("listGruposMuscularesApi envelope", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "g1" }],
      } as never);
      const result = await listGruposMuscularesApi({ tenantId: "t1" });
      expect(result).toHaveLength(1);
    });

    // CRUD de grupo muscular foi removido na Wave 3 — taxonomia agora e
    // canonica global (ver V202604271500__grupos_exercicio_canonicos.sql).
  });
});
