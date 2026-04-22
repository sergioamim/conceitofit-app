import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Mocks dos hooks RQ ──────────────────────────────────────────────────
const hookMocks = vi.hoisted(() => ({
  useCreateAgregadorConfig: vi.fn(),
  useUpdateAgregadorConfig: vi.fn(),
  useRotateAgregadorToken: vi.fn(),
  useRotateAgregadorWebhookSecret: vi.fn(),
  useDeleteAgregadorConfig: vi.fn(),
  useTestAgregadorConnection: vi.fn(),
  useAgregadorEventos: vi.fn(),
  useReprocessarAgregadorEvento: vi.fn(),
  useAgregadoresSchema: vi.fn(),
  useAgregadoresConfigs: vi.fn(),
}));

vi.mock("@/lib/query/use-agregadores-admin", () => ({
  useCreateAgregadorConfig: hookMocks.useCreateAgregadorConfig,
  useUpdateAgregadorConfig: hookMocks.useUpdateAgregadorConfig,
  useRotateAgregadorToken: hookMocks.useRotateAgregadorToken,
  useRotateAgregadorWebhookSecret: hookMocks.useRotateAgregadorWebhookSecret,
  useDeleteAgregadorConfig: hookMocks.useDeleteAgregadorConfig,
  useTestAgregadorConnection: hookMocks.useTestAgregadorConnection,
  useAgregadorEventos: hookMocks.useAgregadorEventos,
  useReprocessarAgregadorEvento: hookMocks.useReprocessarAgregadorEvento,
  useAgregadoresSchema: hookMocks.useAgregadoresSchema,
  useAgregadoresConfigs: hookMocks.useAgregadoresConfigs,
}));

// Mock next navigation hooks (para o monitor view).
vi.mock("next/navigation", async () => {
  const actual =
    await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useSearchParams: () =>
      new URLSearchParams("?tenantId=tenant-abc&tipo=WELLHUB"),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  };
});

import { AgregadorConfigSheet } from "@/components/admin/agregadores/agregador-config-sheet";
import { AgregadorCard } from "@/components/admin/agregadores/agregador-card";
import { AgregadoresEventosView } from "@/app/(backoffice)/admin/integracoes/agregadores/eventos/agregadores-eventos-view";
import type {
  AgregadorSchemaEntry,
  AgregadorConfigResponse,
} from "@/lib/api/agregadores-admin";

const SCHEMA: AgregadorSchemaEntry = {
  tipo: "WELLHUB",
  nome: "Wellhub (ex-Gympass)",
  camposRequeridos: ["external_gym_id", "access_token"],
  camposOpcionais: ["site_id"],
  flags: [
    {
      key: "accessControlEnabled",
      type: "boolean",
      label: "Access Control habilitado",
      default: true,
    },
    {
      key: "customCodePolicy",
      type: "enum",
      options: ["NONE", "EXTERNAL_USER_ID_LAST13"],
      default: "EXTERNAL_USER_ID_LAST13",
      label: "Custom Code Policy",
    },
  ],
  webhookEndpoints: [
    "/api/v1/integracoes/agregadores/wellhub/checkin-webhook",
  ],
};

const CONFIG: AgregadorConfigResponse = {
  tipo: "WELLHUB",
  tenantId: "tenant-abc",
  enabled: true,
  externalGymId: "356",
  siteId: null,
  flags: { accessControlEnabled: true },
  hasToken: true,
  hasWebhookSecret: true,
};

function makeMutationMock(overrides?: Partial<{ mutateAsync: ReturnType<typeof vi.fn>; mutate: ReturnType<typeof vi.fn>; isPending: boolean }>) {
  return {
    mutate: overrides?.mutate ?? vi.fn(),
    mutateAsync: overrides?.mutateAsync ?? vi.fn().mockResolvedValue({}),
    isPending: overrides?.isPending ?? false,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  hookMocks.useCreateAgregadorConfig.mockReturnValue(makeMutationMock());
  hookMocks.useUpdateAgregadorConfig.mockReturnValue(makeMutationMock());
  hookMocks.useRotateAgregadorToken.mockReturnValue(makeMutationMock());
  hookMocks.useRotateAgregadorWebhookSecret.mockReturnValue(makeMutationMock());
  hookMocks.useDeleteAgregadorConfig.mockReturnValue(makeMutationMock());
  hookMocks.useTestAgregadorConnection.mockReturnValue(makeMutationMock());
  hookMocks.useAgregadorEventos.mockReturnValue({
    data: { items: [], total: 0, page: 0, pageSize: 25 },
    isLoading: false,
    error: null,
  });
  hookMocks.useReprocessarAgregadorEvento.mockReturnValue(makeMutationMock());
});

describe("AG-7.9 — AgregadorConfigSheet", () => {
  it("abre em modo criar e renderiza campos do schema", () => {
    render(
      <AgregadorConfigSheet
        open
        onOpenChange={() => undefined}
        tenantId="tenant-abc"
        schema={SCHEMA}
      />,
    );

    // Header de create
    expect(
      screen.getByText(/Configurar Wellhub/i),
    ).toBeInTheDocument();

    // Campos simples do schema
    expect(
      screen.getByTestId("agregador-field-external_gym_id"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("agregador-field-site_id"),
    ).toBeInTheDocument();

    // Access token (password por default)
    const accessTokenInput = screen.getByTestId(
      "agregador-field-access-token",
    );
    expect(accessTokenInput).toBeInTheDocument();
    expect(accessTokenInput).toHaveAttribute("type", "password");

    // Flag boolean
    expect(
      screen.getByTestId("agregador-flag-accessControlEnabled"),
    ).toBeInTheDocument();

    // Webhook URL exibida
    expect(screen.getByTestId("agregador-webhook-url")).toBeInTheDocument();
  });

  it("botão 'Gerar novo webhook secret' chama rotate e abre Dialog one-time reveal", async () => {
    const rotateMutateAsync = vi.fn().mockResolvedValue({
      tipo: "WELLHUB",
      tenantId: "tenant-abc",
      webhookSecret: "wh_super_secret_123",
      webhookUrl:
        "https://app.conceito.fit/api/v1/integracoes/agregadores/wellhub/checkin-webhook",
      warning: "Salve este valor — não será exibido novamente",
    });
    hookMocks.useRotateAgregadorWebhookSecret.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: rotateMutateAsync,
      isPending: false,
    });

    render(
      <AgregadorConfigSheet
        open
        onOpenChange={() => undefined}
        tenantId="tenant-abc"
        schema={SCHEMA}
        config={CONFIG}
      />,
    );

    const rotateBtn = screen.getByTestId(
      "agregador-action-rotate-webhook-secret",
    );
    expect(rotateBtn).not.toBeDisabled();
    fireEvent.click(rotateBtn);

    await waitFor(() => {
      expect(rotateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: "WELLHUB" }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("agregador-secret-reveal-dialog"),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("agregador-reveal-secret")).toHaveValue(
      "wh_super_secret_123",
    );
  });

  it("rotate-webhook-secret fica desabilitado em modo criar", () => {
    render(
      <AgregadorConfigSheet
        open
        onOpenChange={() => undefined}
        tenantId="tenant-abc"
        schema={SCHEMA}
      />,
    );
    const rotateBtn = screen.getByTestId(
      "agregador-action-rotate-webhook-secret",
    );
    expect(rotateBtn).toBeDisabled();
  });
});

describe("AG-7.9 — AgregadorCard Desabilitar", () => {
  it("Desabilitar dispara DELETE após confirmação", async () => {
    const deleteMutate = vi.fn((_vars, opts) => {
      opts?.onSuccess?.();
    });
    hookMocks.useDeleteAgregadorConfig.mockReturnValue({
      mutate: deleteMutate,
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    render(
      <AgregadorCard tenantId="tenant-abc" schema={SCHEMA} config={CONFIG} />,
    );

    const btn = screen.getByTestId("agregador-action-desabilitar");
    fireEvent.click(btn);

    // Confirmação
    const confirm = await screen.findByTestId(
      "agregador-desabilitar-confirm-action",
    );
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(deleteMutate).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: "WELLHUB" }),
        expect.any(Object),
      );
    });
  });
});

describe("AG-7.10 — Monitor de eventos", () => {
  it("renderiza filtros e empty state enquanto endpoint não existe", () => {
    render(<AgregadoresEventosView />);

    expect(
      screen.getByTestId("agregadores-eventos-filtros"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Agregador/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();

    // Empty state com TODO
    const empty = screen.getByTestId("agregadores-eventos-empty");
    expect(empty.textContent ?? "").toMatch(/AG-7\.10\.backend/);
  });

  it("botão Reprocessar dispara POST correto para evento", async () => {
    const reprocessarMutate = vi.fn();
    hookMocks.useReprocessarAgregadorEvento.mockReturnValue({
      mutate: reprocessarMutate,
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isPending: false,
    });

    hookMocks.useAgregadorEventos.mockReturnValue({
      data: {
        items: [
          {
            id: "evt-1",
            tenantId: "tenant-abc",
            agregador: "WELLHUB",
            eventType: "CHECK_IN",
            externalGymId: "356",
            externalUserId: "user-xyz",
            status: "FAILED",
            createdAt: "2026-04-21T10:00:00Z",
          },
        ],
        total: 1,
        page: 0,
        pageSize: 25,
      },
      isLoading: false,
      error: null,
    });

    render(<AgregadoresEventosView />);

    const reprocessBtn = screen.getByTestId("evento-reprocessar-evt-1");
    fireEvent.click(reprocessBtn);

    await waitFor(() => {
      expect(reprocessarMutate).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: "WELLHUB", eventId: "evt-1" }),
        expect.any(Object),
      );
    });
  });
});
