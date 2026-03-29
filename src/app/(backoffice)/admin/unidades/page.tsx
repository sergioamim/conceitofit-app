import { useUnidadesWorkspace } from "./hooks/use-unidades-workspace";
import { StatsCards } from "./components/stats-cards";
import { AcademiaSidebar } from "./components/academia-sidebar";
import { UnitFormCard } from "./components/unit-form-card";
import { UnitsTableCard } from "./components/units-table-card";

export default function UnidadesPage() {
  const workspace = useUnidadesWorkspace();
  const { error, onboardingWarning } = workspace;

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Unidades</p>
        <h1 className="text-3xl font-display font-bold">Unidades (tenants)</h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma academia para criar, editar e acompanhar as unidades vinculadas sem sair do contexto.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      {onboardingWarning ? (
        <div className="rounded-xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
          {onboardingWarning}
        </div>
      ) : null}

      <StatsCards workspace={workspace} />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <AcademiaSidebar workspace={workspace} />

        <div className="flex flex-col gap-6">
          <UnitFormCard workspace={workspace} />
          <UnitsTableCard workspace={workspace} />
        </div>
      </div>
    </div>
  );
}
