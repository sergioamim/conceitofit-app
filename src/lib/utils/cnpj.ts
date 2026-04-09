export function normalizeCnpjDigits(value?: string | null): string {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, 14) : "";
}

export function formatCnpj(value?: string | null): string {
  const digits = normalizeCnpjDigits(value);
  if (!digits) return "";

  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ];

  if (digits.length <= 2) return parts[0];
  if (digits.length <= 5) return `${parts[0]}.${parts[1]}`;
  if (digits.length <= 8) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (digits.length <= 12) return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}-${parts[4]}`;
}

export function isValidCnpj(value?: string | null): boolean {
  const digits = normalizeCnpjDigits(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const numbers = digits.split("").map(Number);
  const calcDigit = (base: number[]) => {
    const startWeight = base.length === 12 ? 5 : 6;
    let weight = startWeight;
    let total = 0;

    for (const number of base) {
      total += number * weight;
      weight -= 1;
      if (weight < 2) {
        weight = 9;
      }
    }

    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(numbers.slice(0, 12));
  const secondDigit = calcDigit(numbers.slice(0, 13));

  return firstDigit === numbers[12] && secondDigit === numbers[13];
}
