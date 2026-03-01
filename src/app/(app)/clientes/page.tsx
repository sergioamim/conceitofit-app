"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { listAlunosPage, updateAluno } from "@/lib/mock/services";
import { getStore } from "@/lib/mock/store";
import { StatusBadge } from "@/components/shared/status-badge";
import { HoverPopover } from "@/components/shared/hover-popover";
import { NovoClienteWizard } from "@/components/shared/novo-cliente-wizard";
import { ClienteThumbnail } from "@/components/shared/cliente-thumbnail";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maskCPF, maskPhone } from "@/lib/utils";
import type { Aluno, StatusAluno } from "@/lib/types";

const STATUS_FILTERS: { value: StatusAluno | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ATIVO", label: "Ativos" },
  { value: "SUSPENSO", label: "Suspensos" },
  { value: "INATIVO", label: "Inativos" },
  { value: "CANCELADO", label: "Cancelados" },
];

const SEXO_LABEL: Record<string, string> = { M: "Masculino", F: "Feminino", OUTRO: "Outro" };

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function ClientesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantRef = useRef<string>(getStore().currentTenantId || getStore().tenant?.id || "");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [filtro, setFiltro] = useState<StatusAluno | "TODOS">("TODOS");
  const [busca, setBusca] = useState("");
  const [tenantId, setTenantId] = useState(() => tenantRef.current);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pageSize, setPageSize] = useState<20 | 50 | 100 | 200>(20);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalClientes, setTotalClientes] = useState(0);
  const [metaPage, setMetaPage] = useState(0);
  const [metaSize, setMetaSize] = useState(20);
  const [statusTotals, setStatusTotals] = useState({
    TODOS: 0,
    ATIVO: 0,
    SUSPENSO: 0,
    INATIVO: 0,
    CANCELADO: 0,
  });
  const [resumoOpen, setResumoOpen] = useState(false);
  const [clienteResumo, setClienteResumo] = useState<Aluno | null>(null);
  const [liberandoSuspensao, setLiberandoSuspensao] = useState(false);

  const load = useCallback(async () => {
    const paged = await listAlunosPage({
      status: filtro === "TODOS" ? undefined : filtro,
      page,
      size: pageSize,
    });

    setAlunos(paged.items);
    setHasNextPage(paged.hasNext);
    setTotalClientes(paged.total ?? paged.items.length);
    setMetaPage(paged.page);
    setMetaSize(paged.size);

    const totais = paged.totaisStatus;
    const todos = totais?.total ?? paged.total ?? paged.items.length;
    const ativos = totais?.totalAtivo ?? 0;
    const suspensos = totais?.totalSuspenso ?? 0;
    const inativos = totais?.totalInativo ?? 0;
    const cancelados = totais?.totalCancelado ?? totais?.cancelados ?? 0;

    setStatusTotals({
      TODOS: todos,
      ATIVO: ativos,
      SUSPENSO: suspensos,
      INATIVO: inativos,
      CANCELADO: cancelados,
    });
  }, [filtro, page, pageSize]);

  const syncTenantChange = useCallback(() => {
    const current = getStore().currentTenantId || getStore().tenant?.id || "";
    if (!current || current === tenantRef.current) return;
    tenantRef.current = current;
    setTenantId(current);
    setPage(0);
    setAlunos([]);
    setHasNextPage(false);
    setTotalClientes(0);
  }, []);

  useEffect(() => {
    syncTenantChange();
    function handleTenantUpdate() {
      syncTenantChange();
    }
    window.addEventListener("academia-store-updated", handleTenantUpdate);
    return () => window.removeEventListener("academia-store-updated", handleTenantUpdate);
  }, [syncTenantChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, tenantId]);
  useEffect(() => {
    const q = (searchParams.get("q") ?? "").trim();
    if (!q) return;
    const timer = window.setTimeout(() => {
      const digits = q.replace(/\D/g, "");
      if (digits && digits.length >= 11) {
        setBusca(maskCPF(digits));
        return;
      }
      setBusca(q);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const buscaDigits = busca.replace(/\D/g, "");

  const filtered = alunos.filter((a) => {
    const matchStatus = filtro === "TODOS" || a.status === filtro;
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
    const ym = new Date().toISOString().slice(0, 7);
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
    const store = getStore();
    const matriculaAtiva = store.matriculas.find(
      (item) => item.alunoId === clienteResumo.id && item.status === "ATIVA"
    );
    if (!matriculaAtiva) return null;
    const plano = store.planos.find((item) => item.id === matriculaAtiva.planoId);
    return {
      nome: plano?.nome ?? "Plano ativo",
      dataFim: matriculaAtiva.dataFim,
    };
  }, [clienteResumo]);

  const clienteResumoBaseHref = useMemo(() => {
    if (!clienteResumo) return "";
    return `/clientes/${clienteResumo.id}?tenantId=${encodeURIComponent(clienteResumo.tenantId)}`;
  }, [clienteResumo]);

  return (
    <div className="space-y-6">
      <NovoClienteWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onDone={async (created, opts) => {
          await load();
          if (created && opts?.openSale) {
            setWizardOpen(false);
            router.push(`/vendas/nova?clienteId=${encodeURIComponent(created.id)}&prefill=1`);
          }
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusTotals.TODOS} clientes cadastrados · pré-cadastro pode ser criado sem matrícula e completo depois
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="size-4" />
          Novo cliente
        </Button>
      </div>

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
              setFiltro(s.value);
              setPage(0);
            }}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === s.value
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {s.label}
              {(
                s.value === "TODOS" ||
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
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, telefone ou e-mail..."
            value={busca}
            onChange={(e) => {
              const raw = e.target.value;
              const hasLetters = /[a-zA-Z@]/.test(raw);
              if (hasLetters) {
                setBusca(raw);
                setPage(0);
                return;
              }
              const digits = raw.replace(/\D/g, "");
              if (digits.length >= 11) {
                setBusca(maskCPF(raw));
              } else {
                setBusca(maskPhone(raw));
              }
              setPage(0);
            }}
            className="w-72 bg-secondary border-border pl-8 text-sm"
          />
        </div>
        <div className="w-44">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v) as 20 | 50 | 100 | 200);
              setPage(0);
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
          router.push(`/clientes/${aluno.id}?tenantId=${encodeURIComponent(aluno.tenantId)}`)
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
                        setResumoOpen(true);
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
        itemLabel="clientes"
        hasNext={isSearchFiltered ? false : hasNextPage}
        onPrevious={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      <Dialog open={resumoOpen} onOpenChange={setResumoOpen}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resumo do Cliente</DialogTitle>
            <DialogDescription>
              Visão rápida para validar situação e plano antes de abrir o perfil completo.
            </DialogDescription>
          </DialogHeader>
          {clienteResumo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ClienteThumbnail nome={clienteResumo.nome} foto={clienteResumo.foto} size="md" />
                <div>
                  <p className="text-base font-semibold text-foreground">{clienteResumo.nome}</p>
                  <p className="text-xs text-muted-foreground">{clienteResumo.email}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Situação</p>
                  <div className="mt-2">
                    <StatusBadge status={clienteResumo.status} />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plano</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {clienteResumoPlano?.nome ?? "Sem plano ativo"}
                  </p>
                  {clienteResumoPlano?.dataFim ? (
                    <p className="mt-1 text-xs text-muted-foreground">Válido até {formatDate(clienteResumoPlano.dataFim)}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF</p>
                  <p className="mt-2 text-sm text-foreground">{clienteResumo.cpf}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</p>
                  <p className="mt-2 text-sm text-foreground">{clienteResumo.telefone}</p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={() => setResumoOpen(false)}>
              Fechar
            </Button>
            {clienteResumo?.status === "SUSPENSO" ? (
              <Button
                type="button"
                variant="outline"
                className="border-border text-gym-accent"
                onClick={async () => {
                  if (!clienteResumo || liberandoSuspensao) return;
                  const confirmar = window.confirm(
                    `Confirmar liberação da suspensão de ${clienteResumo.nome}?`
                  );
                  if (!confirmar) return;
                  try {
                    setLiberandoSuspensao(true);
                    await updateAluno(clienteResumo.id, {
                      status: "ATIVO",
                      suspensao: undefined,
                    });
                    setClienteResumo((prev) =>
                      prev ? { ...prev, status: "ATIVO", suspensao: undefined } : prev
                    );
                    await load();
                  } catch (error) {
                    console.error("[clientes] Falha ao liberar suspensão", error);
                    window.alert("Não foi possível liberar a suspensão no momento.");
                  } finally {
                    setLiberandoSuspensao(false);
                  }
                }}
                disabled={liberandoSuspensao}
              >
                {liberandoSuspensao ? "Liberando..." : "Liberar suspensão"}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => {
                if (!clienteResumoBaseHref) return;
                setResumoOpen(false);
                router.push(clienteResumoBaseHref);
              }}
            >
              Ver perfil completo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ClientesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando clientes...</div>}>
      <ClientesPageContent />
    </Suspense>
  );
}
