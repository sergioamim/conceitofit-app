import { expect, test } from "@playwright/test";
import {
  getNfseConfiguracaoAtualApi,
  listAgregadorTransacoesApi,
  listIntegracoesOperacionaisApi,
  reprocessarAgregadorTransacaoApi,
  reprocessarIntegracaoOperacionalApi,
  salvarNfseConfiguracaoAtualApi,
  validarNfseConfiguracaoAtualApi,
} from "../../src/lib/api/admin-financeiro";
import { emitirNfseEmLoteApi, emitirNfsePagamentoApi } from "../../src/lib/api/pagamentos";

const TENANT_ID = "tn-admin-financeiro";

const envSnapshot = {
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

function mockFetchWithSequence(
  responses: Array<{
    body: unknown;
    status?: number;
  }>
) {
  const calls: Array<{ url: string; method: string; body?: string | null }> = [];
  const previousFetch = global.fetch;

  global.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const next = responses[calls.length];
    if (!next) {
      throw new Error(`Unexpected fetch ${String(input)}`);
    }

    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body ? String(init.body) : null,
    });

    return Promise.resolve(
      new Response(JSON.stringify(next.body), {
        status: next.status ?? 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  }) as typeof global.fetch;

  return {
    calls,
    restore() {
      global.fetch = previousFetch;
    },
  };
}

test.describe("admin financeiro backend-only bridge", () => {
  test.beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  });

  test.afterEach(() => {
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
  });

  test("wrappers fiscais delegam para a API e preservam o payload canônico", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          id: `nfse-${TENANT_ID}`,
          tenantId: TENANT_ID,
          prefeitura: "Rio de Janeiro",
          inscricaoMunicipal: "123",
          cnaePrincipal: "9313-1/00",
          codigoTributacaoNacional: "1301",
          codigoNbs: "1.1301.25.00",
          classificacaoTributaria: "SERVICO_TRIBUTAVEL",
          consumidorFinal: true,
          indicadorOperacao: "SERVICO_MUNICIPIO",
          serieRps: "S1",
          loteInicial: 2,
          aliquotaPadrao: 3.5,
          provedor: "GINFES",
          ambiente: "HOMOLOGACAO",
          regimeTributario: "SIMPLES_NACIONAL",
          emissaoAutomatica: true,
          status: "PENDENTE",
        },
      },
      {
        body: {
          id: `nfse-${TENANT_ID}`,
          tenantId: TENANT_ID,
          prefeitura: "Rio Atualizado",
          inscricaoMunicipal: "123",
          cnaePrincipal: "9313-1/00",
          codigoTributacaoNacional: "1301",
          codigoNbs: "1.1301.25.00",
          classificacaoTributaria: "SERVICO_TRIBUTAVEL",
          consumidorFinal: true,
          indicadorOperacao: "SERVICO_MUNICIPIO",
          serieRps: "S1",
          loteInicial: 2,
          aliquotaPadrao: 3.5,
          provedor: "GINFES",
          ambiente: "HOMOLOGACAO",
          regimeTributario: "SIMPLES_NACIONAL",
          emissaoAutomatica: true,
          status: "PENDENTE",
        },
      },
      {
        body: {
          id: `nfse-${TENANT_ID}`,
          tenantId: TENANT_ID,
          prefeitura: "Rio Atualizado",
          inscricaoMunicipal: "123",
          cnaePrincipal: "9313-1/00",
          codigoTributacaoNacional: "1301",
          codigoNbs: "1.1301.25.00",
          classificacaoTributaria: "SERVICO_TRIBUTAVEL",
          consumidorFinal: true,
          indicadorOperacao: "SERVICO_MUNICIPIO",
          serieRps: "S1",
          loteInicial: 2,
          aliquotaPadrao: 3.5,
          provedor: "GINFES",
          ambiente: "HOMOLOGACAO",
          regimeTributario: "SIMPLES_NACIONAL",
          emissaoAutomatica: true,
          status: "CONFIGURADA",
        },
      },
    ]);

    try {
      const listed = await getNfseConfiguracaoAtualApi({ tenantId: TENANT_ID });
      expect(listed.prefeitura).toBe("Rio de Janeiro");

      const saved = await salvarNfseConfiguracaoAtualApi({
        ...listed,
        prefeitura: "Rio Atualizado",
      });
      expect(saved.prefeitura).toBe("Rio Atualizado");

      const validated = await validarNfseConfiguracaoAtualApi({ tenantId: TENANT_ID });
      expect(validated.status).toBe("CONFIGURADA");

      expect(calls).toHaveLength(3);
      expect(calls[0].url).toContain("/api/v1/administrativo/nfse/configuracao-atual");
      expect(calls[1].method).toBe("PUT");
      expect(calls[2].url).toContain("/api/v1/administrativo/nfse/configuracao-atual/validar");

      const saveBody = JSON.parse(calls[1].body ?? "{}") as Record<string, unknown>;
      expect(saveBody.prefeitura).toBe("Rio Atualizado");
      expect(saveBody.codigoTributacaoNacional).toBe("1301");
      expect(saveBody.codigoNbs).toBe("1.1301.25.00");
      expect(saveBody.provedor).toBe("GINFES");
      expect(saveBody.ambiente).toBe("HOMOLOGACAO");
      expect(saveBody.regimeTributario).toBe("SIMPLES_NACIONAL");
    } finally {
      restore();
    }
  });

  test("wrappers de agregadores e integrações usam somente os endpoints canônicos", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          items: [
            {
              id: "agt-1",
              tenantId: TENANT_ID,
              adquirente: "STONE",
              nsu: "0001",
              bandeira: "Visa",
              meioCaptura: "POS",
              clienteNome: "Cliente",
              descricao: "Plano",
              valorBruto: 199,
              taxa: 5,
              valorLiquido: 194,
              parcelas: 1,
              dataTransacao: "2026-03-12T10:00:00",
              dataPrevistaRepasse: "2026-03-13",
              statusTransacao: "CAPTURADA",
              statusRepasse: "DIVERGENTE",
              statusConciliacao: "DIVERGENTE",
            },
          ],
        },
      },
      {
        body: {
          id: "agt-1",
          tenantId: TENANT_ID,
          adquirente: "STONE",
          nsu: "0001",
          bandeira: "Visa",
          meioCaptura: "POS",
          clienteNome: "Cliente",
          descricao: "Plano",
          valorBruto: 199,
          taxa: 5,
          valorLiquido: 194,
          parcelas: 1,
          dataTransacao: "2026-03-12T10:00:00",
          dataPrevistaRepasse: "2026-03-13",
          statusTransacao: "CAPTURADA",
          statusRepasse: "LIQUIDADO",
          statusConciliacao: "CONCILIADA",
        },
      },
      {
        body: {
          items: [
            {
              id: "int-1",
              tenantId: TENANT_ID,
              nome: "Webhook comercial",
              tipo: "WEBHOOK",
              fornecedor: "Hub",
              status: "FALHA",
              filaPendente: 4,
              ocorrencias: [],
            },
          ],
        },
      },
      {
        body: {
          id: "int-1",
          tenantId: TENANT_ID,
          nome: "Webhook comercial",
          tipo: "WEBHOOK",
          fornecedor: "Hub",
          status: "SAUDAVEL",
          filaPendente: 0,
          ocorrencias: [],
        },
      },
    ]);

    try {
      const agregadores = await listAgregadorTransacoesApi({ tenantId: TENANT_ID });
      expect(agregadores[0]?.statusRepasse).toBe("DIVERGENTE");

      const agregadorAtualizado = await reprocessarAgregadorTransacaoApi({
        tenantId: TENANT_ID,
        id: "agt-1",
      });
      expect(agregadorAtualizado.statusRepasse).toBe("LIQUIDADO");

      const integracoes = await listIntegracoesOperacionaisApi({
        tenantId: TENANT_ID,
        includeAllTenants: false,
      });
      expect(integracoes[0]?.filaPendente).toBe(4);

      const integracaoAtualizada = await reprocessarIntegracaoOperacionalApi({
        tenantId: TENANT_ID,
        id: "int-1",
      });
      expect(integracaoAtualizada.status).toBe("SAUDAVEL");

      expect(calls).toHaveLength(4);
      expect(calls[0].url).toContain("/api/v1/gerencial/agregadores/transacoes");
      expect(calls[1].url).toContain("/api/v1/gerencial/agregadores/transacoes/agt-1/reprocessar");
      expect(calls[2].url).toContain("/api/v1/administrativo/integracoes-operacionais");
      expect(calls[3].url).toContain("/api/v1/administrativo/integracoes-operacionais/int-1/reprocessar");
    } finally {
      restore();
    }
  });

  test("emissão de nfse por pagamento não recai mais para marcação local quando o backend responde 404", async () => {
    const pagamentoId = "pg-404";
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          message: "endpoint ausente",
        },
        status: 404,
      },
    ]);

    try {
      await expect(
        emitirNfsePagamentoApi({ tenantId: TENANT_ID, id: pagamentoId })
      ).rejects.toThrow("Backend ainda não expõe emissão de NFSe por pagamento neste ambiente.");

      expect(calls[0].url).toContain(`/api/v1/comercial/pagamentos/${pagamentoId}/nfse`);
    } finally {
      restore();
    }
  });

  test("emissão em lote propaga mensagem fiscal bloqueante do backend", async () => {
    const { restore } = mockFetchWithSequence([
      {
        body: {
          message: "Emissão em lote bloqueada porque a configuração fiscal da unidade está incompleta.",
          fieldErrors: {
            codigoTributacaoNacional: "Informe o código de tributação nacional antes de emitir NFSe.",
          },
        },
        status: 422,
      },
    ]);

    try {
      await expect(
        emitirNfseEmLoteApi({ tenantId: TENANT_ID, ids: ["pg-1", "pg-2"] })
      ).rejects.toThrow("Informe o código de tributação nacional antes de emitir NFSe.");
    } finally {
      restore();
    }
  });
});
