"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, StopCircle } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListErrorState } from "@/components/shared/list-states";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  getPrescricaoTreinoApi,
  criarPrescricaoTreinoApi,
  encerrarCicloTreinoApi,
} from "@/lib/api/treinos";
import type {
  PrescricaoTreinoPayload,
  TreinoCicloResponse,
  TreinoMotivoPrescricao,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatDate } from "@/lib/formatters";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

const MOTIVOS: Array<{ value: TreinoMotivoPrescricao; label: string }> = [
  { value: "INICIAL", label: "Prescrição inicial" },
  { value: "RENOVACAO", label: "Renovação" },
  { value: "AJUSTE_OBJETIVO", label: "Ajuste de objetivo" },
  { value: "POS_AVALIACAO", label: "Pós-avaliação" },
  { value: "IMPORTACAO", label: "Importação" },
  { value: "OUTRO", label: "Outro" },
];

const STATUS_CLASS: Record<string, string> = {
  ATIVO: "bg-gym-teal/15 text-gym-teal",
  ENCERRADO: "bg-secondary text-muted-foreground",
  PAUSADO: "bg-gym-warning/15 text-gym-warning",
  CANCELADO: "bg-gym-danger/15 text-gym-danger",
};

const prescricaoSchema = z.object({
  frequenciaPlanejadaSemana: z
    .union([z.coerce.number().int().positive().max(7), z.literal("")])
    .optional(),
  quantidadePrevistaExecucoes: z
    .union([z.coerce.number().int().positive().max(500), z.literal("")])
    .optional(),
  motivoPrescricao: z
    .enum(["INICIAL", "RENOVACAO", "AJUSTE_OBJETIVO", "POS_AVALIACAO", "IMPORTACAO", "OUTRO"])
    .optional(),
  observacoesPrescricao: z.string().trim().max(2000).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

type PrescricaoFormValues = z.infer<typeof prescricaoSchema>;

/**
 * Gestão de ciclo/prescrição de treino (Task #540).
 * Consome GET/POST /api/v1/treinos/{id}/prescricao e
 * POST /api/v1/treinos/{id}/encerrar-ciclo.
 *
 * NOTA: o backend não expõe /treinos/{id}/clonar-para-cliente. A funcionalidade
 * de "clonar para outro aluno" mencionada na task #540 fica como débito até o
 * BE implementar.
 */
export default function TreinoPrescricaoPage() {
  const params = useParams<{ id: string }>();
  const treinoId = params?.id ?? "";
  const { tenantId, tenantResolved } = useTenantContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ciclo = useQuery<TreinoCicloResponse | null>({
    queryKey: ["treinos", "prescricao", tenantId, treinoId],
    queryFn: () => getPrescricaoTreinoApi({ tenantId, id: treinoId }),
    enabled: tenantResolved && Boolean(tenantId) && Boolean(treinoId),
    staleTime: 30_000,
  });

  const form = useForm<PrescricaoFormValues>({
    resolver: zodResolver(prescricaoSchema),
    mode: "onChange",
    defaultValues: {
      frequenciaPlanejadaSemana: "",
      quantidadePrevistaExecucoes: "",
      motivoPrescricao: "INICIAL",
      observacoesPrescricao: "",
      dataInicio: "",
      dataFim: "",
    },
  });

  // Popular form quando o ciclo carregar
  useEffect(() => {
    if (ciclo.data) {
      form.reset({
        frequenciaPlanejadaSemana: ciclo.data.frequenciaPlanejadaSemana ?? "",
        quantidadePrevistaExecucoes: ciclo.data.quantidadePrevistaExecucoes ?? "",
        motivoPrescricao: ciclo.data.motivoPrescricao ?? "INICIAL",
        observacoesPrescricao: ciclo.data.observacoesPrescricao ?? "",
        dataInicio: ciclo.data.dataInicio ?? "",
        dataFim: ciclo.data.dataFim ?? "",
      });
    }
  }, [ciclo.data, form]);

  const criarMutation = useMutation({
    mutationFn: (data: PrescricaoTreinoPayload) =>
      criarPrescricaoTreinoApi({ tenantId, id: treinoId, data }),
    onSuccess: (data) => {
      queryClient.setQueryData(["treinos", "prescricao", tenantId, treinoId], data);
      setSuccess("Prescrição salva com sucesso.");
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (e) => setFormError(normalizeErrorMessage(e)),
  });

  const encerrarMutation = useMutation({
    mutationFn: () => encerrarCicloTreinoApi({ tenantId, id: treinoId }),
    onSuccess: (data) => {
      queryClient.setQueryData(["treinos", "prescricao", tenantId, treinoId], data);
      setSuccess("Ciclo encerrado com sucesso.");
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (e) => setFormError(normalizeErrorMessage(e)),
  });

  function onSubmit(values: PrescricaoFormValues) {
    setFormError(null);
    setSuccess(null);
    const payload: PrescricaoTreinoPayload = {
      frequenciaPlanejadaSemana:
        values.frequenciaPlanejadaSemana === "" || values.frequenciaPlanejadaSemana == null
          ? undefined
          : Number(values.frequenciaPlanejadaSemana),
      quantidadePrevistaExecucoes:
        values.quantidadePrevistaExecucoes === "" || values.quantidadePrevistaExecucoes == null
          ? undefined
          : Number(values.quantidadePrevistaExecucoes),
      motivoPrescricao: values.motivoPrescricao,
      observacoesPrescricao: values.observacoesPrescricao || undefined,
      dataInicio: values.dataInicio || undefined,
      dataFim: values.dataFim || undefined,
    };
    criarMutation.mutate(payload);
  }

  function handleEncerrar() {
    confirm("Encerrar o ciclo atual? Esta ação não pode ser desfeita.", () => {
      encerrarMutation.mutate();
    });
  }

  const atual = ciclo.data;
  const isAtivo = atual?.status === "ATIVO";
  const loading = ciclo.isLoading;
  const loadError = ciclo.error instanceof Error ? ciclo.error.message : null;

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <Breadcrumb
        items={[
          { label: "Treinos", href: "/treinos" },
          { label: "Detalhe", href: `/treinos/${treinoId}` },
          { label: "Prescrição / Ciclo" },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Treinos
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Prescrição / Ciclo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie a prescrição e o ciclo de execução deste treino.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link href={`/treinos/${treinoId}`}>
            <ArrowLeft className="size-4" />
            Voltar ao editor
          </Link>
        </Button>
      </div>

      {loadError ? (
        <ListErrorState error={loadError} onRetry={() => void ciclo.refetch()} />
      ) : null}

      {formError ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {formError}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal">
          {success}
        </div>
      ) : null}

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card/60" />
      ) : (
        <>
          {/* Resumo do ciclo atual */}
          {atual ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Ciclo atual</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[atual.status] ?? STATUS_CLASS.ENCERRADO}`}
                  >
                    {atual.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Aderência
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold text-gym-accent">
                    {atual.aderenciaPercentual != null ? `${atual.aderenciaPercentual.toFixed(0)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Execuções
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold">
                    {atual.execucoesConcluidas ?? 0}
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      / {atual.quantidadePrevistaExecucoes ?? "—"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Revisão
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold text-muted-foreground">
                    #{atual.revisaoNumero ?? 1}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Período
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {atual.dataInicio ? formatDate(atual.dataInicio) : "—"}
                    {atual.dataFim ? ` → ${formatDate(atual.dataFim)}` : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nenhum ciclo ativo. Crie uma prescrição inicial abaixo.
              </CardContent>
            </Card>
          )}

          {/* Form de prescrição */}
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {atual ? "Atualizar prescrição" : "Nova prescrição"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="motivoPrescricao">Motivo</Label>
                    <Select
                      value={form.watch("motivoPrescricao") ?? "INICIAL"}
                      onValueChange={(v) =>
                        form.setValue("motivoPrescricao", v as TreinoMotivoPrescricao)
                      }
                    >
                      <SelectTrigger className="mt-1 w-full border-border bg-secondary">
                        <SelectValue placeholder="Motivo da prescrição" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOTIVOS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="frequenciaPlanejadaSemana">Frequência semanal</Label>
                    <Input
                      id="frequenciaPlanejadaSemana"
                      type="number"
                      min={1}
                      max={7}
                      placeholder="Ex: 3"
                      className="mt-1 border-border bg-secondary"
                      {...form.register("frequenciaPlanejadaSemana")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantidadePrevistaExecucoes">Execuções previstas</Label>
                    <Input
                      id="quantidadePrevistaExecucoes"
                      type="number"
                      min={1}
                      max={500}
                      placeholder="Ex: 36"
                      className="mt-1 border-border bg-secondary"
                      {...form.register("quantidadePrevistaExecucoes")}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="dataInicio">Data início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      className="mt-1 border-border bg-secondary"
                      {...form.register("dataInicio")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim">Data fim</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      className="mt-1 border-border bg-secondary"
                      {...form.register("dataFim")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoesPrescricao">Observações do professor</Label>
                  <Textarea
                    id="observacoesPrescricao"
                    placeholder="Objetivos, observações técnicas, recomendações..."
                    rows={4}
                    className="mt-1 border-border bg-secondary"
                    {...form.register("observacoesPrescricao")}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={criarMutation.isPending}>
                <Save className="size-4" />
                {criarMutation.isPending
                  ? "Salvando..."
                  : atual
                    ? "Atualizar prescrição"
                    : "Criar prescrição"}
              </Button>
              {isAtivo ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-gym-danger/30 text-gym-danger hover:bg-gym-danger/10"
                  disabled={encerrarMutation.isPending}
                  onClick={handleEncerrar}
                >
                  <StopCircle className="size-4" />
                  {encerrarMutation.isPending ? "Encerrando..." : "Encerrar ciclo"}
                </Button>
              ) : null}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
