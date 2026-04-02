import Link from "next/link";
import {
  SecurityActiveBadge,
  SecurityBroadAccessBadge,
  SecurityCompatibilityBadge,
  SecurityEligibilityBadge,
  SecurityReviewBadge,
  SecurityRiskBadge,
} from "@/components/security/security-badges";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { formatCpf } from "@/lib/shared/formatters";
import type { GlobalAdminUserSummary } from "@/lib/types";
import { type Filters, PAGE_SIZE, getScopeLabel } from "./usuarios-types";

interface UsuariosTableProps {
  items: GlobalAdminUserSummary[];
  appliedFilters: Filters;
  page: number;
  total: number;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function formatLoginIdentifier(label: string, value: string) {
  return label.trim().toUpperCase() === "CPF" ? formatCpf(value) : value;
}

export function UsuariosTable({
  items,
  appliedFilters,
  page,
  total,
  hasNext,
  onPrevious,
  onNext,
}: UsuariosTableProps) {
  return (
    <PaginatedTable
      columns={[
        { label: "Pessoa e login" },
        { label: "Rede e escopo" },
        { label: "Vínculos operacionais" },
        { label: "Papéis em uso" },
        { label: "Governança" },
        { label: "Estado" },
        { label: "Ações", className: "text-right" },
      ]}
      items={items}
      emptyText={
        appliedFilters.scopeType
          ? `Nenhuma pessoa administrativa encontrada para o escopo ${getScopeLabel(appliedFilters.scopeType).toLowerCase()}.`
          : "Nenhuma pessoa administrativa encontrada para os filtros atuais."
      }
      getRowKey={(item) => item.id}
      itemLabel="pessoas"
      page={page}
      pageSize={PAGE_SIZE}
      total={total}
      hasNext={hasNext}
      onPrevious={onPrevious}
      onNext={onNext}
      renderCells={(item) => (
        <>
          <TableCell className="px-4 py-3">
            <div className="space-y-1">
              <p className="font-medium">{item.fullName || item.name}</p>
              <p className="text-xs text-muted-foreground">{item.email}</p>
              {item.loginIdentifiers?.length ? (
                <p className="text-xs text-muted-foreground">
                  {item.loginIdentifiers
                    .map((identifier) => `${identifier.label}: ${formatLoginIdentifier(identifier.label, identifier.value)}`)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </TableCell>
          <TableCell className="px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{item.networkName || "Rede não informada"}</p>
            <p className="text-xs">Escopo efetivo: {getScopeLabel(item.scopeType)}</p>
            {item.domainLinksSummary?.length ? (
              <p className="text-xs">{item.domainLinksSummary.join(" · ")}</p>
            ) : (
              <p className="text-xs">{item.userKind ? `Tipo: ${item.userKind}` : "Sem agregações gerenciais informadas"}</p>
            )}
          </TableCell>
          <TableCell className="px-4 py-3 text-sm text-muted-foreground">
            <p>{item.membershipsAtivos} acessos ativos</p>
            <p className="text-xs">{item.academias.map((academia) => academia.nome).join(", ") || "Sem academia vinculada"}</p>
            <p className="text-xs">
              Base: {item.defaultTenantName || "não definida"}
              {item.activeTenantName && item.activeTenantName !== item.defaultTenantName
                ? ` · Ativa: ${item.activeTenantName}`
                : ""}
            </p>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {item.perfis.length === 0 ? (
                <span className="text-xs text-muted-foreground">Sem papel atribuído</span>
              ) : (
                item.perfis.slice(0, 3).map((perfil) => (
                  <span key={`${item.id}-${perfil}`} className="rounded-full bg-secondary px-2 py-1 text-[11px]">
                    {perfil}
                  </span>
                ))
              )}
            </div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <SecurityRiskBadge level={item.riskLevel} />
              <SecurityReviewBadge status={item.reviewStatus} />
              <SecurityEligibilityBadge eligible={item.eligibleForNewUnits} />
              <SecurityBroadAccessBadge broadAccess={item.broadAccess} />
              <SecurityCompatibilityBadge compatibilityMode={item.compatibilityMode} />
            </div>
            {(item.exceptionsCount ?? 0) > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{item.exceptionsCount} exceção(ões) visíveis</p>
            ) : null}
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="space-y-1 text-sm">
              <SecurityActiveBadge active={item.active} activeLabel={item.status} inactiveLabel={item.status} />
              <p className="text-xs text-muted-foreground">
                {item.defaultTenantName ? `Base: ${item.defaultTenantName}` : "Sem unidade base"}
              </p>
            </div>
          </TableCell>
          <TableCell className="px-4 py-3 text-right">
            <Button asChild size="sm" variant="outline" className="border-border">
              <Link href={`/admin/seguranca/usuarios/${item.id}`}>Abrir governança</Link>
            </Button>
          </TableCell>
        </>
      )}
    />
  );
}
