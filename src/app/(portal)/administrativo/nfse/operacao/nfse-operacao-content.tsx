"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  RotateCw,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ListErrorState } from "@/components/shared/list-states";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  listarNfseSolicitacoesApi,
  listarNfseEventosApi,
  retryNfseSolicitacaoApi,
  cancelarNfseSolicitacaoApi,
  getNfseResumoApi,
  type NfseEvento,
  type NfseResumo,
  type NfseSolicitacaoItem,
  type NfseStatus,
} from "@/lib/api/nfse";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { formatBRL, formatDateTimeBR } from "@/lib/formatters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const STATUS_CLASS: Record<string, string> = {
  EM_PROCESSAMENTO: "bg-gym-warning/15 text-gym-warning",
  EMITIDA: "bg-gym-teal/15 text-gym-teal",
  FALHA: "bg-gym-danger/15 text-gym-danger",
  CANCELADA: "bg-muted text-muted-foreground",
  EM_CANCELAMENTO: "bg-gym-warning/15 text-gym-warning",
};

const STATUS_LABEL: Record<string, string> = {
  EM_PROCESSAMENTO: "Em processamento",
  EMITIDA: "Emitida",
  FALHA: "Falha",
  CANCELADA: "Cancelada",
  EM_CANCELAMENTO: "Em cancelamento",
};

/**
 * Operacao NFS-e (Task #543). Consome todos os endpoints de solicitacoes,
 * eventos e resumo do NfseController. Complementa a tela de configuracao
 * existente com uma visao operacional.
 */
export function NfseOperacaoContent() {
  const { tenantId, tenantResolved } = useTenantContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Nota: o BE exige unidadeId como path param. Para simplificar nesta v1,
  // usamos tenantId como unidadeId default (comum quando unidade == tenant)
  // e documentamos que a UI pode evoluir para seletor de unidade.
  const unidadeId = tenantId;

  const [statusFilter, setStatusFilter] = useState<string>(FILTER_ALL);
  const [search, setSearch] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [eventsOpen, setEventsOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<NfseSolicitacaoItem | null>(null);
  const [cancelarOpen, setCancelarOpen] = useState(false);
  const [cancelarMotivo, setCancelarMotivo] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resumoQuery = useQuery<NfseResumo>({
    queryKey: ["nfse", "resumo", tenantId],
    queryFn: () => getNfseResumoApi({ tenantId }),
    enabled: tenantResolved && Boolean(tenantId),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const listQuery = useQuery<NfseSolicitacaoItem[]>({
    queryKey: [
      "nfse",
      "solicitacoes",
      tenantId,
      unidadeId,
      statusFilter,
      dataInicio,
      dataFim,
    ],
    queryFn: () =>
      listarNfseSolicitacoesApi({
        tenantId,
        unidadeId,
        status: statusFilter !== FILTER_ALL ? (statusFilter as NfseStatus) : undefined,
        dataEmissaoInicio: dataInicio || undefined,
        dataEmissaoFim: dataFim || undefined,
        size: 100,
      }),
    enabled: tenantResolved && Boolean(tenantId) && Boolean(unidadeId),
    staleTime: 30_000,
  });

  const eventsQuery = useQuery<NfseEvento[]>({
    queryKey: ["nfse", "eventos", selectedSolicitacao?.id, tenantId],
    queryFn: () =>
      listarNfseEventosApi({
        tenantId,
        unidadeId,
        solicitacaoId: selectedSolicitacao!.id,
      }),
    enabled: eventsOpen && Boolean(selectedSolicitacao?.id),
    staleTime: 30_000,
  });

  const retryMutation = useMutation({
    mutationFn: (solicitacaoId: string) =>
      retryNfseSolicitacaoApi({ tenantId, unidadeId, solicitacaoId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["nfse", "solicitacoes"] });
      void queryClient.invalidateQueries({ queryKey: ["nfse", "resumo"] });
      setSuccess("Retry solicitado. Nova emissão em processamento.");
      setTimeout(() => setSuccess(null), 4000);
    },
    onError: (e) => setError(normalizeErrorMessage(e)),
  });

  const cancelarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      cancelarNfseSolicitacaoApi({ tenantId, unidadeId, solicitacaoId: id, motivo }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["nfse", "solicitacoes"] });
      void queryClient.invalidateQueries({ queryKey: ["nfse", "resumo"] });
      setCancelarOpen(false);
      setCancelarMotivo("");
      setSelectedSolicitacao(null);
      setSuccess("Cancelamento solicitado.");
      setTimeout(() => setSuccess(null), 4000);
    },
    onError: (e) => setError(normalizeErrorMessage(e)),
  });

  const items = listQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((s) =>
      [s.tomadorNome, s.tomadorCnpj, s.numeroNota]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [items, search]);

  const resumo = resumoQuery.data;
  const loadError =
    listQuery.error instanceof Error ? listQuery.error.message : null;

  function handleRetry(s: NfseSolicitacaoItem) {
    confirm(`Reenviar solicitação #${s.numeroNota ?? s.id.slice(0, 8)}?`, () => {
      retryMutation.mutate(s.id);
    });
  }

  function handleOpenCancelar(s: NfseSolicitacaoItem) {
    setSelectedSolicitacao(s);
    setCancelarMotivo("");
    setCancelarOpen(true);
  }

  function handleConfirmCancelar() {
    if (!selectedSolicitacao || !cancelarMotivo.trim()) return;
    cancelarMutation.mutate({
      id: selectedSolicitacao.id,
      motivo: cancelarMotivo.trim(),
    });
  }

  function handleOpenEvents(s: NfseSolicitacaoItem) {
    setSelectedSolicitacao(s);
    setEventsOpen(true);
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Administrativo · NFS-e
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Operação</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solicitações de emissão, retry, cancelamento e timeline de eventos.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link href="/administrativo/nfse">
            <ArrowLeft className="size-4" />
            Voltar para configuração
          </Link>
        </Button>
      </div>

      {loadError ? (
        <ListErrorState error={loadError} onRetry={() => void listQuery.refetch()} />
      ) : null}

      {(error || success) ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
              : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {error ?? success}
        </div>
      ) : null}

      {/* Resumo */}
      {resumo ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </p>
            <p className="mt-2 text-2xl font-extrabold">{resumo.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Emitidas
            </p>
            <p className="mt-2 text-2xl font-extrabold text-gym-teal">
              {resumo.porStatus?.EMITIDA ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Em processamento
            </p>
            <p className="mt-2 text-2xl font-extrabold text-gym-warning">
              {resumo.porStatus?.EM_PROCESSAMENTO ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Falhas
            </p>
            <p className="mt-2 text-2xl font-extrabold text-gym-danger">
              {resumo.porStatus?.FALHA ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Canceladas
            </p>
            <p className="mt-2 text-2xl font-extrabold text-muted-foreground">
              {resumo.porStatus?.CANCELADA ?? 0}
            </p>
          </div>
        </div>
      ) : null}

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tomador, CNPJ, nº nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border bg-secondary pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-border bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value={FILTER_ALL}>Todos os status</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border-border bg-secondary"
            placeholder="Início"
          />
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border-border bg-secondary"
            placeholder="Fim"
          />
        </div>
      </div>

      {/* Tabela */}
      {listQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma solicitação encontrada para o filtro selecionado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Nº Nota
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Tomador
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  Valor
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Emissão
                </th>
                <th scope="col" className="px-3 py-2 text-center font-semibold">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 text-center font-semibold">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/30">
                  <td className="px-3 py-2 font-mono text-xs">
                    {s.numeroNota ?? s.id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{s.tomadorNome ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.tomadorCnpj ?? ""}</p>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {s.valorServicos != null ? formatBRL(s.valorServicos) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {s.dataEmissao ? formatDateTimeBR(s.dataEmissao) : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[s.status] ?? STATUS_CLASS.EM_PROCESSAMENTO}`}
                    >
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEvents(s)}
                        title="Ver eventos"
                      >
                        <Clock className="size-4" />
                      </Button>
                      {s.status === "FALHA" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(s)}
                          disabled={retryMutation.isPending}
                          title="Reenviar"
                          className="text-gym-accent hover:bg-gym-accent/10"
                        >
                          <RotateCw className="size-4" />
                        </Button>
                      ) : null}
                      {s.status === "EMITIDA" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCancelar(s)}
                          title="Cancelar"
                          className="text-gym-danger hover:bg-gym-danger/10"
                        >
                          <XCircle className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Eventos/Timeline */}
      <Dialog
        open={eventsOpen}
        onOpenChange={(open) => {
          setEventsOpen(open);
          if (!open) setSelectedSolicitacao(null);
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="">
              Timeline — {selectedSolicitacao?.numeroNota ?? "Solicitação"}
            </DialogTitle>
            <DialogDescription>
              Eventos registrados desde a solicitação até o status atual.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto py-2">
            {eventsQuery.isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Carregando eventos...
              </p>
            ) : (eventsQuery.data?.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum evento registrado.
              </p>
            ) : (
              eventsQuery.data!.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-lg border border-border bg-secondary/30 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="size-3 text-muted-foreground" />
                      <span className="font-mono text-xs font-semibold">{ev.tipo}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTimeBR(ev.ocorridoEm)}
                    </span>
                  </div>
                  {ev.mensagem ? (
                    <p className="mt-1 text-xs text-muted-foreground">{ev.mensagem}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventsOpen(false)} className="border-border">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Cancelar */}
      <Dialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-gym-danger" />
              Cancelar NFS-e
            </DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              value={cancelarMotivo}
              onChange={(e) => setCancelarMotivo(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo do cancelamento..."
              className="mt-1 border-border bg-secondary"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelarOpen(false)}
              className="border-border"
            >
              Voltar
            </Button>
            <Button
              onClick={handleConfirmCancelar}
              disabled={!cancelarMotivo.trim() || cancelarMutation.isPending}
              className="bg-gym-danger text-white hover:bg-gym-danger/90"
            >
              <CheckCircle2 className="size-4" />
              {cancelarMutation.isPending ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-border"
          onClick={() => {
            void listQuery.refetch();
            void resumoQuery.refetch();
          }}
          disabled={listQuery.isFetching || resumoQuery.isFetching}
        >
          <RefreshCw className={`size-4 ${listQuery.isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>
    </div>
  );
}
