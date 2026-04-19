"use client";

import { useEffect, useState } from "react";
import type { Aluno } from "@/lib/types";
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  Lock,
  Clock,
  TrendingDown,
  Camera,
} from "lucide-react";

interface ClienteStatusBannersProps {
  aluno: Aluno;
  suspenso: boolean;
  pendenteFinanceiro: boolean;
  planoAtivo?: { dataFim: string } | null;
  presencas: Array<{ data: string }>;
  pagamentos: Array<{ status: string; dataVencimento: string }>;
}

interface BannerData {
  key: string;
  icon: React.ReactNode;
  text: string;
  variant: "green" | "red" | "yellow" | "orange" | "blue";
}

const variantStyles: Record<BannerData["variant"], string> = {
  green: "border-green-600/40 bg-green-600/10 text-green-500",
  red: "border-gym-danger/40 bg-gym-danger/10 text-gym-danger",
  yellow: "border-gym-warning/40 bg-gym-warning/10 text-gym-warning",
  orange: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  blue: "border-blue-500/40 bg-blue-500/10 text-blue-400",
};

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function ClienteStatusBanners({
  aluno,
  suspenso,
  pendenteFinanceiro,
  planoAtivo,
  presencas,
  pagamentos,
}: ClienteStatusBannersProps) {
  const [banners, setBanners] = useState<BannerData[]>([]);

  useEffect(() => {
    const now = new Date();
    const result: BannerData[] = [];

    // 1. Green: Acesso liberado
    if (aluno.status === "ATIVO" && !suspenso && !pendenteFinanceiro) {
      result.push({
        key: "acesso-liberado",
        icon: <ShieldCheck className="h-4 w-4 shrink-0" />,
        text: "Acesso liberado",
        variant: "green",
      });
    }

    // Vencido payments analysis
    const vencidos = pagamentos.filter((p) => p.status === "VENCIDO");

    // 2. Green: Cliente sem pendências
    if (vencidos.length === 0) {
      result.push({
        key: "sem-pendencias",
        icon: <Check className="h-4 w-4 shrink-0" />,
        text: "Cliente sem pendências",
        variant: "green",
      });
    }

    // 3. Red: Inadimplente
    if (vencidos.length > 0) {
      const oldestVencido = vencidos.reduce((oldest, p) => {
        const d = parseLocalDate(p.dataVencimento);
        const o = parseLocalDate(oldest.dataVencimento);
        return d < o ? p : oldest;
      });
      const days = daysBetween(parseLocalDate(oldestVencido.dataVencimento), now);
      result.push({
        key: "inadimplente",
        icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
        text: `Inadimplente há ${days} dia${days !== 1 ? "s" : ""}`,
        variant: "red",
      });
    }

    // 4. Red: Acesso bloqueado
    if (suspenso || aluno.status === "SUSPENSO") {
      result.push({
        key: "acesso-bloqueado",
        icon: <Lock className="h-4 w-4 shrink-0" />,
        text: "Acesso bloqueado",
        variant: "red",
      });
    }

    // 5. Yellow: Contrato vence em X dias
    if (planoAtivo?.dataFim) {
      const fimDate = parseLocalDate(planoAtivo.dataFim);
      const daysUntilEnd = daysBetween(now, fimDate);
      if (daysUntilEnd >= 0 && daysUntilEnd <= 30) {
        result.push({
          key: "contrato-vencendo",
          icon: <Clock className="h-4 w-4 shrink-0" />,
          text: `Contrato vence em ${daysUntilEnd} dia${daysUntilEnd !== 1 ? "s" : ""}`,
          variant: "yellow",
        });
      }
    }

    // 6. Orange: Sem frequência há X dias
    if (presencas.length === 0) {
      result.push({
        key: "sem-frequencia",
        icon: <TrendingDown className="h-4 w-4 shrink-0" />,
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
          icon: <TrendingDown className="h-4 w-4 shrink-0" />,
          text: `Sem frequência há ${daysSinceLast} dias`,
          variant: "orange",
        });
      }
    }

    // 7. Blue: Face não sincronizada
    if (!aluno.foto) {
      result.push({
        key: "face-nao-sincronizada",
        icon: <Camera className="h-4 w-4 shrink-0" />,
        text: "Face não sincronizada",
        variant: "blue",
      });
    }

    setBanners(result);
  }, [aluno, suspenso, pendenteFinanceiro, planoAtivo, presencas, pagamentos]);

  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {banners.map((banner) => (
        <div
          key={banner.key}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${variantStyles[banner.variant]}`}
        >
          {banner.icon}
          <span>{banner.text}</span>
        </div>
      ))}
    </div>
  );
}
