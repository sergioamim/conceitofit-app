import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConversaStatusBadge } from "@/components/atendimento/status-badge";
import type { ConversationStatus } from "@/lib/shared/types/whatsapp-crm";

const ALL_STATUSES: { status: ConversationStatus; label: string }[] = [
  { status: "ABERTA", label: "Aberta" },
  { status: "EM_ATENDIMENTO", label: "Em atendimento" },
  { status: "PENDENTE", label: "Pendente" },
  { status: "ENCERRADA", label: "Encerrada" },
  { status: "SPAM", label: "Spam" },
  { status: "BLOQUEADA", label: "Bloqueada" },
];

describe("ConversaStatusBadge", () => {
  it.each(ALL_STATUSES)(
    "renders correct label for $status",
    ({ status, label }) => {
      render(<ConversaStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );

  it("applies custom className", () => {
    const { container } = render(
      <ConversaStatusBadge status="ABERTA" className="extra" />,
    );
    expect(container.firstChild).toHaveClass("extra");
  });
});
