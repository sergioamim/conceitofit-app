"use client";

import Link from "next/link";
import { BookOpen, FileText, LineChart, MonitorCheck, Receipt } from "lucide-react";

const SECTIONS = [
  {
    href: "/gerencial/contabilidade/contas",
    label: "Plano de Contas",
    description: "Contas contabeis organizadas por tipo (ativo, passivo, receita, despesa, patrimonio).",
    icon: BookOpen,
    tone: "text-gym-accent",
  },
  {
    href: "/gerencial/contabilidade/livros-razao",
    label: "Livros Razao",
    description: "Livros razao com lancamentos de debito e credito por periodo de referencia.",
    icon: FileText,
    tone: "text-gym-teal",
  },
  {
    href: "/gerencial/contabilidade/transacoes",
    label: "Transacoes",
    description: "Registro e controle de transacoes financeiras com confirmacao e reversao.",
    icon: Receipt,
    tone: "text-gym-warning",
  },
  {
    href: "/gerencial/contabilidade/relatorios",
    label: "Relatorios",
    description: "Balanco patrimonial, fluxo de caixa e extrato por conta.",
    icon: LineChart,
    tone: "text-gym-accent",
  },
  {
    href: "/gerencial/contabilidade/monitoramento",
    label: "Monitoramento",
    description: "Transacoes suspeitas, padroes incomuns e alertas de alta frequencia.",
    icon: MonitorCheck,
    tone: "text-gym-danger",
  },
] as const;

export default function ContabilidadePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gerencial</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">Contabilidade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modulo financeiro contabil — contas, livros razao, transacoes, relatorios e monitoramento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-gym-accent/40 hover:bg-card/80"
            >
              <div className="flex items-center gap-3">
                <Icon className={`size-5 ${section.tone}`} />
                <h2 className="font-display text-lg font-bold">{section.label}</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
