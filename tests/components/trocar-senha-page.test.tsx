import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiRequestError } from "@/lib/api/http";
import TrocarSenhaPage from "@/app/(cliente)/meu-perfil/senha/page";

const mocks = {
  push: vi.fn(),
  toast: vi.fn(),
  changePasswordApi: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/lib/api/auth", () => ({
  changePasswordApi: (...args: unknown[]) => mocks.changePasswordApi(...args),
}));

describe("TrocarSenhaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia o payload canônico e redireciona após sucesso", async () => {
    mocks.changePasswordApi.mockResolvedValueOnce({
      message: "Senha atualizada com sucesso.",
    });

    render(<TrocarSenhaPage />);

    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "SenhaAtual1" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "NovaSenha123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "NovaSenha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar Senha" }));

    await waitFor(() => {
      expect(mocks.changePasswordApi).toHaveBeenCalledWith({
        currentPassword: "SenhaAtual1",
        newPassword: "NovaSenha123",
        confirmNewPassword: "NovaSenha123",
      });
    });

    expect(mocks.toast).toHaveBeenCalledWith({
      title: "Senha atualizada com sucesso.",
    });
    expect(mocks.push).toHaveBeenCalledWith("/meu-perfil");
  });

  it("mapeia fieldErrors do backend inline", async () => {
    mocks.changePasswordApi.mockRejectedValueOnce(new ApiRequestError({
      status: 400,
      message: "Validation Error",
      fieldErrors: {
        currentPassword: "Senha atual inválida.",
        newPassword: "A nova senha deve ter ao menos 8 caracteres, 1 número e 1 letra maiúscula.",
      },
    }));

    render(<TrocarSenhaPage />);

    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "SenhaAtual1" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "NovaSenha123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "NovaSenha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar Senha" }));

    expect(await screen.findByText("Senha atual inválida.")).toBeInTheDocument();
    expect(await screen.findByText("A nova senha deve ter ao menos 8 caracteres, 1 número e 1 letra maiúscula.")).toBeInTheDocument();
  });
});
