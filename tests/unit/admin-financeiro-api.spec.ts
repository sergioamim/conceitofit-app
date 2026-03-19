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

const envSnapshot = {
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
});

test.afterEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
});

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

test.describe("admin financeiro api", () => {
  test("retorna draft padrão quando a configuração atual de nfse ainda não existe", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          status: 404,
          error: "Not Found",
          path: "/api/v1/administrativo/nfse/configuracao-atual",
        },
        status: 404,
      },
    ]);

    try {
      const loaded = await getNfseConfiguracaoAtualApi({ tenantId: "tenant-404" });

      expect(loaded.id).toBe("nfse-tenant-404");
      expect(loaded.tenantId).toBe("tenant-404");
      expect(loaded.status).toBe("PENDENTE");
      expect(loaded.prefeitura).toBe("");
      expect(loaded.loteInicial).toBe(1);
      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/api/v1/administrativo/nfse/configuracao-atual");
    } finally {
      restore();
    }
  });

  test("propaga erros inesperados ao carregar a configuração atual de nfse", async () => {
    const { restore } = mockFetchWithSequence([
      {
        body: {
          status: 500,
          error: "Internal Server Error",
          message: "Falha ao consultar configuração fiscal",
          path: "/api/v1/administrativo/nfse/configuracao-atual",
        },
        status: 500,
      },
    ]);

    try {
      await expect(getNfseConfiguracaoAtualApi({ tenantId: "tenant-500" })).rejects.toMatchObject({
        name: "ApiRequestError",
        status: 500,
      });
    } finally {
      restore();
    }
  });

  test("normaliza configuracao nfse e usa rotas canônicas", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          tenantId: "tenant-1",
          prefeitura: "Rio",
          codigoTributacaoNacional: "1301",
          codigoNbs: "1.1301.25.00",
          classificacaoTributaria: "SERVICO_TRIBUTAVEL",
          indicadorOperacao: "SERVICO_MUNICIPIO",
          loteInicial: "2",
          aliquotaPadrao: "3.5",
          status: "PENDENTE",
        },
      },
      {
        body: {
          id: "nfse-tenant-1",
          tenantId: "tenant-1",
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
          id: "nfse-tenant-1",
          tenantId: "tenant-1",
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
      const loaded = await getNfseConfiguracaoAtualApi({ tenantId: "tenant-1" });
      expect(loaded.prefeitura).toBe("Rio");
      expect(loaded.codigoTributacaoNacional).toBe("1301");
      expect(loaded.loteInicial).toBe(2);
      expect(loaded.aliquotaPadrao).toBe(3.5);

      const saved = await salvarNfseConfiguracaoAtualApi({
        ...loaded,
        prefeitura: "Rio Atualizado",
        inscricaoMunicipal: "123",
        cnaePrincipal: "9313-1/00",
        serieRps: "S1",
      });
      expect(saved.prefeitura).toBe("Rio Atualizado");

      const validated = await validarNfseConfiguracaoAtualApi({ tenantId: "tenant-1" });
      expect(validated.status).toBe("CONFIGURADA");

      expect(calls).toHaveLength(3);
      expect(calls[0].url).toContain("/api/v1/administrativo/nfse/configuracao-atual");
      expect(calls[1].method).toBe("PUT");
      expect(calls[2].url).toContain("/api/v1/administrativo/nfse/configuracao-atual/validar");
    } finally {
      restore();
    }
  });

  test("lista envelopes e reprocessa agregadores e integrações", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          items: [
            {
              id: "agt-1",
              tenantId: "tenant-1",
              adquirente: "STONE",
              nsu: "0001",
              bandeira: "Visa",
              meioCaptura: "POS",
              clienteNome: "Cliente",
              descricao: "Plano",
              valorBruto: "199",
              taxa: "5",
              valorLiquido: "194",
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
          tenantId: "tenant-1",
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
              tenantId: "tenant-1",
              nome: "Webhook comercial",
              tipo: "WEBHOOK",
              fornecedor: "Hub",
              status: "FALHA",
              filaPendente: "4",
              ocorrencias: [],
            },
          ],
        },
      },
      {
        body: {
          id: "int-1",
          tenantId: "tenant-1",
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
      const agregadores = await listAgregadorTransacoesApi({ tenantId: "tenant-1" });
      expect(agregadores[0].valorLiquido).toBe(194);

      const reprocessedAgregador = await reprocessarAgregadorTransacaoApi({
        tenantId: "tenant-1",
        id: "agt-1",
      });
      expect(reprocessedAgregador.statusRepasse).toBe("LIQUIDADO");

      const integracoes = await listIntegracoesOperacionaisApi({ tenantId: "tenant-1" });
      expect(integracoes[0].filaPendente).toBe(4);

      const reprocessedIntegracao = await reprocessarIntegracaoOperacionalApi({
        tenantId: "tenant-1",
        id: "int-1",
      });
      expect(reprocessedIntegracao.status).toBe("SAUDAVEL");

      expect(calls[0].url).toContain("/api/v1/gerencial/agregadores/transacoes");
      expect(calls[1].url).toContain("/api/v1/gerencial/agregadores/transacoes/agt-1/reprocessar");
      expect(calls[2].url).toContain("/api/v1/administrativo/integracoes-operacionais");
      expect(calls[3].url).toContain("/api/v1/administrativo/integracoes-operacionais/int-1/reprocessar");
    } finally {
      restore();
    }
  });
});
