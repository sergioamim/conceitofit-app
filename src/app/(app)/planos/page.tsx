"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Pencil, Power, Star } from "lucide-react";
import {
  listPlanos,
  listAtividades,
  createPlano,
  updatePlano,
  togglePlanoAtivo,
  togglePlanoDestaque,
} from "@/lib/mock/services";
import type { Plano, Atividade, TipoPlano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlanoModal, type PlanoForm } from "@/components/shared/plano-modal";
import { cn } from "@/lib/utils";

const TIPO_LABEL: Record<TipoPlano, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  AVULSO: "Avulso",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plano | undefined>(undefined);
  const [filtroAtivo, setFiltroAtivo] = useState<"ATIVOS" | "TODOS">("ATIVOS");

  useEffect(() => {
    Promise.all([listPlanos(), listAtividades()]).then(([pls, atv]) => {
      setPlanos(pls);
      setAtividades(atv);
    });
  }, []);

  async function reload() {
    const [pls, atv] = await Promise.all([listPlanos(), listAtividades()]);
    setPlanos(pls);
    setAtividades(atv);
  }

  async function handleSave(data: PlanoForm, id?: string) {
    const payload = {
      nome: data.nome,
      descricao: data.descricao || undefined,
      tipo: data.tipo,
      duracaoDias: parseInt(data.duracaoDias, 10) || 0,
      valor: parseFloat(data.valor) || 0,
      valorMatricula: parseFloat(data.valorMatricula) || 0,
      cobraAnuidade: data.cobraAnuidade,
      valorAnuidade: data.cobraAnuidade ? parseFloat(data.valorAnuidade) || 0 : undefined,
      parcelasMaxAnuidade: data.cobraAnuidade ? Math.max(1, parseInt(data.parcelasMaxAnuidade, 10) || 1) : undefined,
      permiteRenovacaoAutomatica: data.tipo === "AVULSO" ? false : data.permiteRenovacaoAutomatica,
      permiteCobrancaRecorrente: data.tipo === "AVULSO" ? false : data.permiteCobrancaRecorrente,
      diaCobrancaPadrao:
        data.tipo === "AVULSO" || !data.permiteCobrancaRecorrente
          ? undefined
          : Math.min(28, Math.max(1, parseInt(data.diaCobrancaPadrao, 10) || 1)),
      atividades: data.atividades,
      beneficios: data.beneficios,
      destaque: data.destaque,
      ordem: data.ordem ? parseInt(data.ordem, 10) : undefined,
    };
    if (id) {
      await updatePlano(id, payload);
    } else {
      await createPlano(payload);
    }
    setModalOpen(false);
    setEditing(undefined);
    reload();
  }

  async function handleToggleAtivo(id: string) {
    await togglePlanoAtivo(id);
    reload();
  }

  async function handleToggleDestaque(id: string) {
    await togglePlanoDestaque(id);
    reload();
  }

  const planosFiltrados =
    filtroAtivo === "ATIVOS" ? planos.filter((p) => p.ativo) : planos;

  return (
    <div className="space-y-6">
      <PlanoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(undefined);
        }}
        onSave={handleSave}
        atividades={atividades}
        initial={editing}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Planos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Planos disponíveis para matrícula
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {planosFiltrados.length} planos
          {filtroAtivo === "ATIVOS" ? " ativos" : " cadastrados"}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value as "ATIVOS" | "TODOS")}
            className="h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
          >
            <option value="ATIVOS">Mostrar ativos</option>
            <option value="TODOS">Mostrar todos</option>
          </select>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            Novo Plano
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {planosFiltrados.map((p) => (
          <div
            key={p.id}
            className={cn(
              "relative rounded-xl border p-5 transition-all",
              p.destaque
                ? "border-gym-accent bg-gym-accent/5"
                : "border-border bg-card",
              !p.ativo && "opacity-60"
            )}
          >
            {p.destaque && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-gym-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
                Popular
              </span>
            )}

            <div className="absolute right-3 top-3 flex gap-1.5">
              <button
                onClick={() => {
                  setEditing(p);
                  setModalOpen(true);
                }}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-3" />
              </button>
              <button
                onClick={() => handleToggleDestaque(p.id)}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Star className="size-3" />
              </button>
              <button
                onClick={() => handleToggleAtivo(p.id)}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Power className="size-3" />
              </button>
            </div>

            <div className="font-display text-lg font-bold">{p.nome}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {TIPO_LABEL[p.tipo]} · {p.duracaoDias} dias
            </div>

            <div className="mt-4">
              <span
                className={cn(
                  "font-display text-3xl font-extrabold",
                  p.destaque ? "text-gym-accent" : "text-foreground"
                )}
              >
                {formatBRL(p.valor)}
              </span>
              <span className="text-xs text-muted-foreground"> / plano</span>
            </div>

            {p.valorMatricula > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                + {formatBRL(p.valorMatricula)} de matrícula
              </p>
            )}
            {p.cobraAnuidade && (p.valorAnuidade ?? 0) > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                + {formatBRL(Number(p.valorAnuidade ?? 0))} de anuidade
                {(p.parcelasMaxAnuidade ?? 1) > 1 ? ` (até ${p.parcelasMaxAnuidade}x)` : ""}
              </p>
            )}

            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>
                Renovação automática:{" "}
                <span className={p.permiteRenovacaoAutomatica ? "text-gym-teal" : "text-gym-danger"}>
                  {p.permiteRenovacaoAutomatica ? "Permitida" : "Não permitida"}
                </span>
              </p>
              <p>
                Cobrança recorrente:{" "}
                <span className={p.permiteCobrancaRecorrente ? "text-gym-teal" : "text-gym-danger"}>
                  {p.permiteCobrancaRecorrente ? "Permitida" : "Não permitida"}
                </span>
                {p.permiteCobrancaRecorrente && p.diaCobrancaPadrao
                  ? ` · dia ${p.diaCobrancaPadrao}`
                  : ""}
              </p>
            </div>

            {p.beneficios && p.beneficios.length > 0 && (
              <ul className="mt-4 space-y-2">
                {p.beneficios.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-3 shrink-0 text-gym-teal" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.ativo ? "Ativo" : "Inativo"}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Plano
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duração
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Matrícula
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Anuidade
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Renovação
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cobrança recorrente
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Destaque
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {planosFiltrados.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium text-sm">{p.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {TIPO_LABEL[p.tipo]}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.duracaoDias} dias
                </td>
                <td className="px-4 py-3 font-display font-bold text-gym-accent">
                  {formatBRL(p.valor)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.valorMatricula > 0 ? formatBRL(p.valorMatricula) : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.cobraAnuidade && (p.valorAnuidade ?? 0) > 0
                    ? `${formatBRL(Number(p.valorAnuidade ?? 0))}${(p.parcelasMaxAnuidade ?? 1) > 1 ? ` · até ${p.parcelasMaxAnuidade}x` : ""}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.permiteRenovacaoAutomatica ? "Sim" : "Não"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.permiteCobrancaRecorrente
                    ? `Sim${p.diaCobrancaPadrao ? ` · dia ${p.diaCobrancaPadrao}` : ""}`
                    : "Não"}
                </td>
                <td className="px-4 py-3">
                  {p.destaque ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gym-accent/15 px-2 py-0.5 text-[11px] font-semibold text-gym-accent">
                      <Check className="size-3" /> Popular
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
