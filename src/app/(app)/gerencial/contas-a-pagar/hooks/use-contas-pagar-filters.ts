"use client";

import { useMemo, useState } from "react";
import { getBusinessMonthRange } from "@/lib/business-date";
import { isContaPagarEmAberto } from "@/lib/domain/status-helpers";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import type {
  CategoriaContaPagar,
  ContaPagar,
  RegraRecorrenciaContaPagar,
  StatusContaPagar,
  TipoContaPagar,
} from "@/lib/types";
import { contaTotal } from "./use-contas-pagar-workspace";

export type StatusFiltro = WithFilterAll<"EM_ABERTO" | StatusContaPagar>;
export type CategoriaFiltro = "TODAS" | CategoriaContaPagar;
export type TipoFiltro = WithFilterAll<string>;
export type OrigemFiltro = "TODAS" | "MANUAL" | "RECORRENTE";

export function useContasPagarFilters(input: {
  contas: ContaPagar[];
  regrasRecorrencia: RegraRecorrenciaContaPagar[];
  tipoContaMap: Map<string, TipoContaPagar>;
}) {
  const { contas, regrasRecorrencia, tipoContaMap } = input;
  const range = getBusinessMonthRange();

  const [status, setStatus] = useState<StatusFiltro>("EM_ABERTO");
  const [categoria, setCategoria] = useState<CategoriaFiltro>("TODAS");
  const [tipoContaFiltro, setTipoContaFiltro] = useState<TipoFiltro>(FILTER_ALL);
  const [origemFiltro, setOrigemFiltro] = useState<OrigemFiltro>("TODAS");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contas.filter((conta) => {
      const inRange = conta.dataVencimento >= startDate && conta.dataVencimento <= endDate;
      if (!inRange) return false;

      if (status === "EM_ABERTO") {
        if (!isContaPagarEmAberto(conta.status)) return false;
      } else if (status !== FILTER_ALL && conta.status !== status) {
        return false;
      }

      if (categoria !== "TODAS" && conta.categoria !== categoria) return false;
      if (tipoContaFiltro !== FILTER_ALL && conta.tipoContaId !== tipoContaFiltro) return false;
      if (origemFiltro !== "TODAS" && (conta.origemLancamento ?? "MANUAL") !== origemFiltro) return false;

      if (!term) return true;
      const tipoNome = conta.tipoContaId ? tipoContaMap.get(conta.tipoContaId)?.nome ?? "" : "";
      return (
        conta.fornecedor.toLowerCase().includes(term) ||
        conta.descricao.toLowerCase().includes(term) ||
        (conta.centroCusto ?? "").toLowerCase().includes(term) ||
        (conta.documentoFornecedor ?? "").toLowerCase().includes(term) ||
        tipoNome.toLowerCase().includes(term)
      );
    });
  }, [categoria, contas, endDate, origemFiltro, search, startDate, status, tipoContaFiltro, tipoContaMap]);

  const resumo = useMemo(() => {
    const previstas = filtered.filter((c) => c.status !== "CANCELADA").reduce((s, c) => s + contaTotal(c), 0);
    const pagas = filtered.filter((c) => c.status === "PAGA").reduce((s, c) => s + Number(c.valorPago ?? contaTotal(c)), 0);
    const emAberto = filtered.filter((c) => isContaPagarEmAberto(c.status)).reduce((s, c) => s + contaTotal(c), 0);
    const vencidas = filtered.filter((c) => c.status === "VENCIDA").reduce((s, c) => s + contaTotal(c), 0);
    return { previstas, pagas, emAberto, vencidas };
  }, [filtered]);

  const resumoRecorrencia = useMemo(() => {
    const ativa = regrasRecorrencia.filter((r) => r.status === "ATIVA").length;
    const pausada = regrasRecorrencia.filter((r) => r.status === "PAUSADA").length;
    const cancelada = regrasRecorrencia.filter((r) => r.status === "CANCELADA").length;
    return { total: regrasRecorrencia.length, ativa, pausada, cancelada };
  }, [regrasRecorrencia]);

  return {
    status, setStatus,
    categoria, setCategoria,
    tipoContaFiltro, setTipoContaFiltro,
    origemFiltro, setOrigemFiltro,
    search, setSearch,
    startDate, setStartDate,
    endDate, setEndDate,
    filtered,
    resumo,
    resumoRecorrencia,
    range,
  };
}
