import { expect, test } from "@playwright/test";
import {
  createAlunoComMatriculaService,
  createAlunoService,
  createVendaService,
  excluirAlunoService,
  getClienteOperationalContextService,
  liberarAcessoCatracaService,
  listAlunosPageService,
  listAlunosService,
  listVendasPageService,
  migrarClienteParaUnidadeService,
  resolveAlunoTenantService,
  resolveVendaFluxoStatusFromApi,
  updateAlunoService,
} from "../../src/lib/tenant/comercial/runtime";
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

test.describe("comercial runtime", () => {
  // Decisão de domínio: BLOQUEADO é estado distinto de INATIVO (acesso
  // suspenso por inadimplência vs plano vencido) — normalizeAlunoStatus
  // preserva o valor bruto do backend.
  test("coordena servicos de alunos e vendas sem store legado", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          items: [
            {
              id: "al-1",
              tenantId: "tenant-1",
              nome: "Ana",
              email: "ana@email.com",
              telefone: "11999999999",
              cpf: "12345678900",
              dataNascimento: "1990-01-01",
              sexo: "F",
              status: "ATIVO",
              dataCadastro: "2026-03-14T10:00:00Z",
            },
          ],
          page: 2,
          size: 15,
          hasNext: true,
          totaisStatus: {
            total: 40,
            totalAtivo: "30",
            totalSuspenso: "2",
            totalInativo: "8",
          },
        },
      },
      {
        body: {
          items: [
            {
              id: "al-2",
              tenantId: "tenant-1",
              nome: "Bruno",
              email: "bruno@email.com",
              telefone: "11988888888",
              cpf: "99999999999",
              dataNascimento: "1991-01-01",
              sexo: "M",
              status: "BLOQUEADO",
              dataCadastro: "2026-03-14T10:05:00Z",
            },
          ],
          page: 0,
          size: 500,
          hasNext: false,
        },
      },
      {
        body: {
          id: "al-3",
          tenantId: "tenant-1",
          nome: "Carla",
          email: "carla@email.com",
          telefone: "11977777777",
          cpf: "11111111111",
          dataNascimento: "1992-01-01",
          sexo: "F",
          status: "ATIVO",
          dataCadastro: "2026-03-14T10:10:00Z",
        },
      },
      {
        body: {
          aluno: {
            id: "al-4",
            tenantId: "tenant-1",
            nome: "Daniel",
            email: "daniel@email.com",
            telefone: "11966666666",
            cpf: "22222222222",
            dataNascimento: "1993-01-01",
            sexo: "M",
            status: "ATIVO",
            dataCadastro: "2026-03-14T10:15:00Z",
          },
          matricula: {
            id: "mat-1",
            tenantId: "tenant-1",
            alunoId: "al-4",
            planoId: "pl-1",
            dataInicio: "2026-03-14",
            dataFim: "2026-04-14",
            valorPago: 149.9,
            formaPagamento: "PIX",
            status: "ATIVA",
            renovacaoAutomatica: false,
            dataCriacao: "2026-03-14T10:15:00Z",
          },
          pagamento: {
            id: "pg-1",
            tenantId: "tenant-1",
            alunoId: "al-4",
            tipo: "MATRICULA",
            descricao: "Matrícula",
            valor: 149.9,
            desconto: 0,
            valorFinal: 149.9,
            dataVencimento: "2026-03-14",
            formaPagamento: "PIX",
            status: "PAGO",
            dataCriacao: "2026-03-14T10:15:00Z",
          },
        },
      },
      {
        body: {
          id: "al-3",
          tenantId: "tenant-1",
          nome: "Carla Atualizada",
          email: "carla@email.com",
          telefone: "11977777777",
          cpf: "11111111111",
          dataNascimento: "1992-01-01",
          sexo: "F",
          status: "ATIVO",
          dataCadastro: "2026-03-14T10:10:00Z",
        },
      },
      {
        body: { message: "Aluno nao encontrado" },
        status: 404,
      },
      {
        body: {
          id: "al-9",
          tenantId: "tenant-2",
          nome: "Evelyn",
          email: "evelyn@email.com",
          telefone: "11955555555",
          cpf: "33333333333",
          dataNascimento: "1994-01-01",
          sexo: "F",
          status: "ATIVO",
          dataCadastro: "2026-03-14T10:20:00Z",
        },
      },
      {
        body: [
          {
            id: "vd-1",
            tenantId: "tenant-1",
            tipo: "PLANO",
            status: "FECHADA",
            itens: [],
            subtotal: 200,
            descontoTotal: 0,
            acrescimoTotal: 0,
            total: 200,
            pagamento: {
              formaPagamento: "PIX",
              valorPago: 200,
            },
            dataCriacao: "2026-03-14T10:25:00Z",
          },
        ],
      },
      {
        body: {
          id: "vd-2",
          tenantId: "tenant-1",
          tipo: "PLANO",
          status: "FECHADA",
          itens: [],
          subtotal: 250,
          descontoTotal: 20,
          acrescimoTotal: 0,
          total: 230,
          pagamento: {
            formaPagamento: "PIX",
            valorPago: 230,
            status: "PENDENTE",
          },
          contratoStatus: "PENDENTE_ASSINATURA",
          dataCriacao: "2026-03-14T10:30:00Z",
        },
      },
    ]);

    try {
      const alunosPage = await listAlunosPageService({
        tenantId: "tenant-1",
        page: 2,
        size: 15,
      });
      expect(alunosPage.page).toBe(2);
      expect(alunosPage.size).toBe(15);
      expect(alunosPage.total).toBe(40);
      expect(alunosPage.hasNext).toBe(true);
      expect(alunosPage.totaisStatus?.totalAtivo).toBe(30);

      const alunos = await listAlunosService({
        tenantId: "tenant-1",
      });
      expect(alunos[0]?.status).toBe("BLOQUEADO");

      const created = await createAlunoService({
        tenantId: "tenant-1",
        data: {
          nome: "Carla",
          email: "carla@email.com",
          telefone: "11977777777",
          cpf: "11111111111",
          dataNascimento: "1992-01-01",
          sexo: "F",
        },
      });
      expect(created.id).toBe("al-3");

      const createdWithMatricula = await createAlunoComMatriculaService({
        tenantId: "tenant-1",
        data: {
          nome: "Daniel",
          email: "daniel@email.com",
          telefone: "11966666666",
          cpf: "22222222222",
          dataNascimento: "1993-01-01",
          sexo: "M",
          planoId: "pl-1",
          dataInicio: "2026-03-14",
          formaPagamento: "PIX",
        },
      });
      expect(createdWithMatricula.matricula.id).toBe("mat-1");

      const updated = await updateAlunoService({
        tenantId: "tenant-1",
        id: "al-3",
        data: {
          nome: "Carla Atualizada",
        },
      });
      expect(updated.nome).toBe("Carla Atualizada");

      const resolved = await resolveAlunoTenantService({
        alunoId: "al-9",
        tenantId: "tenant-1",
        tenantIds: ["tenant-2"],
      });
      expect(resolved).toEqual({
        tenantId: "tenant-2",
        aluno: expect.objectContaining({
          id: "al-9",
          tenantId: "tenant-2",
        }),
      });

      const vendas = await listVendasPageService({
        tenantId: "tenant-1",
      });
      expect(vendas.items).toHaveLength(1);
      expect(vendas.total).toBe(1);
      expect(vendas.hasNext).toBe(false);

      const venda = await createVendaService({
        tenantId: "tenant-1",
        data: {
          tipo: "PLANO",
          itens: [],
          pagamento: {
            formaPagamento: "PIX",
            valorPago: 230,
          },
        },
      });
      expect(venda.id).toBe("vd-2");
      expect(venda.contratoStatus).toBe("PENDENTE_ASSINATURA");

      expect(calls[5].url).toContain("/api/v1/comercial/alunos/al-9");
      expect(calls[6].url).toContain("/api/v1/comercial/alunos/al-9");
      expect(calls[7].url).toContain("/api/v1/comercial/vendas");
      expect(calls[8].method).toBe("POST");
    } finally {
      restore();
    }
  });

  test("resolve status de venda e libera acesso de catraca com validacoes operacionais", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          tenantId: "tenant-1",
          connectedAgents: 0,
          agents: [],
        },
      },
      {
        body: {
          tenantId: "tenant-1",
          connectedAgents: 1,
          agents: [{ agentId: "agent-1" }],
        },
      },
      {
        body: {
          requestId: "grant-123",
        },
      },
    ]);

    try {
      await expect(
        liberarAcessoCatracaService({
          tenantId: "tenant-1",
          alunoId: "al-1",
          justificativa: "   ",
        })
      ).rejects.toThrow("A justificativa é obrigatória.");

      await expect(
        liberarAcessoCatracaService({
          tenantId: "tenant-1",
          alunoId: "al-1",
          justificativa: "Liberacao sem agente",
        })
      ).rejects.toThrow("Nenhum agente da catraca conectado para este tenant.");

      const requestId = await liberarAcessoCatracaService({
        tenantId: "tenant-1",
        alunoId: "al-1",
        justificativa: "Liberacao manual",
        issuedBy: "recepcao",
      });
      expect(requestId).toBe("grant-123");
      expect(calls[2].body).toContain("\"issuedBy\":\"recepcao\"");

      expect(
        resolveVendaFluxoStatusFromApi({
          id: "vd-a",
          tenantId: "tenant-1",
          tipo: "PLANO",
          status: "CANCELADA",
          itens: [],
          subtotal: 10,
          descontoTotal: 0,
          acrescimoTotal: 0,
          total: 10,
          pagamento: {
            formaPagamento: "PIX",
            valorPago: 10,
            status: "PAGO",
          },
          dataCriacao: "2026-03-14T12:00:00Z",
        })
      ).toBe("CANCELADO");

      expect(
        resolveVendaFluxoStatusFromApi({
          id: "vd-b",
          tenantId: "tenant-1",
          tipo: "PLANO",
          status: "FECHADA",
          itens: [],
          subtotal: 10,
          descontoTotal: 0,
          acrescimoTotal: 0,
          total: 10,
          pagamento: {
            formaPagamento: "PIX",
            valorPago: 0,
            status: "PENDENTE",
          },
          dataCriacao: "2026-03-14T12:00:00Z",
        })
      ).toBe("AGUARDANDO_PAGAMENTO");

      expect(
        resolveVendaFluxoStatusFromApi({
          id: "vd-c",
          tenantId: "tenant-1",
          tipo: "PLANO",
          status: "FECHADA",
          itens: [],
          subtotal: 10,
          descontoTotal: 0,
          acrescimoTotal: 0,
          total: 10,
          pagamento: {
            formaPagamento: "PIX",
            valorPago: 10,
            status: "PAGO",
          },
          contratoStatus: "PENDENTE_ASSINATURA",
          dataCriacao: "2026-03-14T12:00:00Z",
        })
      ).toBe("AGUARDANDO_ASSINATURA");

      expect(
        resolveVendaFluxoStatusFromApi({
          id: "vd-d",
          tenantId: "tenant-1",
          tipo: "PLANO",
          status: "FECHADA",
          itens: [],
          subtotal: 10,
          descontoTotal: 0,
          acrescimoTotal: 0,
          total: 10,
          pagamento: {
            formaPagamento: "PIX",
            valorPago: 10,
            status: "PAGO",
          },
          dataCriacao: "2026-03-14T12:00:00Z",
        })
      ).toBe("ATIVO");

      expect(
        resolveVendaFluxoStatusFromApi({
          id: "vd-e",
          tenantId: "tenant-1",
          tipo: "PRODUTO",
          status: "FECHADA",
          itens: [],
          subtotal: 10,
          descontoTotal: 0,
          acrescimoTotal: 0,
          total: 10,
          pagamento: {
            formaPagamento: "PIX",
            valorPago: 10,
            status: "PAGO",
          },
          dataCriacao: "2026-03-14T12:00:00Z",
        })
      ).toBeUndefined();
    } finally {
      restore();
    }
  });

  test("excluirAlunoService exige justificativa e envia payload auditável", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          success: true,
          auditId: "audit-1",
          eventType: "CLIENT_DELETED",
        },
      },
    ]);

    try {
      await expect(
        excluirAlunoService({
          tenantId: "tenant-1",
          id: "al-1",
          justificativa: "   ",
        })
      ).rejects.toThrow("A justificativa é obrigatória.");

      const result = await excluirAlunoService({
        tenantId: "tenant-1",
        id: "al-1",
        justificativa: "Cadastro duplicado confirmado",
        issuedBy: "backoffice",
      });

      expect(result.success).toBe(true);
      expect(result.auditId).toBe("audit-1");
      expect(calls).toHaveLength(1);
      expect(calls[0]?.method).toBe("DELETE");
      expect(calls[0]?.url).toContain("/api/v1/comercial/alunos/al-1");
      expect(calls[0]?.url).toContain("tenantId=tenant-1");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        tenantId: "tenant-1",
        justificativa: "Cadastro duplicado confirmado",
        issuedBy: "backoffice",
      });
    } finally {
      restore();
    }
  });

  test("carrega contexto operacional do cliente com fallback e executa migracao estrutural", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: { message: "Route missing" },
        status: 404,
      },
      {
        body: { message: "Aluno nao encontrado" },
        status: 404,
      },
      {
        body: {
          id: "al-contexto",
          tenantId: "tenant-2",
          nome: "Cliente Multiunidade",
          email: "cliente@academia.local",
          telefone: "11999990000",
          cpf: "55544433322",
          dataNascimento: "1990-01-01",
          sexo: "F",
          status: "ATIVO",
          dataCadastro: "2026-03-14T10:00:00Z",
        },
      },
      {
        body: {
          success: true,
          auditId: "audit-migracao-1",
          message: "Migração concluída",
          tenantOrigemId: "tenant-2",
          tenantOrigemNome: "Unidade Oeste",
          tenantDestinoId: "tenant-3",
          tenantDestinoNome: "Unidade Centro",
          suggestedActiveTenantId: "tenant-3",
          preservarContextoComercial: true,
        },
      },
    ]);

    try {
      const contexto = await getClienteOperationalContextService({
        alunoId: "al-contexto",
        tenantId: "tenant-1",
        tenants: [
          { id: "tenant-1", nome: "Unidade Base" },
          { id: "tenant-2", nome: "Unidade Oeste" },
          { id: "tenant-3", nome: "Unidade Centro" },
        ],
      });

      expect(contexto).toEqual({
        tenantId: "tenant-2",
        tenantName: "Unidade Oeste",
        baseTenantId: "tenant-2",
        baseTenantName: "Unidade Oeste",
        aluno: expect.objectContaining({
          id: "al-contexto",
          tenantId: "tenant-2",
        }),
        eligibleTenants: [
          expect.objectContaining({ tenantId: "tenant-1", eligible: true }),
          expect.objectContaining({ tenantId: "tenant-2", eligible: true }),
          expect.objectContaining({ tenantId: "tenant-3", eligible: true }),
        ],
        blockedTenants: [],
        blocked: false,
      });

      await expect(
        migrarClienteParaUnidadeService({
          tenantId: "tenant-2",
          id: "al-contexto",
          tenantDestinoId: "tenant-3",
          justificativa: "   ",
        })
      ).rejects.toThrow("A justificativa é obrigatória.");

      const migracao = await migrarClienteParaUnidadeService({
        tenantId: "tenant-2",
        id: "al-contexto",
        tenantDestinoId: "tenant-3",
        justificativa: "Unificação operacional da carteira",
        preservarContextoComercial: true,
      });

      expect(migracao.auditId).toBe("audit-migracao-1");
      expect(migracao.suggestedActiveTenantId).toBe("tenant-3");
      expect(calls[0].url).toContain("/api/v1/comercial/clientes/al-contexto/contexto-operacional");
      expect(calls[3].url).toContain("/api/v1/comercial/clientes/al-contexto/migrar-unidade");
      expect(calls[3].body).toContain("\"tenantDestinoId\":\"tenant-3\"");
    } finally {
      restore();
    }
  });
});
