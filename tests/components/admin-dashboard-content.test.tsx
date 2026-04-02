import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminDashboardContent } from "@/app/(backoffice)/admin/admin-dashboard-content";
import type { MetricasOperacionaisGlobal } from "@/lib/types";

describe("AdminDashboardContent", () => {
  it("não quebra quando métricas globais chegam sem séries opcionais", () => {
    const metricasParciais = {
      totalAlunosAtivos: 120,
      totalMatriculasAtivas: 98,
      vendasMesQuantidade: 12,
      vendasMesValor: 5400,
      ticketMedioGlobal: 450,
      novosAlunosMes: 18,
      novosAlunosMesAnterior: 14,
      tendenciaCrescimentoPercentual: 28.5,
    } as MetricasOperacionaisGlobal;

    render(
      <AdminDashboardContent
        stats={{
          totalAcademias: 3,
          totalUnidades: 8,
          totalAdmins: 5,
          elegiveisNovasUnidades: 2,
        }}
        metricas={metricasParciais}
        operationalError={null}
      />,
    );

    expect(screen.getByRole("heading", { name: "Dashboard do backoffice" })).toBeInTheDocument();
    expect(screen.getByText("Sem dados de evolução mensal disponíveis.")).toBeInTheDocument();
    expect(screen.getByText("Sem distribuição por academia disponível.")).toBeInTheDocument();
  });
});
