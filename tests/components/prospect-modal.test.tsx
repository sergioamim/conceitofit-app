import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProspectModal } from "@/components/shared/prospect-modal";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select">{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock("@/components/shared/phone-input", () => ({
  PhoneInput: ({ value, onChange, ...props }: any) => (
    <input
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      aria-label={props["aria-label"]}
      data-testid="phone-input"
    />
  ),
}));

vi.mock("@/components/shared/masked-input", () => ({
  MaskedInput: ({ value, onChange, ...props }: any) => (
    <input
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      aria-label={props["aria-label"]}
      data-testid="masked-input"
    />
  ),
}));

describe("ProspectModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    funcionarios: [
      { id: "f1", nome: "João", cargo: "Consultor", status: "ATIVO" as const, email: "", telefone: "", role: "" as any, horarioTrabalho: "" as any, notificacoesAtivas: false },
    ],
    initial: null,
  };

  it("renders title for new prospect", () => {
    render(<ProspectModal {...defaultProps} />);
    expect(screen.getByText("Novo Prospect")).toBeInTheDocument();
  });

  it("renders title for editing existing prospect", () => {
    render(
      <ProspectModal
        {...defaultProps}
        initial={{
          id: "1",
          tenantId: "t1",
          nome: "Maria",
          telefone: "11999999999",
          origem: "WHATSAPP",
          status: "NOVO",
          dataCriacao: "2024-01-01T00:00:00",
        }}
      />,
    );
    expect(screen.getByText("Editar Prospect")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ProspectModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Novo Prospect")).not.toBeInTheDocument();
  });

  it("renders name and phone fields", () => {
    render(<ProspectModal {...defaultProps} />);
    expect(screen.getByText("Nome *")).toBeInTheDocument();
    expect(screen.getByText("Telefone *")).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    render(<ProspectModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("disables save button when name is empty", () => {
    render(<ProspectModal {...defaultProps} />);
    const saveBtn = screen.getByText("Salvar");
    expect(saveBtn).toBeDisabled();
  });

  it("calls onSave with form data when valid", () => {
    render(<ProspectModal {...defaultProps} />);

    const nameInput = screen.getByLabelText("Nome *");
    fireEvent.change(nameInput, { target: { value: "Carlos Silva" } });

    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "11988887777" } });

    fireEvent.click(screen.getByText("Salvar"));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it("renders optional fields", () => {
    render(<ProspectModal {...defaultProps} />);
    expect(screen.getByText("E-mail")).toBeInTheDocument();
    expect(screen.getByText("Observações")).toBeInTheDocument();
  });
});
