import { afterEach, describe, expect, it, vi } from "vitest";
import { getNfseConfiguracaoAtualApi } from "@/lib/api/financeiro-operacional";
import * as http from "@/lib/api/http";

/**
 * Regression tests para a migração incremental do endpoint NFS-e
 * configuração (Task #556). Garante que:
 *
 * 1. Se o caller passar unidadeId, usa o path novo
 *    /api/v1/nfse/configuracoes/base com tenantId + unidadeId.
 * 2. Se não passar, mantém o path legado com tenantId só.
 * 3. 404 em qualquer path vira config vazia (fallback).
 * 4. 500 no path novo (semantic "sem config") vira config vazia.
 * 5. 500 no path legado continua sendo erro (throw).
 */
describe("getNfseConfiguracaoAtualApi — Task #556", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usa path novo /nfse/configuracoes/base quando unidadeId é fornecido", async () => {
    const spy = vi
      .spyOn(http, "apiRequest")
      .mockResolvedValue({ tenantId: "t1", ativo: true } as never);

    await getNfseConfiguracaoAtualApi({
      tenantId: "tenant-x",
      unidadeId: "unidade-y",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const call = spy.mock.calls[0][0] as {
      path: string;
      query?: Record<string, unknown>;
    };
    expect(call.path).toBe("/api/v1/nfse/configuracoes/base");
    expect(call.query).toEqual({ tenantId: "tenant-x", unidadeId: "unidade-y" });
  });

  it("usa path legado quando unidadeId ausente (compat)", async () => {
    const spy = vi
      .spyOn(http, "apiRequest")
      .mockResolvedValue(null as never);

    await getNfseConfiguracaoAtualApi({ tenantId: "tenant-x" });

    const call = spy.mock.calls[0][0] as {
      path: string;
      query?: Record<string, unknown>;
    };
    expect(call.path).toBe("/api/v1/administrativo/nfse/configuracao-atual");
    expect(call.query).toEqual({ tenantId: "tenant-x" });
  });

  it("404 no path legado retorna config vazia (fallback existente)", async () => {
    const err = new http.ApiRequestError({
      status: 404,
      message: "not found",
    });
    vi.spyOn(http, "apiRequest").mockRejectedValue(err);

    const result = await getNfseConfiguracaoAtualApi({ tenantId: "tenant-x" });
    expect(result.tenantId).toBe("tenant-x");
    // normalizeNfseConfiguracao gera id derivado "nfse-{tenantId}" para
    // config vazia. O importante é que não lançou erro.
    expect(result).toBeDefined();
  });

  it("404 no path novo também retorna config vazia", async () => {
    const err = new http.ApiRequestError({
      status: 404,
      message: "not found",
    });
    vi.spyOn(http, "apiRequest").mockRejectedValue(err);

    const result = await getNfseConfiguracaoAtualApi({
      tenantId: "tenant-x",
      unidadeId: "unidade-y",
    });
    expect(result.tenantId).toBe("tenant-x");
  });

  it("500 no path novo é tratado como 'sem config ativa' (comportamento BE)", async () => {
    const err = new http.ApiRequestError({
      status: 500,
      message: "Nenhuma configuração ativa de NFSe encontrada",
    });
    vi.spyOn(http, "apiRequest").mockRejectedValue(err);

    const result = await getNfseConfiguracaoAtualApi({
      tenantId: "tenant-x",
      unidadeId: "unidade-y",
    });
    expect(result.tenantId).toBe("tenant-x");
  });

  it("500 no path legado continua sendo erro (não mascara bugs)", async () => {
    const err = new http.ApiRequestError({
      status: 500,
      message: "unexpected server error",
    });
    vi.spyOn(http, "apiRequest").mockRejectedValue(err);

    await expect(
      getNfseConfiguracaoAtualApi({ tenantId: "tenant-x" }),
    ).rejects.toThrow();
  });
});
