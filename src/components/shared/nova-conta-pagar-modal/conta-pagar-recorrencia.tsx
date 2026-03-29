"use client";

import type { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NovaContaFormState } from "./conta-pagar-types";

type ContaPagarRecorrenciaProps = {
  form: NovaContaFormState;
  setForm: Dispatch<SetStateAction<NovaContaFormState>>;
  diaVencimentoSugestao: number;
};

export function ContaPagarRecorrencia({
  form,
  setForm,
  diaVencimentoSugestao,
}: ContaPagarRecorrenciaProps) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.recorrente}
          onChange={(e) =>
            setForm((v) => ({
              ...v,
              recorrente: e.target.checked,
              regime: e.target.checked ? "FIXA" : v.regime,
              recorrenciaDiaDoMes:
                v.recorrenciaDiaDoMes || String(diaVencimentoSugestao),
              recorrenciaDataInicial: v.recorrenciaDataInicial || v.dataVencimento,
            }))
          }
        />
        Conta recorrente
      </label>

      {form.recorrente && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de recorrência
            </label>
            <Select
              value={form.recorrenciaTipo}
              onValueChange={(value) =>
                setForm((v) => ({
                  ...v,
                  recorrenciaTipo: value as "MENSAL" | "INTERVALO_DIAS",
                }))
              }
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="MENSAL">Mensal</SelectItem>
                <SelectItem value="INTERVALO_DIAS">A cada X dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.recorrenciaTipo === "INTERVALO_DIAS" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                A cada X dias
              </label>
              <Input
                type="number"
                min={1}
                value={form.recorrenciaIntervaloDias}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    recorrenciaIntervaloDias: e.target.value,
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>
          )}

          {form.recorrenciaTipo === "MENSAL" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dia do mês
              </label>
              <Input
                type="number"
                min={1}
                max={31}
                value={form.recorrenciaDiaDoMes || String(diaVencimentoSugestao)}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    recorrenciaDiaDoMes: e.target.value,
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data inicial (âncora)
            </label>
            <Input
              type="date"
              value={form.recorrenciaDataInicial}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  recorrenciaDataInicial: e.target.value,
                }))
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Término da recorrência
            </label>
            <Select
              value={form.recorrenciaTermino}
              onValueChange={(value) =>
                setForm((v) => ({
                  ...v,
                  recorrenciaTermino: value as "SEM_FIM" | "EM_DATA" | "APOS_OCORRENCIAS",
                }))
              }
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="SEM_FIM">Sem fim</SelectItem>
                <SelectItem value="EM_DATA">Em data</SelectItem>
                <SelectItem value="APOS_OCORRENCIAS">Após N ocorrências</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.recorrenciaTermino === "EM_DATA" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data fim
              </label>
              <Input
                type="date"
                value={form.recorrenciaDataFim}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    recorrenciaDataFim: e.target.value,
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>
          )}

          {form.recorrenciaTermino === "APOS_OCORRENCIAS" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Qtd. ocorrências
              </label>
              <Input
                type="number"
                min={1}
                value={form.recorrenciaNumeroOcorrencias}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    recorrenciaNumeroOcorrencias: e.target.value,
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>
          )}

          <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.criarLancamentoInicialAgora}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  criarLancamentoInicialAgora: e.target.checked,
                }))
              }
            />
            Criar lançamento inicial agora
          </label>
        </div>
      )}
    </div>
  );
}
