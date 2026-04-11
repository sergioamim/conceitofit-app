"use client";

import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BalancoTable } from "./balanco-table";
import { FluxoTable } from "./fluxo-table";
import { getBusinessMonthRange } from "@/lib/business-date";
import { getBalancoPatrimonialApi, getFluxoCaixaApi } from "@/lib/api/financial";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { BalancoPatrimonial, FluxoCaixa } from "@/lib/types";
import { ListErrorState } from "@/components/shared/list-states";

type ReportType = "balanco" | "fluxo-caixa";

interface RelatoriosContentProps {
  initialBalanco: BalancoPatrimonial | null;
  initialFluxo: FluxoCaixa | null;
}

export function RelatoriosContent({ initialBalanco, initialFluxo }: RelatoriosContentProps) {
  const tenantContext = useTenantContext();
  const range = getBusinessMonthRange();
  const [reportType, setReportType] = useState<ReportType>("balanco");
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balanco, setBalanco] = useState<BalancoPatrimonial | null>(initialBalanco);
  const [fluxo, setFluxo] = useState<FluxoCaixa | null>(initialFluxo);

  const handleGenerate = useCallback(async () => {
    const tenantId = tenantContext.tenantId;
    if (!tenantId) {
      setError("Tenant ID não disponível");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (reportType === "balanco") {
        const data = await getBalancoPatrimonialApi({ tenantId, dataBase: endDate });
        setBalanco(data);
        setFluxo(null);
      } else {
        const data = await getFluxoCaixaApi({ tenantId, startDate, endDate });
        setFluxo(data);
        setBalanco(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar relatório";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [tenantContext.tenantId, reportType, startDate, endDate]);

  const handleRetry = useCallback(() => {
    void handleGenerate();
  }, [handleGenerate]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contabilidade</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">Relatorios Contabeis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Balanco patrimonial e fluxo de caixa.</p>
      </div>

      {error ? <ListErrorState error={error} onRetry={handleRetry} /> : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relatorio</label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="balanco">Balanco Patrimonial</SelectItem>
                <SelectItem value="fluxo-caixa">Fluxo de Caixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">De</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ate</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-border bg-secondary" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              <FileText className="mr-2 size-4" />
              {loading ? "Gerando..." : "Gerar relatorio"}
            </Button>
          </div>
        </div>
      </div>

      {balanco && reportType === "balanco" && <BalancoTable balanco={balanco} />}
      {fluxo && reportType === "fluxo-caixa" && <FluxoTable fluxo={fluxo} />}

      {!balanco && !fluxo && !loading && !error ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          Selecione o tipo de relatorio e clique em &quot;Gerar relatorio&quot; para visualizar.
        </div>
      ) : null}
    </div>
  );
}
