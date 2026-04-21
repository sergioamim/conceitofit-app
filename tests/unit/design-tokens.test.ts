import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const globalsCss = readFileSync(
  resolve(__dirname, "../../src/app/globals.css"),
  "utf8",
);

describe("design tokens — cockpit de vendas (VUN-1.1)", () => {
  it("expõe --color-ink e --color-receipt-paper em @theme inline para uso via Tailwind", () => {
    expect(globalsCss).toMatch(/--color-ink:\s*var\(--ink\);/);
    expect(globalsCss).toMatch(/--color-receipt-paper:\s*var\(--receipt-paper\);/);
  });

  it("define --ink e --receipt-paper no :root (light theme)", () => {
    const rootBlock = globalsCss.match(/:root\s*{([\s\S]*?)}/)?.[1] ?? "";
    expect(rootBlock).toMatch(/--ink:\s*#111418;/);
    expect(rootBlock).toMatch(/--receipt-paper:\s*#faf8f3;/);
  });

  it("sobrescreve --ink no .dark (header fica mais escuro em dark mode)", () => {
    const darkBlock = globalsCss.match(/\.dark\s*{([\s\S]*?)}/)?.[1] ?? "";
    expect(darkBlock).toMatch(/--ink:\s*#0a0b0d;/);
  });

  it("NÃO sobrescreve --receipt-paper no .dark (papel creme é constante)", () => {
    const darkBlock = globalsCss.match(/\.dark\s*{([\s\S]*?)}/)?.[1] ?? "";
    expect(darkBlock).not.toMatch(/--receipt-paper:/);
  });

  it("preserva --gym-teal dinâmico (não regride tenant-theme)", () => {
    // sanity: tokens existentes seguem presentes após a adição dos novos
    expect(globalsCss).toMatch(/--gym-teal:\s*#1ea06a;/);
    expect(globalsCss).toMatch(/--color-gym-teal:\s*var\(--gym-teal\);/);
  });

  it("mantém --font-mono mapeado para --font-geist-mono (decisão @po: sem troca de fonte nesta story)", () => {
    expect(globalsCss).toMatch(/--font-mono:\s*var\(--font-geist-mono\);/);
  });
});
