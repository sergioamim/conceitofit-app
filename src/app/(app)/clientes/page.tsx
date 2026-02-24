"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { listAlunosPage } from "@/lib/mock/services";
import { StatusBadge } from "@/components/shared/status-badge";
import { HoverPopover } from "@/components/shared/hover-popover";
import { NovoClienteWizard } from "@/components/shared/novo-cliente-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const AVATAR_COLORS = ["#c8f135", "#3de8a0", "#38bdf8", "#f472b6", "#fb923c", "#a78bfa"];

function getInitials(nome: string) {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function avatarColor(nome: string) {
  let hash = 0;
  for (const c of nome) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function ClientesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [filtro, setFiltro] = useState<StatusAluno | "TODOS">("TODOS");
  const [busca, setBusca] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pageSize, setPageSize] = useState<20 | 50 | 100 | 200>(20);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [statusTotals, setStatusTotals] = useState({
    TODOS: 0,
    ATIVO: 0,
    SUSPENSO: 0,
    INATIVO: 0,
    CANCELADO: 0,
  });

  const load = useCallback(async () => {
    const paged = await listAlunosPage({
      status: filtro === "TODOS" ? undefined : filtro,
      page,
      size: pageSize,
    });
    setAlunos(paged.items);
    setHasNextPage(paged.hasNext);
  }, [filtro, page, pageSize]);

  const loadTotals = useCallback(async () => {
    async function countByStatus(status?: StatusAluno): Promise<number> {
      const paged = await listAlunosPage({
        status,
        page: 1,
        size: 200,
      });
      return paged.items.length;
    }

    const [todos, ativos, suspensos, inativos] = await Promise.all([
      countByStatus(undefined),
      countByStatus("ATIVO"),
      countByStatus("SUSPENSO"),
      countByStatus("INATIVO"),
    ]);
    setStatusTotals({
      TODOS: todos,
      ATIVO: ativos,
      SUSPENSO: suspensos,
      INATIVO: inativos,
      CANCELADO: Math.max(0, todos - ativos - suspensos - inativos),
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTotals();
  }, [loadTotals]);
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
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + filtered.length;
  const displayed = filtered;

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

  return (
    <div className="space-y-6">
      <NovoClienteWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onDone={async () => {
          await load();
          await loadTotals();
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusTotals.TODOS} clientes cadastrados · cadastro direto já cria matrícula e pagamento
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
              setPage(1);
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
                setPage(1);
                return;
              }
              const digits = raw.replace(/\D/g, "");
              if (digits.length >= 11) {
                setBusca(maskCPF(raw));
              } else {
                setBusca(maskPhone(raw));
              }
              setPage(1);
            }}
            className="w-72 bg-secondary border-border pl-8 text-sm"
          />
        </div>
        <div className="w-44">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v) as 20 | 50 | 100 | 200);
              setPage(1);
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
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              {["Cliente", "CPF", "Telefone", "Nascimento", "Sexo", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayed.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</td></tr>
            )}
            {displayed.map((a) => {
              const color = avatarColor(a.nome);
              return (
                <tr
                  key={a.id}
                  className="cursor-pointer transition-colors hover:bg-secondary/40"
                  onClick={() => router.push(`/clientes/${a.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: color + "33", color }}>
                        {getInitials(a.nome)}
                      </div>
                      <div>
                        <Link
                          href={`/clientes/${a.id}`}
                          className="text-sm font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {a.nome}
                        </Link>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{a.cpf}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{a.telefone}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(a.dataNascimento)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{SEXO_LABEL[a.sexo] ?? a.sexo}</td>
                  <td className="px-4 py-3">
                    {a.status === "SUSPENSO" && a.suspensao ? (
                      <HoverPopover
                        content={
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Suspensão
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {a.suspensao.motivo}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {a.suspensao.inicio || a.suspensao.fim
                                ? `${a.suspensao.inicio ? formatDate(a.suspensao.inicio) : "Imediato"} → ${a.suspensao.fim ? formatDate(a.suspensao.fim) : "Indeterminado"}`
                                : "Prazo indeterminado"}
                            </p>
                          </div>
                        }
                      >
                        <StatusBadge status={a.status} />
                      </HoverPopover>
                    ) : (
                      <StatusBadge status={a.status} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{filtered.length === 0 ? 0 : startIndex + 1}</span> até{" "}
          <span className="font-semibold text-foreground">{endIndex}</span> · página{" "}
          <span className="font-semibold text-foreground">{page}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-border"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-border"
            disabled={!hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
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
