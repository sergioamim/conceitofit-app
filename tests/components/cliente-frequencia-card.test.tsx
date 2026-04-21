import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClienteFrequenciaCard } from "@/app/(portal)/clientes/[id]/cliente-frequencia-card";

const HOJE = new Date(2026, 3, 20); // 2026-04-20

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(HOJE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ClienteFrequenciaCard", () => {
  it("renderiza título e placeholder quando não há presenças", () => {
    const { container } = render(<ClienteFrequenciaCard presencas={[]} hoje={HOJE} />);
    expect(screen.getByText(/frequência/i)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument(); // contador
    expect(screen.getByText(/última visita/i)).toBeInTheDocument();
    // 14 mini-bars (todas vazias)
    const bars = container.querySelectorAll('[data-state="ausente"]');
    expect(bars).toHaveLength(14);
  });

  it("preenche barras correspondentes aos dias com presença", () => {
    const { container } = render(
      <ClienteFrequenciaCard
        presencas={[{ data: "2026-04-20" }, { data: "2026-04-19" }, { data: "2026-04-15" }]}
        hoje={HOJE}
      />
    );
    const presentes = container.querySelectorAll('[data-state="presente"]');
    expect(presentes).toHaveLength(3);
  });

  it("conta treinos no mês e exibe número + meta padrão", () => {
    render(
      <ClienteFrequenciaCard
        presencas={[
          { data: "2026-04-05" },
          { data: "2026-04-10" },
          { data: "2026-04-15" },
        ]}
        hoje={HOJE}
      />
    );
    expect(screen.getByText("3")).toBeInTheDocument(); // treinos no mês
    expect(screen.getByText("/ 12")).toBeInTheDocument(); // meta default
  });

  it("respeita meta customizada via prop", () => {
    render(
      <ClienteFrequenciaCard
        presencas={[{ data: "2026-04-20" }]}
        metaMensal={20}
        hoje={HOJE}
      />
    );
    expect(screen.getByText("/ 20")).toBeInTheDocument();
  });

  it("exibe 'hoje' como última visita quando presença é hoje", () => {
    render(
      <ClienteFrequenciaCard
        presencas={[{ data: "2026-04-20" }]}
        hoje={HOJE}
      />
    );
    expect(screen.getByText("hoje")).toBeInTheDocument();
  });

  it("exibe 'há Xd' quando última visita não é hoje", () => {
    render(
      <ClienteFrequenciaCard
        presencas={[{ data: "2026-04-15" }]}
        hoje={HOJE}
      />
    );
    expect(screen.getByText("há 5d")).toBeInTheDocument();
  });

  it("aplica aria-label descritivo ao gráfico", () => {
    render(
      <ClienteFrequenciaCard
        presencas={[{ data: "2026-04-20" }, { data: "2026-04-19" }]}
        hoje={HOJE}
      />
    );
    expect(
      screen.getByRole("img", { name: /2 de 12 treinos no mês/i })
    ).toBeInTheDocument();
  });
});
