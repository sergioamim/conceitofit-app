import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ForcedPasswordChangeFlow } from "@/components/auth/forced-password-change-flow";
import { forcedPasswordChangeFormSchema } from "@/lib/tenant/forms/auth-schemas";

const mockReplace = vi.fn();
const mockPrefetch = vi.fn();
const mockChangeForcedPasswordApi = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    prefetch: mockPrefetch,
  }),
}));

vi.mock("@/lib/api/auth", () => ({
  changeForcedPasswordApi: (input: { newPassword: string; confirmNewPassword: string }) =>
    mockChangeForcedPasswordApi(input),
}));

// Mock session functions used by the component's guard
const mockHasActiveSession = vi.fn(() => false);
const mockGetForcePasswordChangeRequired = vi.fn(() => false);
const mockGetNetworkName = vi.fn(() => undefined);
const mockGetNetworkSubdomain = vi.fn(() => undefined);

vi.mock("@/lib/api/session", () => ({
  AUTH_SESSION_CLEARED_EVENT: "auth-session-cleared",
  AUTH_SESSION_UPDATED_EVENT: "auth-session-updated",
  hasActiveSession: () => mockHasActiveSession(),
  getForcePasswordChangeRequiredFromSession: () => mockGetForcePasswordChangeRequired(),
  getNetworkNameFromSession: () => mockGetNetworkName(),
  getNetworkSubdomainFromSession: () => mockGetNetworkSubdomain(),
}));

vi.mock("@/lib/tenant/auth-redirect", () => ({
  buildLoginHref: (_next?: string, _subdomain?: string | null) => "/login",
  resolvePostLoginPath: (next?: string | null) => next ?? "/dashboard",
}));

describe("ForcedPasswordChangeFlow", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockPrefetch.mockReset();
    mockChangeForcedPasswordApi.mockReset();
    mockHasActiveSession.mockReturnValue(false);
    mockGetForcePasswordChangeRequired.mockReturnValue(false);
    mockGetNetworkName.mockReturnValue(undefined);
    mockGetNetworkSubdomain.mockReturnValue(undefined);
  });

  it("redireciona para o login quando não existe sessão de primeiro acesso", async () => {
    mockHasActiveSession.mockReturnValue(false);

    render(<ForcedPasswordChangeFlow />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("redireciona para o próximo destino quando a sessão já não exige troca obrigatória", async () => {
    mockHasActiveSession.mockReturnValue(true);
    mockGetForcePasswordChangeRequired.mockReturnValue(false);

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
    mockHasActiveSession.mockReturnValue(true);
    mockGetForcePasswordChangeRequired.mockReturnValue(true);
    mockGetNetworkName.mockReturnValue("Rede Norte");
    mockGetNetworkSubdomain.mockReturnValue("rede-norte");
    mockChangeForcedPasswordApi.mockResolvedValue({ message: "Senha atualizada com sucesso." });

    render(<ForcedPasswordChangeFlow />);

    await waitFor(() => {
      expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    });

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
    mockHasActiveSession.mockReturnValue(true);
    mockGetForcePasswordChangeRequired.mockReturnValue(true);
    mockGetNetworkName.mockReturnValue("Rede Norte");
    mockGetNetworkSubdomain.mockReturnValue("rede-norte");
    mockChangeForcedPasswordApi.mockRejectedValue(new Error("Senha fraca demais."));

    render(<ForcedPasswordChangeFlow />);

    await waitFor(() => {
      expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    });

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
