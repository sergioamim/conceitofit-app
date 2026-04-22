import type { ReactNode } from "react";

/**
 * Casca estrutural do cockpit de venda (VUN-1.2).
 *
 * Server Component puro — apenas layout, zero estado ou interação. Consumidores
 * preenchem os slots via props; responsabilidade de `"use client"` é do filho,
 * não do shell. Target: recepção 1440×900; layout colapsa gracefully em 1024px.
 *
 * Ver `docs/VENDAS_UNIFICADAS_PRD.md` §8.1 e §10 para o contrato visual.
 */
type CockpitShellProps = {
  headerLeft?: ReactNode;
  headerCenter?: ReactNode;
  headerRight?: ReactNode;
  /**
   * Slot esquerdo. Opcional a partir de VUN-Onda-4 (2026-04-22): quando
   * ausente/null, o layout colapsa pra 2 colunas (centro expandido + direita).
   * Deprecado no cockpit novo — cliente e item search migraram pro header
   * via UniversalSearch (⌘K).
   */
  columnLeft?: ReactNode;
  columnCenter: ReactNode;
  columnRight: ReactNode;
};

export function CockpitShell({
  headerLeft,
  headerCenter,
  headerRight,
  columnLeft,
  columnCenter,
  columnRight,
}: CockpitShellProps) {
  const hasLeft = columnLeft != null && columnLeft !== false;
  return (
    <div
      className="flex h-full min-h-0 flex-col bg-background"
      data-testid="cockpit-shell"
    >
      <header
        className="flex h-14 shrink-0 items-center justify-between bg-ink px-6 text-[color:oklch(0.98_0_0)]"
        data-testid="cockpit-shell-header"
      >
        <div
          className="flex items-center gap-4"
          data-testid="cockpit-shell-header-left"
        >
          {headerLeft}
        </div>
        <div
          className="flex flex-1 items-center justify-center px-6"
          data-testid="cockpit-shell-header-center"
        >
          {headerCenter}
        </div>
        <div
          className="flex items-center gap-4"
          data-testid="cockpit-shell-header-right"
        >
          {headerRight}
        </div>
      </header>

      <div
        className={
          hasLeft
            ? "grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)_380px] min-[1440px]:grid-cols-[360px_minmax(0,1fr)_400px]"
            : "grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_380px] min-[1440px]:grid-cols-[minmax(0,1fr)_400px]"
        }
        data-testid="cockpit-shell-body"
      >
        {hasLeft ? (
          <aside
            className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-border bg-card"
            data-testid="cockpit-shell-column-left"
          >
            {columnLeft}
          </aside>
        ) : null}
        <section
          className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-border"
          data-testid="cockpit-shell-column-center"
        >
          {columnCenter}
        </section>
        <aside
          className="flex h-full min-h-0 flex-col overflow-y-auto bg-card"
          data-testid="cockpit-shell-column-right"
        >
          {columnRight}
        </aside>
      </div>
    </div>
  );
}
