"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Aluno, Plano, Tenant, Venda } from "@/lib/types";

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
  plano,
  contratoAutoEnvioMensagem,
  voucherCodigo,
  voucherDescontoPercent,
}: {
  open: boolean;
  onClose: () => void;
  venda: Venda | null;
  cliente?: Aluno | null;
  tenant?: Tenant | null;
  plano?: Plano | null;
  contratoAutoEnvioMensagem?: string;
  voucherCodigo?: string;
  voucherDescontoPercent?: number;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState("");
  const [sendingContrato, setSendingContrato] = useState(false);
  const [sentContratoMessage, setSentContratoMessage] = useState("");

  const totalItens = useMemo(
    () => venda?.itens.reduce((sum, item) => sum + item.quantidade, 0) ?? 0,
    [venda]
  );

  const emailValue = email ?? cliente?.email ?? "";
  function resetAndClose() {
    setSentMessage("");
    setSentContratoMessage("");
    setSending(false);
    setSendingContrato(false);
    setEmail(null);
    onClose();
  }

  function formatDocumento(value: string | undefined) {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return value;
  }

  function renderContractTemplate(templateHtml: string): string {
    const replacements: Record<string, string> = {
      NOME_CLIENTE: cliente?.nome ?? venda?.clienteNome ?? "",
      CPF_CLIENTE: formatDocumento(cliente?.cpf),
      EMAIL_CLIENTE: cliente?.email ?? "",
      TELEFONE_CLIENTE: cliente?.telefone ?? "",
      NOME_PLANO: plano?.nome ?? "",
      VALOR_PLANO: formatBRL(Number(plano?.valor ?? 0)),
      NOME_UNIDADE: tenant?.nome ?? "",
      RAZAO_SOCIAL_UNIDADE: tenant?.razaoSocial ?? tenant?.nome ?? "",
      CNPJ_UNIDADE: formatDocumento(tenant?.documento),
      DATA_ASSINATURA: new Date().toLocaleDateString("pt-BR"),
      NUMERO_RECIBO: venda?.id ?? "",
      DATA_PAGAMENTO: venda ? formatDateTime(venda.dataCriacao) : "",
    };

    let html = templateHtml;
    Object.entries(replacements).forEach(([key, value]) => {
      const safe = escapeHtml(value);
      html = html.replaceAll(`{{${key}}}`, safe).replaceAll(`%${key}%`, safe);
    });
    return html;
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

  async function handleSendContratoEmail() {
    const mail = emailValue.trim();
    if (!mail || !mail.includes("@")) {
      setSentContratoMessage("Informe um e-mail válido para envio do contrato.");
      return;
    }
    if (!plano?.contratoTemplateHtml?.trim()) {
      setSentContratoMessage("Plano sem contrato configurado.");
      return;
    }
    setSendingContrato(true);
    setSentContratoMessage("");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSendingContrato(false);
    setSentContratoMessage(`Contrato enviado para ${mail}.`);
  }

  function handlePrintCupom() {
    if (!venda) return;
    const mode = tenant?.configuracoes?.impressaoCupom?.modo ?? "80MM";
    const custom = Number(tenant?.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80);
    const mm = mode === "58MM" ? 58 : mode === "80MM" ? 80 : Math.max(40, Math.min(120, custom || 80));

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

    const html = `
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Recibo de pagamento</title>
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
          .print-actions { margin-top: 3mm; display: flex; justify-content: center; }
          .print-btn { border: 1px solid #222; background: #fff; padding: 6px 10px; font-size: 12px; cursor: pointer; }
          @media print { .print-actions { display: none; } }
        </style>
      </head>
      <body>
        <div class="cupom">
          <div class="title">${escapeHtml(tenant?.nome ?? "Unidade")}</div>
          <div class="sub">Recibo de pagamento</div>
          ${tenant?.razaoSocial ? `<div class="sub">${escapeHtml(tenant.razaoSocial)}</div>` : ""}
          ${tenant?.documento ? `<div class="sub">Documento: ${escapeHtml(tenant.documento)}</div>` : ""}
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
          <div class="line"><span>Valor pago</span><span>${escapeHtml(formatBRL(venda.pagamento.valorPago))}</span></div>
          <div class="foot">Documento comercial não fiscal</div>
          <div class="print-actions">
            <button class="print-btn" onclick="window.print()">Imprimir recibo</button>
          </div>
        </div>
        <script>
          window.onload = () => { setTimeout(() => window.print(), 150); };
        </script>
      </body>
      </html>
    `;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const w = window.open(url, "_blank");
    if (!w) {
      URL.revokeObjectURL(url);
      window.alert("Não foi possível abrir o recibo. Verifique bloqueio de pop-up.");
      return;
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function handlePrintContrato() {
    if (!venda || !plano?.contratoTemplateHtml?.trim()) {
      window.alert("Este plano não possui contrato vinculado.");
      return;
    }
    const mode = tenant?.configuracoes?.impressaoCupom?.modo ?? "80MM";
    const custom = Number(tenant?.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80);
    const mm = mode === "58MM" ? 58 : mode === "80MM" ? 80 : Math.max(40, Math.min(120, custom || 80));
    const contratoHtml = renderContractTemplate(plano.contratoTemplateHtml);
    const assinaturaHint =
      plano.contratoAssinatura === "DIGITAL"
        ? "Assinatura digital obrigatória."
        : plano.contratoAssinatura === "PRESENCIAL"
          ? "Assinatura presencial obrigatória."
          : "Assinatura digital ou presencial.";

    const html = `
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Contrato - ${escapeHtml(plano.nome)}</title>
        <style>
          @page { size: auto; margin: 8mm; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111; background: #fff; }
          .doc { width: ${Math.max(80, mm)}mm; margin: 0 auto; font-size: 12px; line-height: 1.4; }
          .head { text-align: center; margin-bottom: 8px; }
          .head h1 { margin: 0; font-size: 16px; }
          .meta { font-size: 11px; color: #333; margin-bottom: 8px; }
          .content { border: 1px solid #ccc; padding: 8px; }
          .assinatura { margin-top: 16px; font-size: 11px; }
          .line { margin-top: 20px; border-top: 1px solid #111; width: 100%; }
          .actions { margin-top: 12px; display: flex; justify-content: center; }
          .btn { border: 1px solid #222; background: #fff; padding: 6px 10px; cursor: pointer; }
          @media print { .actions { display: none; } }
        </style>
      </head>
      <body>
        <div class="doc">
          <div class="head">
            <h1>Contrato / Assinatura</h1>
            <div class="meta">${escapeHtml(tenant?.nome ?? "Unidade")} · ${escapeHtml(plano.nome)}</div>
          </div>
          <div class="content">${contratoHtml}</div>
          <div class="assinatura">
            <p><strong>Regras de assinatura:</strong> ${escapeHtml(assinaturaHint)}</p>
            <div class="line"></div>
            <p>Assinatura do cliente</p>
          </div>
          <div class="actions">
            <button class="btn" onclick="window.print()">Imprimir contrato</button>
          </div>
        </div>
        <script>window.onload = () => { setTimeout(() => window.print(), 150); };</script>
      </body>
      </html>
    `;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const w = window.open(url, "_blank");
    if (!w) {
      URL.revokeObjectURL(url);
      window.alert("Não foi possível abrir o contrato. Verifique bloqueio de pop-up.");
      return;
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
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
            {voucherCodigo && venda.descontoTotal > 0 ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gym-teal">
                  Cupom {voucherCodigo} aplicado{voucherDescontoPercent ? ` (${voucherDescontoPercent}%)` : ""}
                </span>
                <span className="text-gym-teal">- {formatBRL(venda.descontoTotal)}</span>
              </div>
            ) : null}
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

          {plano?.contratoTemplateHtml?.trim() ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contrato / Assinatura
              </p>
              <p className="text-xs text-muted-foreground">
                Plano: {plano.nome} · modo de assinatura: {plano.contratoAssinatura.toLowerCase()}
              </p>
              {venda.contratoStatus ? (
                <p className="text-xs text-muted-foreground">
                  Status atual: {venda.contratoStatus === "ASSINADO"
                    ? "assinado"
                    : venda.contratoStatus === "PENDENTE_ASSINATURA"
                      ? "pendente de assinatura"
                      : "sem contrato obrigatório"}
                </p>
              ) : null}
              {contratoAutoEnvioMensagem ? (
                <p className="text-xs text-gym-teal">{contratoAutoEnvioMensagem}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {plano.contratoEnviarAutomaticoEmail
                    ? "Envio automático habilitado (cliente sem e-mail disponível nesta venda)."
                    : "Envio automático não habilitado para este plano."}
                </p>
              )}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Button type="button" variant="outline" className="border-border" onClick={handlePrintContrato}>
                  Imprimir contrato
                </Button>
                <Button type="button" variant="outline" className="border-border" onClick={handleSendContratoEmail} disabled={sendingContrato}>
                  {sendingContrato ? "Enviando..." : "Enviar contrato por e-mail"}
                </Button>
              </div>
              {sentContratoMessage && <p className="text-xs text-muted-foreground">{sentContratoMessage}</p>}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="button" variant="outline" className="border-border" onClick={handlePrintCupom}>
              Imprimir recibo
            </Button>
            <Button type="button" variant="outline" className="border-border" onClick={resetAndClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
