import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  CheckinPendenteStack,
  CheckinPendenteToast,
} from "@/components/cockpit/checkin-pendente-toast";
import type { CheckinPendenteReceived } from "@/hooks/use-checkin-pendente-stream";

function buildPendente(
  overrides?: Partial<CheckinPendenteReceived>,
): CheckinPendenteReceived {
  return {
    checkinPendenteId: "pid-1",
    vinculoId: "vid-1",
    alunoId: "aid-1",
    alunoNome: "Maria Silva",
    agregador: "WELLHUB",
    externalUserId: "gp-1234",
    recebidoEm: "2026-04-21T10:00:00Z",
    validoAte: new Date(Date.now() + 45 * 60_000).toISOString(),
    receivedLocallyAt: Date.now(),
    ...overrides,
  };
}

describe("CheckinPendenteToast (VUN-5.8)", () => {
  it("renderiza nome do aluno + agregador em label amigável (Gympass)", () => {
    render(
      <CheckinPendenteToast
        pendente={buildPendente({ agregador: "WELLHUB" })}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText(/Check-in Gympass recebido/)).toBeInTheDocument();
  });

  it("mapeia TOTALPASS para o label TotalPass", () => {
    render(
      <CheckinPendenteToast
        pendente={buildPendente({ agregador: "TOTALPASS" })}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText(/Check-in TotalPass recebido/)).toBeInTheDocument();
  });

  it("cai em fallback quando nome do aluno está ausente", () => {
    render(
      <CheckinPendenteToast
        pendente={buildPendente({ alunoNome: null, agregador: "WELLHUB" })}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Usuário WELLHUB")).toBeInTheDocument();
  });

  it("dispara onDismiss ao clicar no botão X", () => {
    const onDismiss = vi.fn();
    render(
      <CheckinPendenteToast
        pendente={buildPendente()}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Dispensar aviso de Maria Silva/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("mostra 'expirado' quando validoAte já passou", () => {
    render(
      <CheckinPendenteToast
        pendente={buildPendente({
          validoAte: new Date(Date.now() - 60_000).toISOString(),
        })}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText(/expirado/i)).toBeInTheDocument();
  });
});

describe("CheckinPendenteStack (VUN-5.8)", () => {
  it("não renderiza nada quando não há pendentes visíveis nem ocultos", () => {
    const { container } = render(
      <CheckinPendenteStack
        pendentes={[]}
        pendentesOcultos={0}
        onDismiss={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("mostra overflow badge '+N check-ins pendentes' quando há ocultos", () => {
    render(
      <CheckinPendenteStack
        pendentes={[buildPendente()]}
        pendentesOcultos={5}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId("checkin-pendente-overflow"),
    ).toHaveTextContent("+5 check-ins pendentes");
  });

  it("singulariza overflow quando há exatamente 1 oculto", () => {
    render(
      <CheckinPendenteStack
        pendentes={[buildPendente()]}
        pendentesOcultos={1}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId("checkin-pendente-overflow"),
    ).toHaveTextContent("+1 check-in pendente");
  });

  it("renderiza cada pendente com testid individual e dispara onDismiss por id", () => {
    const onDismiss = vi.fn();
    const pendentes = [
      buildPendente({ checkinPendenteId: "pid-1", alunoNome: "Ana" }),
      buildPendente({ checkinPendenteId: "pid-2", alunoNome: "Bruno" }),
    ];

    render(
      <CheckinPendenteStack
        pendentes={pendentes}
        pendentesOcultos={0}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getAllByTestId("checkin-pendente-toast")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Dispensar aviso de Ana/i }));
    expect(onDismiss).toHaveBeenCalledWith("pid-1");
  });
});
