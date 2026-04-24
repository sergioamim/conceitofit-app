"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
    let digit = Number.parseInt(digits[i], 10);
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
  const first2 = Number.parseInt(digits.slice(0, 2) || "0", 10);
  const first4 = Number.parseInt(digits.slice(0, 4) || "0", 10);
  const first6 = Number.parseInt(digits.slice(0, 6) || "0", 10);
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

type NovoCartaoFormValues = {
  titular: string;
  titularEhCliente: boolean;
  cpfTitular: string;
  numero: string;
  validade: string;
  cvv: string;
};

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
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<NovoCartaoFormValues>({
    mode: "onTouched",
    defaultValues: {
      titular: "",
      titularEhCliente: true,
      cpfTitular: "",
      numero: "",
      validade: "",
      cvv: "",
    },
  });
  const numero = useWatch({ control, name: "numero" }) ?? "";
  const titularEhCliente = useWatch({ control, name: "titularEhCliente" });
  const cpfTitular = useWatch({ control, name: "cpfTitular" }) ?? "";
  const validade = useWatch({ control, name: "validade" }) ?? "";
  const watchedTitular = useWatch({ control, name: "titular" }) ?? "";
  const watchedCvv = useWatch({ control, name: "cvv" }) ?? "";
  // Manual required-fields watcher para evitar rodar validação no mount.
  // CPF do titular é condicional (só obrigatório quando !titularEhCliente).
  const canSave =
    Boolean(watchedTitular?.trim()) &&
    numero.replace(/\D/g, "").length >= 12 &&
    validade.length >= 4 &&
    watchedCvv.length >= 3 &&
    (titularEhCliente || Boolean(cpfTitular?.trim()));
  const bandeiraDetectada = detectBandeira(numero);
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
    if (open) {
      reset({
        titular: "",
        titularEhCliente: true,
        cpfTitular: "",
        numero: "",
        validade: "",
        cvv: "",
      });
      clearErrors();
    }
  }, [clearErrors, open, reset]);

  function onSubmit(values: NovoCartaoFormValues) {
    const digits = values.numero.replace(/\D/g, "");
    const bandeiraNome = detectBandeira(digits);
    const bandeira = bandeiras.find((item) => item.nome.toLowerCase() === (bandeiraNome ?? "").toLowerCase());
    if (!values.titular.trim() || digits.length < 12 || !values.validade || !values.cvv) return;
    if (!luhnCheck(digits)) {
      setError("numero", { type: "manual", message: "Número do cartão inválido." });
      return;
    }
    const expiry = validateCardExpiry(values.validade);
    if (!expiry.valid) {
      setError("validade", { type: "manual", message: expiry.message ?? "Validade inválida." });
      return;
    }
    if (!bandeira) {
      setError("numero", { type: "manual", message: "Bandeira não reconhecida." });
      return;
    }
    if (!values.titularEhCliente) {
      if (!values.cpfTitular) {
        setError("cpfTitular", { type: "manual", message: "CPF do titular é obrigatório." });
        return;
      }
      const cpfCheck = validateCPF(values.cpfTitular);
      if (!cpfCheck.valid) {
        setError("cpfTitular", { type: "manual", message: cpfCheck.message ?? "CPF inválido." });
        return;
      }
    }
    onSave({
      bandeiraId: bandeira.id,
      titular: values.titular.trim(),
      ultimos4: digits.slice(-4),
      validade: values.validade,
      cpfTitular: values.titularEhCliente ? undefined : values.cpfTitular,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Novo cartão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Titular <span className="text-gym-danger">*</span>
              </label>
              <Input
                {...register("titular", {
                  validate: (value) => value.trim().length > 0 || "Informe o titular.",
                })}
                aria-invalid={errors.titular ? "true" : "false"}
                className="border-border bg-secondary"
              />
              {errors.titular ? <p className="text-xs text-gym-danger">{errors.titular.message}</p> : null}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("titularEhCliente")} />
              <span className="text-muted-foreground">Titular é o cliente</span>
            </div>
            {!titularEhCliente ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CPF do titular <span className="text-gym-danger">*</span>
                </label>
                <Input
                  {...register("cpfTitular", {
                    validate: (value) =>
                      titularEhCliente || (value ?? "").length > 0 || "Informe o CPF do titular.",
                    onChange: (event) => {
                      event.target.value = event.target.value.replace(/\D/g, "").slice(0, 11);
                    },
                  })}
                  value={maskCPF(cpfTitular)}
                  placeholder="000.000.000-00"
                  aria-invalid={errors.cpfTitular ? "true" : "false"}
                  className="border-border bg-secondary"
                />
                {errors.cpfTitular ? <p className="text-xs text-gym-danger">{errors.cpfTitular.message}</p> : null}
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Número <span className="text-gym-danger">*</span>
              </label>
              <Input
                {...register("numero", {
                  validate: (value) =>
                    value.replace(/\D/g, "").length >= 12 || "Informe um número de cartão válido.",
                  onChange: (event) => {
                    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 19);
                  },
                })}
                value={maskCardNumber(numero)}
                placeholder="0000 0000 0000 0000"
                aria-invalid={errors.numero ? "true" : "false"}
                className="border-border bg-secondary"
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
              {errors.numero ? <p className="text-xs text-gym-danger">{errors.numero.message}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Validade <span className="text-gym-danger">*</span>
                </label>
                <Input
                  {...register("validade", {
                    validate: (value) => value.length >= 4 || "Informe a validade.",
                    onChange: (event) => {
                      event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
                    },
                  })}
                  value={formatValidade(validade)}
                  placeholder="MM/AA"
                  aria-invalid={errors.validade ? "true" : "false"}
                  className="border-border bg-secondary"
                />
                {errors.validade ? <p className="text-xs text-gym-danger">{errors.validade.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CVV <span className="text-gym-danger">*</span>
                </label>
                <Input
                  {...register("cvv", {
                    validate: (value) => value.length >= 3 || "Informe o CVV.",
                    onChange: (event) => {
                      event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
                    },
                  })}
                  placeholder="123"
                  aria-invalid={errors.cvv ? "true" : "false"}
                  className="border-border bg-secondary"
                />
                {errors.cvv ? <p className="text-xs text-gym-danger">{errors.cvv.message}</p> : null}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave}>Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
