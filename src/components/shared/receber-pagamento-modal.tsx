"use client";

import { useMemo, useState } from "react";
import { getBusinessTodayIso } from "@/lib/business-date";
import type { FormaPagamento, Pagamento, TipoFormaPagamento } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ReceberPagamentoModal({
  pagamento,
  formasPagamento,
  convenio,
  onClose,
  onConfirm,
}: {
  pagamento: Pagamento;
  formasPagamento: FormaPagamento[];
  convenio?: { nome: string; descontoPercentual: number };
  onClose: () => void;
  onConfirm: (data: {
    dataPagamento: string;
    formaPagamento: TipoFormaPagamento;
    observacoes?: string;
  }) => void;
}) {
  const [dataPagamento, setDataPagamento] = useState(
    getBusinessTodayIso()
  );
  const [formaPagamento, setFormaPagamento] = useState<TipoFormaPagamento | "">("");
  const [observacoes, setObservacoes] = useState("");

  const formasAtivas = useMemo(
    () => formasPagamento.filter((f) => f.ativo),
    [formasPagamento]
  );

  return (
    <Dialog open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Receber pagamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <p className="font-medium">{pagamento.descricao}</p>
            <p className="text-muted-foreground">
              Valor: <span className="font-semibold text-foreground">{formatBRL(pagamento.valorFinal)}</span>
            </p>
            {convenio && (
              <p className="mt-1 text-xs text-muted-foreground">
                Convênio: <span className="font-semibold text-foreground">{convenio.nome}</span> · {convenio.descontoPercentual}%
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data do pagamento *
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
              Forma de pagamento *
            </label>
            <Select
              value={formaPagamento}
              onValueChange={(v) => setFormaPagamento(v as TipoFormaPagamento)}
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {formasAtivas.map((fp) => (
                  <SelectItem key={fp.id} value={fp.tipo}>
                    {fp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <Input
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                dataPagamento,
                formaPagamento: formaPagamento as TipoFormaPagamento,
                observacoes: observacoes || undefined,
              })
            }
            disabled={!dataPagamento || !formaPagamento}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
