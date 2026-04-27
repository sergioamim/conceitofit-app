import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAtividadeUpsertApiRequest,
  createAtividadeApi,
  createCargoApi,
  createSalaApi,
  deleteAtividadeApi,
  deleteCargoApi,
  deleteSalaApi,
  listAtividadeGradesApi,
  listAtividadesApi,
  listCargosApi,
  listSalasApi,
  normalizeAtividadeApiResponse,
  toggleAtividadeApi,
  toggleCargoApi,
  toggleSalaApi,
  updateAtividadeApi,
  updateCargoApi,
  updateSalaApi,
} from "@/lib/api/administrativo";
import * as http from "@/lib/api/http";

describe("api/administrativo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("buildAtividadeUpsertApiRequest", () => {
    it("limita nome/descricao/icone/cor", () => {
      const req = buildAtividadeUpsertApiRequest({
        nome: "x".repeat(200),
        descricao: "y".repeat(1000),
        categoria: "MUSCULACAO",
        icone: "💪💪💪💪💪💪💪💪💪💪💪💪",
        cor: "#FF00AA-extra-stuff",
        permiteCheckin: true,
        checkinObrigatorio: false,
      } as never);
      expect(req.nome.length).toBe(100);
      expect(req.descricao?.length).toBe(500);
      expect(req.icone?.length).toBeLessThanOrEqual(10);
      expect(req.cor?.length).toBeLessThanOrEqual(10);
    });

    it("checkinObrigatorio false quando permiteCheckin false", () => {
      const req = buildAtividadeUpsertApiRequest({
        nome: "A",
        categoria: "MUSCULACAO",
        permiteCheckin: false,
        checkinObrigatorio: true,
      } as never);
      expect(req.permiteCheckin).toBe(false);
      expect(req.checkinObrigatorio).toBe(false);
    });

    it("limpa strings vazias", () => {
      const req = buildAtividadeUpsertApiRequest({
        nome: "A",
        descricao: "  ",
        icone: "",
        categoria: "OUTRA",
        permiteCheckin: true,
        checkinObrigatorio: false,
      } as never);
      expect(req.descricao).toBeUndefined();
      expect(req.icone).toBeUndefined();
    });
  });

  describe("normalizeAtividadeApiResponse", () => {
    it("usa defaults", () => {
      const result = normalizeAtividadeApiResponse({});
      expect(result.nome).toBe("");
      expect(result.categoria).toBe("OUTRA");
      expect(result.cor).toBe("#3de8a0");
      expect(result.permiteCheckin).toBe(true);
      expect(result.ativo).toBe(true);
    });

    it("checkinObrigatorio false quando permiteCheckin false", () => {
      const result = normalizeAtividadeApiResponse({
        permiteCheckin: false,
        checkinObrigatorio: true,
      });
      expect(result.checkinObrigatorio).toBe(false);
    });

    it("usa fallback quando input vazio", () => {
      const result = normalizeAtividadeApiResponse(
        {},
        { tenantId: "t1", nome: "F", categoria: "CROSSFIT" as never },
      );
      expect(result.tenantId).toBe("t1");
      expect(result.nome).toBe("F");
      expect(result.categoria).toBe("CROSSFIT");
    });
  });

  describe("cargos CRUD", () => {
    it("listCargosApi GET default false", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listCargosApi();
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/administrativo/cargos");
      expect(spy.mock.calls[0][0].query?.apenasAtivos).toBe(false);
    });

    it("createCargoApi POST", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await createCargoApi({ nome: "C" });
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("updateCargoApi PUT", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await updateCargoApi("c1", { nome: "Edit", ativo: true });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/cargos/c1",
      );
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].body).toEqual({ nome: "Edit", ativo: true });
    });

    it("toggleCargoApi PATCH", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await toggleCargoApi("c1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/cargos/c1/toggle",
      );
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
    });

    it("deleteCargoApi DELETE", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await deleteCargoApi("c1");
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });
  });

  describe("salas CRUD", () => {
    it("listSalasApi GET", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listSalasApi();
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/administrativo/salas");
    });

    it("createSalaApi POST", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await createSalaApi({ nome: "S" } as never);
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("updateSalaApi PUT", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await updateSalaApi("s1", { nome: "Edit" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/administrativo/salas/s1");
    });

    it("toggleSalaApi PATCH", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await toggleSalaApi("s1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/salas/s1/toggle",
      );
    });

    it("deleteSalaApi DELETE", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await deleteSalaApi("s1");
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });
  });

  describe("atividades CRUD", () => {
    it("listAtividadesApi GET", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "a1", nome: "At" },
      ] as never);
      const result = await listAtividadesApi({
        tenantId: "t1",
        apenasAtivas: true,
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/atividades",
      );
      expect(result).toHaveLength(1);
    });

    it("listAtividadesApi envelope items", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "a1" }, { id: "a2" }],
      } as never);
      const result = await listAtividadesApi({ tenantId: "t1" });
      expect(result).toHaveLength(2);
    });

    it("createAtividadeApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "a1" } as never);
      await createAtividadeApi({
        tenantId: "t1",
        data: {
          nome: "A",
          categoria: "MUSCULACAO",
          permiteCheckin: true,
          checkinObrigatorio: false,
        } as never,
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).not.toHaveProperty("tenantId");
    });

    it("updateAtividadeApi PUT", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "a1" } as never);
      await updateAtividadeApi({
        tenantId: "t1",
        id: "a1",
        data: {
          nome: "Edit",
          categoria: "MUSCULACAO",
          permiteCheckin: true,
          checkinObrigatorio: false,
          ativo: true,
        } as never,
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/atividades/a1",
      );
      expect(spy.mock.calls[0][0].body).not.toHaveProperty("tenantId");
    });

    it("toggleAtividadeApi PATCH", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "a1" } as never);
      await toggleAtividadeApi({ tenantId: "t1", id: "a1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/atividades/a1/toggle",
      );
    });

    it("deleteAtividadeApi DELETE", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await deleteAtividadeApi({ tenantId: "t1", id: "a1" });
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });
  });

  describe("listAtividadeGradesApi", () => {
    it("GET /atividades-grade", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listAtividadeGradesApi({ tenantId: "t1", apenasAtivas: true });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/atividades-grade",
      );
    });

    it("sem params → query com undefined", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listAtividadeGradesApi();
      expect(spy.mock.calls[0][0].query?.tenantId).toBeUndefined();
    });
  });
});
