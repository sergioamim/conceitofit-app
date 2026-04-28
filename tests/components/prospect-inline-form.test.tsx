import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import type { Prospect } from "@/lib/types";

import { ProspectInlineForm } from "@/app/(portal)/vendas/nova/components/prospect-inline-form";
import { ApiRequestError } from "@/lib/api/http";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  createProspectApi: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/api/crm", () => ({
  createProspectApi: mocks.createProspectApi,
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

const CPF_VALIDO = "52998224725"; // CPF determinístico válido (dígitos OK)

const prospectFixture: Prospect = {
  id: "p-1",
  tenantId: "tenant-1",
  nome: "João da Silva",
  telefone: "11999990000",
  cpf: CPF_VALIDO,
  origem: "VISITA_PRESENCIAL",
  status: "NOVO",
  dataCriacao: "2026-04-20T10:00:00",
} as Prospect;

describe("ProspectInlineForm (VUN-2.4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createProspectApi.mockResolvedValue(prospectFixture);
  });

  it("renderiza CPF pré-preenchido formatado e readonly (AC2)", () => {
    render(
      <ProspectInlineForm
        cpf={CPF_VALIDO}
        tenantId="tenant-1"
        onCreated={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const cpfInput = screen.getByTestId(
      "prospect-inline-cpf"
    ) as HTMLInputElement;
    expect(cpfInput).toHaveValue("529.982.247-25");
    expect(cpfInput).toHaveAttribute("readonly");
  });

  async function submitForm() {
    await act(async () => {
      fireEvent.submit(screen.getByTestId("prospect-inline-form"));
    });
  }

  it("bloqueia submit quando o nome está vazio (AC7)", async () => {
    render(
      <ProspectInlineForm
        cpf={CPF_VALIDO}
        tenantId="tenant-1"
        onCreated={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    await submitForm();

    await waitFor(() => {
      expect(screen.getByText(/Informe o nome/i)).toBeInTheDocument();
    });
    expect(mocks.createProspectApi).not.toHaveBeenCalled();
  });

  it("bloqueia submit quando o telefone está vazio (AC7 + backend requer telefone)", async () => {
    render(
      <ProspectInlineForm
        cpf={CPF_VALIDO}
        tenantId="tenant-1"
        onCreated={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: "João da Silva" },
    });
    await submitForm();

    await waitFor(() => {
      expect(screen.getByText(/Informe o telefone/i)).toBeInTheDocument();
    });
    expect(mocks.createProspectApi).not.toHaveBeenCalled();
  });

  it("submete payload correto e dispara onCreated no sucesso (AC3, AC4)", async () => {
    const onCreated = vi.fn();
    render(
      <ProspectInlineForm
        cpf={CPF_VALIDO}
        tenantId="tenant-1"
        onCreated={onCreated}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: "João da Silva" },
    });
    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: "11999990000" },
    });

    await submitForm();

    await waitFor(() => {
      expect(mocks.createProspectApi).toHaveBeenCalledTimes(1);
    });

    expect(mocks.createProspectApi).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      data: expect.objectContaining({
        nome: "João da Silva",
        cpf: CPF_VALIDO,
        origem: "VISITA_PRESENCIAL",
      }),
    });

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(prospectFixture);
    });
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Prospect criado" })
    );
  });

  it("mantém o form aberto e dispara toast destrutivo em caso de erro (AC5)", async () => {
    mocks.createProspectApi.mockRejectedValueOnce(
      new Error("CPF já cadastrado")
    );
    const onCreated = vi.fn();

    render(
      <ProspectInlineForm
        cpf={CPF_VALIDO}
        tenantId="tenant-1"
        onCreated={onCreated}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: "João da Silva" },
    });
    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: "11999990000" },
    });
    await submitForm();

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          description: "CPF já cadastrado",
        })
      );
    });
    expect(onCreated).not.toHaveBeenCalled();
    // Form ainda presente
    expect(screen.getByTestId("prospect-inline-form")).toBeInTheDocument();
  });

  it("aplica fieldErrors do backend inline sem toast duplicado", async () => {
    mocks.createProspectApi.mockRejectedValueOnce(
      new ApiRequestError({
        status: 400,
        message: "validation failed",
        fieldErrors: {
          telefone: "Telefone já cadastrado.",
        },
      })
    );

    render(
      <ProspectInlineForm
        cpf={CPF_VALIDO}
        tenantId="tenant-1"
        onCreated={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: "João da Silva" },
    });
    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: "11999990000" },
    });

    await submitForm();

    await waitFor(() => {
      expect(screen.getByText("Telefone já cadastrado.")).toBeInTheDocument();
    });
    expect(mocks.toast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Falha ao criar prospect",
      })
    );
  });

  it("dispara onCancel quando o botão Cancelar é clicado", () => {
    const onCancel = vi.fn();
    render(
      <ProspectInlineForm
        cpf={CPF_VALIDO}
        tenantId="tenant-1"
        onCreated={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
