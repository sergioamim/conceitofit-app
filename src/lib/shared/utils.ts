import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

export function validateCardExpiry(value: string): { valid: boolean; message?: string } {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return { valid: false, message: "Validade incompleta." };
  const month = parseInt(digits.slice(0, 2), 10);
  const year = parseInt(digits.slice(2, 4), 10);
  if (Number.isNaN(month) || Number.isNaN(year)) return { valid: false, message: "Validade inválida." };
  if (month < 1 || month > 12) return { valid: false, message: "Mês inválido." };
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, message: "Cartão vencido." };
  }
  return { valid: true };
}
