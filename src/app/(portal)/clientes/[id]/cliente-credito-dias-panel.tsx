"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarClock, History, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/formatters";
import { useEmitirContratoCreditoDias, useEstornarContratoCreditoDias, useContratoCreditosDias } from "@/lib/query/use-contrato-creditos-dias";
import { queryKeys } from "@/lib/query/keys";
import { useHasCapacidade } from "@/features/rbac/hooks/use-has-capacidade";
import { editarContratoService } from "@/lib/tenant/comercial/runtime";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { Contrato, ContratoCreditoDias } from "@/lib/types";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";

import type {
  EditarContratoForm,
  EmitirCreditoDiasForm,
  EstornarCreditoDiasForm,
} from "./cliente-credito-dias-modal.schema";
import { ClienteEditarContratoModal } from "./cliente-editar-contrato-modal";
import { ClienteEmitirCreditoDiasModal } from "./cliente-emitir-credito-dias-modal";
import { ClienteEstornarCreditoDiasModal } from "./cliente-estornar-credito-dias-modal";

interface ClienteCreditoDiasPanelProps {
  contratoAtivo: Contrato | null;
  planoNome?: string | null;
  onReload: () => Promise<void>;
}

function formatOperadorLabel(nome: string | undefined, userId: number | undefined) {
  if (nome?.trim()) {
    return nome.trim();
  }
  if (typeof userId === "number" && Number.isFinite(userId)) {
    return `Usuário #${userId}`;
  }
  return "Operador não identificado";
}

export function ClienteCreditoDiasPanel({
  contratoAtivo,
  planoNome,
  onReload,
}: ClienteCreditoDiasPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userId } = useTenantContext();
  const [editarOpen, setEditarOpen] = useState(false);
  const [editarErro, setEditarErro] = useState("");
  const [editandoContrato, setEditandoContrato] = useState(false);
  const [emitirOpen, setEmitirOpen] = useState(false);
  const [emitirErro, setEmitirErro] = useState("");
  const [creditoEstorno, setCreditoEstorno] = useState<ContratoCreditoDias | null>(null);
  const [estornoErro, setEstornoErro] = useState("");

  const { hasCapacidade, isLoading: capacidadeLoading } = useHasCapacidade(
    userId,
    contratoAtivo?.tenantId,
  );
  const podeGerenciarCredito = hasCapacidade("matricula.credito-dias");
  const podeEditarContrato = hasCapacidade("matricula.editar-contrato");

  const creditosQuery = useContratoCreditosDias(
    contratoAtivo?.tenantId,
    contratoAtivo?.id,
    Boolean(contratoAtivo),
  );
  const emitirMutation = useEmitirContratoCreditoDias();
  const estornarMutation = useEstornarContratoCreditoDias();

  async function refreshCreditoDias() {
    if (!contratoAtivo) return;
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.contratos.creditosDias(contratoAtivo.tenantId, contratoAtivo.id),
      }),
      onReload(),
    ]);
  }

  async function handleEmitir(values: EmitirCreditoDiasForm) {
    if (!contratoAtivo) return;
    setEmitirErro("");
    try {
      await emitirMutation.mutateAsync({
        contratoId: contratoAtivo.id,
        dias: values.dias,
        motivo: values.motivo,
      });
      await refreshCreditoDias();
      setEmitirOpen(false);
      toast({
        title: "Crédito de dias aplicado",
        description: `${values.dias} dia(s) adicionados ao contrato ativo.`,
      });
    } catch (error) {
      setEmitirErro(normalizeErrorMessage(error));
    }
  }

  async function handleEstornar(values: EstornarCreditoDiasForm) {
    if (!creditoEstorno) return;
    setEstornoErro("");
    try {
      await estornarMutation.mutateAsync({
        creditoId: creditoEstorno.id,
        tenantId: creditoEstorno.tenantId,
        motivo: values.motivo,
      });
      await refreshCreditoDias();
      setCreditoEstorno(null);
      toast({
        title: "Crédito estornado",
        description: "O vencimento do contrato foi recalculado com sucesso.",
      });
    } catch (error) {
      setEstornoErro(normalizeErrorMessage(error));
    }
  }

  async function handleEditarContrato(values: EditarContratoForm) {
    if (!contratoAtivo) return;
    setEditandoContrato(true);
    setEditarErro("");
    try {
      const resumo = await editarContratoService({
        tenantId: contratoAtivo.tenantId,
        id: contratoAtivo.id,
        dataInicio: values.dataInicio,
        motivo: values.motivo,
      });
      await refreshCreditoDias();
      setEditarOpen(false);
      toast({
        title: "Contrato atualizado",
        description: `Início ${formatDate(resumo.dataInicioAnterior)} -> ${formatDate(resumo.dataInicioNova)}. Novo vencimento: ${formatDate(resumo.dataFimNova)}.`,
      });
    } catch (error) {
      setEditarErro(normalizeErrorMessage(error));
    } finally {
      setEditandoContrato(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-gym-teal" />
              <h2 className="font-display text-base font-bold">Crédito de dias</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste operacional do vencimento com histórico e estorno auditável.
            </p>
          </div>
          {contratoAtivo && (podeEditarContrato || podeGerenciarCredito) ? (
            <div className="flex flex-wrap items-center gap-2">
              {podeEditarContrato ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border"
                  onClick={() => setEditarOpen(true)}
                >
                  Editar contrato
                </Button>
              ) : null}
              {podeGerenciarCredito ? (
                <Button size="sm" onClick={() => setEmitirOpen(true)}>
                  Creditar dias
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {!contratoAtivo ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
            Este cliente não possui contrato ativo para receber crédito de dias.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {planoNome ?? "Contrato ativo"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Início: {formatDate(contratoAtivo.dataInicio)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vigência: {formatDate(contratoAtivo.dataInicio)} → {formatDate(contratoAtivo.dataFim)}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gym-teal/20 bg-gym-teal/10 px-3 py-1 text-xs font-semibold text-gym-teal">
                  <CalendarClock className="size-3.5" />
                  Vence em {formatDate(contratoAtivo.dataFim)}
                </div>
              </div>
              {!podeGerenciarCredito ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {capacidadeLoading
                    ? "Verificando permissões do operador..."
                    : "Seu perfil pode visualizar o histórico, mas não creditar ou estornar dias."}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <History className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Histórico do contrato ativo</h3>
              </div>

              {creditosQuery.isLoading ? (
                <p className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  Carregando histórico de créditos...
                </p>
              ) : creditosQuery.error ? (
                <div className="rounded-lg border border-gym-warning/30 bg-gym-warning/10 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 text-gym-warning" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gym-warning">
                        Não foi possível carregar o histórico agora.
                      </p>
                      <p className="mt-1 text-xs text-gym-warning/90">
                        {normalizeErrorMessage(creditosQuery.error)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="border-border" onClick={() => void creditosQuery.refetch()}>
                      Tentar de novo
                    </Button>
                  </div>
                </div>
              ) : !creditosQuery.data?.length ? (
                <p className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  Nenhum crédito registrado para este contrato.
                </p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {creditosQuery.data.map((credito) => {
                    const estornandoAtual =
                      estornarMutation.isPending && estornarMutation.variables?.creditoId === credito.id;
                    const emitidoEm = credito.emitidoEm.split("T")[0] ?? credito.emitidoEm;
                    const estornadoEm = credito.estornadoEm?.split("T")[0] ?? credito.estornadoEm;
                    const autorizadoPor = formatOperadorLabel(
                      credito.autorizadoPorNome,
                      credito.autorizadoPorUsuarioId,
                    );
                    const estornadoPor = formatOperadorLabel(
                      credito.estornadoPorNome,
                      credito.estornadoPorUsuarioId,
                    );

                    return (
                      <div key={credito.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              +{credito.dias} dia(s)
                            </p>
                            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {credito.origem}
                            </span>
                            {credito.estornado ? (
                              <span className="rounded-full border border-gym-danger/20 bg-gym-danger/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gym-danger">
                                Estornado
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{credito.motivo}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Emitido em {formatDate(emitidoEm)} • vencimento {formatDate(credito.dataFimAnterior)} → {formatDate(credito.dataFimPosterior)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Adicionado por {autorizadoPor}
                          </p>
                          {credito.estornado && credito.estornoMotivo ? (
                            <p className="mt-1 text-xs text-gym-danger">
                              Estornado por {estornadoPor}
                              {estornadoEm ? ` em ${formatDate(estornadoEm)}` : ""}: {credito.estornoMotivo}
                            </p>
                          ) : null}
                        </div>

                        {podeGerenciarCredito && !credito.estornado ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border"
                            disabled={estornandoAtual}
                            onClick={() => {
                              setEstornoErro("");
                              setCreditoEstorno(credito);
                            }}
                          >
                            {estornandoAtual ? "Estornando..." : "Estornar"}
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {contratoAtivo ? (
        <ClienteEditarContratoModal
          open={editarOpen}
          dataInicioAtual={contratoAtivo.dataInicio}
          dataFimAtual={contratoAtivo.dataFim}
          loading={editandoContrato}
          error={editarErro}
          onOpenChange={(nextOpen) => {
            setEditarErro("");
            setEditarOpen(nextOpen);
          }}
          onSubmit={handleEditarContrato}
        />
      ) : null}

      {contratoAtivo ? (
        <ClienteEmitirCreditoDiasModal
          open={emitirOpen}
          contratoDataFim={contratoAtivo.dataFim}
          loading={emitirMutation.isPending}
          error={emitirErro}
          onOpenChange={(nextOpen) => {
            setEmitirErro("");
            setEmitirOpen(nextOpen);
          }}
          onSubmit={handleEmitir}
        />
      ) : null}

      <ClienteEstornarCreditoDiasModal
        open={creditoEstorno != null}
        credito={creditoEstorno}
        loading={estornarMutation.isPending}
        error={estornoErro}
        onOpenChange={(nextOpen) => {
          setEstornoErro("");
          if (!nextOpen) setCreditoEstorno(null);
        }}
        onSubmit={handleEstornar}
      />
    </>
  );
}
