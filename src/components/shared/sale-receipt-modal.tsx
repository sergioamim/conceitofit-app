"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Aluno, Tenant, Venda } from "@/lib/types";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export function SaleReceiptModal({
  open,
  onClose,
  venda,
  cliente,
  tenant,
}: {
  open: boolean;
  onClose: () => void;
  venda: Venda | null;
  cliente?: Aluno | null;
  tenant?: Tenant | null;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState("");
  const [printModeOverride, setPrintModeOverride] = useState<"58MM" | "80MM" | "CUSTOM" | null>(null);
  const [customWidthOverride, setCustomWidthOverride] = useState<string | null>(null);

  const totalItens = useMemo(
    () => venda?.itens.reduce((sum, item) => sum + item.quantidade, 0) ?? 0,
    [venda]
  );

  const emailValue = email ?? cliente?.email ?? "";
  const tenantPrintMode = tenant?.configuracoes?.impressaoCupom?.modo ?? "80MM";
  const tenantCustomWidth = String(tenant?.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80);
  const printMode = printModeOverride ?? tenantPrintMode;
  const customWidthValue = customWidthOverride ?? tenantCustomWidth;

  function resetAndClose() {
    setSentMessage("");
    setSending(false);
    setEmail(null);
    setPrintModeOverride(null);
    setCustomWidthOverride(null);
    onClose();
  }

  async function handleSendEmail() {
    const mail = emailValue.trim();
    if (!mail || !mail.includes("@")) {
      setSentMessage("Informe um e-mail válido.");
      return;
    }
    setSending(true);
    setSentMessage("");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSending(false);
    setSentMessage(`Recibo enviado para ${mail}.`);
  }

  function handlePrintCupom() {
    if (!venda) return;
    const mm = printMode === "58MM"
      ? 58
      : printMode === "80MM"
        ? 80
        : Math.max(40, Math.min(120, Number(customWidthValue) || 80));

    const itemsHtml = venda.itens.map((item) => {
      const title = escapeHtml(item.descricao);
      const line = `${item.quantidade} x ${formatBRL(item.valorUnitario)}`;
      return `
        <div class="item">
          <div class="name">${title}</div>
          <div class="meta">
            <span>${escapeHtml(line)}</span>
            <span>${escapeHtml(formatBRL(item.valorTotal))}</span>
          </div>
        </div>
      `;
    }).join("");

    const w = window.open("", "_blank", "noopener,noreferrer,width=420,height=720");
    if (!w) {
      window.alert("Não foi possível abrir a impressão. Verifique bloqueio de pop-up.");
      return;
    }

    const html = `
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Cupom de venda</title>
        <style>
          @page { size: auto; margin: 4mm; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111; }
          .cupom { width: ${mm}mm; margin: 0 auto; font-size: 12px; line-height: 1.3; }
          .title { text-align: center; font-weight: 700; margin: 2mm 0 1mm; }
          .sub { text-align: center; margin-bottom: 2mm; font-size: 11px; }
          .sep { border-top: 1px dashed #444; margin: 2mm 0; }
          .line { display: flex; justify-content: space-between; gap: 8px; }
          .item { margin-bottom: 2mm; }
          .item .name { font-weight: 700; margin-bottom: 1mm; word-break: break-word; }
          .item .meta { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; }
          .total { font-size: 14px; font-weight: 700; }
          .foot { margin-top: 3mm; text-align: center; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="cupom">
          <div class="title">${escapeHtml(tenant?.nome ?? "Unidade")}</div>
          <div class="sub">Cupom de venda</div>
          <div class="sep"></div>
          <div class="line"><span>Nº:</span><span>${escapeHtml(venda.id)}</span></div>
          <div class="line"><span>Data:</span><span>${escapeHtml(formatDateTime(venda.dataCriacao))}</span></div>
          <div class="line"><span>Cliente:</span><span>${escapeHtml(venda.clienteNome ?? "Não identificado")}</span></div>
          <div class="sep"></div>
          ${itemsHtml}
          <div class="sep"></div>
          <div class="line"><span>Subtotal</span><span>${escapeHtml(formatBRL(venda.subtotal))}</span></div>
          <div class="line"><span>Desconto</span><span>${escapeHtml(formatBRL(venda.descontoTotal))}</span></div>
          <div class="line"><span>Acréscimo</span><span>${escapeHtml(formatBRL(venda.acrescimoTotal))}</span></div>
          <div class="line total"><span>Total</span><span>${escapeHtml(formatBRL(venda.total))}</span></div>
          <div class="sep"></div>
          <div class="line"><span>Pagamento</span><span>${escapeHtml(venda.pagamento.formaPagamento)}</span></div>
          ${venda.pagamento.parcelas ? `<div class="line"><span>Parcelas</span><span>${venda.pagamento.parcelas}x</span></div>` : ""}
          <div class="foot">Documento não fiscal</div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
      </html>
    `;

    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  if (!venda) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? resetAndClose() : null)}>
      <DialogContent className="border-border bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Recibo da venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
            <p><span className="text-muted-foreground">Nº:</span> {venda.id}</p>
            <p><span className="text-muted-foreground">Data:</span> {formatDateTime(venda.dataCriacao)}</p>
            <p><span className="text-muted-foreground">Tipo:</span> {venda.tipo}</p>
            <p><span className="text-muted-foreground">Cliente:</span> {venda.clienteNome ?? "Não identificado"}</p>
          </div>

          <div className="rounded-lg border border-border">
            <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Itens ({totalItens})
            </div>
            <div className="space-y-2 p-3">
              {venda.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantidade} x {formatBRL(item.valorUnitario)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatBRL(item.valorTotal)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 rounded-lg border border-border bg-secondary/20 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(venda.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <span>{formatBRL(venda.descontoTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Acréscimo</span>
              <span>{formatBRL(venda.acrescimoTotal)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total pago</span>
              <span className="text-gym-accent">{formatBRL(venda.total)}</span>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Enviar recibo por e-mail
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={emailValue}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@cliente.com"
                className="bg-secondary border-border"
              />
              <Button type="button" onClick={handleSendEmail} disabled={sending}>
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
            {sentMessage && <p className="text-xs text-muted-foreground">{sentMessage}</p>}
          </div>

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Impressão do cupom
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
              <Select value={printMode} onValueChange={(value) => setPrintModeOverride(value as "58MM" | "80MM" | "CUSTOM")}>
                <SelectTrigger className="w-full border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="80MM">80mm (padrão)</SelectItem>
                  <SelectItem value="58MM">58mm</SelectItem>
                  <SelectItem value="CUSTOM">Customizado</SelectItem>
                </SelectContent>
              </Select>

              {printMode === "CUSTOM" ? (
                <Input
                  type="number"
                  min={40}
                  max={120}
                  value={customWidthValue}
                  onChange={(e) => setCustomWidthOverride(e.target.value)}
                  className="border-border bg-secondary"
                  placeholder="Largura em mm"
                />
              ) : (
                <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  Tamanho aplicado ao imprimir
                </div>
              )}
            </div>
            <Button type="button" variant="outline" className="w-full border-border" onClick={handlePrintCupom}>
              Imprimir cupom
            </Button>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" className="border-border" onClick={resetAndClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
