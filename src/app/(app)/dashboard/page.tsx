"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { getDashboard } from "@/lib/mock/services";
import { StatusBadge } from "@/components/shared/status-badge";
import type { DashboardData } from "@/lib/types";
import { MonthYearPicker } from "@/components/shared/month-year-picker";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accentClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${accentClass}`}
      />
      <Icon className="absolute right-4 top-4 size-6 opacity-10" />
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`font-display text-3xl font-extrabold leading-none ${accentClass.replace("bg-", "text-")}`}>
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());

  async function load(month = mes, year = ano) {
    const dash = await getDashboard({ month, year });
    setData(dash);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(mes, ano);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, ano]);

  useEffect(() => {
    function handleUpdate() {
      load(mes, ano);
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, ano]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral da academia
          </p>
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Clientes ativos"
          value={data.totalAlunosAtivos}
          sub="matrículas vigentes"
          icon={Users}
          accentClass="bg-gym-teal"
        />
        <StatCard
          label="Prospects novos"
          value={data.prospectsNovos}
          sub="aguardando contato"
          icon={UserPlus}
          accentClass="bg-gym-accent"
        />
        <StatCard
          label="Receita do mês"
          value={formatBRL(data.receitaDoMes)}
          sub="pagamentos recebidos"
          icon={TrendingUp}
          accentClass="bg-gym-teal"
        />
        <StatCard
          label="Pendentes"
          value={data.pagamentosPendentes.length}
          sub="pagamentos em aberto"
          icon={AlertTriangle}
          accentClass="bg-gym-danger"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Prospects recentes */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Prospects recentes</h2>
            <Link
              href="/prospects"
              className="text-xs text-gym-accent hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {data.prospectsRecentes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum prospect ativo
            </p>
          ) : (
            <div className="space-y-3">
              {data.prospectsRecentes.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.telefone}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagamentos pendentes */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Pagamentos pendentes</h2>
            <Link
              href="/pagamentos"
              className="text-xs text-gym-accent hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {data.pagamentosPendentes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum pagamento pendente
            </p>
          ) : (
            <div className="space-y-3">
              {data.pagamentosPendentes.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.aluno?.nome ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Vence {formatDate(p.dataVencimento)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gym-accent">
                      {formatBRL(p.valorFinal)}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Matrículas vencendo */}
      {data.matriculasVencendo.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">
              Matrículas vencendo em 7 dias
            </h2>
            <Link
              href="/matriculas"
              className="text-xs text-gym-accent hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-border">
            {data.matriculasVencendo.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{m.aluno?.nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.plano?.nome} · vence {formatDate(m.dataFim)}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
