"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listContasPagarApi,
  listRegrasRecorrenciaContaPagarApi,
} from "@/lib/api/financeiro-gerencial";
import { listFormasPagamentoApi } from "@/lib/api/formas-pagamento";
import { listTiposContaPagarApi } from "@/lib/api/tipos-conta";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type {
  ContaPagar,
  FormaPagamento,
  RegraRecorrenciaContaPagar,
  TipoContaPagar,
} from "@/lib/types";

export function useContasPagarData() {
  const tenantContext = useTenantContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [tiposConta, setTiposConta] = useState<TipoContaPagar[]>([]);
  const [regrasRecorrencia, setRegrasRecorrencia] = useState<RegraRecorrenciaContaPagar[]>([]);

  const load = useCallback(async () => {
    if (!tenantContext.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [contasData, formasData, tiposData, regrasData] = await Promise.all([
        listContasPagarApi({ tenantId: tenantContext.tenantId }),
        listFormasPagamentoApi({ tenantId: tenantContext.tenantId, apenasAtivas: false }),
        listTiposContaPagarApi({ tenantId: tenantContext.tenantId, apenasAtivos: false }),
        listRegrasRecorrenciaContaPagarApi({ tenantId: tenantContext.tenantId, status: "TODAS" }),
      ]);
      setContas(contasData);
      setFormasPagamento(formasData);
      setTiposConta(tiposData);
      setRegrasRecorrencia(regrasData);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantContext.tenantId]);

  useEffect(() => {
    if (tenantContext.tenantResolved && tenantContext.tenantId) {
      void load();
    }
  }, [load, tenantContext.tenantId, tenantContext.tenantResolved]);

  const tipoContaMap = useMemo(
    () => new Map(tiposConta.map((item) => [item.id, item])),
    [tiposConta],
  );

  const tiposAtivos = useMemo(
    () => tiposConta.filter((tipo) => tipo.ativo),
    [tiposConta],
  );

  const formasPagamentoUnicas = useMemo(() => {
    const seen = new Set<string>();
    return formasPagamento.filter((forma) => {
      if (seen.has(forma.tipo)) return false;
      seen.add(forma.tipo);
      return true;
    });
  }, [formasPagamento]);

  return {
    tenantId: tenantContext.tenantId,
    loading,
    error,
    setError,
    contas,
    formasPagamento,
    tiposConta,
    regrasRecorrencia,
    tipoContaMap,
    tiposAtivos,
    formasPagamentoUnicas,
    load,
  };
}
