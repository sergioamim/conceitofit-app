"use client";

export function validateCPF(value: string): { valid: boolean; message?: string } {
  if (process.env.NODE_ENV === "development") {
    return { valid: true };
  }
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11) return { valid: false, message: "CPF inválido." };
  if (/^(\d)\1+$/.test(cpf)) return { valid: false, message: "CPF inválido." };

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i += 1) {
      total += parseInt(base[i], 10) * factor--;
    }
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  if (d1 !== parseInt(cpf[9], 10) || d2 !== parseInt(cpf[10], 10)) {
    return { valid: false, message: "CPF inválido." };
  }
  return { valid: true };
}
