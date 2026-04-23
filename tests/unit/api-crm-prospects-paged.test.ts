import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSumarioProspectsApi,
  listProspectsApi,
  listProspectsPageApi,
} from "@/lib/api/crm";
import * as http from "@/lib/api/http";

/**
 * Cobertura das adicoes P1 (prospects) no wrapper de CRM: filtros
 * extras em `listProspectsApi`, variante paginada com envelope, e
 * novo endpoint de sumario. Foco em: traducao de query params,
 * parse dos headers de paginacao, e normalizacao do sumario.
 */
describe("api/crm (P1 prospects paged + sumario)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listProspectsApi (legado, agora com filtros extras)", () => {
    it("propaga todos os filtros novos ao backend (search/periodo)", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);

      await listProspectsApi({
        tenantId: "t1",
        status: "NOVO",
        origem: "INSTAGRAM",
        search: "joao",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      });

      const call = spy.mock.calls[0][0];
      expect(call.path).toBe("/api/v1/academia/prospects");
      expect(call.query).toMatchObject({
        tenantId: "t1",
        status: "NOVO",
        origem: "INSTAGRAM",
        search: "joao",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      });
    });
  });

  describe("listProspectsPageApi", () => {
    it("envia page/size + filtros e le envelope dos headers", async () => {
      const spy = vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [
          {
            id: "p1",
            tenantId: "t1",
            nome: "Joao",
            email: "joao@x.com",
            telefone: "11987654321",
            origem: "INSTAGRAM",
            status: "NOVO",
            dataCriacao: "2026-04-10",
          },
        ],
        headers: {
          "x-total-count": "200",
          "x-page": "0",
          "x-size": "50",
          "x-total-pages": "4",
        },
      } as never);

      const result = await listProspectsPageApi({
        tenantId: "t1",
        status: "NOVO",
        origem: "INSTAGRAM",
        search: "joao",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        page: 0,
        size: 50,
      });

      const call = spy.mock.calls[0][0];
      expect(call.path).toBe("/api/v1/academia/prospects");
      expect(call.query).toMatchObject({
        tenantId: "t1",
        status: "NOVO",
        origem: "INSTAGRAM",
        search: "joao",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        page: 0,
        size: 50,
      });

      expect(result.total).toBe(200);
      expect(result.page).toBe(0);
      expect(result.size).toBe(50);
      expect(result.hasNext).toBe(true); // 0 < 4-1
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("p1");
    });

    it("hasNext=false na ultima pagina", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [],
        headers: {
          "x-total-count": "60",
          "x-page": "2",
          "x-size": "20",
          "x-total-pages": "3", // page 2 of 3 (0-indexed) = ultima
        },
      } as never);

      const r = await listProspectsPageApi({ tenantId: "t1", page: 2, size: 20 });
      expect(r.hasNext).toBe(false);
    });

    it("sem headers, devolve defaults seguros", async () => {
      vi.spyOn(http, "apiRequestWithMeta").mockResolvedValue({
        data: [],
        headers: {},
      } as never);

      const r = await listProspectsPageApi({ tenantId: "t1" });
      expect(r.total).toBe(0);
      expect(r.hasNext).toBe(false);
    });
  });

  describe("getSumarioProspectsApi", () => {
    it("GET /prospects/sumario com startDate/endDate", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        novos: 5,
        emContato: 3,
        agendouVisita: 2,
        visitou: 1,
        convertidos: 4,
        perdidos: 2,
        ativos: 11,
        total: 17,
      } as never);

      const result = await getSumarioProspectsApi({
        tenantId: "t1",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      });

      const call = spy.mock.calls[0][0];
      expect(call.path).toBe("/api/v1/academia/prospects/sumario");
      expect(call.query).toMatchObject({
        tenantId: "t1",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      });

      expect(result).toEqual({
        novos: 5,
        emContato: 3,
        agendouVisita: 2,
        visitou: 1,
        convertidos: 4,
        perdidos: 2,
        ativos: 11,
        total: 17,
      });
    });

    it("converte strings do backend em numeros", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        novos: "5",
        emContato: "3",
        agendouVisita: "2",
        visitou: "1",
        convertidos: "4",
        perdidos: "2",
        ativos: "11",
        total: "17",
      } as never);

      const result = await getSumarioProspectsApi({ tenantId: "t1" });
      expect(result.novos).toBe(5);
      expect(result.total).toBe(17);
    });

    it("trata null/undefined como zero", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        novos: null,
        emContato: undefined,
      } as never);

      const result = await getSumarioProspectsApi({ tenantId: "t1" });
      expect(result.novos).toBe(0);
      expect(result.emContato).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
