"use client";

import { useEffect, useState } from "react";
import type { BandeiraCartao } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { validateCardExpiry, maskCPF } from "@/lib/utils";
import { validateCPF } from "@/components/shared/cpf-validator";

function maskCardNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ").slice(0, 19);
}

function luhnCheck(number: string) {
  const digits = number.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return digits.length >= 12 && sum % 10 === 0;
}

function detectBandeira(numero: string): string | null {
  const digits = numero.replace(/\D/g, "");
  if (digits.startsWith("4")) return "Visa";
  const first2 = parseInt(digits.slice(0, 2) || "0", 10);
  const first4 = parseInt(digits.slice(0, 4) || "0", 10);
  const first6 = parseInt(digits.slice(0, 6) || "0", 10);
  if ((first2 >= 51 && first2 <= 55) || (first4 >= 2221 && first4 <= 2720)) return "Mastercard";
  const eloPrefixes4 = [
    4011, 4012, 4013, 4014, 4015, 4026, 4058, 4103, 4104, 4105, 4141, 4193,
    4312, 4389, 4514, 4576, 4593, 5041, 5067, 5090, 6277, 6362, 6363,
  ];
  const eloRanges6 = [
    [506699, 506778],
    [509000, 509999],
    [650031, 650033],
    [650035, 650051],
    [650405, 650439],
    [650485, 650538],
    [650541, 650598],
    [650700, 650718],
    [650720, 650727],
    [650901, 650978],
    [651652, 651679],
    [655000, 655019],
    [655021, 655058],
  ];
  if (eloPrefixes4.includes(first4) || eloRanges6.some(([a, b]) => first6 >= a && first6 <= b)) return "Elo";
  return null;
}

function formatValidade(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function NovoCartaoModal({
  open,
  onClose,
  onSave,
  bandeiras,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { bandeiraId: string; titular: string; ultimos4: string; validade: string; cpfTitular?: string }) => void;
  bandeiras: BandeiraCartao[];
}) {
  const [numero, setNumero] = useState("");
  const [titular, setTitular] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpfTitular, setCpfTitular] = useState("");
  const [titularEhCliente, setTitularEhCliente] = useState(true);
  const [erro, setErro] = useState("");
  const bandeiraDetectada = detectBandeira(numero.replace(/\D/g, ""));
  const bandeiraVisual = bandeiraDetectada
    ? {
        label: bandeiraDetectada,
        className:
          bandeiraDetectada === "Visa"
            ? "bg-blue-500/15 text-blue-400"
            : bandeiraDetectada === "Mastercard"
            ? "bg-orange-500/15 text-orange-400"
            : "bg-emerald-500/15 text-emerald-400",
      }
    : null;

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNumero("");
    setTitular("");
    setValidade("");
    setCvv("");
    setCpfTitular("");
    setTitularEhCliente(true);
    setErro("");
  }, [open]);

  function handleSave() {
    const digits = numero.replace(/\D/g, "");
    const bandeiraNome = bandeiraDetectada;
    const bandeira = bandeiras.find((b) => b.nome.toLowerCase() === (bandeiraNome ?? "").toLowerCase());
    if (!titular || digits.length < 12 || !validade || !cvv) return;
    if (!luhnCheck(digits)) {
      setErro("Número do cartão inválido.");
      return;
    }
    const expiry = validateCardExpiry(validade);
    if (!expiry.valid) {
      setErro(expiry.message ?? "Validade inválida.");
      return;
    }
    if (!bandeira) {
      setErro("Bandeira não reconhecida.");
      return;
    }
    if (!titularEhCliente && !cpfTitular) {
      setErro("CPF do titular é obrigatório.");
      return;
    }
    if (!titularEhCliente) {
      const cpfCheck = validateCPF(cpfTitular);
      if (!cpfCheck.valid) {
        setErro(cpfCheck.message ?? "CPF inválido.");
        return;
      }
    }
    setErro("");
    const ultimos4 = digits.slice(-4);
    onSave({ bandeiraId: bandeira.id, titular, ultimos4, validade, cpfTitular: titularEhCliente ? undefined : cpfTitular });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Novo cartão
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Titular *
            </label>
            <Input
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={titularEhCliente}
              onChange={(e) => setTitularEhCliente(e.target.checked)}
            />
            <span className="text-muted-foreground">Titular é o cliente</span>
          </div>
          {!titularEhCliente && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                CPF do titular *
              </label>
              <Input
                value={maskCPF(cpfTitular)}
                onChange={(e) => setCpfTitular(e.target.value)}
                placeholder="000.000.000-00"
                className="bg-secondary border-border"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Número *
            </label>
            <Input
              value={maskCardNumber(numero)}
              onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
              placeholder="0000 0000 0000 0000"
              className="bg-secondary border-border"
            />
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Bandeira:</span>
              {bandeiraVisual ? (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${bandeiraVisual.className}`}>
                  {bandeiraVisual.label}
                </span>
              ) : (
                <span>Não reconhecida</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Validade *
              </label>
              <Input
              value={formatValidade(validade)}
              onChange={(e) => setValidade(e.target.value)}
              placeholder="MM/AA"
              className="bg-secondary border-border"
            />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                CVV *
              </label>
              <Input
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\\D/g, "").slice(0, 4))}
                placeholder="123"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          {erro && (
            <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
              {erro}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
