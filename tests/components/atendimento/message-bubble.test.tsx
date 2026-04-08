import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/atendimento/message-bubble";
import type { MensagemResponse } from "@/lib/shared/types/whatsapp-crm";

// Mock formatRelativeTime to return a stable string
vi.mock("@/lib/utils/time-format", () => ({
  formatRelativeTime: () => "há 2 minutos",
}));

function makeMensagem(
  overrides: Partial<MensagemResponse> = {},
): MensagemResponse {
  return {
    id: "msg-1",
    conversationId: "conv-1",
    direction: "INBOUND",
    contentType: "TEXTO",
    content: "Olá, tudo bem?",
    mediaUrl: null,
    deliveryStatus: "ENTREGUE",
    isAutomated: false,
    createdAt: "2026-04-07T14:00:00",
    ...overrides,
  };
}

describe("MessageBubble", () => {
  it("renders inbound message aligned left", () => {
    const { container } = render(
      <MessageBubble message={makeMensagem({ direction: "INBOUND" })} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-start");
  });

  it("renders outbound message aligned right", () => {
    const { container } = render(
      <MessageBubble message={makeMensagem({ direction: "OUTBOUND" })} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-end");
  });

  it("shows 'Automação' badge when isAutomated is true", () => {
    render(
      <MessageBubble message={makeMensagem({ isAutomated: true })} />,
    );
    expect(screen.getByText("Automação")).toBeInTheDocument();
  });

  it("does not show 'Automação' badge when isAutomated is false", () => {
    render(
      <MessageBubble message={makeMensagem({ isAutomated: false })} />,
    );
    expect(screen.queryByText("Automação")).not.toBeInTheDocument();
  });

  it("renders message content", () => {
    render(
      <MessageBubble message={makeMensagem({ content: "Teste 123" })} />,
    );
    expect(screen.getByText("Teste 123")).toBeInTheDocument();
  });

  it("renders relative timestamp", () => {
    render(<MessageBubble message={makeMensagem()} />);
    expect(screen.getByText("há 2 minutos")).toBeInTheDocument();
  });
});
