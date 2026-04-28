"use client";

import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/formatters";
import {
  ShieldCheck,
  Calendar,
  Activity,
  AlertTriangle,
  CreditCard,
  TrendingDown,
  ClipboardList,
  Gift,
  Users,
  type LucideIcon,
} from "lucide-react";

export type SinalTom = "neutro" | "ok" | "atencao" | "critico" | "vazio";

export interface Sinal {
  key: string;
  icon?: LucideIcon;
  label: string;
  valor: string;
  hint?: string;
  tom?: SinalTom;
  /** Sinal placeholder sem dado disponível ainda; renderiza visualmente esmaecido, sem hover/click. */
  disabled?: boolean;
}

const toneClasses: Record<SinalTom, { label: string; valor: string; border: string }> = {
  neutro: {
    label: "text-muted-foreground",
    valor: "text-foreground",
    border: "border-border",
  },
  ok: {
    label: "text-gym-teal",
    valor: "text-gym-teal",
    border: "border-gym-teal/40",
  },
  atencao: {
    label: "text-gym-warning",
    valor: "text-gym-warning",
    border: "border-gym-warning/40",
  },
  critico: {
    label: "text-gym-danger",
    valor: "text-gym-danger",
    border: "border-gym-danger/40",
  },
  vazio: {
    label: "text-muted-foreground",
    valor: "text-muted-foreground",
    border: "border-border border-dashed",
  },
};

export function ClienteSinaisRail({ sinais }: { sinais: Sinal[] }) {
  if (sinais.length === 0) return null;

  return (
    <div
      className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-6"
      role="list"
      aria-label="Sinais de saúde do cliente"
    >
      {sinais.map((s) => {
        const tom = toneClasses[s.tom ?? "neutro"];
        const Icon = s.icon;
        const disabled = !!s.disabled;
        return (
          <div
            key={s.key}
            role="listitem"
            data-disabled={disabled || undefined}
            title={disabled ? "Em breve" : undefined}
            className={cn(
              "flex min-w-[160px] shrink-0 snap-start flex-col rounded-xl border bg-card p-3 sm:min-w-0",
              tom.border,
              disabled && "pointer-events-none cursor-not-allowed border-dashed opacity-50 select-none"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider",
                disabled ? "text-muted-foreground" : tom.label
              )}
            >
              {Icon ? <Icon className="size-3 shrink-0" /> : null}
              <span className="truncate">{s.label}</span>
            </div>
            <div
              className={cn(
                "mt-1 font-display text-lg font-bold leading-tight tracking-tight",
                disabled ? "text-muted-foreground" : tom.valor
              )}
            >
              {s.valor}
            </div>
            {s.hint ? (
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{s.hint}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Exportando os ícones já mapeados para os sinais padrão, evitando que o
 * page.tsx precise importar lucide diretamente só para alimentar o rail.
 */
export const SinaisIcons = {
  contrato: ShieldCheck,
  cobranca: Calendar,
  frequencia: Activity,
  pendencia: AlertTriangle,
  saldo: CreditCard,
  semFrequencia: TrendingDown,
  avaliacao: ClipboardList,
  fidelidade: Gift,
  convidados: Users,
} as const;

// ---------------------------------------------------------------------------
// Builder dos sinais — Perfil v3 Wave 1 (AC1.2). Slots sem dado são omitidos
// conforme AC3.8. Implementação determinística a partir do payload disponível
// no `useClienteWorkspace`.
// ---------------------------------------------------------------------------

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export interface BuildSinaisInput {
  planoAtivo: { dataFim: string } | null;
  planoAtivoInfo: { nome?: string } | null;
  agregadorVinculos?: Array<{ agregador: string; usuarioExternoId: string; status?: string }>;
  presencas: Array<{ data: string }>;
  pagamentos: Array<{ status: string; dataVencimento: string; valor?: number }>;
  saldo: number;
  recorrente: { data: string; plano: { nome: string }; valor: number } | null;
  /**
   * `true` quando o cliente tem pelo menos 1 avaliação física registrada.
   * Sem dado, o sinal "Avaliação" é omitido do rail (decisão de produto
   * 2026-04-22: não poluir com placeholder "Em breve").
   * Backend pendente: endpoint de avaliações ainda não consumido no workspace.
   */
  temAvaliacoes?: boolean;
  /**
   * `true` quando o plano ATIVO do cliente permite convidados.
   * Sem flag `permiteConvidados` no Plano hoje, permanece false → sinal omitido.
   * Backend pendente: adicionar `permite_convidados` em `plano_extra` quando
   * o produto de convidados for implementado.
   */
  planoPermiteConvidados?: boolean;
}

export function buildSinaisCliente(input: BuildSinaisInput): Sinal[] {
  const now = new Date();
  const sinais: Sinal[] = [];
  const agregadorAtivo = input.agregadorVinculos?.find((item) => item.status === "ATIVO") ?? null;
  const agregadorLabel = agregadorAtivo
    ? ({
        WELLHUB: "Wellhub",
        TOTALPASS: "TotalPass",
        OUTRO: "Agregador",
      } as const)[agregadorAtivo.agregador as "WELLHUB" | "TOTALPASS" | "OUTRO"] ?? "Agregador"
    : null;

  // 1. Contrato
  if (input.planoAtivo) {
    const fim = parseLocalDate(input.planoAtivo.dataFim);
    const dias = Math.floor((fim.getTime() - now.getTime()) / 86400000);
    if (dias < 0) {
      sinais.push({
        key: "contrato",
        icon: SinaisIcons.contrato,
        label: "Contrato",
        valor: `Venceu há ${-dias}d`,
        hint: input.planoAtivoInfo?.nome,
        tom: "critico",
      });
    } else {
      sinais.push({
        key: "contrato",
        icon: SinaisIcons.contrato,
        label: "Contrato",
        valor: dias === 0 ? "Vence hoje" : `${dias} dia${dias !== 1 ? "s" : ""}`,
        hint: input.planoAtivoInfo?.nome,
        tom: dias <= 14 ? "atencao" : "ok",
      });
    }
  } else if (agregadorAtivo) {
    sinais.push({
      key: "contrato",
      icon: SinaisIcons.contrato,
      label: "Vínculo",
      valor: `${agregadorLabel} ativo`,
      hint: agregadorAtivo.usuarioExternoId,
      tom: "ok",
    });
  } else {
    sinais.push({
      key: "contrato",
      icon: SinaisIcons.contrato,
      label: "Contrato",
      valor: "Sem contrato",
      tom: "atencao",
    });
  }

  // 2. Frequência (treinos no mês corrente)
  const anoRef = now.getFullYear();
  const mesRef = now.getMonth();
  const treinosMes = input.presencas.filter((p) => {
    const d = parseLocalDate(p.data);
    return d.getFullYear() === anoRef && d.getMonth() === mesRef;
  }).length;

  const ultimaVisita = input.presencas.length
    ? input.presencas.reduce((latest, p) =>
        parseLocalDate(p.data) > parseLocalDate(latest.data) ? p : latest
      )
    : null;
  const diasSemVisita = ultimaVisita
    ? Math.floor((now.getTime() - parseLocalDate(ultimaVisita.data).getTime()) / 86400000)
    : null;

  sinais.push({
    key: "frequencia",
    icon: SinaisIcons.frequencia,
    label: "Frequência",
    valor: `${treinosMes} treino${treinosMes !== 1 ? "s" : ""}`,
    hint:
      diasSemVisita === null
        ? "sem histórico"
        : diasSemVisita === 0
        ? "última visita hoje"
        : `última visita há ${diasSemVisita}d`,
    tom: treinosMes === 0 ? "critico" : treinosMes < 4 ? "atencao" : "ok",
  });

  // 3. Pendência financeira (ou saldo, ou "sem pendência")
  const vencidos = input.pagamentos.filter((p) => p.status === "VENCIDO");
  if (vencidos.length > 0) {
    const totalVencido = vencidos.reduce((acc, p) => acc + (p.valor ?? 0), 0);
    sinais.push({
      key: "pendencia",
      icon: SinaisIcons.pendencia,
      label: "Pendência",
      valor:
        totalVencido > 0
          ? formatBRL(totalVencido)
          : `${vencidos.length} vencido${vencidos.length > 1 ? "s" : ""}`,
      hint: `${vencidos.length} boleto${vencidos.length > 1 ? "s" : ""} vencido${vencidos.length > 1 ? "s" : ""}`,
      tom: "critico",
    });
  } else if (input.saldo < 0) {
    // Saldo devedor real (cliente deve pra academia)
    sinais.push({
      key: "saldo",
      icon: SinaisIcons.saldo,
      label: "Saldo devedor",
      valor: formatBRL(Math.abs(input.saldo)),
      tom: "atencao",
    });
  } else {
    // saldo === 0 OU saldo > 0 → "Sem pendência".
    // Saldo positivo NÃO é crédito a favor — é o resultado de "pago - aberto"
    // (sempre positivo quando há histórico de pagamentos quitados sem dívidas).
    // Crédito real (sobra/refund/nota de crédito) virá em feature dedicada.
    sinais.push({
      key: "pendencia",
      icon: SinaisIcons.pendencia,
      label: "Pendência",
      valor: "Sem pendência",
      tom: "ok",
    });
  }

  // 4. Próxima cobrança — só aparece se o plano atual for recorrente.
  //    Sem recorrência, o sinal é OMITIDO (decisão 2026-04-22: não poluir
  //    com placeholder "—/sem recorrência" que não agrega ao operador).
  if (input.recorrente) {
    sinais.push({
      key: "proxima-cobranca",
      icon: SinaisIcons.cobranca,
      label: "Próx. cobrança",
      valor: parseLocalDate(input.recorrente.data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      hint: formatBRL(input.recorrente.valor),
      tom: "neutro",
    });
  }

  // 5. Avaliação — aparece só quando há histórico de avaliação registrada.
  //    Até o workspace puxar `avaliacoes`, `temAvaliacoes` vem false e o
  //    sinal é omitido. Quando habilitarmos: valor = "N avaliações" ou
  //    "última em DD/MM" dependendo do design final.
  if (input.temAvaliacoes) {
    sinais.push({
      key: "avaliacao",
      icon: SinaisIcons.avaliacao,
      label: "Avaliação",
      valor: "Em dia",
      tom: "ok",
    });
  }

  // 6. Fidelidade — sempre visível. Dado ainda não disponível do backend,
  //    mantido como placeholder por decisão de produto (2026-04-22:
  //    "fidelidade pode manter assim") até o módulo de pontos ir pro ar.
  sinais.push({
    key: "fidelidade",
    icon: SinaisIcons.fidelidade,
    label: "Fidelidade",
    valor: "Em breve",
    hint: "backend pendente",
    tom: "vazio",
    disabled: true,
  });

  // 7. Convidados — aparece só se o plano ativo permite convidados.
  //    Flag ainda não existe em `plano_extra` (backend pendente); enquanto
  //    `planoPermiteConvidados` vier false, o sinal é omitido.
  if (input.planoPermiteConvidados) {
    sinais.push({
      key: "convidados",
      icon: SinaisIcons.convidados,
      label: "Convidados",
      valor: "Disponível",
      tom: "ok",
    });
  }

  return sinais;
}
