  "use client";

import { useEffect, useState } from "react";
import { listPagamentos, receberPagamento, listFormasPagamento } from "@/lib/mock/services";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Pagamento,
  Aluno,
  StatusPagamento,
  TipoFormaPagamento,
  FormaPagamento,
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

function ReceberModal({
  pagamento,
  formasPagamento,
  onClose,
  onConfirm,
}: {
  pagamento: PagamentoWithAluno;
  formasPagamento: FormaPagamento[];
  onClose: () => void;
  onConfirm: (data: { dataPagamento: string; formaPagamento: TipoFormaPagamento }) => void;
}) {
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formaPagamento, setFormaPagamento] = useState<TipoFormaPagamento | "">("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Registrar recebimento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-secondary p-3 text-sm">
            <p className="font-medium">{pagamento.aluno?.nome ?? "—"}</p>
            <p className="text-muted-foreground">{pagamento.descricao}</p>
            <p className="mt-1 font-display text-lg font-bold text-gym-accent">
              {formatBRL(pagamento.valorFinal)}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data de pagamento
            </label>
            <Input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Forma de pagamento
            </label>
            <Select
              value={formaPagamento}
              onValueChange={(v) => setFormaPagamento(v as TipoFormaPagamento)}
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {formasPagamento.map((fp) => (
                  <SelectItem key={fp.id} value={fp.tipo}>
                    {fp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button
            disabled={!formaPagamento || !dataPagamento}
            onClick={() =>
              onConfirm({
                dataPagamento,
                formaPagamento: formaPagamento as TipoFormaPagamento,
              })
            }
          >
            Confirmar recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<PagamentoWithAluno[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [filtro, setFiltro] = useState<StatusPagamento | "TODOS">("TODOS");
  const [recebendo, setRecebendo] = useState<PagamentoWithAluno | null>(null);

  async function load() {
    const [pags, fps] = await Promise.all([
      listPagamentos(),
      listFormasPagamento(),
    ]);
    setPagamentos(pags);
    setFormasPagamento(fps);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered =
    filtro === "TODOS"
      ? pagamentos
      : pagamentos.filter((p) => p.status === filtro);

  const totalRecebido = pagamentos
    .filter((p) => p.status === "PAGO")
    .reduce((s, p) => s + p.valorFinal, 0);

  const totalPendente = pagamentos
    .filter((p) => p.status === "PENDENTE" || p.status === "VENCIDO")
    .reduce((s, p) => s + p.valorFinal, 0);

  async function handleConfirmRecebimento(data: {
    dataPagamento: string;
    formaPagamento: TipoFormaPagamento;
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
        <ReceberModal
          pagamento={recebendo}
          formasPagamento={formasPagamento}
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
            {pagamentos.length}
          </p>
        </div>
      </div>

      {/* Filters */}
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aluno
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
