/**
 * A11y audit (Wave H.2) — componentes leaf das 6 telas de Montagem
 * de Treino. Componentes complexos (TreinoV3Editor, TemplatesGridV3,
 * páginas com data fetching) já são exercitados pelos e2e via
 * Playwright; aqui auditamos os blocos puros via axe-core.
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { BibliotecaExerciciosModal } from "@/components/treinos/biblioteca-exercicios-modal";
import { KpiCard, ChartStat } from "@/app/(portal)/treinos/progresso/[alunoId]/_helpers";
import { TrendingUp } from "lucide-react";
import type { Exercicio } from "@/lib/shared/types/aluno";

const exercicios: Exercicio[] = [
  {
    id: "ex-1",
    tenantId: "tn-1",
    nome: "Supino reto",
    grupoMuscularId: "grp-peito",
    grupoMuscularNome: "Peito",
    equipamento: "Barra livre",
    ativo: true,
  },
  {
    id: "ex-2",
    tenantId: "tn-1",
    nome: "Puxada frontal",
    grupoMuscularId: "grp-costas",
    grupoMuscularNome: "Costas",
    equipamento: "Pulley",
    ativo: true,
  },
];

describe("a11y · BibliotecaExerciciosModal", () => {
  it("não tem violações ao abrir vazia", async () => {
    const { container } = render(
      <BibliotecaExerciciosModal
        open
        onClose={() => {}}
        exercicios={[]}
        onAdd={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("não tem violações com lista de exercícios + filtros visíveis", async () => {
    const { container } = render(
      <BibliotecaExerciciosModal
        open
        onClose={() => {}}
        exercicios={exercicios}
        onAdd={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("a11y · KpiCard (progresso)", () => {
  it("verde — sem violações", async () => {
    const { container } = render(
      <KpiCard
        tone="green"
        icon={<TrendingUp className="size-4" />}
        label="Adesão (12 semanas)"
        value="92%"
        detail="78 dias com treino"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("todas as 4 tonalidades sem violações", async () => {
    const tones = ["green", "teal", "orange", "red"] as const;
    for (const tone of tones) {
      const { container } = render(
        <KpiCard
          tone={tone}
          icon={<TrendingUp className="size-4" />}
          label="Métrica"
          value="123"
          detail="detalhe"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });
});

describe("a11y · ChartStat (progresso)", () => {
  it("estado neutro sem violações", async () => {
    const { container } = render(<ChartStat label="Início" value="60 kg" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("variantes accent + positive sem violações", async () => {
    const { container: a } = render(
      <ChartStat label="Atual" value="70 kg" accent />,
    );
    expect(await axe(a)).toHaveNoViolations();

    const { container: b } = render(
      <ChartStat label="Ganho" value="+10 kg" positive />,
    );
    expect(await axe(b)).toHaveNoViolations();
  });
});
