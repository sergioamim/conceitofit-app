"use client";

import { useEffect, useState } from "react";
import {
  listFormasPagamento,
  createFormaPagamento,
  updateFormaPagamento,
  toggleFormaPagamento,
  deleteFormaPagamento,
} from "@/lib/mock/services";
import type { FormaPagamento, TipoFormaPagamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TIPO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

function FormaPagamentoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<FormaPagamento, "id" | "tenantId" | "ativo">, id?: string) => void;
  initial?: FormaPagamento | null;
}) {
  const [form, setForm] = useState({
    nome: "",
    tipo: "DINHEIRO" as TipoFormaPagamento,
    taxaPercentual: "0",
    parcelasMax: "1",
    instrucoes: "",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        tipo: initial.tipo,
        taxaPercentual: String(initial.taxaPercentual ?? 0),
        parcelasMax: String(initial.parcelasMax ?? 1),
        instrucoes: initial.instrucoes ?? "",
      });
    } else {
      setForm({
        nome: "",
        tipo: "DINHEIRO",
        taxaPercentual: "0",
        parcelasMax: "1",
        instrucoes: "",
      });
    }
  }, [initial, open]);

  function handleSave() {
    if (!form.nome) return;
    onSave(
      {
        nome: form.nome,
        tipo: form.tipo,
        taxaPercentual: parseFloat(form.taxaPercentual) || 0,
        parcelasMax: parseInt(form.parcelasMax, 10) || 1,
        instrucoes: form.instrucoes || undefined,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar forma de pagamento" : "Nova forma de pagamento"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nome *
            </label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo *
            </label>
            <Select
              value={form.tipo}
              onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoFormaPagamento }))}
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {Object.entries(TIPO_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Taxa (%)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.taxaPercentual}
                onChange={(e) => setForm((f) => ({ ...f, taxaPercentual: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Parcelas máx.
              </label>
              <Input
                type="number"
                min={1}
                value={form.parcelasMax}
                onChange={(e) => setForm((f) => ({ ...f, parcelasMax: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Instruções
            </label>
            <Input
              value={form.instrucoes}
              onChange={(e) => setForm((f) => ({ ...f, instrucoes: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave}>{initial ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FormasPagamentoPage() {
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FormaPagamento | null>(null);

  async function load() {
    const data = await listFormasPagamento({ apenasAtivas: false });
    setFormas(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(
    data: Omit<FormaPagamento, "id" | "tenantId" | "ativo">,
    id?: string
  ) {
    if (id) await updateFormaPagamento(id, data);
    else await createFormaPagamento(data);
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function handleToggle(id: string) {
    await toggleFormaPagamento(id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta forma de pagamento?")) return;
    await deleteFormaPagamento(id);
    load();
  }

  return (
    <div className="space-y-6">
      <FormaPagamentoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Formas de pagamento
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestão de formas de pagamento e taxas
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Nova forma</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Forma
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Taxa
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Parcelas
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {formas.map((f) => (
              <tr key={f.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 text-sm font-medium">{f.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {TIPO_LABEL[f.tipo] ?? f.tipo}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {f.taxaPercentual}%
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {f.parcelasMax}x
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      f.ativo
                        ? "bg-gym-teal/15 text-gym-teal"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {f.ativo ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(f);
                        setModalOpen(true);
                      }}
                      className="h-7 text-xs"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(f.id)}
                      className="h-7 text-xs"
                    >
                      {f.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(f.id)}
                      className="h-7 text-xs border-gym-danger/30 text-gym-danger hover:border-gym-danger/60"
                    >
                      Remover
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
