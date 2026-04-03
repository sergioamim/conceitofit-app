import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Dialog accessibility", () => {
  test("preserva o titulo explicito quando o modal informa DialogTitle", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modal com titulo</DialogTitle>
            <DialogDescription>Descricao do modal com titulo.</DialogDescription>
          </DialogHeader>
          <div>Conteudo</div>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("heading", { name: "Modal com titulo" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Janela modal" })).not.toBeInTheDocument();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test("injeta titulo oculto acessivel e avisa em desenvolvimento quando faltar DialogTitle", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <Dialog open>
        <DialogContent>
          <div>Conteudo sem titulo</div>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("heading", { name: "Janela modal" })).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      "[a11y] DialogContent renderizado sem DialogTitle. Adicione um DialogTitle visivel ou use um titulo acessivel com VisuallyHidden."
    );
  });
});
