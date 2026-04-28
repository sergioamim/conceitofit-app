"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  FORMA_PAGAMENTO_LABEL,
  type FormaPagamentoSplit,
  type ParcelaInputDto,
  type ParcelaResponseDto,
  criarPagamentoSplitApi,
  quitarComSplitApi,
  type PagamentoSplitResponseDto,
} from "@/lib/api/pagamentos-split";
import { ParcelasAcoesPanel } from "./parcelas-acoes-panel";

/**
 * Modal de cobrança split (multi-forma) — wave 4 do PRD_PAGAMENTO_SPLIT.
 *
 * Fluxo:
 * 1. Operador informa valor total e descrição
 * 2. Adiciona N formas (parcelas) — cada uma com valor próprio
 * 3. Cartões pedem NSU/bandeira/parcelas; PIX/dinheiro só valor
 * 4. Crédito interno valida saldo do aluno (futuro — hoje só campo)
 * 5. Quando soma === total, botão "Fechar pagamento" libera
 */

const FORMAS_DISPONIVEIS: FormaPagamentoSplit[] = [
  "DINHEIRO",
  "PIX",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "CREDITO_INTERNO",
];

type ParcelaLocal = ParcelaInputDto & { _key: string };

interface SplitCobrancaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  alunoId?: string;
  alunoNome?: string;
  operadorId?: string;
  /** Valor sugerido inicial (ex: vinha de uma cobrança pendente) */
  valorSugerido?: number;
  descricaoSugerida?: string;
  saldoCreditoInternoDisponivel?: number;
  /**
   * Quando informado, o modal opera no fluxo "quitar pagamento existente":
   * valor e descrição ficam bloqueados e o submit usa o endpoint
   * /pagamentos/{id}/quitar-com-split (em vez de criar pagamento novo).
   */
  pagamentoExistenteId?: string;
  onSuccess?: (pagamento: PagamentoSplitResponseDto) => void;
}

export function SplitCobrancaModal({
  open,
  onOpenChange,
  tenantId,
  alunoId,
  alunoNome,
  operadorId,
  valorSugerido = 0,
  descricaoSugerida = "",
  saldoCreditoInternoDisponivel = 0,
  pagamentoExistenteId,
  onSuccess,
}: SplitCobrancaModalProps) {
  const modoQuitar = Boolean(pagamentoExistenteId);
  const { toast } = useToast();

  const [valorTotal, setValorTotal] = useState<string>(
    valorSugerido > 0 ? valorSugerido.toFixed(2) : "",
  );
  const [descricao, setDescricao] = useState(descricaoSugerida);
  const [parcelas, setParcelas] = useState<ParcelaLocal[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Após criar pagamento: modo "gerenciar" mostra parcelas com ações.
  const [pagamentoCriado, setPagamentoCriado] =
    useState<PagamentoSplitResponseDto | null>(null);

  const valorTotalNum = useMemo(() => {
    const n = Number(valorTotal.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [valorTotal]);

  const somaParcelas = useMemo(
    () => parcelas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0),
    [parcelas],
  );

  const saldoRestante = useMemo(
    () => Math.max(0, +(valorTotalNum - somaParcelas).toFixed(2)),
    [valorTotalNum, somaParcelas],
  );

  const fechado = saldoRestante === 0 && parcelas.length > 0 && valorTotalNum > 0;
  const podeFechar = fechado && !submitting;

  const handleRemoveParcela = (key: string) => {
    setParcelas((prev) => prev.filter((p) => p._key !== key));
  };

  const handleAddParcela = (parcela: ParcelaInputDto) => {
    setParcelas((prev) => [
      ...prev,
      { ...parcela, _key: `${Date.now()}-${prev.length}` },
    ]);
    setAddOpen(false);
  };

  const handleFechar = async () => {
    if (!fechado) return;
    setSubmitting(true);
    try {
      const parcelasNet: ParcelaInputDto[] = parcelas.map(
        ({ _key: _ignore, ...rest }) => rest,
      );
      const result = modoQuitar
        ? await quitarComSplitApi(tenantId, pagamentoExistenteId!, {
            operadorId,
            parcelas: parcelasNet,
          })
        : await criarPagamentoSplitApi(tenantId, {
            alunoId,
            operadorId,
            tipo: "AVULSO",
            descricao: descricao || "Cobrança split",
            valor: valorTotalNum,
            desconto: 0,
            parcelas: parcelasNet,
          });
      toast({
        title: modoQuitar ? "Pagamento quitado" : "Pagamento criado",
        description: `${result.parcelas.length} forma(s), total ${formatBRL(result.valor)}.`,
      });
      onSuccess?.(result);
      // Transição pra modo "gerenciar" — operador pode confirmar PIX, estornar etc
      setPagamentoCriado(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao criar pagamento";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      // Reset full ao fechar
      setValorTotal("");
      setDescricao("");
      setParcelas([]);
      setPagamentoCriado(null);
    }
    onOpenChange(next);
  };

  // Modo "gerenciar" — após criar pagamento, mostra parcelas + ações
  if (pagamentoCriado) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pagamento criado</DialogTitle>
            <DialogDescription>
              {pagamentoCriado.descricao} · Total{" "}
              <strong>{formatBRL(pagamentoCriado.valor)}</strong> ·{" "}
              <span
                className={cn(
                  pagamentoCriado.status === "PAGO"
                    ? "text-green-700"
                    : "text-amber-700",
                )}
              >
                {pagamentoCriado.status}
              </span>
            </DialogDescription>
          </DialogHeader>

          <ParcelasAcoesPanel
            tenantId={tenantId}
            pagamentoId={pagamentoCriado.id}
            parcelas={pagamentoCriado.parcelas}
            operadorId={operadorId}
            onParcelaUpdated={(atualizada: ParcelaResponseDto) => {
              setPagamentoCriado((prev) =>
                prev
                  ? {
                      ...prev,
                      parcelas: prev.parcelas.map((p) =>
                        p.id === atualizada.id ? atualizada : p,
                      ),
                    }
                  : prev,
              );
            }}
          />

          <DialogFooter>
            <Button type="button" onClick={() => handleClose(false)}>
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modoQuitar ? "Receber pagamento via split" : "Cobrança Split"}
            </DialogTitle>
            <DialogDescription>
              {modoQuitar
                ? `Distribua o valor entre N formas. ${alunoNome ? `Cliente: ${alunoNome}` : ""}`
                : alunoNome
                  ? `Cliente: ${alunoNome}`
                  : "Cobrança avulsa multi-forma"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Valor total e descrição */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="split-valor-total" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor total {modoQuitar ? "(do pagamento)" : ""}
                </label>
                <Input
                  id="split-valor-total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  placeholder="0,00"
                  data-testid="split-valor-total"
                  disabled={parcelas.length > 0 || modoQuitar}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="split-descricao" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Descrição
                </label>
                <Input
                  id="split-descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Mensalidade Abril"
                  disabled={modoQuitar}
                />
              </div>
            </div>

            {/* Saldo restante */}
            {valorTotalNum > 0 && (
              <div
                className={cn(
                  "rounded-lg border p-3 text-center",
                  fechado
                    ? "border-green-500 bg-green-500/10"
                    : "border-amber-500 bg-amber-500/10",
                )}
                data-testid="split-saldo"
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {fechado ? "Pronto pra fechar" : "Saldo a quitar"}
                </div>
                <div className="font-mono text-2xl font-bold">
                  {formatBRL(saldoRestante)}
                </div>
                {parcelas.length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {parcelas.length} forma(s) · soma {formatBRL(somaParcelas)} de{" "}
                    {formatBRL(valorTotalNum)}
                  </div>
                )}
              </div>
            )}

            {/* Lista de parcelas */}
            {parcelas.length > 0 && (
              <ul className="space-y-1.5" data-testid="split-parcelas-list">
                {parcelas.map((p) => (
                  <li
                    key={p._key}
                    className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {FORMA_PAGAMENTO_LABEL[p.forma]}
                        {p.numeroParcelas && p.numeroParcelas > 1
                          ? ` · ${p.numeroParcelas}×`
                          : ""}
                        {p.bandeira ? ` · ${p.bandeira}` : ""}
                      </span>
                      {p.codigoAutorizacao && (
                        <span className="text-xs text-muted-foreground">
                          NSU {p.codigoAutorizacao}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{formatBRL(p.valor)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParcela(p._key)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remover forma"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Adicionar forma */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setAddOpen(true)}
              disabled={valorTotalNum <= 0 || saldoRestante <= 0}
              data-testid="split-add-forma"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar forma
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleFechar}
              disabled={!podeFechar}
              data-testid="split-fechar"
            >
              {submitting ? (
                "Processando..."
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Fechar pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdicionarFormaModal
        open={addOpen}
        onOpenChange={setAddOpen}
        saldoRestante={saldoRestante}
        saldoCreditoInternoDisponivel={saldoCreditoInternoDisponivel}
        onSubmit={handleAddParcela}
      />
    </>
  );
}

interface AdicionarFormaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saldoRestante: number;
  saldoCreditoInternoDisponivel: number;
  onSubmit: (parcela: ParcelaInputDto) => void;
}

function AdicionarFormaModal({
  open,
  onOpenChange,
  saldoRestante,
  saldoCreditoInternoDisponivel,
  onSubmit,
}: AdicionarFormaModalProps) {
  const [forma, setForma] = useState<FormaPagamentoSplit>("DINHEIRO");
  const [valor, setValor] = useState<string>(saldoRestante.toFixed(2));
  const [bandeira, setBandeira] = useState("");
  const [nsu, setNsu] = useState("");
  const [parcelasCartao, setParcelasCartao] = useState<number>(1);
  const [erro, setErro] = useState<string | null>(null);

  // Reset valor quando abre / saldo muda
  useMemo(() => {
    if (open) {
      setValor(saldoRestante.toFixed(2));
      setForma("DINHEIRO");
      setBandeira("");
      setNsu("");
      setParcelasCartao(1);
      setErro(null);
    }
  }, [open, saldoRestante]);

  const valorNum = useMemo(() => {
    const n = Number(valor.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [valor]);

  const isCartao = forma === "CARTAO_CREDITO" || forma === "CARTAO_DEBITO";
  const isCredito = forma === "CREDITO_INTERNO";

  const handleSubmit = () => {
    setErro(null);
    if (valorNum <= 0) {
      setErro("Valor deve ser maior que zero");
      return;
    }
    if (valorNum > saldoRestante + 0.001) {
      setErro(`Valor excede saldo restante (${formatBRL(saldoRestante)})`);
      return;
    }
    if (isCartao && !nsu.trim()) {
      setErro("NSU obrigatório para cartões");
      return;
    }
    if (isCredito && valorNum > saldoCreditoInternoDisponivel + 0.001) {
      setErro(
        `Saldo de crédito insuficiente (disponível ${formatBRL(saldoCreditoInternoDisponivel)})`,
      );
      return;
    }
    onSubmit({
      forma,
      valor: valorNum,
      numeroParcelas: forma === "CARTAO_CREDITO" ? parcelasCartao : undefined,
      bandeira: isCartao ? bandeira.trim() || undefined : undefined,
      codigoAutorizacao: isCartao ? nsu.trim() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar forma de pagamento</DialogTitle>
          <DialogDescription>
            Saldo restante: {formatBRL(saldoRestante)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Forma
            </label>
            <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamentoSplit)}>
              <SelectTrigger data-testid="split-add-forma-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_DISPONIVEIS.map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                    disabled={f === "CREDITO_INTERNO" && saldoCreditoInternoDisponivel <= 0}
                  >
                    {FORMA_PAGAMENTO_LABEL[f]}
                    {f === "CREDITO_INTERNO" && saldoCreditoInternoDisponivel > 0
                      ? ` (saldo ${formatBRL(saldoCreditoInternoDisponivel)})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label htmlFor="split-add-valor" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Valor
            </label>
            <Input
              id="split-add-valor"
              type="number"
              step="0.01"
              min="0"
              max={saldoRestante}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              data-testid="split-add-valor"
              className="font-mono"
            />
          </div>

          {forma === "CARTAO_CREDITO" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Parcelas
              </label>
              <Select
                value={String(parcelasCartao)}
                onValueChange={(v) => setParcelasCartao(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}× de {formatBRL(valorNum / Math.max(1, n))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isCartao && (
            <>
              <div className="space-y-1">
                <label htmlFor="split-add-bandeira" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bandeira (opcional)
                </label>
                <Input
                  id="split-add-bandeira"
                  value={bandeira}
                  onChange={(e) => setBandeira(e.target.value)}
                  placeholder="VISA, MASTERCARD, ELO..."
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="split-add-nsu" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  NSU / Código autorização *
                </label>
                <Input
                  id="split-add-nsu"
                  value={nsu}
                  onChange={(e) => setNsu(e.target.value)}
                  placeholder="Da maquininha"
                  data-testid="split-add-nsu"
                  className="font-mono"
                />
              </div>
            </>
          )}

          {erro && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4" />
              {erro}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} data-testid="split-add-submit">
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
