import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ForcedPasswordChangeFlow } from "@/components/auth/forced-password-change-flow";
import { clearAuthSession, saveAuthSession } from "@/lib/api/session";
import { forcedPasswordChangeFormSchema } from "@/lib/tenant/forms/auth-schemas";

const mockReplace = vi.fn();
const mockChangeForcedPasswordApi = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock("@/lib/api/auth", () => ({
  changeForcedPasswordApi: (input: { newPassword: string; confirmNewPassword: string }) =>
    mockChangeForcedPasswordApi(input),
}));

describe("ForcedPasswordChangeFlow", () => {
  beforeEach(() => {
    clearAuthSession();
    mockReplace.mockReset();
    mockChangeForcedPasswordApi.mockReset();
  });

  it("redireciona para o login quando não existe sessão de primeiro acesso", async () => {
    render(<ForcedPasswordChangeFlow />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("redireciona para o próximo destino quando a sessão já não exige troca obrigatória", async () => {
    saveAuthSession({
      token: "token-ok",
      refreshToken: "refresh-ok",
      networkSubdomain: "rede-norte",
      forcePasswordChangeRequired: false,
    });

    render(<ForcedPasswordChangeFlow nextPath="/admin" />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/admin");
    });
  });

  it("valida no schema que a confirmação precisa ser idêntica à nova senha", () => {
    const result = forcedPasswordChangeFormSchema.safeParse({
      newPassword: "NovaSenha123",
      confirmNewPassword: "OutraSenha123",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.confirmNewPassword).toContain(
      "A confirmação da senha deve ser idêntica à nova senha.",
    );
    expect(mockChangeForcedPasswordApi).not.toHaveBeenCalled();
  });

  it("envia a nova senha e redireciona para o dashboard após sucesso", async () => {
    saveAuthSession({
      token: "token-ok",
      refreshToken: "refresh-ok",
      networkName: "Rede Norte",
      networkSubdomain: "rede-norte",
      forcePasswordChangeRequired: true,
    });
    mockChangeForcedPasswordApi.mockResolvedValue({ message: "Senha atualizada com sucesso." });

    render(<ForcedPasswordChangeFlow />);

    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "NovaSenha123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "NovaSenha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    await waitFor(() => {
      expect(mockChangeForcedPasswordApi).toHaveBeenCalledWith({
        newPassword: "NovaSenha123",
        confirmNewPassword: "NovaSenha123",
      });
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("exibe a mensagem de erro da API e mantém o usuário na tela", async () => {
    saveAuthSession({
      token: "token-ok",
      refreshToken: "refresh-ok",
      networkName: "Rede Norte",
      networkSubdomain: "rede-norte",
      forcePasswordChangeRequired: true,
    });
    mockChangeForcedPasswordApi.mockRejectedValue(new Error("Senha fraca demais."));

    render(<ForcedPasswordChangeFlow />);

    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "NovaSenha123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "NovaSenha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(await screen.findByText("Senha fraca demais.")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalledWith("/dashboard");
  });
});
