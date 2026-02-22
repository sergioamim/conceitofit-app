"use client";

import { useEffect, useState } from "react";
import type { Servico } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { HoverPopover } from "@/components/shared/hover-popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ServicoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Servico, "id" | "tenantId">, id?: string) => void;
  initial?: Servico | null;
}) {
  const [form, setForm] = useState({
    nome: "",
    sku: "",
    categoria: "",
    descricao: "",
    sessoes: "",
    valor: "",
    custo: "",
    duracaoMinutos: "",
    validadeDias: "",
    comissaoPercentual: "",
    aliquotaImpostoPercentual: "",
    permiteDesconto: true,
    tipoCobranca: "UNICO" as "UNICO" | "RECORRENTE",
    recorrenciaDias: "",
    agendavel: true,
    permiteAcessoCatraca: false,
    permiteVoucher: false,
    ativo: true,
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        sku: initial.sku ?? "",
        categoria: initial.categoria ?? "",
        descricao: initial.descricao ?? "",
        sessoes: initial.sessoes ? String(initial.sessoes) : "",
        valor: initial.valor ? String(initial.valor) : "",
        custo: initial.custo ? String(initial.custo) : "",
        duracaoMinutos: initial.duracaoMinutos ? String(initial.duracaoMinutos) : "",
        validadeDias: initial.validadeDias ? String(initial.validadeDias) : "",
        comissaoPercentual: initial.comissaoPercentual ? String(initial.comissaoPercentual) : "",
        aliquotaImpostoPercentual: initial.aliquotaImpostoPercentual ? String(initial.aliquotaImpostoPercentual) : "",
        permiteDesconto: initial.permiteDesconto,
        tipoCobranca: initial.tipoCobranca,
        recorrenciaDias: initial.recorrenciaDias ? String(initial.recorrenciaDias) : "",
        agendavel: initial.agendavel,
        permiteAcessoCatraca: initial.permiteAcessoCatraca,
        permiteVoucher: initial.permiteVoucher,
        ativo: initial.ativo,
      });
    } else {
      setForm({
        nome: "",
        sku: "",
        categoria: "",
        descricao: "",
        sessoes: "",
        valor: "",
        custo: "",
        duracaoMinutos: "",
        validadeDias: "",
        comissaoPercentual: "",
        aliquotaImpostoPercentual: "",
        permiteDesconto: true,
        tipoCobranca: "UNICO",
        recorrenciaDias: "",
        agendavel: true,
        permiteAcessoCatraca: false,
        permiteVoucher: false,
        ativo: true,
      });
    }
  }, [initial, open]);

  function handleSave() {
    if (!form.nome) return;
    onSave(
      {
        nome: form.nome,
        sku: form.sku || undefined,
        categoria: form.categoria || undefined,
        descricao: form.descricao || undefined,
        sessoes: form.sessoes ? Math.max(1, parseInt(form.sessoes, 10)) : undefined,
        valor: form.valor ? Math.max(0, parseFloat(form.valor)) : 0,
        custo: form.custo ? Math.max(0, parseFloat(form.custo)) : undefined,
        duracaoMinutos: form.duracaoMinutos ? Math.max(1, parseInt(form.duracaoMinutos, 10)) : undefined,
        validadeDias: form.validadeDias ? Math.max(1, parseInt(form.validadeDias, 10)) : undefined,
        comissaoPercentual: form.comissaoPercentual ? Math.max(0, parseFloat(form.comissaoPercentual)) : undefined,
        aliquotaImpostoPercentual: form.aliquotaImpostoPercentual ? Math.max(0, parseFloat(form.aliquotaImpostoPercentual)) : undefined,
        permiteDesconto: form.permiteDesconto,
        tipoCobranca: form.tipoCobranca,
        recorrenciaDias:
          form.tipoCobranca === "RECORRENTE" && form.recorrenciaDias
            ? Math.max(1, parseInt(form.recorrenciaDias, 10))
            : undefined,
        agendavel: form.agendavel,
        permiteAcessoCatraca: form.permiteAcessoCatraca,
        permiteVoucher: form.permiteVoucher,
        ativo: form.ativo,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar serviço" : "Novo serviço"}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                SKU / Código interno
              </label>
              <Input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Categoria
              </label>
              <Input
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição
            </label>
            <Input
              value={form.descricao}
              onChange={(e) =>
                setForm((f) => ({ ...f, descricao: e.target.value }))
              }
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sessões
              </label>
              <Input
                type="number"
                min={1}
                step="1"
                value={form.sessoes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sessoes: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ativo
              </label>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ativo: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Disponível</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duração por sessão (min)
              </label>
              <Input
                type="number"
                min={1}
                value={form.duracaoMinutos}
                onChange={(e) => setForm((f) => ({ ...f, duracaoMinutos: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de cobrança
              </label>
              <Select value={form.tipoCobranca} onValueChange={(v) => setForm((f) => ({ ...f, tipoCobranca: v as "UNICO" | "RECORRENTE" }))}>
                <SelectTrigger className="w-full bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="UNICO">Único</SelectItem>
                  <SelectItem value="RECORRENTE">Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recorrência (dias)
              </label>
              <Input
                type="number"
                min={1}
                value={form.recorrenciaDias}
                onChange={(e) => setForm((f) => ({ ...f, recorrenciaDias: e.target.value }))}
                className="bg-secondary border-border"
                disabled={form.tipoCobranca !== "RECORRENTE"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor (R$)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.valor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valor: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Custo (R$)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.custo}
                onChange={(e) => setForm((f) => ({ ...f, custo: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Comissão (%)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.comissaoPercentual}
                onChange={(e) => setForm((f) => ({ ...f, comissaoPercentual: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Imposto (%)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.aliquotaImpostoPercentual}
                onChange={(e) => setForm((f) => ({ ...f, aliquotaImpostoPercentual: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Validade (dias)
              </label>
              <Input
                type="number"
                min={1}
                value={form.validadeDias}
                onChange={(e) => setForm((f) => ({ ...f, validadeDias: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Permite agendamento?
              </p>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.agendavel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agendavel: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Agendável</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Permite desconto?
              </p>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.permiteDesconto}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, permiteDesconto: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Aplicar desconto na venda</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Permite acesso catraca?
                <HoverPopover
                  content="Quando ativo, o acesso na catraca será consumido pela quantidade de sessões do serviço."
                  side="top"
                >
                  <span className="inline-flex size-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                    ?
                  </span>
                </HoverPopover>
              </p>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.permiteAcessoCatraca}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, permiteAcessoCatraca: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Controlar acesso por sessões</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Permite aplicar voucher?
              </p>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.permiteVoucher}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, permiteVoucher: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Aplicável em campanhas e vouchers</span>
              </div>
            </div>
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
