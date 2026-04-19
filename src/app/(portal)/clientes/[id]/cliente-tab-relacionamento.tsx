"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/formatters";
import { formatBRL } from "@/lib/shared/formatters";
import {
  CalendarDays,
  CreditCard,
  FileText,
  Pause,
  Play,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import type { Aluno, Matricula, Pagamento } from "@/lib/types";

type TimelineEvent = {
  id: string;
  date: string;
  type: "contrato" | "pagamento" | "suspensao" | "cadastro" | "venda";
  title: string;
  description?: string;
  status?: string;
  valor?: number;
};

const EVENT_ICONS: Record<TimelineEvent["type"], React.ComponentType<{ className?: string }>> = {
  contrato: FileText,
  pagamento: CreditCard,
  suspensao: Pause,
  cadastro: UserPlus,
  venda: ShoppingCart,
};

const EVENT_COLORS: Record<TimelineEvent["type"], string> = {
  contrato: "border-gym-teal/40 bg-gym-teal/10 text-gym-teal",
  pagamento: "border-gym-accent/40 bg-gym-accent/10 text-gym-accent",
  suspensao: "border-gym-warning/40 bg-gym-warning/10 text-gym-warning",
  cadastro: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  venda: "border-violet-500/40 bg-violet-500/10 text-violet-400",
};

interface ClienteTabRelacionamentoProps {
  aluno: Aluno;
  matriculas: Matricula[];
  pagamentos: Pagamento[];
}

export function ClienteTabRelacionamento({ aluno, matriculas, pagamentos }: ClienteTabRelacionamentoProps) {
  const [filtro, setFiltro] = useState<TimelineEvent["type"] | "todos">("todos");

  const events = useMemo(() => {
    const items: TimelineEvent[] = [];

    // Cadastro
    if (aluno.dataCadastro) {
      items.push({
        id: `cadastro-${aluno.id}`,
        date: aluno.dataCadastro,
        type: "cadastro",
        title: "Cliente cadastrado",
        description: aluno.nome,
      });
    }

    // Contratos
    for (const m of matriculas) {
      items.push({
        id: `contrato-${m.id}`,
        date: m.dataInicio,
        type: "contrato",
        title: `Contrato iniciado`,
        description: `${formatDate(m.dataInicio)} a ${formatDate(m.dataFim)}`,
        status: m.status,
      });
    }

    // Pagamentos
    for (const p of pagamentos) {
      items.push({
        id: `pagamento-${p.id}`,
        date: p.dataVencimento,
        type: "pagamento",
        title: p.descricao,
        description: formatDate(p.dataVencimento),
        status: p.status,
        valor: p.valorFinal,
      });
    }

    // Suspensoes
    for (const s of aluno.suspensoes ?? []) {
      items.push({
        id: `suspensao-${s.dataRegistro}`,
        date: s.dataRegistro?.split("T")[0] ?? "",
        type: "suspensao",
        title: `Suspensao: ${s.motivo}`,
        description: s.detalhes ?? undefined,
      });
    }

    // Ordenar do mais recente para o mais antigo
    items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

    return items;
  }, [aluno, matriculas, pagamentos]);

  const filtered = filtro === "todos" ? events : events.filter((e) => e.type === filtro);

  const filterOptions: { value: TimelineEvent["type"] | "todos"; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "contrato", label: "Contratos" },
    { value: "pagamento", label: "Pagamentos" },
    { value: "suspensao", label: "Suspensoes" },
    { value: "cadastro", label: "Cadastro" },
  ];

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFiltro(opt.value)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              filtro === opt.value
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30"
            }`}
          >
            {opt.label}
            {opt.value !== "todos" && (
              <span className="ml-1 text-[10px] text-muted-foreground">
                ({events.filter((e) => e.type === opt.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-bold">Timeline</h2>
        <div className="mt-4 space-y-0">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum evento encontrado.</p>
          )}
          {filtered.map((event, index) => {
            const Icon = EVENT_ICONS[event.type];
            const colorClass = EVENT_COLORS[event.type];
            return (
              <div key={event.id} className="relative flex gap-4 pb-6">
                {/* Linha vertical */}
                {index < filtered.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                )}
                {/* Icone */}
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${colorClass}`}>
                  <Icon className="size-3.5" />
                </div>
                {/* Conteudo */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                      {event.valor != null && (
                        <p className="text-xs font-semibold text-gym-accent">{formatBRL(event.valor)}</p>
                      )}
                      {event.status && (
                        <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          event.status === "PAGO" || event.status === "ATIVA" ? "bg-gym-teal/15 text-gym-teal" :
                          event.status === "VENCIDO" || event.status === "CANCELADO" || event.status === "CANCELADA" ? "bg-gym-danger/15 text-gym-danger" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {event.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Observacoes */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-bold">Observacoes</h2>
        <div className="mt-3">
          {aluno.observacoesMedicas ? (
            <p className="text-sm text-foreground whitespace-pre-wrap">{aluno.observacoesMedicas}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma observacao registrada.</p>
          )}
        </div>
      </div>

      {/* Interesses (placeholder) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Interesses</h2>
          <button className="text-xs text-gym-accent hover:underline">Cadastrar</button>
        </div>
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">Nenhum interesse cadastrado.</p>
        </div>
      </div>
    </div>
  );
}
