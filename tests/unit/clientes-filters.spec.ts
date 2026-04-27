import { describe, expect, it } from "vitest";
import {
  clienteAdvancedFormValuesToQueryParams,
  clienteListFiltersToFormValues,
  countClienteListFilters,
  parseClienteListFilters,
} from "@/lib/tenant/comercial/clientes-filters";

describe("clientes-filters", () => {
  it("parseia filtros avançados a partir da URL", () => {
    const params = new URLSearchParams({
      comPendenciaFinanceira: "true",
      comAgregador: "true",
      tipoAgregador: "WELLHUB",
      comResponsavel: "false",
      semPlanoAtivo: "true",
      acessoBloqueado: "false",
    });

    expect(parseClienteListFilters(params)).toEqual({
      comPendenciaFinanceira: true,
      comAgregador: true,
      tipoAgregador: "WELLHUB",
      comResponsavel: false,
      semPlanoAtivo: true,
      acessoBloqueado: false,
    });
  });

  it("converte filtros atuais para valores do formulário", () => {
    expect(
      clienteListFiltersToFormValues({
        comPendenciaFinanceira: true,
        tipoAgregador: "TOTALPASS",
        comResponsavel: true,
      }),
    ).toEqual({
      financeiro: "COM_PENDENCIA",
      agregador: "TOTALPASS",
      responsavel: "COM_RESPONSAVEL",
      acesso: "TODOS",
    });
  });

  it("converte formulário em query params do backend", () => {
    expect(
      clienteAdvancedFormValuesToQueryParams({
        financeiro: "SEM_PENDENCIA",
        agregador: "TOTALPASS",
        responsavel: "COM_RESPONSAVEL",
        acesso: "BLOQUEADO",
      }),
    ).toEqual({
      comPendenciaFinanceira: "false",
      comAgregador: "true",
      tipoAgregador: "TOTALPASS",
      comResponsavel: "true",
      acessoBloqueado: "true",
    });
  });

  it("conta quantos filtros avançados estão ativos", () => {
    expect(
      countClienteListFilters({
        comPendenciaFinanceira: true,
        tipoAgregador: "WELLHUB",
        acessoBloqueado: false,
      }),
    ).toBe(3);
  });

  it("não duplica a contagem quando agregador específico já implica comAgregador=true", () => {
    expect(
      countClienteListFilters({
        comAgregador: true,
        tipoAgregador: "WELLHUB",
      }),
    ).toBe(1);
  });

  it("ignora o filtro legado de plano no formulário avançado e na contagem", () => {
    const filters = parseClienteListFilters(
      new URLSearchParams({ semPlanoAtivo: "true" }),
    );

    expect(filters.semPlanoAtivo).toBe(true);
    expect(clienteListFiltersToFormValues(filters)).toEqual({
      financeiro: "TODOS",
      agregador: "TODOS",
      responsavel: "TODOS",
      acesso: "TODOS",
    });
    expect(countClienteListFilters(filters)).toBe(0);
  });
});
