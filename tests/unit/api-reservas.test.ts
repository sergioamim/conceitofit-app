import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelarReservaAulaApi,
  getAulaOcupacaoApi,
  listAulasAgendaApi,
  listReservasAulaApi,
  promoverReservaWaitlistApi,
  registrarCheckinAulaApi,
  reservarAulaApi,
} from "@/lib/api/reservas";
import * as http from "@/lib/api/http";

describe("api/reservas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listAulasAgendaApi", () => {
    it("GET /administrativo/atividades-sessoes", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "s1",
          atividadeGradeId: "g1",
          dataSessao: "2026-04-10",
          inicioEm: "2026-04-10T10:00:00",
          fimEm: "2026-04-10T11:00:00",
          capacidadeTotal: 20,
          reservasConfirmadas: 5,
          diaSemana: "SEG",
        },
      ] as never);
      const result = await listAulasAgendaApi({
        tenantId: "t1",
        dateFrom: "2026-04-10",
        dateTo: "2026-04-20",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/atividades-sessoes",
      );
      expect(result).toHaveLength(1);
      expect(result[0].vagasOcupadas).toBe(5);
    });

    it("envelope items → extrai", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [
          {
            id: "s1",
            atividadeGradeId: "g1",
            dataSessao: "2026-04-10",
            capacidadeTotal: 10,
          },
        ],
      } as never);
      const result = await listAulasAgendaApi({
        tenantId: "t1",
        dateFrom: "2026-04-10",
        dateTo: "2026-04-20",
      });
      expect(result).toHaveLength(1);
    });

    it("vagasDisponiveis default via capacidade-ocupadas", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "s1",
          atividadeGradeId: "g1",
          dataSessao: "2026-04-10",
          capacidadeTotal: 10,
          reservasConfirmadas: 3,
        },
      ] as never);
      const result = await listAulasAgendaApi({
        tenantId: "t1",
        dateFrom: "2026-04-10",
        dateTo: "2026-04-20",
      });
      expect(result[0].vagasDisponiveis).toBe(7);
    });
  });

  describe("listReservasAulaApi", () => {
    it("GET /agenda/aulas/reservas", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "r1",
          sessaoId: "s1",
          alunoId: "a1",
          data: "2026-04-10",
          status: "CONFIRMADA",
        },
      ] as never);
      await listReservasAulaApi({
        tenantId: "t1",
        sessaoId: "s1",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/agenda/aulas/reservas",
      );
      expect(spy.mock.calls[0][0].query?.sessaoId).toBe("s1");
    });
  });

  describe("getAulaOcupacaoApi", () => {
    it("GET /sessoes/{id}/ocupacao e normaliza", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        sessao: {
          id: "s1",
          capacidade: 20,
          vagasOcupadas: 10,
        },
        reservas: [
          {
            id: "r1",
            alunoId: "a1",
            status: "CONFIRMADA",
          },
          {
            id: "r2",
            alunoId: "a2",
            status: "LISTA_ESPERA",
          },
          {
            id: "r3",
            alunoId: "a3",
            status: "CANCELADA",
          },
        ],
      } as never);
      const result = await getAulaOcupacaoApi({
        tenantId: "t1",
        sessaoId: "s1",
      });
      expect(result.sessao.capacidade).toBe(20);
      expect(result.confirmadas).toHaveLength(1);
      expect(result.waitlist).toHaveLength(1);
      expect(result.canceladas).toHaveLength(1);
    });

    it("confirmadas/waitlist/canceladas arrays explícitos", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        sessao: { id: "s1" },
        confirmadas: [{ id: "r1", alunoId: "a1" }],
        waitlist: [{ id: "r2", alunoId: "a2" }],
        canceladas: [{ id: "r3", alunoId: "a3" }],
      } as never);
      const result = await getAulaOcupacaoApi({
        tenantId: "t1",
        sessaoId: "s1",
      });
      expect(result.confirmadas).toHaveLength(1);
      expect(result.waitlist).toHaveLength(1);
      expect(result.canceladas).toHaveLength(1);
    });

    it("checkinsRealizados calculado via CHECKIN status", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        sessao: { id: "s1" },
        reservas: [
          { id: "r1", alunoId: "a1", status: "CHECKIN" },
          { id: "r2", alunoId: "a2", status: "CONFIRMADA" },
        ],
      } as never);
      const result = await getAulaOcupacaoApi({
        tenantId: "t1",
        sessaoId: "s1",
      });
      expect(result.checkinsRealizados).toBeGreaterThanOrEqual(1);
    });
  });

  describe("reservarAulaApi", () => {
    it("POST /agenda/aulas/reservas", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "r1",
        status: "CONFIRMADA",
      } as never);
      await reservarAulaApi({
        tenantId: "t1",
        data: {
          atividadeGradeId: "g1",
          data: "2026-04-10",
          alunoId: "a1",
          origem: "BACKOFFICE",
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toMatchObject({
        alunoId: "a1",
        origem: "BACKOFFICE",
      });
    });
  });

  describe("cancelarReservaAulaApi", () => {
    it("POST /reservas/{id}/cancelar", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "r1",
        status: "CANCELADA",
      } as never);
      await cancelarReservaAulaApi({ tenantId: "t1", id: "r1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/agenda/aulas/reservas/r1/cancelar",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });
  });

  describe("promoverReservaWaitlistApi", () => {
    it("POST /promover-waitlist", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "r1",
        status: "CONFIRMADA",
      } as never);
      await promoverReservaWaitlistApi({ tenantId: "t1", sessaoId: "s1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/agenda/aulas/sessoes/s1/promover-waitlist",
      );
    });

    it("null response → null", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue(null as never);
      const result = await promoverReservaWaitlistApi({
        tenantId: "t1",
        sessaoId: "s1",
      });
      expect(result).toBeNull();
    });
  });

  describe("registrarCheckinAulaApi", () => {
    it("POST /reservas/{id}/checkin", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "r1",
        status: "CHECKIN",
      } as never);
      await registrarCheckinAulaApi({ tenantId: "t1", id: "r1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/agenda/aulas/reservas/r1/checkin",
      );
    });
  });
});
