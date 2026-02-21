  "use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listPagamentos, receberPagamento, listFormasPagamento, listAlunos, listMatriculas, listConvenios } from "@/lib/mock/services";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ReceberPagamentoModal } from "@/components/shared/receber-pagamento-modal";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  Pagamento,
  Aluno,
  StatusPagamento,
  TipoFormaPagamento,
  FormaPagamento,
  Matricula,
  Convenio,
} from "@/lib/types";

type PagamentoWithAluno = Pagamento & { aluno?: Aluno };

const STATUS_FILTERS: { value: StatusPagamento | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "PENDENTE", label: "Pendentes" },
  { value: "VENCIDO", label: "Vencidos" },
  { value: "PAGO", label: "Pagos" },
  { value: "CANCELADO", label: "Cancelados" },
];

const TIPO_LABEL: Record<string, string> = {
  MATRICULA: "Matrícula",
  MENSALIDADE: "Mensalidade",
  TAXA: "Taxa",
  PRODUTO: "Produto",
  AVULSO: "Avulso",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}


export default function PagamentosPage() {
  const searchParams = useSearchParams();
  const [pagamentos, setPagamentos] = useState<PagamentoWithAluno[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [clientes, setClientes] = useState<Aluno[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [filtro, setFiltro] = useState<StatusPagamento | "TODOS">("TODOS");
  const [recebendo, setRecebendo] = useState<PagamentoWithAluno | null>(null);
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const [clienteFiltro, setClienteFiltro] = useState<string>("TODOS");

  async function load() {
    const [pags, fps, cls, mats, cvs] = await Promise.all([
      listPagamentos(),
      listFormasPagamento(),
      listAlunos(),
      listMatriculas(),
      listConvenios(),
    ]);
    setPagamentos(pags);
    setFormasPagamento(fps);
    setClientes(cls);
    setMatriculas(mats);
    setConvenios(cvs);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const alunoId = searchParams.get("clienteId") ?? searchParams.get("alunoId");
  const filteredBase =
    filtro === "TODOS"
      ? pagamentos
      : pagamentos.filter((p) => p.status === filtro);

  const filtered = filteredBase.filter((p) => {
    if (alunoId && p.alunoId !== alunoId) return false;
    if (clienteFiltro !== "TODOS" && p.alunoId !== clienteFiltro) return false;
    const d = new Date(p.dataVencimento + "T00:00:00");
    return d.getMonth() === mes && d.getFullYear() === ano;
  });

  const totalRecebido = filtered
    .filter((p) => p.status === "PAGO")
    .reduce((s, p) => s + p.valorFinal, 0);

  const totalPendente = filtered
    .filter((p) => p.status === "PENDENTE" || p.status === "VENCIDO")
    .reduce((s, p) => s + p.valorFinal, 0);

  async function handleConfirmRecebimento(data: {
    dataPagamento: string;
    formaPagamento: TipoFormaPagamento;
    observacoes?: string;
  }) {
    if (!recebendo) return;
    await receberPagamento(recebendo.id, {
      ...data,
    });
    setRecebendo(null);
    load();
  }

  return (
    <div className="space-y-6">
      {recebendo && (
        <ReceberPagamentoModal
          pagamento={recebendo}
          formasPagamento={formasPagamento}
          convenio={(() => {
            const mat = matriculas.find((m) => m.id === recebendo.matriculaId);
            if (!mat?.convenioId) return undefined;
            const conv = convenios.find((c) => c.id === mat.convenioId);
            return conv ? { nome: conv.nome, descontoPercentual: conv.descontoPercentual } : undefined;
          })()}
          onClose={() => setRecebendo(null)}
          onConfirm={handleConfirmRecebimento}
        />
      )}

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Pagamentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie cobranças e recebimentos
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gym-teal" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recebido no mês
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">
            {formatBRL(totalRecebido)}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gym-warning" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Em aberto
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">
            {formatBRL(totalPendente)}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gym-accent" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total de cobranças
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">
            {filtered.length}
          </p>
        </div>
      </div>

      {/* Filters */}
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
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
            <SelectTrigger className="w-52 bg-secondary border-border text-xs">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="TODOS">Todos clientes</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <MonthYearPicker
            month={mes}
            year={ano}
            onChange={(next) => {
              setMes(next.month);
              setAno(next.year);
            }}
          />
        </div>
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
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vencimento
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ação
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
                  Nenhum pagamento encontrado
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{p.aluno?.nome ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                  {p.descricao}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {TIPO_LABEL[p.tipo] ?? p.tipo}
                </td>
                <td className="px-4 py-3">
                  <p className="font-display font-bold text-sm text-gym-accent">
                    {formatBRL(p.valorFinal)}
                  </p>
                  {p.desconto > 0 && (
                    <p className="text-xs text-muted-foreground">
                      desc. {formatBRL(p.desconto)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm">{formatDate(p.dataVencimento)}</p>
                  {p.dataPagamento && (
                    <p className="text-xs text-gym-teal">
                      Pago em {formatDate(p.dataPagamento)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  {(p.status === "PENDENTE" || p.status === "VENCIDO") && (
                    <Button
                      size="sm"
                      onClick={() => setRecebendo(p)}
                      className="h-7 text-xs"
                    >
                      Receber
                    </Button>
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
