import { expect, test } from "@playwright/test";
import {
  cancelarReservaAulaApi,
  getAulaOcupacaoApi,
  listAulasAgendaApi,
  listReservasAulaApi,
  promoverReservaWaitlistApi,
  registrarCheckinAulaApi,
  reservarAulaApi,
} from "../../src/lib/api/reservas";
import { mockFetchWithSequence } from "./support/test-runtime";

const envSnapshot = {
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
});

test.afterEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
});

test.describe("reservas api", () => {
  test("normaliza sessoes, reservas e ocupacao com envelopes variados", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          data: [
            {
              tenantId: "tenant-1",
              atividadeGradeId: "grade-1",
              atividadeId: "atv-1",
              atividadeNome: "Spinning",
              data: "2026-03-17",
              diaSemana: "TER",
              horaInicio: "06:00",
              horaFim: "07:00",
              capacidade: "20",
              vagasOcupadas: "8",
              waitlistTotal: "2",
              permiteReserva: "sim",
              listaEsperaHabilitada: "1",
              exibirNoAppCliente: true,
              exibirNoAutoatendimento: "true",
              checkinLiberadoMinutosAntes: "30",
              permiteCheckin: "1",
              checkinObrigatorio: "false",
              local: "Sala Bike",
              instrutorNome: "Paula",
            },
          ],
        },
      },
      {
        body: {
          items: [
            {
              id: "res-2",
              tenantId: "tenant-1",
              sessaoId: "sessao-2",
              atividadeGradeId: "grade-2",
              atividadeId: "atv-2",
              atividadeNome: "Yoga",
              alunoId: "aluno-2",
              alunoNome: "Bruna",
              data: "2026-03-18",
              horaInicio: "09:00",
              horaFim: "10:00",
              origem: "APP_CLIENTE",
              status: "LISTA_ESPERA",
              posicaoListaEspera: "2",
              instrutorNome: "Caio",
            },
          ],
        },
      },
      {
        body: {
          sessao: {
            tenantId: "tenant-1",
            atividadeGradeId: "grade-3",
            atividadeId: "atv-3",
            atividadeNome: "Funcional",
            data: "2026-03-19",
            horaInicio: "18:00",
            horaFim: "19:00",
            capacidade: 12,
            vagasOcupadas: 11,
            local: "Studio 2",
            instrutorNome: "Leo",
          },
          reservas: [
            {
              id: "res-3",
              alunoId: "aluno-3",
              alunoNome: "Carlos",
              status: "CHECKIN",
              dataCriacao: "2026-03-14T12:00:00Z",
            },
            {
              id: "res-4",
              alunoId: "aluno-4",
              alunoNome: "Daniela",
              status: "LISTA_ESPERA",
              posicaoListaEspera: 1,
              dataCriacao: "2026-03-14T12:01:00Z",
            },
            {
              id: "res-5",
              alunoId: "aluno-5",
              alunoNome: "Erica",
              status: "CANCELADA",
              canceladaEm: "2026-03-14T12:02:00Z",
              dataCriacao: "2026-03-14T12:02:00Z",
            },
          ],
        },
      },
    ]);

    try {
      const agenda = await listAulasAgendaApi({
        tenantId: "tenant-1",
        dateFrom: "2026-03-17",
        dateTo: "2026-03-17",
      });
      expect(agenda[0]?.id).toBe("sessao-grade-1-2026-03-17");
      expect(agenda[0]?.capacidade).toBe(20);
      expect(agenda[0]?.vagasDisponiveis).toBe(12);
      expect(agenda[0]?.permiteReserva).toBe(true);
      expect(agenda[0]?.permiteCheckin).toBe(true);
      expect(agenda[0]?.origemTipo).toBe("GRADE_RECORRENTE");

      const reservas = await listReservasAulaApi({
        tenantId: "tenant-1",
        sessaoId: "sessao-2",
      });
      expect(reservas[0]?.status).toBe("LISTA_ESPERA");
      expect(reservas[0]?.posicaoListaEspera).toBe(2);
      expect(reservas[0]?.instrutorNome).toBe("Caio");

      const ocupacao = await getAulaOcupacaoApi({
        tenantId: "tenant-1",
        sessaoId: "sessao-3",
      });
      expect(ocupacao.sessao.id).toBe("sessao-3");
      expect(ocupacao.confirmadas).toHaveLength(1);
      expect(ocupacao.waitlist).toHaveLength(1);
      expect(ocupacao.canceladas).toHaveLength(1);
      expect(ocupacao.checkinsRealizados).toBe(1);

      expect(calls[0].url).toContain("/api/v1/agenda/aulas/sessoes");
      expect(calls[1].url).toContain("/api/v1/agenda/aulas/reservas");
      expect(calls[2].url).toContain("/api/v1/agenda/aulas/sessoes/sessao-3/ocupacao");
    } finally {
      restore();
    }
  });

  test("normaliza metadados de ocorrência avulsa vindos da agenda", async () => {
    const { restore } = mockFetchWithSequence([
      {
        body: [
          {
            id: "sessao-ocorrencia-1",
            tenantId: "tenant-1",
            atividadeGradeId: "grade-sob-demanda",
            atividadeId: "atividade-1",
            atividadeNome: "Pilates Solo",
            data: "2026-03-26",
            diaSemana: "QUI",
            horaInicio: "19:30",
            horaFim: "20:20",
            capacidade: 14,
            vagasOcupadas: 3,
            origemTipo: "OCORRENCIA_AVULSA",
            ocorrenciaId: "occ-1",
            definicaoHorario: "SOB_DEMANDA",
            exibirNoAppCliente: true,
            exibirNoAutoatendimento: true,
            permiteReserva: true,
            listaEsperaHabilitada: true,
            permiteCheckin: true,
            checkinObrigatorio: false,
          },
        ],
      },
    ]);

    try {
      const agenda = await listAulasAgendaApi({
        tenantId: "tenant-1",
        dateFrom: "2026-03-26",
        dateTo: "2026-03-26",
      });

      expect(agenda[0]).toEqual(
        expect.objectContaining({
          id: "sessao-ocorrencia-1",
          origemTipo: "OCORRENCIA_AVULSA",
          ocorrenciaId: "occ-1",
          definicaoHorario: "SOB_DEMANDA",
          vagasDisponiveis: 11,
        })
      );
    } finally {
      restore();
    }
  });

  test("executa fluxo de reservar, cancelar, promover waitlist e checkin", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          tenantId: "tenant-1",
          atividadeGradeId: "grade-9",
          atividadeId: "atv-9",
          atividadeNome: "Pilates",
          alunoId: "aluno-9",
          alunoNome: "Fernanda",
          data: "2026-03-20",
          horaInicio: "07:30",
          horaFim: "08:30",
          origem: "BACKOFFICE",
          status: "CONFIRMADA",
        },
      },
      {
        body: {
          tenantId: "tenant-1",
          alunoId: "aluno-9",
          alunoNome: "Fernanda",
          canceladaEm: "2026-03-20T06:00:00Z",
        },
      },
      {
        body: {
          tenantId: "tenant-1",
          alunoId: "aluno-10",
          alunoNome: "Gustavo",
          status: "CONFIRMADA",
        },
      },
      {
        body: {
          tenantId: "tenant-1",
          alunoId: "aluno-10",
          alunoNome: "Gustavo",
          checkinEm: "2026-03-20T07:35:00Z",
        },
      },
      {
        body: null,
      },
    ]);

    try {
      const reserva = await reservarAulaApi({
        tenantId: "tenant-1",
        data: {
          atividadeGradeId: "grade-9",
          data: "2026-03-20",
          alunoId: "aluno-9",
          origem: "BACKOFFICE",
        },
      });
      expect(reserva.atividadeGradeId).toBe("grade-9");
      expect(reserva.dataCriacao).toBeTruthy();

      const cancelada = await cancelarReservaAulaApi({
        tenantId: "tenant-1",
        id: "res-9",
      });
      expect(cancelada.id).toBe("res-9");
      expect(cancelada.status).toBe("CANCELADA");

      const promovida = await promoverReservaWaitlistApi({
        tenantId: "tenant-1",
        sessaoId: "sessao-9",
      });
      expect(promovida?.status).toBe("CONFIRMADA");
      expect(promovida?.sessaoId).toBe("sessao-9");

      const checkin = await registrarCheckinAulaApi({
        tenantId: "tenant-1",
        id: "res-10",
      });
      expect(checkin.id).toBe("res-10");
      expect(checkin.status).toBe("CHECKIN");
      expect(checkin.checkinEm).toBe("2026-03-20T07:35:00Z");

      const semPromocao = await promoverReservaWaitlistApi({
        tenantId: "tenant-1",
        sessaoId: "sessao-vazio",
      });
      expect(semPromocao).toBeNull();

      expect(calls[0].method).toBe("POST");
      expect(calls[1].url).toContain("/api/v1/agenda/aulas/reservas/res-9/cancelar");
      expect(calls[2].url).toContain("/api/v1/agenda/aulas/sessoes/sessao-9/promover-waitlist");
      expect(calls[3].url).toContain("/api/v1/agenda/aulas/reservas/res-10/checkin");
    } finally {
      restore();
    }
  });
});
