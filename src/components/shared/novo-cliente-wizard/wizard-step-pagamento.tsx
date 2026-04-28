"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { ChevronDown, ChevronUp, CreditCard, Loader2, Plus, Tag, Trash2 } from "lucide-react";
import type { FormaPagamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/formatters";
import type { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";
import type { ClienteWizardForm } from "./wizard-types";

export function Step3Pagamento({
  fps, form, commercial
}: {
  fps: FormaPagamento[];
  form: UseFormReturn<ClienteWizardForm>;
  commercial: ReturnType<typeof useCommercialFlow>;
}) {
  const { register, control, watch } = form;
  const { dryRun, selectedPlano, conveniosPlano } = commercial;
  const formaPagamento = watch("pagamento.formaPagamento");
  const isRecorrente = formaPagamento === "RECORRENTE";

  const [cupomInput, setCupomInput] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);

  async function handleAplicarCupom() {
    if (!cupomInput.trim()) return;
    setValidandoCupom(true);
    await commercial.applyCupom(cupomInput.trim());
    setValidandoCupom(false);
  }

  function handleRemoverCupom() {
    setCupomInput("");
    commercial.applyCupom("");
  }

  return (
    <div className="space-y-5">
      {selectedPlano && (
        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          <p className="text-muted-foreground">Plano: <span className="font-semibold text-foreground">{selectedPlano.nome}</span></p>
          <p className="text-muted-foreground">Valor: <span className="font-bold text-gym-accent">{formatBRL(selectedPlano.valor)}</span></p>
          {selectedPlano.diaCobrancaPadrao?.length ? (
            <p className="text-muted-foreground">Dias de cobranca: <span className="font-semibold text-foreground">{selectedPlano.diaCobrancaPadrao.join(", ")}</span></p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Data de inicio *
          </label>
          <Input
            type="date"
            {...register("pagamento.dataInicio")}
            onChange={(e) => {
              register("pagamento.dataInicio").onChange(e);
              commercial.setDataInicioPlano(e.target.value);
            }}
            className="bg-card border-border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Forma de pagamento *</label>
          <Controller name="pagamento.formaPagamento" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full bg-card border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {fps.map((fp) => (
                  <SelectItem
                    key={fp.id}
                    value={fp.tipo}
                    disabled={fp.tipo === "RECORRENTE" && !!selectedPlano && !selectedPlano.permiteCobrancaRecorrente}
                  >
                    {fp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>
      </div>

      {/* Dia de cobrança para recorrente */}
      {isRecorrente && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dia de cobranca mensal *</label>
          {selectedPlano?.diaCobrancaPadrao?.length ? (
            <Controller name="pagamento.diaCobranca" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full bg-card border-border"><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {selectedPlano.diaCobrancaPadrao!.map((dia) => (
                    <SelectItem key={dia} value={String(dia)}>Dia {dia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          ) : (
            <Input
              type="number"
              min={1}
              max={28}
              placeholder="1 a 28"
              {...register("pagamento.diaCobranca")}
              className="bg-card border-border"
            />
          )}
        </div>
      )}

      {/* Cartão de crédito para recorrente */}
      {isRecorrente && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-gym-accent" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cartao de credito</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Numero do cartao *</label>
              <Input
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                {...register("pagamento.cartaoNumero")}
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Validade *</label>
              <Input placeholder="MM/AA" maxLength={5} {...register("pagamento.cartaoValidade")} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CVV *</label>
              <Input type="password" placeholder="***" maxLength={4} {...register("pagamento.cartaoCvv")} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CPF do titular</label>
              <Input placeholder="000.000.000-00" {...register("pagamento.cartaoCpfTitular")} className="bg-secondary border-border" />
            </div>
          </div>
        </div>
      )}

      {/* Cupom e Convênio */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Tag className="mr-1 inline size-3" />
            Cupom de desconto
          </label>
          {commercial.cupomAppliedCode ? (
            <div className="flex items-center gap-2 rounded-md border border-gym-teal/30 bg-gym-teal/10 px-3 py-2 text-sm">
              <span className="font-semibold text-gym-teal">{commercial.cupomAppliedCode}</span>
              <span className="text-xs text-muted-foreground">({commercial.cupomPercent}% de desconto)</span>
              <button type="button" onClick={handleRemoverCupom} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Remover</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Digite o codigo do cupom"
                value={cupomInput}
                onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
                className="bg-card border-border flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAplicarCupom} disabled={!cupomInput.trim() || validandoCupom} className="border-border shrink-0">
                {validandoCupom ? <Loader2 className="size-3.5 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
          )}
          {commercial.cupomError ? (
            <p className="text-xs text-gym-danger">{commercial.cupomError}</p>
          ) : null}
        </div>

        {conveniosPlano.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Convenio</label>
            <Select
              value={commercial.convenioPlanoId}
              onValueChange={commercial.setConvenioPlanoId}
            >
              <SelectTrigger className="w-full bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__SEM_CONVENIO__">Sem convenio</SelectItem>
                {conveniosPlano.map((conv) => (
                  <SelectItem key={conv.id} value={conv.id}>
                    {conv.nome} ({conv.descontoPercentual}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Isentar matrícula */}
      {selectedPlano && Number(selectedPlano.valorMatricula ?? 0) > 0 && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={commercial.isentarMatricula}
            onChange={(e) => commercial.setIsentarMatricula(e.target.checked)}
          />
          Isentar cobranca de matricula ({formatBRL(Number(selectedPlano.valorMatricula ?? 0))})
        </label>
      )}

      {/* Itens avulsos (serviço/produto) */}
      <ItensAvulsosSection commercial={commercial} />

      {/* Resumo financeiro */}
      {dryRun && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(dryRun.subtotal)}</span></div>
          {dryRun.descontoConvenio > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Desconto convenio</span><span className="text-gym-teal">- {formatBRL(dryRun.descontoConvenio)}</span></div>
          )}
          {dryRun.descontoCupom > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Desconto cupom</span><span className="text-gym-teal">- {formatBRL(dryRun.descontoCupom)}</span></div>
          )}
          {dryRun.descontoTotal > 0 && (dryRun.descontoConvenio === 0 && dryRun.descontoCupom === 0) && (
            <div className="flex justify-between"><span className="text-muted-foreground">Descontos</span><span className="text-gym-teal">- {formatBRL(dryRun.descontoTotal)}</span></div>
          )}
          <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
            <span>Total final</span>
            <span className="text-base font-bold text-gym-accent">{formatBRL(dryRun.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ItensAvulsosSection({ commercial }: { commercial: ReturnType<typeof useCommercialFlow> }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"SERVICO" | "PRODUTO">("SERVICO");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const avulsos = commercial.cart.filter((i) => i.tipo === "SERVICO" || i.tipo === "PRODUTO");

  function handleAdd() {
    if (!descricao.trim() || !valor) return;
    commercial.addItemToCart({
      tipo,
      referenciaId: `avulso-${Date.now()}`,
      descricao: descricao.trim(),
      quantidade: 1,
      valorUnitario: parseFloat(valor) || 0,
      desconto: 0,
    });
    setDescricao("");
    setValor("");
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-3" />
        Adicionar servico ou produto
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {open && (
        <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-3">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Descricao</label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Avaliacao fisica" className="bg-card border-border text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tipo</label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as "SERVICO" | "PRODUTO")}>
                <SelectTrigger className="w-28 bg-card border-border text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="SERVICO">Servico</SelectItem>
                  <SelectItem value="PRODUTO">Produto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Valor</label>
              <Input type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="w-24 bg-card border-border text-sm" />
            </div>
            <Button type="button" size="sm" onClick={handleAdd} disabled={!descricao.trim() || !valor} className="shrink-0">
              <Plus className="size-3.5" />
            </Button>
          </div>

          {avulsos.length > 0 && (
            <div className="space-y-1">
              {avulsos.map((item, idx) => {
                const cartIdx = commercial.cart.indexOf(item);
                return (
                  <div key={`${item.referenciaId}-${idx}`} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs">
                    <span className="flex-1">{item.descricao}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{item.tipo === "SERVICO" ? "Servico" : "Produto"}</span>
                    <span className="font-semibold">{formatBRL(item.valorUnitario)}</span>
                    <button type="button" onClick={() => commercial.removeCartItem(cartIdx)} className="text-muted-foreground hover:text-gym-danger">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
