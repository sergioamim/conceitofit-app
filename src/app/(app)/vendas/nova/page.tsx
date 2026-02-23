"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { createVenda, getCurrentTenant, listAlunos, listPlanos, listProdutos, listServicos, listVoucherCodigos, listVouchers } from "@/lib/mock/services";
import type { Aluno, PagamentoVenda, Plano, Produto, Servico, Tenant, TipoVenda, Venda } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckoutPayment } from "@/components/shared/checkout-payment";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";
import { SaleReceiptModal } from "@/components/shared/sale-receipt-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CartItem {
  tipo: TipoVenda;
  referenciaId: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  detalhes?: string;
}

interface DetectResult {
  rawValue: string;
}

function formatBRL(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildPlanoItems(plano: Plano, parcelasAnuidade: number): CartItem[] {
  const items: CartItem[] = [
    {
      tipo: "PLANO",
      referenciaId: plano.id,
      descricao: `Plano: ${plano.nome}`,
      quantidade: 1,
      valorUnitario: Number(plano.valor ?? 0),
      desconto: 0,
    },
  ];

  if (Number(plano.valorMatricula ?? 0) > 0) {
    items.push({
      tipo: "PLANO",
      referenciaId: `${plano.id}:matricula`,
      descricao: `Matrícula: ${plano.nome}`,
      quantidade: 1,
      valorUnitario: Number(plano.valorMatricula ?? 0),
      desconto: 0,
      detalhes: "Cobrança única",
    });
  }

  const cobraAnuidade = Boolean(plano.cobraAnuidade);
  const valorAnuidade = Number(plano.valorAnuidade ?? 0);
  if (cobraAnuidade && valorAnuidade > 0) {
    const parcelas = Math.max(1, parcelasAnuidade || 1);
    items.push({
      tipo: "PLANO",
      referenciaId: `${plano.id}:anuidade`,
      descricao: `Anuidade: ${plano.nome}`,
      quantidade: 1,
      valorUnitario: valorAnuidade,
      desconto: 0,
      detalhes: `${parcelas}x de ${formatBRL(valorAnuidade / parcelas)}`,
    });
  }

  return items;
}

function inferSaleTypeFromCart(items: CartItem[]): TipoVenda {
  if (items.some((item) => item.tipo === "PLANO")) return "PLANO";
  if (items.some((item) => item.tipo === "SERVICO")) return "SERVICO";
  return "PRODUTO";
}

export default function NovaVendaPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tipoVenda, setTipoVenda] = useState<TipoVenda>("PLANO");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [clienteQuery, setClienteQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemQuery, setItemQuery] = useState("");
  const [qtd, setQtd] = useState("1");
  const [selectedPlanoId, setSelectedPlanoId] = useState("");
  const [parcelasAnuidade, setParcelasAnuidade] = useState("1");
  const [cupomCode, setCupomCode] = useState("");
  const [cupomAppliedCode, setCupomAppliedCode] = useState("");
  const [cupomPercent, setCupomPercent] = useState(0);
  const [cupomError, setCupomError] = useState("");
  const [acrescimoGeral, setAcrescimoGeral] = useState("0");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptVenda, setReceiptVenda] = useState<Venda | null>(null);
  const [receiptCliente, setReceiptCliente] = useState<Aluno | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      const [t, als, pls, svs, prds] = await Promise.all([
        getCurrentTenant(),
        listAlunos(),
        listPlanos(),
        listServicos({ apenasAtivos: true }),
        listProdutos({ apenasAtivos: true }),
      ]);
      setTenant(t);
      setAlunos(als);
      setPlanos(pls.filter((p) => p.ativo));
      setServicos(svs);
      setProdutos(prds);
    }
    load();
  }, []);

  useEffect(() => {
    setSelectedItemId("");
    setItemQuery("");
    setQtd("1");
  }, [tipoVenda]);

  const options = useMemo(() => {
    if (tipoVenda === "PLANO") {
      return planos.map((p) => ({ id: p.id, nome: p.nome, valor: Number(p.valor ?? 0), searchText: p.nome }));
    }
    if (tipoVenda === "SERVICO") {
      return servicos.map((s) => ({ id: s.id, nome: s.nome, valor: Number(s.valor ?? 0), searchText: `${s.nome} ${s.sku ?? ""}` }));
    }
    return produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      valor: Number(p.valorVenda ?? 0),
      codigoBarras: p.codigoBarras,
      sku: p.sku,
      searchText: `${p.nome} ${p.sku ?? ""} ${p.codigoBarras ?? ""}`,
    }));
  }, [tipoVenda, planos, servicos, produtos]);

  const clienteOptions = useMemo<SuggestionOption[]>(
    () =>
      alunos.map((a) => ({
        id: a.id,
        label: `${a.nome} · CPF ${a.cpf}`,
        searchText: `${a.nome} ${a.cpf}`,
      })),
    [alunos]
  );

  const itemOptions = useMemo<SuggestionOption[]>(
    () =>
      options.map((o) => ({
        id: o.id,
        label: `${o.nome} · ${formatBRL(o.valor)}`,
        searchText: `${o.searchText ?? ""}`,
      })),
    [options]
  );

  useEffect(() => {
    if (!clienteId) return;
    const selected = clienteOptions.find((c) => c.id === clienteId);
    if (selected) setClienteQuery(selected.label);
  }, [clienteId, clienteOptions]);

  useEffect(() => {
    if (!selectedItemId) return;
    const selected = itemOptions.find((o) => o.id === selectedItemId);
    if (selected) setItemQuery(selected.label);
  }, [selectedItemId, itemOptions]);

  const selectedPlano = useMemo(
    () => planos.find((plano) => plano.id === selectedPlanoId),
    [planos, selectedPlanoId]
  );

  const requireCliente = useMemo(
    () => cart.some((item) => item.tipo === "PLANO" || item.tipo === "SERVICO"),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.valorUnitario * i.quantidade, 0),
    [cart]
  );
  const descontoCupom = useMemo(() => (subtotal * cupomPercent) / 100, [subtotal, cupomPercent]);
  const descontoTotal = descontoCupom;
  const acrescimoTotal = parseFloat(acrescimoGeral) || 0;
  const total = Math.max(0, subtotal - descontoTotal + acrescimoTotal);

  function addItem() {
    const selected = options.find((o) => o.id === selectedItemId);
    if (!selected) return;

    const item: CartItem = {
      tipo: tipoVenda,
      referenciaId: selected.id,
      descricao: selected.nome,
      quantidade: Math.max(1, parseInt(qtd, 10) || 1),
      valorUnitario: selected.valor,
      desconto: 0,
    };

    setCart((prev) => [...prev, item]);
  }

  function addPlanoToCart(plano: Plano) {
    const maxParcelas = Math.max(1, Number(plano.parcelasMaxAnuidade ?? 1));
    const parcelas = Math.min(maxParcelas, Math.max(1, parseInt(parcelasAnuidade, 10) || 1));
    setParcelasAnuidade(String(parcelas));
    setSelectedPlanoId(plano.id);
    setCart((prev) => {
      const semPlano = prev.filter((item) => item.tipo !== "PLANO");
      return [...buildPlanoItems(plano, parcelas), ...semPlano];
    });
  }

  function refreshPlanoItems(parcelas: number) {
    if (!selectedPlano) return;
    setCart((prev) => {
      const semPlano = prev.filter((item) => item.tipo !== "PLANO");
      return [...buildPlanoItems(selectedPlano, parcelas), ...semPlano];
    });
  }

  function removeCartItem(index: number) {
    const target = cart[index];
    if (!target) return;
    if (target.tipo === "PLANO") {
      setCart((prev) => prev.filter((item) => item.tipo !== "PLANO"));
      setSelectedPlanoId("");
      setParcelasAnuidade("1");
      return;
    }
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  }

  function clearScannerResources() {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  const applyCodeToProduct = useCallback((code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;

    const match = produtos.find((p) => {
      const cb = p.codigoBarras?.trim().toUpperCase();
      const sku = p.sku?.trim().toUpperCase();
      return cb === normalized || sku === normalized;
    });

    if (!match) return false;

    if (tipoVenda !== "PRODUTO") {
      setTipoVenda("PRODUTO");
    }
    setSelectedItemId(match.id);
    setItemQuery(`${match.nome} · ${formatBRL(Number(match.valorVenda ?? 0))}`);
    return true;
  }, [produtos, tipoVenda]);

  useEffect(() => {
    if (!scannerOpen) {
      clearScannerResources();
      return;
    }

    let cancelled = false;
    async function startScanner() {
      setScannerError("");
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setScannerError("Câmera não disponível neste dispositivo/navegador.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const Detector = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => { detect: (input: HTMLVideoElement) => Promise<DetectResult[]> } }).BarcodeDetector;
        if (!Detector) {
          setScannerError("Leitura automática não suportada. Use o campo de código manual.");
          return;
        }

        const detector = new Detector({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"],
        });

        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length === 0) return;
            const codeValue = codes[0]?.rawValue ?? "";
            if (applyCodeToProduct(codeValue)) {
              setScannerOpen(false);
            } else {
              setScannerError(`Código ${codeValue} não encontrado nos produtos.`);
            }
          } catch {
            setScannerError("Não foi possível ler o código. Tente novamente.");
          }
        }, 600);
      } catch {
        setScannerError("Não foi possível acessar a câmera.");
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      clearScannerResources();
    };
  }, [applyCodeToProduct, scannerOpen]);

  async function applyCupom() {
    const code = cupomCode.trim().toUpperCase();
    if (!code) {
      setCupomPercent(0);
      setCupomAppliedCode("");
      setCupomError("");
      return;
    }
    const now = new Date().toISOString().slice(0, 10);
    const vouchers = (await listVouchers()).filter((v) => {
      if (!v.ativo || !v.usarNaVenda) return false;
      if (v.periodoInicio > now) return false;
      if (v.prazoDeterminado && v.periodoFim && v.periodoFim < now) return false;
      return true;
    });
    for (const voucher of vouchers) {
      const codigos = await listVoucherCodigos(voucher.id);
      const match = codigos.some((c) => c.codigo.trim().toUpperCase() === code);
      if (!match) continue;
      const percent = (voucher.tipo ?? "").toUpperCase().includes("DESCONTO") ? 10 : 0;
      if (percent <= 0) {
        setCupomError("Cupom encontrado, mas sem desconto aplicável para essa venda.");
        setCupomAppliedCode("");
        setCupomPercent(0);
        return;
      }
      setCupomAppliedCode(code);
      setCupomPercent(percent);
      setCupomError("");
      return;
    }
    setCupomError("Cupom inválido para esta unidade/período.");
    setCupomAppliedCode("");
    setCupomPercent(0);
  }

  async function handleConfirmPayment(pagamento: PagamentoVenda) {
    if (requireCliente && !clienteId) {
      alert("Cliente é obrigatório para venda de plano/serviço.");
      return;
    }
    if (cart.length === 0) {
      alert("Adicione ao menos um item à venda.");
      return;
    }

    setSaving(true);
    try {
      const tipoFinal = inferSaleTypeFromCart(cart);
      const venda = await createVenda({
        tipo: tipoFinal,
        clienteId: clienteId || undefined,
        itens: cart.map((i) => ({
          tipo: i.tipo,
          referenciaId: i.referenciaId,
          descricao: i.descricao,
          quantidade: i.quantidade,
          valorUnitario: i.valorUnitario,
          desconto: i.desconto,
        })),
        descontoTotal,
        acrescimoTotal: parseFloat(acrescimoGeral) || 0,
        pagamento,
      });
      setReceiptVenda(venda);
      setReceiptCliente(alunos.find((a) => a.id === venda.clienteId) ?? null);
      setReceiptOpen(true);
      setCart([]);
      setSelectedItemId("");
      setItemQuery("");
      setQtd("1");
      setSelectedPlanoId("");
      setParcelasAnuidade("1");
      setCupomCode("");
      setCupomAppliedCode("");
      setCupomPercent(0);
      setCupomError("");
      setAcrescimoGeral("0");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao registrar venda");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SaleReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        venda={receiptVenda}
        cliente={receiptCliente}
        tenant={tenant}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Nova Venda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Carrinho unificado de plano, serviço e produto
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Unidade</p>
          <p className="font-medium">{tenant?.nome ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{tenant?.subdomain ?? ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de venda</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["PLANO", "SERVICO", "PRODUTO"] as TipoVenda[]).map((tipo) => (
                <Button
                  key={tipo}
                  variant={tipoVenda === tipo ? "default" : "outline"}
                  className={tipoVenda === tipo ? "" : "border-border"}
                  onClick={() => setTipoVenda(tipo)}
                >
                  {tipo}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className={tipoVenda === "PLANO" ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-3 md:grid-cols-2"}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cliente {requireCliente ? "*" : "(opcional)"}
                </label>
                <SuggestionInput
                  value={clienteQuery}
                  onValueChange={(value) => {
                    setClienteQuery(value);
                    const exact = clienteOptions.find((option) => option.label === value);
                    setClienteId(exact?.id ?? "");
                  }}
                  onSelect={(option) => {
                    setClienteId(option.id);
                    setClienteQuery(option.label);
                  }}
                  options={clienteOptions}
                  placeholder="Buscar por nome ou CPF"
                />
                {!requireCliente && (
                  <button
                    type="button"
                    className="cursor-pointer text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={() => {
                      setClienteId("");
                      setClienteQuery("");
                    }}
                  >
                    Limpar cliente (venda sem identificação)
                  </button>
                )}
              </div>

              {tipoVenda !== "PLANO" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item</label>
                  <div className="flex items-center gap-2">
                    <SuggestionInput
                      className="flex-1"
                      value={itemQuery}
                      onValueChange={(value) => {
                        setItemQuery(value);
                        const exact = itemOptions.find((option) => option.label === value);
                        setSelectedItemId(exact?.id ?? "");
                      }}
                      onSelect={(option) => {
                        setSelectedItemId(option.id);
                        setItemQuery(option.label);
                      }}
                      options={itemOptions}
                      placeholder="Buscar item por nome"
                    />
                    {tipoVenda === "PRODUTO" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 border-border"
                        onClick={() => setScannerOpen(true)}
                        title="Leitor de código de barras"
                      >
                        <ScanLine className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {tipoVenda !== "PLANO" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quantidade</label>
                  <Input type="number" min={1} value={qtd} onChange={(e) => setQtd(e.target.value)} className="bg-secondary border-border" />
                </div>
                <div className="flex items-end">
                  <Button onClick={addItem} className="w-full" disabled={!selectedItemId}>Adicionar item</Button>
                </div>
              </div>
            )}

            {tipoVenda === "PLANO" && (
              <div className="mt-3 space-y-3">
                {selectedPlano?.cobraAnuidade && Number(selectedPlano.valorAnuidade ?? 0) > 0 && (
                  <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-secondary/20 p-3 md:grid-cols-[1fr_180px]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Anuidade do plano</p>
                      <p className="text-sm text-muted-foreground">
                        Valor {formatBRL(Number(selectedPlano.valorAnuidade ?? 0))} pago em até{" "}
                        {Math.max(1, Number(selectedPlano.parcelasMaxAnuidade ?? 1))}x.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parcelas da anuidade</label>
                      <Select
                        value={parcelasAnuidade}
                        onValueChange={(value) => {
                          setParcelasAnuidade(value);
                          refreshPlanoItems(Math.max(1, parseInt(value, 10) || 1));
                        }}
                      >
                        <SelectTrigger className="w-full border-border bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          {Array.from({ length: Math.max(1, Number(selectedPlano.parcelasMaxAnuidade ?? 1)) }).map((_, idx) => {
                            const parcelas = idx + 1;
                            const parcelaValor = Number(selectedPlano.valorAnuidade ?? 0) / parcelas;
                            return (
                              <SelectItem key={parcelas} value={String(parcelas)}>
                                {parcelas}x de {formatBRL(parcelaValor)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  {planos.map((plano) => {
                    const selected = selectedPlanoId === plano.id;
                    return (
                      <button
                        key={plano.id}
                        type="button"
                        onClick={() => addPlanoToCart(plano)}
                        className={`cursor-pointer rounded-lg border p-3 text-left transition-colors ${
                          selected ? "border-gym-accent bg-gym-accent/10" : "border-border bg-secondary/30 hover:bg-secondary/50"
                        }`}
                      >
                        <p className="text-sm font-semibold">{plano.nome}</p>
                        <p className="mt-1 font-display text-lg font-bold text-gym-accent">{formatBRL(Number(plano.valor ?? 0))}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{plano.tipo} · {plano.duracaoDias} dias</p>
                        <p className="mt-2 text-[11px] text-muted-foreground">Matrícula: {formatBRL(Number(plano.valorMatricula ?? 0))}</p>
                        {plano.cobraAnuidade && Number(plano.valorAnuidade ?? 0) > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Anuidade: {formatBRL(Number(plano.valorAnuidade ?? 0))} (até {Math.max(1, Number(plano.parcelasMaxAnuidade ?? 1))}x)
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Itens da venda</h3>
              <span className="text-xs text-muted-foreground">{cart.length} item(ns)</span>
            </div>

            <div className="mt-3 space-y-2">
              {cart.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>}
              {cart.map((item, idx) => (
                <div key={`${item.referenciaId}-${idx}`} className="rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.descricao}</p>
                    <Button variant="outline" size="sm" className="h-7 border-border" onClick={() => removeCartItem(idx)}>Remover</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.tipo === "PLANO" ? formatBRL(item.valorUnitario) : `${item.quantidade} x ${formatBRL(item.valorUnitario)}`}
                  </p>
                  {item.detalhes && <p className="text-[11px] text-muted-foreground">{item.detalhes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-base font-bold">Resumo</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(subtotal)}</span></div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Cupom</span>
                <div className="flex items-center gap-2">
                  <Input
                    value={cupomCode}
                    onChange={(e) => setCupomCode(e.target.value.toUpperCase())}
                    placeholder="Código"
                    className="h-8 w-32 bg-secondary border-border"
                  />
                  <Button type="button" variant="outline" size="sm" className="border-border" onClick={applyCupom}>
                    Aplicar
                  </Button>
                </div>
              </div>
              {cupomAppliedCode && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gym-teal">Cupom {cupomAppliedCode} aplicado ({cupomPercent}%)</span>
                  <span className="text-gym-teal">- {formatBRL(descontoCupom)}</span>
                </div>
              )}
              {cupomError && <p className="text-xs text-gym-danger">{cupomError}</p>}
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Acréscimo</span>
                <Input type="number" min={0} step="0.01" value={acrescimoGeral} onChange={(e) => setAcrescimoGeral(e.target.value)} className="h-8 w-28 bg-secondary border-border" />
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-gym-accent">{formatBRL(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <CheckoutPayment total={total} onConfirm={handleConfirmPayment} loading={saving} />
        </div>
      </div>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Leitor de código de barras</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aponte a câmera para o código de barras do produto ou informe o código manualmente.
            </p>
            <video ref={videoRef} className="h-56 w-full rounded-md border border-border bg-black/80 object-cover" />

            <div className="flex items-center gap-2">
              <Input
                placeholder="Código de barras ou SKU"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="bg-secondary border-border"
              />
              <Button
                type="button"
                onClick={() => {
                  if (!applyCodeToProduct(manualCode)) {
                    setScannerError("Código não encontrado nos produtos.");
                    return;
                  }
                  setScannerOpen(false);
                }}
              >
                Buscar
              </Button>
            </div>

            {scannerError && (
              <p className="text-xs text-gym-danger">{scannerError}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
