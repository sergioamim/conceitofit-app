"use client";

import type { Aluno } from "@/lib/types";
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  Lock,
  Clock,
  TrendingDown,
  Camera,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Status banners do perfil do cliente — agora embutidos no ClienteHeader
 * (hero) como chips compactos no canto inferior direito da barra.
 *
 * Regras de produto (2026-04-22):
 *  - "Contrato vence em X dias" só aparece quando `daysUntilEnd <= 3` (antes era 30).
 *  - "Cliente sem pendências" é icon-only (checkmark verde) — sem texto no chip.
 *  - "Acesso liberado", "Sem frequência há X dias" e demais mantêm texto.
 *  - Ordenação visual é direita→esquerda (flex-row-reverse), prioridade a
 *    sinais críticos (vermelho) aparecer primeiro na leitura natural.
 */

export type BannerVariant = "green" | "red" | "yellow" | "orange" | "blue";

export interface BannerData {
  key: string;
  icon: LucideIcon;
  /** Texto do chip. Omitido quando `iconOnly === true`. */
  text: string;
  variant: BannerVariant;
  /** Quando true, renderiza só o ícone (sem texto). Ex.: "sem pendências". */
  iconOnly?: boolean;
}

export interface ComputeClienteBannersInput {
  aluno: Aluno;
  suspenso: boolean;
  pendenteFinanceiro: boolean;
  planoAtivo?: { dataFim: string } | null;
  presencas: Array<{ data: string }>;
  pagamentos: Array<{ status: string; dataVencimento: string }>;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Função pura: dado o estado do cliente, retorna a lista ordenada de banners
 * a exibir. Prioridade visual (primeiros elementos = mais críticos; com
 * flex-row-reverse viram os mais à direita no rendering).
 */
export function computeClienteBanners(
  input: ComputeClienteBannersInput,
): BannerData[] {
  const { aluno, suspenso, pendenteFinanceiro, planoAtivo, presencas, pagamentos } = input;
  const now = new Date();
  const result: BannerData[] = [];

  const vencidos = pagamentos.filter((p) => p.status === "VENCIDO");

  // Vermelhos (críticos) — primeiro na lista.
  if (vencidos.length > 0) {
    const oldestVencido = vencidos.reduce((oldest, p) => {
      const d = parseLocalDate(p.dataVencimento);
      const o = parseLocalDate(oldest.dataVencimento);
      return d < o ? p : oldest;
    });
    const days = daysBetween(parseLocalDate(oldestVencido.dataVencimento), now);
    result.push({
      key: "inadimplente",
      icon: AlertTriangle,
      text: `Inadimplente há ${days} dia${days !== 1 ? "s" : ""}`,
      variant: "red",
    });
  }

  if (suspenso || aluno.status === "SUSPENSO") {
    result.push({
      key: "acesso-bloqueado",
      icon: Lock,
      text: "Acesso bloqueado",
      variant: "red",
    });
  }

  // Amarelo — contrato vencendo em ≤3 dias (antes era ≤30).
  if (planoAtivo?.dataFim) {
    const fimDate = parseLocalDate(planoAtivo.dataFim);
    const daysUntilEnd = daysBetween(now, fimDate);
    if (daysUntilEnd >= 0 && daysUntilEnd <= 3) {
      result.push({
        key: "contrato-vencendo",
        icon: Clock,
        text: `Contrato vence em ${daysUntilEnd} dia${daysUntilEnd !== 1 ? "s" : ""}`,
        variant: "yellow",
      });
    }
  }

  // Laranja — sem frequência (aparece tanto quando nunca houve presença
  // quanto quando a última foi há mais de 14 dias).
  if (presencas.length === 0) {
    result.push({
      key: "sem-frequencia",
      icon: TrendingDown,
      text: "Sem frequência registrada",
      variant: "orange",
    });
  } else {
    const lastPresenca = presencas.reduce((latest, p) => {
      const d = parseLocalDate(p.data);
      const l = parseLocalDate(latest.data);
      return d > l ? p : latest;
    });
    const daysSinceLast = daysBetween(parseLocalDate(lastPresenca.data), now);
    if (daysSinceLast > 14) {
      result.push({
        key: "sem-frequencia",
        icon: TrendingDown,
        text: `Sem frequência há ${daysSinceLast} dias`,
        variant: "orange",
      });
    }
  }

  // Azul — face não sincronizada.
  if (!aluno.foto) {
    result.push({
      key: "face-nao-sincronizada",
      icon: Camera,
      text: "Face não sincronizada",
      variant: "blue",
    });
  }

  // Verdes (positivos) — por último; com flex-row-reverse ficam à esquerda.
  if (aluno.status === "ATIVO" && !suspenso && !pendenteFinanceiro) {
    result.push({
      key: "acesso-liberado",
      icon: ShieldCheck,
      text: "Acesso liberado",
      variant: "green",
    });
  }

  if (vencidos.length === 0) {
    result.push({
      key: "sem-pendencias",
      icon: Check,
      text: "Cliente sem pendências",
      variant: "green",
      iconOnly: true,
    });
  }

  return result;
}

const variantStyles: Record<BannerVariant, string> = {
  green: "border-green-600/40 bg-green-600/10 text-green-500",
  red: "border-gym-danger/40 bg-gym-danger/10 text-gym-danger",
  yellow: "border-gym-warning/40 bg-gym-warning/10 text-gym-warning",
  orange: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  blue: "border-blue-500/40 bg-blue-500/10 text-blue-400",
};

/**
 * Rendering compacto dos banners — versão em chip pill pra vir embutida no
 * `ClienteHeader`. `flex-row-reverse` faz a ordem DOM (prioridade) mapear
 * pra direita→esquerda no visual, conforme pedido de produto 2026-04-22.
 */
export function ClienteStatusBannersCompact({
  banners,
}: {
  banners: BannerData[];
}) {
  if (banners.length === 0) return null;

  return (
    <div
      className="flex flex-row-reverse flex-wrap items-center gap-1.5"
      role="list"
      aria-label="Indicadores de status do cliente"
    >
      {banners.map((b) => {
        const Icon = b.icon;
        return (
          <div
            key={b.key}
            role="listitem"
            aria-label={b.text}
            title={b.iconOnly ? b.text : undefined}
            className={cn(
              "inline-flex items-center rounded-full border text-[11px]",
              b.iconOnly ? "size-6 justify-center p-0" : "gap-1 px-2 py-0.5",
              variantStyles[b.variant],
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {b.iconOnly ? null : <span className="leading-none">{b.text}</span>}
          </div>
        );
      })}
    </div>
  );
}
