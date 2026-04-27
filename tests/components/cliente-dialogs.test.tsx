import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ClienteDialogs } from "@/app/(portal)/clientes/[id]/cliente-dialogs";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    aluno: null,
    liberarAcessoOpen: false,
    setLiberarAcessoOpen: vi.fn(),
    liberarAcessoJustificativa: "",
    setLiberarAcessoJustificativa: vi.fn(),
    liberandoAcesso: false,
    liberarAcessoErro: "",
    setLiberarAcessoErro: vi.fn(),
    liberarAcessoInfo: null,
    setLiberarAcessoInfo: vi.fn(),
    handleLiberarAcesso: vi.fn(),
    excluirOpen: false,
    excluirJustificativa: "",
    setExcluirJustificativa: vi.fn(),
    excluindo: false,
    excluirErro: "",
    setExcluirErro: vi.fn(),
    excluirBlockedBy: [],
    setExcluirBlockedBy: vi.fn(),
    closeExcluirModal: vi.fn(),
    handleExcluir: vi.fn(),
    migracaoOpen: false,
    migracaoTenantDestinoId: "",
    setMigracaoTenantDestinoId: vi.fn(),
    migracaoJustificativa: "",
    setMigracaoJustificativa: vi.fn(),
    migracaoPreservaContexto: true,
    setMigracaoPreservaContexto: vi.fn(),
    migrandoCliente: false,
    migracaoErro: "",
    setMigracaoErro: vi.fn(),
    migracaoBlockedBy: [],
    setMigracaoBlockedBy: vi.fn(),
    closeMigracaoModal: vi.fn(),
    handleMigracao: vi.fn(),
    baseTenantNomeAtual: "Unidade Atual",
    opcoesMigracao: [],
    bloquearAcessoOpen: false,
    bloquearAcessoJustificativa: "",
    setBloquearAcessoJustificativa: vi.fn(),
    bloqueandoAcesso: false,
    bloquearAcessoErro: "",
    setBloquearAcessoErro: vi.fn(),
    closeBloquearAcessoModal: vi.fn(),
    handleBloquearAcesso: vi.fn(),
    lgpdDialogTipo: null,
    lgpdJustificativa: "",
    setLgpdJustificativa: vi.fn(),
    lgpdProcessando: false,
    lgpdErro: "",
    setLgpdErro: vi.fn(),
    closeLgpdModal: vi.fn(),
    handleLgpdConfirm: vi.fn(),
    ...overrides,
  };
}

describe("ClienteDialogs", () => {
  it("renderiza modal de bloquear acesso com CTA destrutivo", () => {
    const props = buildProps({ bloquearAcessoOpen: true });
    render(<ClienteDialogs {...props} />);

    expect(screen.getByRole("heading", { name: "Bloquear acesso" })).toBeInTheDocument();
    expect(screen.getByText("Registre a justificativa para bloquear o acesso operacional deste cliente.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bloquear acesso" })).toBeInTheDocument();
  });

  it("dispara callback do modal LGPD", () => {
    const handleLgpdConfirm = vi.fn();
    const props = buildProps({
      lgpdDialogTipo: "pessoais",
      lgpdJustificativa: "Solicitação formal",
      handleLgpdConfirm,
    });
    render(<ClienteDialogs {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir dados pessoais" }));
    expect(handleLgpdConfirm).toHaveBeenCalled();
  });
});
