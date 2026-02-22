"use client";

import { useEffect, useState } from "react";
import type { Produto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProdutoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Produto, "id" | "tenantId">, id?: string) => void;
  initial?: Produto | null;
}) {
  const [form, setForm] = useState({
    nome: "",
    sku: "",
    codigoBarras: "",
    categoria: "",
    marca: "",
    unidadeMedida: "UN" as Produto["unidadeMedida"],
    descricao: "",
    valorVenda: "",
    custo: "",
    comissaoPercentual: "",
    aliquotaImpostoPercentual: "",
    controlaEstoque: true,
    estoqueAtual: "0",
    estoqueMinimo: "",
    permiteDesconto: true,
    permiteVoucher: false,
    ativo: true,
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: initial.nome,
        sku: initial.sku,
        codigoBarras: initial.codigoBarras ?? "",
        categoria: initial.categoria ?? "",
        marca: initial.marca ?? "",
        unidadeMedida: initial.unidadeMedida,
        descricao: initial.descricao ?? "",
        valorVenda: String(initial.valorVenda ?? 0),
        custo: initial.custo ? String(initial.custo) : "",
        comissaoPercentual: initial.comissaoPercentual ? String(initial.comissaoPercentual) : "",
        aliquotaImpostoPercentual: initial.aliquotaImpostoPercentual ? String(initial.aliquotaImpostoPercentual) : "",
        controlaEstoque: initial.controlaEstoque,
        estoqueAtual: String(initial.estoqueAtual ?? 0),
        estoqueMinimo: initial.estoqueMinimo ? String(initial.estoqueMinimo) : "",
        permiteDesconto: initial.permiteDesconto,
        permiteVoucher: initial.permiteVoucher,
        ativo: initial.ativo,
      });
      return;
    }
    setForm({
      nome: "",
      sku: "",
      codigoBarras: "",
      categoria: "",
      marca: "",
      unidadeMedida: "UN",
      descricao: "",
      valorVenda: "",
      custo: "",
      comissaoPercentual: "",
      aliquotaImpostoPercentual: "",
      controlaEstoque: true,
      estoqueAtual: "0",
      estoqueMinimo: "",
      permiteDesconto: true,
      permiteVoucher: false,
      ativo: true,
    });
  }, [initial, open]);

  function handleSave() {
    if (!form.nome.trim() || !form.sku.trim()) return;
    onSave(
      {
        nome: form.nome.trim(),
        sku: form.sku.trim().toUpperCase(),
        codigoBarras: form.codigoBarras.trim() || undefined,
        categoria: form.categoria.trim() || undefined,
        marca: form.marca.trim() || undefined,
        unidadeMedida: form.unidadeMedida,
        descricao: form.descricao.trim() || undefined,
        valorVenda: form.valorVenda ? Math.max(0, parseFloat(form.valorVenda)) : 0,
        custo: form.custo ? Math.max(0, parseFloat(form.custo)) : undefined,
        comissaoPercentual: form.comissaoPercentual ? Math.max(0, parseFloat(form.comissaoPercentual)) : undefined,
        aliquotaImpostoPercentual: form.aliquotaImpostoPercentual ? Math.max(0, parseFloat(form.aliquotaImpostoPercentual)) : undefined,
        controlaEstoque: form.controlaEstoque,
        estoqueAtual: form.controlaEstoque ? Math.max(0, parseFloat(form.estoqueAtual) || 0) : 0,
        estoqueMinimo: form.controlaEstoque && form.estoqueMinimo ? Math.max(0, parseFloat(form.estoqueMinimo)) : undefined,
        permiteDesconto: form.permiteDesconto,
        permiteVoucher: form.permiteVoucher,
        ativo: form.ativo,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">{initial ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SKU *</label>
              <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))} className="bg-secondary border-border" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Código de barras</label>
              <Input value={form.codigoBarras} onChange={(e) => setForm((f) => ({ ...f, codigoBarras: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categoria</label>
              <Input value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Marca</label>
              <Input value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade</label>
              <Select value={form.unidadeMedida} onValueChange={(v) => setForm((f) => ({ ...f, unidadeMedida: v as Produto["unidadeMedida"] }))}>
                <SelectTrigger className="w-full bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="UN">UN</SelectItem>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="G">G</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="ML">ML</SelectItem>
                  <SelectItem value="CX">CX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
            <Input value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="bg-secondary border-border" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preço venda (R$)</label>
              <Input type="number" min={0} step="0.01" value={form.valorVenda} onChange={(e) => setForm((f) => ({ ...f, valorVenda: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Custo (R$)</label>
              <Input type="number" min={0} step="0.01" value={form.custo} onChange={(e) => setForm((f) => ({ ...f, custo: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comissão (%)</label>
              <Input type="number" min={0} step="0.01" value={form.comissaoPercentual} onChange={(e) => setForm((f) => ({ ...f, comissaoPercentual: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Imposto (%)</label>
              <Input type="number" min={0} step="0.01" value={form.aliquotaImpostoPercentual} onChange={(e) => setForm((f) => ({ ...f, aliquotaImpostoPercentual: e.target.value }))} className="bg-secondary border-border" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.controlaEstoque} onChange={(e) => setForm((f) => ({ ...f, controlaEstoque: e.target.checked }))} />
              Controla estoque
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.permiteDesconto} onChange={(e) => setForm((f) => ({ ...f, permiteDesconto: e.target.checked }))} />
              Permite desconto
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.permiteVoucher} onChange={(e) => setForm((f) => ({ ...f, permiteVoucher: e.target.checked }))} />
              Permite voucher
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estoque atual</label>
              <Input type="number" min={0} step="0.001" value={form.estoqueAtual} onChange={(e) => setForm((f) => ({ ...f, estoqueAtual: e.target.value }))} className="bg-secondary border-border" disabled={!form.controlaEstoque} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estoque mínimo</label>
              <Input type="number" min={0} step="0.001" value={form.estoqueMinimo} onChange={(e) => setForm((f) => ({ ...f, estoqueMinimo: e.target.value }))} className="bg-secondary border-border" disabled={!form.controlaEstoque} />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />
              Produto ativo
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button onClick={handleSave}>{initial ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
