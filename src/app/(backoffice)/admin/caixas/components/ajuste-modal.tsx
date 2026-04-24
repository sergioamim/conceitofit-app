"use client";

/**
 * Modal de ajuste administrativo em caixa fechado (CXO-302).
 *
 * Registra um movimento AJUSTE_ENTRADA / AJUSTE_SAIDA em um caixa
 * encerrado. Regras:
 *  - Guard de role ADMIN (FE defensivo; BE revalida via CXO-102).
 *  - react-hook-form + zod (rule do projeto).
 *  - Confirmação dupla via Radix AlertDialog ("Tem certeza?").
 *  - Erros mapeados via `mapCaixaError` + toast destrutivo.
 *
 * Tab "Histórico de ajustes": consome `GET /api/caixas/{id}/ajustes`
 * (CXO-302) para listar movimentos AJUSTE_ENTRADA / AJUSTE_SAIDA.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ajusteAdmin, listarAjustes } from "@/lib/api/caixa";
import type { CaixaAjusteResponse } from "@/lib/api/caixa.types";
import {
  isCaixaApiError,
  mapCaixaError,
} from "@/lib/api/caixa-error-handler";
import { ApiRequestError } from "@/lib/api/http";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const AJUSTE_TIPOS = ["AJUSTE_ENTRADA", "AJUSTE_SAIDA"] as const;

const FORMA_PAGAMENTO_OPTIONS = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "PIX", label: "PIX" },
  { value: "VALE_REFEICAO", label: "Vale refeição" },
  { value: "OUTRO", label: "Outro" },
] as const;

const FORMA_PAGAMENTO_NONE = "__NONE__";

export const AjusteAdminSchema = z.object({
  tipo: z.enum(AJUSTE_TIPOS),
  valor: z.coerce.number().positive("Valor deve ser maior que zero"),
  formaPagamento: z.string().optional(),
  motivo: z
    .string()
    .trim()
    .min(10, "Motivo precisa ter no mínimo 10 caracteres"),
});

export type AjusteAdminFormData = z.infer<typeof AjusteAdminSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AjusteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caixaId: string;
  /** Rótulo informativo do caixa (ex.: nome do operador + data). */
  caixaLabel?: string;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MOTIVO_MIN = 10;

export function AjusteModal({
  open,
  onOpenChange,
  caixaId,
  caixaLabel,
  onSuccess,
}: AjusteModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<string>("ajuste");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<AjusteAdminFormData | null>(
    null,
  );

  // -- Historico state --
  const [ajustes, setAjustes] = useState<CaixaAjusteResponse[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoError, setHistoricoError] = useState<string | null>(null);

  const fetchAjustes = useCallback(async () => {
    setHistoricoLoading(true);
    setHistoricoError(null);
    try {
      const data = await listarAjustes(caixaId);
      setAjustes(data);
    } catch (err) {
      if (isCaixaApiError(err)) {
        const mapped = mapCaixaError(err);
        setHistoricoError(mapped.mensagem);
      } else {
        setHistoricoError(
          err instanceof Error ? err.message : "Erro ao carregar histórico.",
        );
      }
    } finally {
      setHistoricoLoading(false);
    }
  }, [caixaId]);

  // Fetch when tab switches to historico or modal opens on historico
  useEffect(() => {
    if (open && tab === "historico") {
      void fetchAjustes();
    }
  }, [open, tab, fetchAjustes]);

  const form = useForm<AjusteAdminFormData>({
    resolver: zodResolver(AjusteAdminSchema),
    defaultValues: {
      tipo: "AJUSTE_SAIDA",
      valor: 0,
      formaPagamento: undefined,
      motivo: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const tipo = watch("tipo");
  const motivo = watch("motivo") ?? "";
  const formaPagamento = watch("formaPagamento");
  const motivoLength = motivo.length;
  const valorNum = Number(watch("valor"));
  const canSave =
    Boolean(tipo) &&
    Number.isFinite(valorNum) &&
    valorNum > 0 &&
    motivoLength >= MOTIVO_MIN;

  const hintMotivo = useMemo(
    () =>
      motivoLength >= MOTIVO_MIN
        ? `${motivoLength} caracteres`
        : `${motivoLength}/${MOTIVO_MIN} caracteres`,
    [motivoLength],
  );

  function closeAll() {
    setConfirmOpen(false);
    setPendingData(null);
    setSubmitting(false);
    reset();
    onOpenChange(false);
  }

  // Form submit → abre AlertDialog de confirmação.
  const onPreSubmit = handleSubmit((data) => {
    setPendingData(data);
    setConfirmOpen(true);
  });

  async function onConfirm() {
    if (!pendingData) return;
    setSubmitting(true);
    try {
      await ajusteAdmin(caixaId, {
        tipo: pendingData.tipo,
        valor: pendingData.valor,
        formaPagamento: pendingData.formaPagamento || null,
        motivo: pendingData.motivo.trim(),
      });
      toast({
        title: "Ajuste registrado",
        description: "O movimento foi lançado no caixa com sucesso.",
      });
      setConfirmOpen(false);
      setPendingData(null);
      reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      // 403: sem permissão — guard do backend (CXO-102)
      if (err instanceof ApiRequestError && err.status === 403) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Apenas administradores podem registrar ajustes em caixa fechado.",
        });
        onOpenChange(false);
        router.push("/admin/caixas");
      } else if (isCaixaApiError(err)) {
        const mapped = mapCaixaError(err);
        toast({
          variant: "destructive",
          title: mapped.titulo,
          description: mapped.mensagem,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Falha ao registrar ajuste",
          description:
            err instanceof Error
              ? err.message
              : "Tente novamente em instantes.",
        });
      }
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (submitting) return;
          if (!next) reset();
          onOpenChange(next);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajuste em caixa fechado</DialogTitle>
            <DialogDescription>
              {caixaLabel
                ? `Caixa: ${caixaLabel}`
                : "Registre um ajuste administrativo neste caixa."}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="ajuste">Novo ajuste</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="ajuste" className="space-y-4">
              <div
                role="alert"
                className="rounded-md border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-200"
              >
                Esta ação é registrada permanentemente e fica associada ao seu
                usuário no histórico de auditoria.
              </div>

              <form
                className="space-y-4"
                onSubmit={onPreSubmit}
                noValidate
                data-testid="ajuste-modal-form"
              >
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Tipo</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        tipo === "AJUSTE_ENTRADA"
                          ? "border-gym-teal/60 bg-gym-teal/10"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <input
                        type="radio"
                        value="AJUSTE_ENTRADA"
                        checked={tipo === "AJUSTE_ENTRADA"}
                        onChange={() =>
                          setValue("tipo", "AJUSTE_ENTRADA", {
                            shouldDirty: true,
                          })
                        }
                        className="accent-gym-teal"
                      />
                      Entrada (sobra)
                    </label>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        tipo === "AJUSTE_SAIDA"
                          ? "border-gym-danger/60 bg-gym-danger/10"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <input
                        type="radio"
                        value="AJUSTE_SAIDA"
                        checked={tipo === "AJUSTE_SAIDA"}
                        onChange={() =>
                          setValue("tipo", "AJUSTE_SAIDA", {
                            shouldDirty: true,
                          })
                        }
                        className="accent-gym-danger"
                      />
                      Saída (falta)
                    </label>
                  </div>
                  {errors.tipo ? (
                    <p className="text-xs text-gym-danger">
                      {errors.tipo.message}
                    </p>
                  ) : null}
                </fieldset>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ajuste-valor">
                      Valor (R$) <span className="text-gym-danger">*</span>
                    </Label>
                    <Input
                      id="ajuste-valor"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      aria-invalid={Boolean(errors.valor)}
                      {...register("valor")}
                    />
                    {errors.valor ? (
                      <p className="text-xs text-gym-danger">
                        {errors.valor.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ajuste-forma">
                      Forma de pagamento (opcional)
                    </Label>
                    <Select
                      value={formaPagamento ?? FORMA_PAGAMENTO_NONE}
                      onValueChange={(value) =>
                        setValue(
                          "formaPagamento",
                          value === FORMA_PAGAMENTO_NONE ? undefined : value,
                          { shouldDirty: true },
                        )
                      }
                    >
                      <SelectTrigger id="ajuste-forma">
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FORMA_PAGAMENTO_NONE}>
                          Nenhuma
                        </SelectItem>
                        {FORMA_PAGAMENTO_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ajuste-motivo">
                    Motivo (mínimo {MOTIVO_MIN} caracteres) <span className="text-gym-danger">*</span>
                  </Label>
                  <Textarea
                    id="ajuste-motivo"
                    rows={4}
                    aria-invalid={Boolean(errors.motivo)}
                    placeholder="Explique o motivo do ajuste (ex.: recontagem manual após divergência no fechamento)."
                    {...register("motivo")}
                  />
                  <div className="flex items-center justify-between text-xs">
                    {errors.motivo ? (
                      <p className="text-gym-danger">{errors.motivo.message}</p>
                    ) : (
                      <span className="text-muted-foreground">
                        Este texto fica no registro permanente do caixa.
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-muted-foreground tabular-nums",
                        motivoLength >= MOTIVO_MIN ? "text-gym-teal" : undefined,
                      )}
                      data-testid="ajuste-motivo-counter"
                    >
                      {hintMotivo}
                    </span>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (submitting) return;
                      reset();
                      onOpenChange(false);
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting || !canSave}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Registrando…
                      </>
                    ) : (
                      "Confirmar ajuste"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="historico" className="space-y-3">
              {historicoLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Carregando ajustes...
                  </span>
                </div>
              ) : historicoError ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
                  {historicoError}
                </div>
              ) : ajustes.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Nenhum ajuste registrado
                  </p>
                  <p className="mt-1">
                    Este caixa ainda não possui ajustes administrativos.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2 text-right">Valor</th>
                        <th className="px-3 py-2">Forma</th>
                        <th className="px-3 py-2">Motivo</th>
                        <th className="px-3 py-2">Admin</th>
                        <th className="px-3 py-2">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ajustes.map((aj) => (
                        <tr key={aj.id} className="hover:bg-muted/40">
                          <td className="whitespace-nowrap px-3 py-2">
                            <span
                              className={cn(
                                "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
                                aj.tipo === "AJUSTE_ENTRADA"
                                  ? "bg-gym-teal/20 text-gym-teal"
                                  : "bg-gym-danger/20 text-gym-danger",
                              )}
                            >
                              {aj.tipo === "AJUSTE_ENTRADA"
                                ? "Entrada"
                                : "Saída"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                            {Math.abs(aj.valor).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            {aj.formaPagamento ?? "-"}
                          </td>
                          <td
                            className="max-w-[160px] truncate px-3 py-2"
                            title={aj.motivo ?? undefined}
                          >
                            {aj.motivo ?? "-"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            {aj.adminNome ?? "-"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                            {new Date(aj.criadoEm).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (submitting) return;
          setConfirmOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ajuste?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação é registrada permanentemente e não pode
              ser revertida. O movimento ficará vinculado ao seu usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void onConfirm();
              }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Registrando…
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Escape hatch: permite fechar tudo sem deixar state preso */}
      {!open && (pendingData || confirmOpen) ? (
        <button
          type="button"
          className="sr-only"
          aria-hidden
          onClick={closeAll}
        >
          reset
        </button>
      ) : null}
    </>
  );
}
