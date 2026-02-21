"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  listMatriculas,
  cancelarMatricula,
  renovarMatricula,
  listConvenios,
} from "@/lib/mock/services";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { NovaMatriculaModal } from "@/components/shared/nova-matricula-modal";
import type { Matricula, Aluno, Plano, StatusMatricula, Convenio } from "@/lib/types";

type MatriculaWithRefs = Matricula & { aluno?: Aluno; plano?: Plano };

const STATUS_FILTERS: { value: StatusMatricula | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todas" },
  { value: "ATIVA", label: "Ativas" },
  { value: "VENCIDA", label: "Vencidas" },
  { value: "CANCELADA", label: "Canceladas" },
  { value: "SUSPENSA", label: "Suspensas" },
];

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function daysUntil(d: string) {
  const diff = new Date(d + "T00:00:00").getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


export default function MatriculasPage() {
  const searchParams = useSearchParams();
  const [matriculas, setMatriculas] = useState<MatriculaWithRefs[]>([]);
  const [filtro, setFiltro] = useState<StatusMatricula | "TODOS">("TODOS");
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const [novaOpen, setNovaOpen] = useState(false);
  const [filtroConvenio, setFiltroConvenio] = useState<"TODOS" | "COM" | "SEM">("TODOS");
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [autoOpenDone, setAutoOpenDone] = useState(false);
  const prefillClienteId = searchParams.get("clienteId") ?? "";

  async function load() {
    const [data, cvs] = await Promise.all([listMatriculas(), listConvenios()]);
    setMatriculas(data);
    setConvenios(cvs);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (prefillClienteId && !autoOpenDone) {
      setNovaOpen(true);
      setAutoOpenDone(true);
    }
  }, [prefillClienteId, autoOpenDone]);

  const filteredBase =
    filtro === "TODOS"
      ? matriculas
      : matriculas.filter((m) => m.status === filtro);

  const filtered = filteredBase.filter((m) => {
    if (filtroConvenio === "COM" && !m.convenioId) return false;
    if (filtroConvenio === "SEM" && m.convenioId) return false;
    const d = new Date(m.dataInicio + "T00:00:00");
    return d.getMonth() === mes && d.getFullYear() === ano;
  });

  async function handleCancel(id: string) {
    if (!confirm("Cancelar esta matrícula?")) return;
    await cancelarMatricula(id);
    load();
  }

  async function handleRenovar(id: string) {
    await renovarMatricula(id);
    load();
  }

  return (
    <div className="space-y-6">
      <NovaMatriculaModal
        open={novaOpen}
        onClose={() => setNovaOpen(false)}
        onDone={load}
        prefillClienteId={prefillClienteId}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Matrículas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {matriculas.length} matrículas no total
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setNovaOpen(true)}>Nova matrícula</Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFiltro(s.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === s.value
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() =>
              setFiltroConvenio((v) => (v === "COM" ? "TODOS" : "COM"))
            }
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtroConvenio === "COM"
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            Convênio
          </button>
        </div>
        <MonthYearPicker
          month={mes}
          year={ano}
          onChange={(next) => {
            setMes(next.month);
            setAno(next.year);
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Plano
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Período
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pagamento
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Convênio
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhuma matrícula encontrada
                </td>
              </tr>
            )}
            {filtered.map((m) => {
              const dias = daysUntil(m.dataFim);
              const isExpiringSoon = m.status === "ATIVA" && dias >= 0 && dias <= 7;
              return (
                <tr key={m.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">
                      {m.aluno?.nome ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.aluno?.cpf ?? ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {m.plano?.nome ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">
                      {formatDate(m.dataInicio)} → {formatDate(m.dataFim)}
                    </p>
                    {isExpiringSoon && (
                      <p className="text-xs text-gym-warning">
                        Vence em {dias} dia{dias !== 1 ? "s" : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-display font-bold text-sm text-gym-accent">
                      {formatBRL(m.valorPago)}
                    </p>
                    {m.desconto > 0 && (
                      <p className="text-xs text-muted-foreground">
                        desc. {formatBRL(m.desconto)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {FORMA_PAGAMENTO_LABEL[m.formaPagamento] ?? m.formaPagamento}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {m.convenioId ? (() => {
                      const conv = convenios.find((c) => c.id === m.convenioId);
                      const title = conv
                        ? `${conv.nome} · ${conv.descontoPercentual}%`
                        : "Convênio aplicado";
                      return (
                        <span
                          title={title}
                          className="inline-flex items-center justify-center rounded-full bg-gym-teal/15 px-2 py-0.5 text-xs text-gym-teal"
                        >
                          ✓
                        </span>
                      );
                    })() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3">
                    {m.status === "ATIVA" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRenovar(m.id)}
                          className="h-7 text-xs"
                        >
                          Renovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(m.id)}
                          className="h-7 border-gym-danger/30 text-xs text-gym-danger hover:border-gym-danger/60 hover:bg-gym-danger/10"
                        >
                          Cancelar
                        </Button>
                      </div>
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
