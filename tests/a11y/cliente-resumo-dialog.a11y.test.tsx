import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ClienteResumoDialog } from "@/app/(portal)/clientes/components/cliente-resumo-dialog";
import type { Aluno } from "@/lib/types";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div role="dialog" aria-modal="true" aria-label="Resumo do Cliente">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, className, role, "aria-label": ariaLabel }: Record<string, unknown>) => (
      <span className={className as string} role={role as string} aria-label={ariaLabel as string}>{children as React.ReactNode}</span>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock("@/components/shared/cliente-thumbnail", () => ({
  ClienteThumbnail: ({ nome }: any) => <div>{nome}</div>,
}));

vi.mock("@/lib/formatters", () => ({
  formatDate: (v: string) => v,
}));

describe("ClienteResumoDialog a11y", () => {
  const props = {
    isOpen: true,
    onOpenChange: vi.fn(),
    clienteResumo: {
      id: "a1",
      tenantId: "t1",
      nome: "João Silva",
      email: "joao@teste.com",
      telefone: "(11) 99999-0000",
      cpf: "123.456.789-00",
      dataNascimento: "1990-01-01",
      sexo: "M" as const,
      status: "ATIVO" as const,
      dataCadastro: "2024-01-01T00:00:00",
    } as Aluno,
    clienteResumoPlano: { nome: "Plano Mensal", dataFim: "2024-12-31" },
    clienteResumoBaseHref: "/clientes",
    liberandoSuspensao: false,
    onLiberarSuspensao: vi.fn(),
    onVerPerfil: vi.fn(),
    onClose: vi.fn(),
  };

  it("has no accessibility violations", async () => {
    const { container } = render(<ClienteResumoDialog {...props} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
