"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { listAlunos } from "@/lib/mock/services";
import { StatusBadge } from "@/components/shared/status-badge";
import { HoverPopover } from "@/components/shared/hover-popover";
import { NovoClienteWizard } from "@/components/shared/novo-cliente-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
const TIPO_PLANO_LABEL: Record<string, string> = { MENSAL: "Mensal", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral", ANUAL: "Anual", AVULSO: "Avulso" };

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

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClientesPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [filtro, setFiltro] = useState<StatusAluno | "TODOS">("TODOS");
  const [busca, setBusca] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  async function load() {
    listAlunos().then(setAlunos);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    function handleUpdate() {
      load();
    }
    function handleStorage() {
      load();
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

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
      <NovoClienteWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onDone={load} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {alunos.length} clientes cadastrados · cadastro direto já cria matrícula e pagamento
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
            <button key={s.value} onClick={() => setFiltro(s.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === s.value
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {s.label}
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
                return;
              }
              const digits = raw.replace(/\D/g, "");
              if (digits.length >= 11) {
                setBusca(maskCPF(raw));
              } else {
                setBusca(maskPhone(raw));
              }
            }}
            className="w-72 bg-secondary border-border pl-8 text-sm"
          />
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
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</td></tr>
            )}
            {filtered.map((a) => {
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
    </div>
  );
}
