"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContaPagarFormValues } from "./conta-pagar-schema";

type ContaPagarRecorrenciaProps = {
  diaVencimentoSugestao: number;
};

export function ContaPagarRecorrencia({
  diaVencimentoSugestao,
}: ContaPagarRecorrenciaProps) {
  const { register, control, watch, setValue } = useFormContext<ContaPagarFormValues>();
  const recorrente = watch("recorrente");
  const recorrenciaTipo = watch("recorrenciaTipo");
  const recorrenciaTermino = watch("recorrenciaTermino");

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={recorrente}
          onChange={(e) => {
            setValue("recorrente", e.target.checked);
            if (e.target.checked) {
              setValue("regime", "FIXA");
              if (!watch("recorrenciaDiaDoMes")) {
                setValue("recorrenciaDiaDoMes", String(diaVencimentoSugestao));
              }
              if (!watch("recorrenciaDataInicial")) {
                setValue("recorrenciaDataInicial", watch("dataVencimento"));
              }
            }
          }}
        />
        Conta recorrente
      </label>

      {recorrente && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de recorrência
            </label>
            <Controller
              control={control}
              name="recorrenciaTipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="MENSAL">Mensal</SelectItem>
                    <SelectItem value="INTERVALO_DIAS">A cada X dias</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {recorrenciaTipo === "INTERVALO_DIAS" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                A cada X dias
              </label>
              <Input
                type="number"
                min={1}
                {...register("recorrenciaIntervaloDias")}
                className="bg-secondary border-border"
              />
            </div>
          )}

          {recorrenciaTipo === "MENSAL" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dia do mês
              </label>
              <Input
                type="number"
                min={1}
                max={31}
                {...register("recorrenciaDiaDoMes")}
                placeholder={String(diaVencimentoSugestao)}
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
              {...register("recorrenciaDataInicial")}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Término da recorrência
            </label>
            <Controller
              control={control}
              name="recorrenciaTermino"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="SEM_FIM">Sem fim</SelectItem>
                    <SelectItem value="EM_DATA">Em data</SelectItem>
                    <SelectItem value="APOS_OCORRENCIAS">Após N ocorrências</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {recorrenciaTermino === "EM_DATA" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data fim
              </label>
              <Input
                type="date"
                {...register("recorrenciaDataFim")}
                className="bg-secondary border-border"
              />
            </div>
          )}

          {recorrenciaTermino === "APOS_OCORRENCIAS" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Qtd. ocorrências
              </label>
              <Input
                type="number"
                min={1}
                {...register("recorrenciaNumeroOcorrencias")}
                className="bg-secondary border-border"
              />
            </div>
          )}

          <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              {...register("criarLancamentoInicialAgora")}
            />
            Criar lançamento inicial agora
          </label>
        </div>
      )}
    </div>
  );
}
