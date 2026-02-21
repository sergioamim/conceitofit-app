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
import { listPlanos } from "@/lib/mock/services";
import type { Plano, VoucherAplicarEm } from "@/lib/types";

const VOUCHER_TYPES = [
  { value: "DESCONTO", label: "Desconto" },
  { value: "ACESSO", label: "Acesso livre" },
  { value: "SESSAO", label: "Sessão avulsa" },
];

type VoucherCodeType = "UNICO" | "ALEATORIO";

export interface NovoVoucherPayload {
  tipo: string;
  nome: string;
  periodoInicio: string;
  periodoFim?: string;
  prazoDeterminado: boolean;
  quantidade?: number;
  ilimitado: boolean;
  codigoTipo: VoucherCodeType;
  codigoUnicoCustom?: string;
  usarNaVenda: boolean;
  planoIds: string[];
  umaVezPorCliente: boolean;
  aplicarEm: VoucherAplicarEm[];
}

export function NovoVoucherModal({
  open,
  onClose,
  onNext,
}: {
  open: boolean;
  onClose: () => void;
  onNext: (payload: NovoVoucherPayload) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  // ─── Step 1 state ─────────────────────────────────────────
  const [tipo, setTipo] = useState("");
  const [nome, setNome] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [prazoDeterminado, setPrazoDeterminado] = useState(true);
  const [quantidade, setQuantidade] = useState("");
  const [ilimitada, setIlimitada] = useState(false);
  const [codigoTipo, setCodigoTipo] = useState<VoucherCodeType>("UNICO");
  const [codigoUnicoCustom, setCodigoUnicoCustom] = useState("");
  const [usarNaVenda, setUsarNaVenda] = useState(false);
  const [planoIds, setPlanoIds] = useState<string[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Step 2 state ─────────────────────────────────────────
  const [umaVezPorCliente, setUmaVezPorCliente] = useState(false);
  const [aplicarEm, setAplicarEm] = useState<VoucherAplicarEm[]>(["CONTRATO"]);

  useEffect(() => {
    if (open) {
      listPlanos().then((data) => setPlanos(data.filter((p) => p.ativo)));
    }
  }, [open]);

  function resetAll() {
    setStep(1);
    setTipo("");
    setNome("");
    setPeriodoInicio("");
    setPeriodoFim("");
    setPrazoDeterminado(true);
    setQuantidade("");
    setIlimitada(false);
    setCodigoTipo("UNICO");
    setCodigoUnicoCustom("");
    setUsarNaVenda(false);
    setPlanoIds([]);
    setErrors({});
    setUmaVezPorCliente(false);
    setAplicarEm(["CONTRATO"]);
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  function handleProximo() {
    const nextErrors: Record<string, string> = {};
    if (!tipo) nextErrors.tipo = "Selecione o tipo de voucher";
    if (!nome.trim()) nextErrors.nome = "Informe o nome do voucher";
    if (!periodoInicio) nextErrors.periodoInicio = "Informe a data de início";
    if (prazoDeterminado && !periodoFim) nextErrors.periodoFim = "Informe a data de término";
    if (!ilimitada && !quantidade) {
      nextErrors.quantidade = "Informe a quantidade ou marque ilimitada";
    }
    if (codigoTipo === "UNICO" && !codigoUnicoCustom.trim()) {
      nextErrors.codigoUnicoCustom = "Digite o código único do voucher";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setStep(2);
  }

  function handleGerar() {
    onNext({
      tipo,
      nome: nome.trim(),
      periodoInicio,
      periodoFim: prazoDeterminado ? periodoFim : undefined,
      prazoDeterminado,
      quantidade: ilimitada ? undefined : Number(quantidade),
      ilimitado: ilimitada,
      codigoTipo,
      codigoUnicoCustom:
        codigoTipo === "UNICO" ? codigoUnicoCustom.trim().toUpperCase() : undefined,
      usarNaVenda,
      planoIds,
      umaVezPorCliente,
      aplicarEm,
    });
    resetAll();
  }

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
    if (todosPlanosSelecionados) {
      setPlanoIds([]);
    } else {
      setPlanoIds(planos.map((p) => p.id));
    }
  }

  const TIPO_LABEL: Record<string, string> = {
    DESCONTO: "Desconto",
    ACESSO: "Acesso livre",
    SESSAO: "Sessão avulsa",
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Novo voucher
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Passo {step} de 2
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* ─── STEP 1 ─── */}
        {step === 1 && (
          <div className="max-h-[65vh] overflow-y-auto space-y-5 pr-1">
            {/* Tipo */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Tipo de voucher *</span>
                <HoverPopover content="Escolha a finalidade do voucher (desconto, sessão, acesso etc.).">
                  <HelpCircle className="size-4 text-muted-foreground" />
                </HoverPopover>
              </div>
              <Select value={tipo} onValueChange={(v) => setTipo(v)}>
                <SelectTrigger className="w-full bg-secondary border-border text-sm">
                  <SelectValue placeholder="Selecione o tipo de voucher" />
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
                placeholder="Digite o nome do voucher"
              />
              {errors.nome && (
                <p className="text-xs text-gym-danger">{errors.nome}</p>
              )}
            </div>

            {/* Período de validade */}
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
                <HoverPopover content="Quantidade máxima de vouchers que podem ser emitidos.">
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
                  <HoverPopover content="O voucher poderá ser gerado quantas vezes forem necessárias.">
                    <HelpCircle className="size-4 text-muted-foreground" />
                  </HoverPopover>
                </label>
              </div>
              {!ilimitada && errors.quantidade && (
                <p className="text-xs text-gym-danger">{errors.quantidade}</p>
              )}
            </div>

            {/* Tipo de código */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de código
              </p>
              <div className="flex flex-col gap-2">
                {(
                  [
                    {
                      value: "UNICO" as VoucherCodeType,
                      label: "Código único",
                      help: "Um único código para todos os clientes — você define o código.",
                    },
                    {
                      value: "ALEATORIO" as VoucherCodeType,
                      label: "Códigos aleatórios",
                      help: "Gera combinações únicas de 6 caracteres para cada emissão.",
                    },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 rounded-md border border-border/50 bg-secondary/60 px-3 py-2 text-sm font-medium cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="codigoTipo"
                      value={option.value}
                      checked={codigoTipo === option.value}
                      onChange={() => setCodigoTipo(option.value)}
                    />
                    <span className="flex-1">{option.label}</span>
                    <HoverPopover content={option.help}>
                      <Info className="size-4 text-muted-foreground" />
                    </HoverPopover>
                  </label>
                ))}
              </div>
              {codigoTipo === "UNICO" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Código *
                  </label>
                  <Input
                    value={codigoUnicoCustom}
                    onChange={(e) => {
                      const val = e.target.value
                        .toUpperCase()
                        .replace(/\s/g, "")
                        .slice(0, 20);
                      setCodigoUnicoCustom(val);
                    }}
                    className="bg-secondary border-border font-mono tracking-widest"
                    placeholder="Ex: VERAO2025"
                    maxLength={20}
                  />
                  <p className="text-[11px] text-muted-foreground/70">
                    Sem espaços · máx. 20 caracteres · {codigoUnicoCustom.length}/20
                  </p>
                  {errors.codigoUnicoCustom && (
                    <p className="text-xs text-gym-danger">{errors.codigoUnicoCustom}</p>
                  )}
                </div>
              )}
            </div>

            {/* Usar na venda */}
            <div className="flex items-center gap-2">
              <input
                id="usarNaVenda"
                type="checkbox"
                checked={usarNaVenda}
                onChange={(e) => setUsarNaVenda(e.target.checked)}
              />
              <label htmlFor="usarNaVenda" className="text-sm text-muted-foreground cursor-pointer">
                Utilizar na página de vendas
              </label>
              <HoverPopover content="Habilita o voucher direto na tela de vendas.">
                <HelpCircle className="size-4 text-muted-foreground" />
              </HoverPopover>
            </div>

            {/* Contratos aplicáveis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Contratos aplicáveis</span>
                  <HoverPopover content="Selecione os planos nos quais este voucher poderá ser utilizado. Deixe em branco para aplicar em todos.">
                    <HelpCircle className="size-4 text-muted-foreground" />
                  </HoverPopover>
                </div>
                {planos.length > 0 && (
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={todosPlanosSelecionados}
                      onChange={toggleTodosPlanos}
                    />
                    Selecionar todos
                  </label>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-secondary/40 p-3 space-y-1.5">
                {planos.length === 0 && (
                  <p className="text-xs text-muted-foreground">Carregando planos…</p>
                )}
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
              {planoIds.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/70">
                  Nenhum plano selecionado — válido para todos os contratos.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground/70">
                  {planoIds.length} plano(s) selecionado(s).
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 2 ─── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Resumo */}
            <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resumo
              </p>
              <p className="text-sm font-semibold">{nome}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                <span>Tipo: {TIPO_LABEL[tipo]}</span>
                <span>
                  Período:{" "}
                  {periodoInicio}
                  {prazoDeterminado && periodoFim ? ` → ${periodoFim}` : " · Indeterminado"}
                </span>
                <span>Qtd: {ilimitada ? "Ilimitada" : quantidade}</span>
                <span>
                  Código: {codigoTipo === "UNICO" ? codigoUnicoCustom || "Único" : "Aleatório"}
                </span>
                {planoIds.length > 0 && (
                  <span>{planoIds.length} contrato(s) selecionado(s)</span>
                )}
              </div>
            </div>

            {/* Regras de uso */}
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
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Aplicar no valor de</span>
                <HoverPopover content="Define se o voucher incide sobre o contrato (mensalidade), a anuidade, ou ambos.">
                  <Info className="size-4 text-muted-foreground" />
                </HoverPopover>
              </div>
              <div className="flex flex-col gap-2">
                {(
                  [
                    {
                      value: "CONTRATO" as VoucherAplicarEm,
                      label: "Contrato",
                      desc: "Aplica o benefício no valor do plano/mensalidade.",
                    },
                    {
                      value: "ANUIDADE" as VoucherAplicarEm,
                      label: "Anuidade",
                      desc: "Aplica o benefício no valor anual do plano.",
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/60 px-3 py-2.5 cursor-pointer hover:bg-secondary transition-colors"
                  >
                    <input
                      type="checkbox"
                      value={opt.value}
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
        )}

        <DialogFooter className="justify-between gap-2">
          <div>
            {step === 2 && (
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            {step === 1 && (
              <Button onClick={handleProximo}>Próximo →</Button>
            )}
            {step === 2 && (
              <Button
                onClick={handleGerar}
                className="bg-gym-accent text-black hover:bg-gym-accent/90"
              >
                Gerar Voucher
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
