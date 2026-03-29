"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Search, Plus, X, Download } from "lucide-react";
import { logger } from "@/lib/shared/logger";
import { useTableSearchParams } from "@/hooks/use-table-search-params";
import { getBusinessTodayIso } from "@/lib/business-date";
import {
  updateAlunoService,
} from "@/lib/tenant/comercial/runtime";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { StatusBadge } from "@/components/shared/status-badge";
import { HoverPopover } from "@/components/shared/hover-popover";

const NovoClienteWizard = dynamic(
  () => import("@/components/shared/novo-cliente-wizard").then((mod) => mod.NovoClienteWizard),
  { ssr: false }
);
import { ClienteThumbnail } from "@/components/shared/cliente-thumbnail";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maskCPF, maskPhone } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useDialogState } from "@/hooks/use-dialog-state";
import type { Aluno, StatusAluno } from "@/lib/types";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";

import { ClienteResumoDialog } from "./cliente-resumo-dialog";
import { useClientesData } from "./use-clientes-data";

const STATUS_FILTERS: { value: WithFilterAll<StatusAluno>; label: string }[] = [
  { value: FILTER_ALL, label: "Todos" },
  { value: "ATIVO", label: "Ativos" },
  { value: "SUSPENSO", label: "Suspensos" },
  { value: "INATIVO", label: "Inativos" },
  { value: "CANCELADO", label: "Cancelados" },
];

const SEXO_LABEL: Record<string, string> = { M: "Masculino", F: "Feminino", OUTRO: "Outro" };

function ClientesPageContent() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const router = useRouter();
  const { tenantId, tenantResolved, setTenant } = useTenantContext();
  const { q, status: filtro, page, size: pageSize, setParams, clearParams, hasActiveFilters } = useTableSearchParams();
  const [buscaInput, setBuscaInput] = useState(q);
  const busca = q; // alias para manter a funcionalidade preexistente da view
  const wizard = useDialogState();
  const resumoDialog = useDialogState();
  const [clienteResumo, setClienteResumo] = useState<Aluno | null>(null);
  const [liberandoSuspensao, setLiberandoSuspensao] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    alunos,
    hasNextPage,
    totalClientes,
    metaPage,
    metaSize,
    statusTotals,
    loadError,
    loading,
    load,
  } = useClientesData({
    tenantId,
    tenantResolved,
    setTenant,
    filtro,
    page,
    pageSize,
  });

  useEffect(() => {
    setSelectedIds([]);
  }, [tenantId]);

  useEffect(() => {
    setBuscaInput(q);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buscaInput !== q) {
        setParams({ q: buscaInput || null });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [buscaInput, q, setParams]);

  const buscaDigits = busca.replace(/\D/g, "");

  const filtered = alunos.filter((a) => {
    const matchStatus = filtro === FILTER_ALL || a.status === filtro;
    const matchBusca = !busca
      || a.nome.toLowerCase().includes(busca.toLowerCase())
      || a.email.toLowerCase().includes(busca.toLowerCase())
      || (buscaDigits && a.cpf.replace(/\D/g, "").includes(buscaDigits))
      || (buscaDigits && a.telefone.replace(/\D/g, "").includes(buscaDigits));
    return matchStatus && matchBusca;
  });
  const displayed = filtered;
  const isSearchFiltered = busca.trim().length > 0;

  const metrics = useMemo(() => {
    const ym = getBusinessTodayIso().slice(0, 7);
    const novos = alunos.filter((a) => a.dataCadastro.startsWith(ym)).length;
    const renovados = 0;
    const naoRenovados = 0;
    const evadidos = alunos.filter(
      (a) =>
        (a.status === "CANCELADO" || a.status === "INATIVO") &&
        a.dataCadastro.startsWith(ym)
    ).length;
    return { novos, renovados, naoRenovados, evadidos };
  }, [alunos]);

  const clienteResumoPlano = useMemo(() => {
    if (!clienteResumo) return null;
    const estadoAtual = clienteResumo.estadoAtual;
    if (!estadoAtual?.descricaoContratoAtual && !estadoAtual?.dataFimContratoAtual) {
      return null;
    }
    return {
      nome: estadoAtual?.descricaoContratoAtual ?? "Plano ativo",
      dataFim: estadoAtual?.dataFimContratoAtual,
    };
  }, [clienteResumo]);

  const clienteResumoBaseHref = useMemo(() => {
    if (!clienteResumo) return "";
    return `/clientes/${clienteResumo.id}`;
  }, [clienteResumo]);

  const exportCsv = useCallback(() => {
    const toExport = selectedIds.map(id => alunos.find(a => a.id === id)).filter(Boolean) as Aluno[];
    if (toExport.length === 0) return;
    const rows = [
      ["Nome", "CPF", "Telefone", "Email", "Status"].join(","),
      ...toExport.map(a => `"${a.nome}","${a.cpf}","${a.telefone}","${a.email}","${a.status}"`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "clientes-selecionados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSelectedIds([]);
  }, [alunos, selectedIds]);

  const bulkActions = useMemo(() => [
    {
      label: "Exportar CSV",
      icon: Download,
      onClick: exportCsv,
    }
  ], [exportCsv]);

  const handleLiberarSuspensao = useCallback(() => {
    if (!clienteResumo || liberandoSuspensao) return;
    confirm(`Confirmar liberação da suspensão de ${clienteResumo.nome}?`, async () => {
      try {
        setLiberandoSuspensao(true);
        await updateAlunoService({
          tenantId: clienteResumo.tenantId,
          id: clienteResumo.id,
          data: {
            status: "ATIVO",
            suspensao: undefined,
          },
        });
        setClienteResumo((prev) =>
          prev ? { ...prev, status: "ATIVO", suspensao: undefined } : prev
        );
        await load();
      } catch (error) {
        logger.error("Falha ao liberar suspensão", { module: "clientes", error });
        window.alert("Não foi possível liberar a suspensão no momento.");
      } finally {
        setLiberandoSuspensao(false);
      }
    });
  }, [clienteResumo, confirm, liberandoSuspensao, load]);

  const handleVerPerfil = useCallback(() => {
    if (!clienteResumoBaseHref) return;
    resumoDialog.close();
    router.push(clienteResumoBaseHref);
  }, [clienteResumoBaseHref, resumoDialog, router]);

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <NovoClienteWizard
        open={wizard.isOpen}
        onClose={wizard.close}
        onDone={async (created, opts) => {
          await load();
          if (created && opts?.openSale) {
            wizard.close();
            router.push(`/vendas/nova?clienteId=${encodeURIComponent(created.id)}&prefill=1`);
          }
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusTotals.TODOS} clientes cadastrados
          </p>
        </div>
        <Button onClick={wizard.open}>
          <Plus className="size-4" />
          Novo cliente
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {loadError}
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Novos clientes</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{metrics.novos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Clientes renovados</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">{metrics.renovados}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contratos não renovados</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">{metrics.naoRenovados}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Evasão</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">{metrics.evadidos}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
            {STATUS_FILTERS.map((s) => (
            <button key={s.value} onClick={() => {
              setParams({ status: s.value === FILTER_ALL ? null : s.value });
            }}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === s.value
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {s.label}
              {(
                s.value === FILTER_ALL ||
                s.value === "ATIVO" ||
                s.value === "SUSPENSO" ||
                s.value === "INATIVO"
              ) && (
                <span className="ml-1.5 text-muted-foreground">
                  ({statusTotals[s.value]})
                </span>
              )}
            </button>
          ))}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearParams} className="ml-2 h-8 border border-transparent hover:bg-muted text-xs">
              <X className="mr-1 size-3.5" />
              Limpar
            </Button>
          )}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, telefone ou e-mail..."
            value={buscaInput}
            onChange={(e) => {
              const raw = e.target.value;
              const hasLetters = /[a-zA-Z@]/.test(raw);
              if (hasLetters) {
                setBuscaInput(raw);
                return;
              }
              const digits = raw.replace(/\D/g, "");
              if (digits.length >= 11) {
                setBuscaInput(maskCPF(raw));
              } else {
                setBuscaInput(maskPhone(raw));
              }
            }}
            className="w-72 bg-secondary border-border pl-8 text-sm"
          />
        </div>
        <div className="w-44">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setParams({ size: v });
            }}
          >
            <SelectTrigger className="w-full bg-secondary border-border text-xs">
              <SelectValue placeholder="Itens por página" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
              <SelectItem value="100">100 por página</SelectItem>
              <SelectItem value="200">200 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <PaginatedTable<Aluno>
        isLoading={loading}
        itemLabel="clientes"
        tableAriaLabel="Tabela de clientes"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={bulkActions}
        columns={[
          { label: "Cliente" },
          { label: "CPF" },
          { label: "Telefone" },
          { label: "Nascimento" },
          { label: "Sexo" },
          { label: "Status" },
        ]}
        items={displayed}
        emptyText="Nenhum cliente encontrado"
        getRowKey={(aluno) => aluno.id}
        onRowClick={(aluno) =>
          router.push(`/clientes/${aluno.id}`)
        }
        rowClassName={() => "cursor-pointer transition-colors hover:bg-secondary/40"}
        renderCells={(aluno) => {
          return (
            <>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <ClienteThumbnail nome={aluno.nome} foto={aluno.foto} size="sm" />
                  <div>
                    <button
                      type="button"
                      className="cursor-pointer text-left text-sm font-medium hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClienteResumo(aluno);
                        resumoDialog.open();
                      }}
                    >
                      {aluno.nome}
                    </button>
                    {aluno.pendenteComplementacao ? (
                      <p className="text-xs uppercase tracking-wider text-amber-400">Pré-cadastro</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">{aluno.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{aluno.cpf}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{aluno.telefone}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(aluno.dataNascimento)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{SEXO_LABEL[aluno.sexo] ?? aluno.sexo}</td>
              <td className="px-4 py-3">
                {aluno.status === "SUSPENSO" && aluno.suspensao ? (
                  <HoverPopover
                    content={
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Suspensão
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {aluno.suspensao.motivo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {aluno.suspensao.inicio || aluno.suspensao.fim
                            ? `${aluno.suspensao.inicio ? formatDate(aluno.suspensao.inicio) : "Imediato"} → ${aluno.suspensao.fim ? formatDate(aluno.suspensao.fim) : "Indeterminado"}`
                            : "Prazo indeterminado"}
                        </p>
                      </div>
                    }
                  >
                    <StatusBadge status={aluno.status} />
                  </HoverPopover>
                ) : (
                  <StatusBadge status={aluno.status} />
                )}
              </td>
            </>
          );
        }}
        page={metaPage}
        pageSize={metaSize}
        total={totalClientes}
        hasNext={isSearchFiltered ? false : hasNextPage}
        onPrevious={() => setParams({ page: Math.max(0, page - 1) })}
        onNext={() => setParams({ page: page + 1 })}
      />

      <ClienteResumoDialog
        isOpen={resumoDialog.isOpen}
        onOpenChange={resumoDialog.onOpenChange}
        clienteResumo={clienteResumo}
        clienteResumoPlano={clienteResumoPlano}
        clienteResumoBaseHref={clienteResumoBaseHref}
        liberandoSuspensao={liberandoSuspensao}
        onLiberarSuspensao={handleLiberarSuspensao}
        onVerPerfil={handleVerPerfil}
        onClose={resumoDialog.close}
      />
    </div>
  );
}

export function ClientesClient() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded-md bg-primary/10" />
            <div className="h-4 w-64 animate-pulse rounded-md bg-primary/10" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-md bg-primary/10" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="h-24 animate-pulse rounded-xl bg-primary/10" />
          <div className="h-24 animate-pulse rounded-xl bg-primary/10" />
          <div className="h-24 animate-pulse rounded-xl bg-primary/10" />
          <div className="h-24 animate-pulse rounded-xl bg-primary/10" />
        </div>
        <TableSkeleton
          columns={[{ label: "Cliente" }, { label: "CPF" }, { label: "Telefone" }, { label: "Nascimento" }, { label: "Sexo" }, { label: "Status" }]}
          rowCount={10}
        />
      </div>
    }>
      <ClientesPageContent />
    </Suspense>
  );
}
