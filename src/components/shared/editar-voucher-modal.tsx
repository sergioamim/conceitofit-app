"use client";

import { useEffect, useState } from "react";
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
import { Calendar, HelpCircle, Info } from "lucide-react";
import { HoverPopover } from "@/components/shared/hover-popover";
import { updateVoucherApi } from "@/lib/api/beneficios";
import { listPlanosApi } from "@/lib/api/comercial-catalogo";
import type { Plano, Voucher, VoucherAplicarEm, VoucherEscopo } from "@/lib/types";

const VOUCHER_TYPES = [
  { value: "DESCONTO", label: "Desconto" },
  { value: "ACESSO", label: "Acesso livre" },
  { value: "SESSAO", label: "Sessão avulsa" },
];

export function EditarVoucherModal({
  tenantId,
  voucher,
  onClose,
  onSaved,
}: {
  tenantId?: string;
  voucher: Voucher;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tipo, setTipo] = useState(voucher.tipo);
  const [escopo, setEscopo] = useState<VoucherEscopo>(voucher.escopo);
  const [nome, setNome] = useState(voucher.nome);
  const [periodoInicio, setPeriodoInicio] = useState(voucher.periodoInicio);
  const [periodoFim, setPeriodoFim] = useState(voucher.periodoFim ?? "");
  const [prazoDeterminado, setPrazoDeterminado] = useState(voucher.prazoDeterminado);
  const [quantidade, setQuantidade] = useState(
    voucher.quantidade?.toString() ?? ""
  );
  const [ilimitada, setIlimitada] = useState(voucher.ilimitado);
  const [usarNaVenda, setUsarNaVenda] = useState(voucher.usarNaVenda);
  const [planoIds, setPlanoIds] = useState<string[]>(voucher.planoIds ?? []);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [umaVezPorCliente, setUmaVezPorCliente] = useState(voucher.umaVezPorCliente);
  const [aplicarEm, setAplicarEm] = useState<VoucherAplicarEm[]>(voucher.aplicarEm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!tenantId) {
      setPlanos([]);
      return;
    }
    void listPlanosApi({ tenantId, apenasAtivos: true }).then(setPlanos);
  }, [tenantId]);

  function togglePlano(id: string) {
    setPlanoIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function toggleAplicarEm(value: VoucherAplicarEm) {
    setAplicarEm((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  const todosPlanosSelecionados =
    planos.length > 0 && planoIds.length === planos.length;

  function toggleTodosPlanos() {
    setPlanoIds(todosPlanosSelecionados ? [] : planos.map((p) => p.id));
  }

  async function handleSalvar() {
    const nextErrors: Record<string, string> = {};
    if (!tipo) nextErrors.tipo = "Selecione o tipo de voucher";
    if (!nome.trim()) nextErrors.nome = "Informe o nome do voucher";
    if (!periodoInicio) nextErrors.periodoInicio = "Informe a data de início";
    if (prazoDeterminado && !periodoFim)
      nextErrors.periodoFim = "Informe a data de término";
    if (!ilimitada && !quantidade)
      nextErrors.quantidade = "Informe a quantidade ou marque ilimitada";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    setSaveError("");
    try {
      await updateVoucherApi(voucher.id, {
        escopo,
        tipo,
        nome: nome.trim(),
        periodoInicio,
        periodoFim: prazoDeterminado ? periodoFim : undefined,
        prazoDeterminado,
        quantidade: ilimitada ? undefined : Number(quantidade),
        ilimitado: ilimitada,
        usarNaVenda,
        planoIds,
        umaVezPorCliente,
        aplicarEm,
      });
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar voucher.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Editar voucher
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto space-y-5 pr-1">
          {saveError && (
            <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
              {saveError}
            </div>
          )}

          {/* Código (read-only) */}
          <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de código (não editável)
            </p>
            <p className="text-sm font-medium">
              {voucher.codigoTipo === "UNICO" ? "Código único" : "Códigos aleatórios"}
            </p>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Escopo</span>
              <HoverPopover content="Unidade: voucher exclusivo da unidade atual. Grupo: voucher global para toda a rede.">
                <HelpCircle className="size-4 text-muted-foreground" />
              </HoverPopover>
            </div>
            <Select value={escopo} onValueChange={(v) => setEscopo(v as VoucherEscopo)}>
              <SelectTrigger className="w-full bg-secondary border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="UNIDADE">Apenas esta unidade</SelectItem>
                <SelectItem value="GRUPO">Grupo (rede inteira)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Tipo de voucher *</span>
              <HoverPopover content="Finalidade do voucher (desconto, sessão, acesso etc.).">
                <HelpCircle className="size-4 text-muted-foreground" />
              </HoverPopover>
            </div>
            <Select value={tipo} onValueChange={(v) => setTipo(v)}>
              <SelectTrigger className="w-full bg-secondary border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {VOUCHER_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && (
              <p className="text-xs text-gym-danger">{errors.tipo}</p>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Nome do voucher *</span>
              <HoverPopover content="Ex: Bônus de verão ou Voucher amigo">
                <Info className="size-4 text-muted-foreground" />
              </HoverPopover>
            </div>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-secondary border-border"
            />
            {errors.nome && (
              <p className="text-xs text-gym-danger">{errors.nome}</p>
            )}
          </div>

          {/* Período */}
          <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Período de validade
              </p>
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={!prazoDeterminado}
                  onChange={(e) => setPrazoDeterminado(!e.target.checked)}
                />
                Prazo indeterminado
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Início *
                  <Calendar className="size-3.5" />
                </label>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="bg-background border-border"
                />
                {errors.periodoInicio && (
                  <p className="text-xs text-gym-danger">{errors.periodoInicio}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Término {prazoDeterminado ? "*" : ""}
                  <Calendar className="size-3.5" />
                </label>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  disabled={!prazoDeterminado}
                  className="bg-background border-border disabled:opacity-40"
                />
                {errors.periodoFim && (
                  <p className="text-xs text-gym-danger">{errors.periodoFim}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quantidade */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quantidade *
              <HoverPopover content="Quantidade máxima de vouchers emitidos.">
                <Info className="size-4 text-muted-foreground" />
              </HoverPopover>
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                step={1}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                disabled={ilimitada}
                className="w-28 bg-secondary border-border disabled:opacity-40"
                placeholder="Ex: 100"
              />
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={ilimitada}
                  onChange={(e) => setIlimitada(e.target.checked)}
                />
                Ilimitada
              </label>
            </div>
            {!ilimitada && errors.quantidade && (
              <p className="text-xs text-gym-danger">{errors.quantidade}</p>
            )}
          </div>

          {/* Usar na venda */}
          <div className="flex items-center gap-2">
            <input
              id="usarNaVendaEdit"
              type="checkbox"
              checked={usarNaVenda}
              onChange={(e) => setUsarNaVenda(e.target.checked)}
            />
            <label
              htmlFor="usarNaVendaEdit"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Utilizar na página de vendas
            </label>
          </div>

          {/* Contratos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contratos aplicáveis
              </p>
              {planos.length > 0 && (
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={todosPlanosSelecionados}
                    onChange={toggleTodosPlanos}
                  />
                  Selecionar todos
                </label>
              )}
            </div>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-border bg-secondary/40 p-3 space-y-1.5">
              {planos.map((plano) => (
                <label
                  key={plano.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={planoIds.includes(plano.id)}
                    onChange={() => togglePlano(plano.id)}
                  />
                  <span className="flex-1">{plano.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    R$ {plano.valor.toFixed(2).replace(".", ",")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Regras */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Regras de uso
            </p>
            <label className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 cursor-pointer hover:bg-secondary/60 transition-colors">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={umaVezPorCliente}
                onChange={(e) => setUmaVezPorCliente(e.target.checked)}
              />
              <div>
                <p className="text-sm font-medium">Utilizar uma única vez por cliente</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cada cliente poderá resgatar este voucher somente uma vez.
                </p>
              </div>
            </label>
          </div>

          {/* Aplicar em */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Aplicar no valor de</span>
              <HoverPopover content="Define se incide sobre o contrato, a anuidade, ou ambos.">
                <Info className="size-4 text-muted-foreground" />
              </HoverPopover>
            </div>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: "CONTRATO" as VoucherAplicarEm, label: "Contrato", desc: "Aplica no valor do plano/mensalidade." },
                  { value: "ANUIDADE" as VoucherAplicarEm, label: "Anuidade", desc: "Aplica no valor anual do plano." },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/60 px-3 py-2.5 cursor-pointer hover:bg-secondary transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={aplicarEm.includes(opt.value)}
                    onChange={() => toggleAplicarEm(opt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={saving}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
