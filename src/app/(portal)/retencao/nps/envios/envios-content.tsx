"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Frown, Meh, Smile } from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  listNpsEnviosApi,
  type NpsEnvio,
  type StatusEnvio,
} from "@/lib/api/nps";
import { formatDateTime } from "@/lib/formatters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const enviosKeys = {
  list: (tenantId: string, status?: StatusEnvio, alunoId?: string) =>
    ["nps", "envios", tenantId, status ?? "all", alunoId ?? "all"] as const,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: StatusEnvio | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "RESPONDIDA", label: "Respondida" },
  { value: "EXPIRADA", label: "Expirada" },
  { value: "CANCELADA", label: "Cancelada" },
];

function statusBadge(status: StatusEnvio) {
  const map: Record<StatusEnvio, string> = {
    ENVIADA: "bg-gym-accent/15 text-gym-accent",
    RESPONDIDA: "bg-gym-teal/15 text-gym-teal",
    EXPIRADA: "bg-muted text-muted-foreground",
    CANCELADA: "bg-gym-danger/15 text-gym-danger",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

function classificacaoBadge(classificacao: string | null) {
  if (!classificacao) return <span className="text-muted-foreground">—</span>;
  switch (classificacao) {
    case "PROMOTOR":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gym-teal/15 px-2.5 py-0.5 text-xs font-bold text-gym-teal">
          <Smile size={12} /> Promotor
        </span>
      );
    case "NEUTRO":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
          <Meh size={12} /> Neutro
        </span>
      );
    case "DETRATOR":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gym-danger/15 px-2.5 py-0.5 text-xs font-bold text-gym-danger">
          <Frown size={12} /> Detrator
        </span>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EnviosContent({
  initialData,
}: {
  initialData: NpsEnvio[] | null;
}) {
  const { tenantId } = useTenantContext();
  const [statusFilter, setStatusFilter] = useState<StatusEnvio | "ALL">("ALL");
  const [alunoSearch, setAlunoSearch] = useState("");

  const effectiveStatus =
    statusFilter === "ALL" ? undefined : statusFilter;
  const effectiveAluno = alunoSearch.trim() || undefined;

  const {
    data: envios = [],
    isLoading,
    error,
  } = useQuery<NpsEnvio[]>({
    queryKey: enviosKeys.list(
      tenantId ?? "",
      effectiveStatus,
      effectiveAluno,
    ),
    queryFn: () =>
      listNpsEnviosApi({
        tenantId: tenantId!,
        status: effectiveStatus,
        alunoId: effectiveAluno,
      }),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    initialData: initialData ?? undefined,
  });

  if (isLoading && envios.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
        Carregando envios...
      </div>
    );
  }

  if (error && envios.length === 0) {
    return <ListErrorState error={normalizeErrorMessage(error)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Envios NPS
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historico de pesquisas enviadas e respostas recebidas.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_auto]">
          <Input
            value={alunoSearch}
            onChange={(e) => setAlunoSearch(e.target.value)}
            placeholder="Buscar por ID do aluno..."
            className="bg-secondary border-border"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as StatusEnvio | "ALL")
            }
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-border"
            onClick={() => {
              setStatusFilter("ALL");
              setAlunoSearch("");
            }}
          >
            Limpar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Campanha
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Aluno
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Canal
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Nota
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Classificacao
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Comentario
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Enviado em
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Respondido em
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {envios.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhum envio encontrado.
                </td>
              </tr>
            )}
            {envios.map((envio) => (
              <tr
                key={envio.id}
                className="transition-colors hover:bg-secondary/30"
              >
                <td className="px-4 py-3 font-medium">{envio.campanha}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{envio.alunoNome}</p>
                  <p className="text-xs text-muted-foreground">
                    {envio.alunoId}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {envio.canal}
                </td>
                <td className="px-4 py-3">{statusBadge(envio.status)}</td>
                <td className="px-4 py-3">
                  {envio.notaNps != null ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        envio.notaNps <= 6
                          ? "bg-gym-danger/15 text-gym-danger"
                          : envio.notaNps <= 8
                            ? "bg-gym-warning/15 text-gym-warning"
                            : "bg-gym-teal/15 text-gym-teal"
                      }`}
                    >
                      {envio.notaNps}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {classificacaoBadge(envio.classificacao)}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                  {envio.comentario ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(envio.enviadoEm)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(envio.respondidoEm)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
