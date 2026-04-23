"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/formatters";
import { VendaWorkspace } from "../hooks/use-venda-workspace";

interface PlanoDetailsProps {
  workspace: VendaWorkspace;
}

export function PlanoDetails({ workspace }: PlanoDetailsProps) {
  const {
    tipoVenda,
    selectedPlano,
    parcelasAnuidade,
    refreshPlanoItems,
    dataInicioPlano,
    setDataInicioPlano,
    conveniosPlano,
    convenioPlanoId,
    setConvenioPlanoId,
    renovacaoAutomaticaPlano,
    setRenovacaoAutomaticaPlano,
  } = workspace;

  if (tipoVenda !== "PLANO") return null;

  return (
    <div className="mt-3 space-y-3">
      {selectedPlano?.cobraAnuidade && Number(selectedPlano.valorAnuidade ?? 0) > 0 && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-secondary/20 p-3 md:grid-cols-[1fr_180px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Anuidade do plano</p>
            <p className="text-sm text-muted-foreground">
              Valor {formatBRL(Number(selectedPlano.valorAnuidade ?? 0))} pago em até{" "}
              {Math.max(1, Number(selectedPlano.parcelasMaxAnuidade ?? 1))}x.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parcelas da anuidade</label>
            <Select
              value={parcelasAnuidade}
              onValueChange={(value) => {
                refreshPlanoItems(Math.max(1, parseInt(value, 10) || 1));
              }}
            >
              <SelectTrigger className="w-full border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {Array.from({ length: Math.max(1, Number(selectedPlano.parcelasMaxAnuidade ?? 1)) }).map((_, idx) => {
                  const parcelas = idx + 1;
                  const parcelaValor = Number(selectedPlano.valorAnuidade ?? 0) / parcelas;
                  return (
                    <SelectItem key={parcelas} value={String(parcelas)}>
                      {parcelas}x de {formatBRL(parcelaValor)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {selectedPlano && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-secondary/20 p-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="venda-plano-data-inicio" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Início da contratação
            </label>
            <Input
              id="venda-plano-data-inicio"
              type="date"
              value={dataInicioPlano}
              onChange={(e) => setDataInicioPlano(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          {conveniosPlano.length > 0 ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Convênio
              </label>
              <Select value={convenioPlanoId} onValueChange={setConvenioPlanoId}>
                <SelectTrigger className="w-full border-border bg-secondary">
                  <SelectValue placeholder="Sem convênio" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="__SEM_CONVENIO__">Sem convênio</SelectItem>
                  {conveniosPlano.map((convenio) => (
                    <SelectItem key={convenio.id} value={convenio.id}>
                      {convenio.nome} ({convenio.descontoPercentual}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
              Sem convênio ativo vinculado a este plano.
            </div>
          )}
          <div className="md:col-span-2 flex items-start gap-2 rounded-md border border-border/70 bg-card/40 px-3 py-2 text-sm">
            <input
              id="venda-plano-renovacao"
              type="checkbox"
              checked={renovacaoAutomaticaPlano}
              disabled={!selectedPlano.permiteRenovacaoAutomatica}
              onChange={(e) => setRenovacaoAutomaticaPlano(e.target.checked)}
            />
            <label htmlFor="venda-plano-renovacao" className="cursor-pointer text-muted-foreground">
              Renovação automática {selectedPlano.permiteRenovacaoAutomatica ? "permitida" : "indisponível"} ·
              assinatura {selectedPlano.contratoAssinatura.toLowerCase()}
              {selectedPlano.permiteCobrancaRecorrente && selectedPlano.diaCobrancaPadrao?.length
                ? ` · cobranca recorrente (dias ${selectedPlano.diaCobrancaPadrao.join(", ")})`
                : selectedPlano.permiteCobrancaRecorrente
                  ? " · cobranca recorrente (dia livre)"
                  : " · cobranca recorrente indisponivel"}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
