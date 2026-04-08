import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConversationList } from "@/components/atendimento/conversation-list";
import type { ConversaResponse } from "@/lib/shared/types/whatsapp-crm";

// Mock formatRelativeTime
vi.mock("@/lib/utils/time-format", () => ({
  formatRelativeTime: () => "há 5 min",
}));

function makeConversa(
  overrides: Partial<ConversaResponse> & { id: string },
): ConversaResponse {
  return {
    tenantId: "t1",
    academiaId: null,
    unidadeId: null,
    contactId: "c1",
    prospectId: null,
    alunoId: null,
    status: "ABERTA",
    queue: null,
    ownerUserId: null,
    lastMessagePreview: "Olá!",
    lastMessageAt: "2026-04-07T14:00:00",
    aiSummary: null,
    aiIntent: null,
    aiIntentConfidence: null,
    openedAt: "2026-04-07T14:00:00",
    closedAt: null,
    createdAt: "2026-04-07T14:00:00",
    updatedAt: "2026-04-07T14:00:00",
    contatoNome: "João Silva",
    contatoTelefone: "+5511999999999",
    ...overrides,
  };
}

const conversas = [
  makeConversa({ id: "1", contatoNome: "Ana" }),
  makeConversa({ id: "2", contatoNome: "Bruno" }),
  makeConversa({ id: "3", contatoNome: "Carlos" }),
];

describe("ConversationList", () => {
  it("renders all conversations", () => {
    render(
      <ConversationList
        conversas={conversas}
        selectedId={null}
        onSelect={() => {}}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText("Carlos")).toBeInTheDocument();
  });

  it("calls onSelect when clicking an item", () => {
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversas={conversas}
        selectedId={null}
        onSelect={onSelect}
        isLoading={false}
      />,
    );
    fireEvent.click(screen.getByText("Bruno"));
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("highlights selected conversation", () => {
    render(
      <ConversationList
        conversas={conversas}
        selectedId="2"
        onSelect={() => {}}
        isLoading={false}
      />,
    );
    const selected = screen.getByText("Bruno").closest("[role='option']");
    expect(selected).toHaveAttribute("aria-selected", "true");
  });

  it("navigates with ArrowDown", () => {
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversas={conversas}
        selectedId="1"
        onSelect={onSelect}
        isLoading={false}
      />,
    );
    const listbox = screen.getByRole("listbox");
    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("shows skeletons when loading", () => {
    const { container } = render(
      <ConversationList
        conversas={[]}
        selectedId={null}
        onSelect={() => {}}
        isLoading={true}
      />,
    );
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
