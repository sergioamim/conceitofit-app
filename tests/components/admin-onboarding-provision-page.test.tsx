import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiRequestError } from "@/lib/api/http";
import AdminProvisionarAcademiaPage from "@/app/(backoffice)/admin/onboarding/provisionar/page";

const mocks = vi.hoisted(() => ({
  provisionAcademiaAdminApi: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/backoffice/api/admin-onboarding-api", () => ({
  provisionAcademiaAdminApi: (...args: unknown[]) => mocks.provisionAcademiaAdminApi(...args),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/components/shared/phone-input", () => ({
  PhoneInput: ({ value, onChange, ...props }: any) => (
    <input
      {...props}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

function fillProvisionForm() {
  const academiaNome = screen.getByLabelText(/Nome da academia/i);
  fireEvent.change(academiaNome, { target: { value: "Academia Copacabana" } });
  fireEvent.blur(academiaNome);

  const cnpj = screen.getByLabelText(/^CNPJ/i);
  fireEvent.change(cnpj, { target: { value: "46208771000170" } });
  fireEvent.blur(cnpj);

  const telefone = screen.getByLabelText(/Telefone/i);
  fireEvent.change(telefone, { target: { value: "(21) 99999-0000" } });
  fireEvent.blur(telefone);

  const unidadePrincipalNome = screen.getByLabelText(/Nome da unidade principal/i);
  fireEvent.change(unidadePrincipalNome, { target: { value: "Copacabana Matriz" } });
  fireEvent.blur(unidadePrincipalNome);

  const adminNome = screen.getByLabelText(/Nome do administrador/i);
  fireEvent.change(adminNome, { target: { value: "Mariana Costa" } });
  fireEvent.blur(adminNome);

  const adminEmail = screen.getByLabelText(/E-mail do administrador/i);
  fireEvent.change(adminEmail, { target: { value: "mariana@academia.com" } });
  fireEvent.blur(adminEmail);
}

describe("AdminProvisionarAcademiaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantém erro mapeável apenas inline quando o backend devolve fieldErrors conhecidos", async () => {
    mocks.provisionAcademiaAdminApi.mockRejectedValueOnce(
      new ApiRequestError({
        status: 409,
        message: "Validation error",
        fieldErrors: { cnpj: "CNPJ já cadastrado" },
      }),
    );

    render(<AdminProvisionarAcademiaPage />);
    fillProvisionForm();

    const submitButton = screen.getByRole("button", { name: "Provisionar academia" });
    await waitFor(() => expect(submitButton).toBeEnabled());

    fireEvent.click(submitButton);

    await waitFor(() => expect(mocks.provisionAcademiaAdminApi).toHaveBeenCalledTimes(1));

    expect(await screen.findByText("CNPJ já cadastrado")).toBeInTheDocument();
    expect(screen.queryByText("Revise os campos destacados e tente novamente.")).not.toBeInTheDocument();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("mantém banner e toast quando o backend devolve erro global não mapeado", async () => {
    mocks.provisionAcademiaAdminApi.mockRejectedValueOnce(
      new ApiRequestError({
        status: 409,
        message: "Conflito de dados",
        fieldErrors: { conflito: "Já existe uma academia com este conjunto de dados." },
      }),
    );

    render(<AdminProvisionarAcademiaPage />);
    fillProvisionForm();

    const submitButton = screen.getByRole("button", { name: "Provisionar academia" });
    await waitFor(() => expect(submitButton).toBeEnabled());

    fireEvent.click(submitButton);

    expect(await screen.findByText("conflito: Já existe uma academia com este conjunto de dados.")).toBeInTheDocument();
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Falha ao provisionar academia",
        variant: "destructive",
      }),
    );
  });
});
