import { z } from "zod";

export type ClienteAgregadorTipo = "WELLHUB" | "TOTALPASS";

export interface ClienteListFilters {
  comPendenciaFinanceira?: boolean;
  comAgregador?: boolean;
  tipoAgregador?: ClienteAgregadorTipo;
  comResponsavel?: boolean;
  semPlanoAtivo?: boolean;
  acessoBloqueado?: boolean;
}

export const clienteAdvancedFiltersSchema = z.object({
  financeiro: z.enum(["TODOS", "COM_PENDENCIA", "SEM_PENDENCIA"]),
  agregador: z.enum(["TODOS", "COM_AGREGADOR", "WELLHUB", "TOTALPASS"]),
  responsavel: z.enum(["TODOS", "COM_RESPONSAVEL", "SEM_RESPONSAVEL"]),
  acesso: z.enum(["TODOS", "BLOQUEADO", "LIBERADO"]),
});

export type ClienteAdvancedFiltersFormValues = z.infer<
  typeof clienteAdvancedFiltersSchema
>;

const DEFAULT_FORM_VALUES: ClienteAdvancedFiltersFormValues = {
  financeiro: "TODOS",
  agregador: "TODOS",
  responsavel: "TODOS",
  acesso: "TODOS",
};

type SearchParamsLike = {
  get(name: string): string | null;
};

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseAgregadorTipo(value: string | null): ClienteAgregadorTipo | undefined {
  if (value === "WELLHUB" || value === "TOTALPASS") return value;
  return undefined;
}

export function parseClienteListFilters(
  searchParams: SearchParamsLike,
): ClienteListFilters {
  return {
    comPendenciaFinanceira: parseBooleanParam(
      searchParams.get("comPendenciaFinanceira"),
    ),
    comAgregador: parseBooleanParam(searchParams.get("comAgregador")),
    tipoAgregador: parseAgregadorTipo(searchParams.get("tipoAgregador")),
    comResponsavel: parseBooleanParam(searchParams.get("comResponsavel")),
    semPlanoAtivo: parseBooleanParam(searchParams.get("semPlanoAtivo")),
    acessoBloqueado: parseBooleanParam(searchParams.get("acessoBloqueado")),
  };
}

export function countClienteListFilters(filters: ClienteListFilters): number {
  const agregadorCount =
    filters.tipoAgregador !== undefined || filters.comAgregador !== undefined ? 1 : 0;

  return [
    filters.comPendenciaFinanceira,
    filters.comResponsavel,
    filters.acessoBloqueado,
  ].filter((value) => value !== undefined).length + agregadorCount;
}

export function clienteListFiltersToFormValues(
  filters: ClienteListFilters,
): ClienteAdvancedFiltersFormValues {
  return {
    financeiro:
      filters.comPendenciaFinanceira === true
        ? "COM_PENDENCIA"
        : filters.comPendenciaFinanceira === false
          ? "SEM_PENDENCIA"
          : "TODOS",
    agregador:
      filters.tipoAgregador ??
      (filters.comAgregador === true
        ? "COM_AGREGADOR"
        : "TODOS"),
    responsavel:
      filters.comResponsavel === true
        ? "COM_RESPONSAVEL"
        : filters.comResponsavel === false
          ? "SEM_RESPONSAVEL"
          : "TODOS",
    acesso:
      filters.acessoBloqueado === true
        ? "BLOQUEADO"
        : filters.acessoBloqueado === false
          ? "LIBERADO"
          : "TODOS",
  };
}

export function clienteAdvancedFormValuesToQueryParams(
  values: ClienteAdvancedFiltersFormValues,
): Record<string, string | null> {
  return {
    comPendenciaFinanceira:
      values.financeiro === "COM_PENDENCIA"
        ? "true"
        : values.financeiro === "SEM_PENDENCIA"
          ? "false"
          : null,
    comAgregador:
      values.agregador === "COM_AGREGADOR" ||
      values.agregador === "WELLHUB" ||
      values.agregador === "TOTALPASS"
        ? "true"
        : null,
    tipoAgregador:
      values.agregador === "WELLHUB" || values.agregador === "TOTALPASS"
        ? values.agregador
        : null,
    comResponsavel:
      values.responsavel === "COM_RESPONSAVEL"
        ? "true"
        : values.responsavel === "SEM_RESPONSAVEL"
          ? "false"
          : null,
    acessoBloqueado:
      values.acesso === "BLOQUEADO"
        ? "true"
        : values.acesso === "LIBERADO"
          ? "false"
          : null,
  };
}

export function getDefaultClienteAdvancedFilterValues(): ClienteAdvancedFiltersFormValues {
  return DEFAULT_FORM_VALUES;
}
