import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// hoisted mocks — precisam existir antes dos imports serem resolvidos
const hookMocks = vi.hoisted(() => ({
  useAgregadoresSchema: vi.fn(),
  useAgregadoresConfigs: vi.fn(),
  useTestAgregadorConnection: vi.fn(),
  useDeleteAgregadorConfig: vi.fn(),
  useCreateAgregadorConfig: vi.fn(),
  useUpdateAgregadorConfig: vi.fn(),
  useRotateAgregadorToken: vi.fn(),
  useRotateAgregadorWebhookSecret: vi.fn(),
}));

vi.mock("@/lib/query/use-agregadores-admin", () => ({
  useAgregadoresSchema: hookMocks.useAgregadoresSchema,
  useAgregadoresConfigs: hookMocks.useAgregadoresConfigs,
  useTestAgregadorConnection: hookMocks.useTestAgregadorConnection,
  useDeleteAgregadorConfig: hookMocks.useDeleteAgregadorConfig,
  useCreateAgregadorConfig: hookMocks.useCreateAgregadorConfig,
  useUpdateAgregadorConfig: hookMocks.useUpdateAgregadorConfig,
  useRotateAgregadorToken: hookMocks.useRotateAgregadorToken,
  useRotateAgregadorWebhookSecret: hookMocks.useRotateAgregadorWebhookSecret,
}));

import { AgregadoresDashboard } from "@/components/admin/agregadores/agregadores-dashboard";
import type {
  AgregadorConfigResponse,
  AgregadorSchemaResponse,
} from "@/lib/api/agregadores-admin";

const SCHEMA: AgregadorSchemaResponse = {
  agregadores: [
    {
      tipo: "WELLHUB",
      nome: "Wellhub (ex-Gympass)",
      camposRequeridos: ["external_gym_id", "access_token"],
      camposOpcionais: ["webhook_secret"],
      flags: [
        { key: "accessControlEnabled", type: "boolean", default: true },
        { key: "bookingEnabled", type: "boolean", default: false },
      ],
      webhookEndpoints: [
        "/api/v1/integracoes/agregadores/wellhub/checkin-webhook",
      ],
    },
    {
      tipo: "TOTALPASS",
      nome: "TotalPass",
      camposRequeridos: ["external_gym_id", "access_token"],
      camposOpcionais: [],
      flags: [],
      webhookEndpoints: [],
    },
  ],
};

const WELLHUB_CONFIG: AgregadorConfigResponse = {
  tipo: "WELLHUB",
  tenantId: "tenant-abc",
  enabled: true,
  externalGymId: "356",
  siteId: null,
  flags: { accessControlEnabled: true, bookingEnabled: false },
  hasToken: true,
  hasWebhookSecret: true,
};

function setupHooks(
  configs: AgregadorConfigResponse[],
  overrides: Partial<{
    schemaLoading: boolean;
    configsLoading: boolean;
    mutateImpl: (
      input: { tipo: string; tenantId: string },
      opts: {
        onSuccess?: (result: { success: boolean; message?: string }) => void;
        onError?: (err: Error) => void;
      },
    ) => void;
    isPending: boolean;
  }> = {},
) {
  hookMocks.useAgregadoresSchema.mockReturnValue({
    data: overrides.schemaLoading ? undefined : SCHEMA,
    isLoading: overrides.schemaLoading ?? false,
    error: null,
  });
  hookMocks.useAgregadoresConfigs.mockReturnValue({
    data: overrides.configsLoading ? undefined : configs,
    isLoading: overrides.configsLoading ?? false,
    error: null,
  });
  const mutate =
    overrides.mutateImpl ??
    ((_input, opts) => opts.onSuccess?.({ success: true, message: "ok" }));
  hookMocks.useTestAgregadorConnection.mockReturnValue({
    mutate: vi.fn(mutate),
    isPending: overrides.isPending ?? false,
  });
  // Mocks das mutations que o AgregadorCard/AgregadorConfigSheet agora usam
  // mesmo que os tests focados no dashboard não acionem essas ações.
  const noopMutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };
  hookMocks.useDeleteAgregadorConfig.mockReturnValue(noopMutation);
  hookMocks.useCreateAgregadorConfig.mockReturnValue(noopMutation);
  hookMocks.useUpdateAgregadorConfig.mockReturnValue(noopMutation);
  hookMocks.useRotateAgregadorToken.mockReturnValue(noopMutation);
  hookMocks.useRotateAgregadorWebhookSecret.mockReturnValue(noopMutation);
}

describe("AG-7.8 — AgregadoresDashboard", () => {
  it("renderiza 2 cards (WELLHUB configurado + TOTALPASS nao-configurado)", () => {
    setupHooks([WELLHUB_CONFIG]);

    render(<AgregadoresDashboard tenantId="tenant-abc" />);

    expect(screen.getByTestId("agregadores-grid")).toBeInTheDocument();
    expect(screen.getByTestId("agregador-card-WELLHUB")).toBeInTheDocument();
    expect(screen.getByTestId("agregador-card-TOTALPASS")).toBeInTheDocument();
    expect(screen.getByText("Wellhub (ex-Gympass)")).toBeInTheDocument();
    expect(screen.getByText("TotalPass")).toBeInTheDocument();
  });

  it("mostra badge 'Configurado' para WELLHUB enabled e 'Nao configurado' para TOTALPASS", () => {
    setupHooks([WELLHUB_CONFIG]);

    render(<AgregadoresDashboard tenantId="tenant-abc" />);

    const wellhubCard = screen.getByTestId("agregador-card-WELLHUB");
    const totalpassCard = screen.getByTestId("agregador-card-TOTALPASS");

    expect(wellhubCard.textContent).toContain("Configurado");
    expect(wellhubCard.textContent).toContain("356"); // external_gym_id
    expect(wellhubCard.textContent).toContain("accessControlEnabled"); // flag ativa
    expect(totalpassCard.textContent).toContain("Não configurado");
  });

  it("mostra badge 'Configurado, desabilitado' quando enabled=false", () => {
    setupHooks([{ ...WELLHUB_CONFIG, enabled: false }]);

    render(<AgregadoresDashboard tenantId="tenant-abc" />);

    const wellhubCard = screen.getByTestId("agregador-card-WELLHUB");
    expect(wellhubCard.textContent).toContain("Configurado, desabilitado");
  });

  it("botao 'Testar conexao' dispara mutation no card configurado", async () => {
    const mutateSpy = vi.fn(
      (_input: unknown, opts: { onSuccess?: (r: unknown) => void }) => {
        opts.onSuccess?.({ success: true, message: "ok" });
      },
    );
    hookMocks.useAgregadoresSchema.mockReturnValue({
      data: SCHEMA,
      isLoading: false,
      error: null,
    });
    hookMocks.useAgregadoresConfigs.mockReturnValue({
      data: [WELLHUB_CONFIG],
      isLoading: false,
      error: null,
    });
    hookMocks.useTestAgregadorConnection.mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
    });
    const noopMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    };
    hookMocks.useDeleteAgregadorConfig.mockReturnValue(noopMutation);
    hookMocks.useCreateAgregadorConfig.mockReturnValue(noopMutation);
    hookMocks.useUpdateAgregadorConfig.mockReturnValue(noopMutation);
    hookMocks.useRotateAgregadorToken.mockReturnValue(noopMutation);
    hookMocks.useRotateAgregadorWebhookSecret.mockReturnValue(noopMutation);

    render(<AgregadoresDashboard tenantId="tenant-abc" />);

    const wellhubCard = screen.getByTestId("agregador-card-WELLHUB");
    const testBtn = wellhubCard.querySelector<HTMLButtonElement>(
      '[data-testid="agregador-action-test"]',
    );
    expect(testBtn).toBeTruthy();
    expect(testBtn).not.toBeDisabled();

    fireEvent.click(testBtn!);

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: "WELLHUB", tenantId: "tenant-abc" }),
        expect.any(Object),
      );
    });
  });

  it("botao 'Testar conexao' fica desabilitado em agregador nao configurado", () => {
    setupHooks([]); // sem configs

    render(<AgregadoresDashboard tenantId="tenant-abc" />);

    const totalpassCard = screen.getByTestId("agregador-card-TOTALPASS");
    const testBtn = totalpassCard.querySelector<HTMLButtonElement>(
      '[data-testid="agregador-action-test"]',
    );
    expect(testBtn).toBeTruthy();
    expect(testBtn).toBeDisabled();
  });
});
