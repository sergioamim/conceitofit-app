import { useContasPagarWorkspace } from "./hooks/use-contas-pagar-workspace";
import { ContasPagarHeader } from "./components/contas-pagar-header";
import { ContasPagarStats } from "./components/contas-pagar-stats";
import { ContasPagarFilters } from "./components/contas-pagar-filters";
import { ContasPagarTable } from "./components/contas-pagar-table";
import { ContasPagarModals } from "./components/contas-pagar-modals";
import { ListErrorState } from "@/components/shared/list-states";

export default function ContasPagarPage() {
  const workspace = useContasPagarWorkspace();
  const { error, load } = workspace;

  return (
    <div className="space-y-6">
      {error ? (
        <ListErrorState error={error} onRetry={() => void load()} />
      ) : null}

      <ContasPagarModals workspace={workspace} />

      <ContasPagarHeader workspace={workspace} />

      <ContasPagarStats workspace={workspace} />

      <ContasPagarFilters workspace={workspace} />

      <ContasPagarTable workspace={workspace} />
    </div>
  );
}
