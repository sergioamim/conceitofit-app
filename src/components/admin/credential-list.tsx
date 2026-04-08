"use client";

import { Activity, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaginatedTable, type PaginatedTableColumn } from "@/components/shared/paginated-table";
import { CredentialHealthBadge } from "./credential-health-badge";
import type { WhatsAppCredentialResponse } from "@/lib/shared/types/whatsapp-crm";

const COLUMNS: PaginatedTableColumn[] = [
  { label: "Telefone" },
  { label: "Modo", className: "hidden md:table-cell" },
  { label: "Onboarding", className: "w-[140px]" },
  { label: "Token", className: "w-[120px]" },
  { label: "Último Check", className: "hidden xl:table-cell w-[160px]" },
  { label: "Ações", className: "w-[180px]" },
];

const MODE_LABELS: Record<string, string> = {
  UNIT_NUMBER: "Por unidade",
  NETWORK_SHARED_NUMBER: "Compartilhado",
};

interface CredentialListProps {
  credentials: WhatsAppCredentialResponse[];
  isLoading: boolean;
  onEdit: (credential: WhatsAppCredentialResponse) => void;
  onDelete: (id: string) => void;
  onHealthCheck: (id: string) => void;
  onRefreshToken?: (id: string) => void;
}

export function CredentialList({
  credentials,
  isLoading,
  onEdit,
  onDelete,
  onHealthCheck,
  onRefreshToken,
}: CredentialListProps) {
  const renderCells = (credential: WhatsAppCredentialResponse) => (
    <>
      <TableCell className="px-4 py-3">
        <p className="font-medium text-foreground">{credential.phoneNumber}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
          WABA: {credential.wabaId}
        </p>
      </TableCell>
      <TableCell className="hidden px-4 py-3 md:table-cell">
        <Badge variant="outline" className="text-xs">
          {MODE_LABELS[credential.mode] ?? credential.mode}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3">
        <CredentialHealthBadge credential={credential} />
      </TableCell>
      <TableCell className="px-4 py-3">
        {credential.tokenExpired ? (
          <Badge className="bg-gym-danger/10 text-gym-danger border-gym-danger/20 text-[10px]">
            Expirado
          </Badge>
        ) : credential.tokenExpiringSoon ? (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
            Expirando
          </Badge>
        ) : (
          <Badge className="bg-gym-teal/10 text-gym-teal border-gym-teal/20 text-[10px]">
            Válido
          </Badge>
        )}
      </TableCell>
      <TableCell className="hidden whitespace-nowrap px-4 py-3 text-sm text-muted-foreground xl:table-cell">
        {credential.lastHealthCheckAt
          ? credential.lastHealthCheckAt.slice(0, 16).replace("T", " ")
          : "—"}
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(credential);
            }}
          >
            <Pencil className="size-3.5" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Health check"
            onClick={(e) => {
              e.stopPropagation();
              onHealthCheck(credential.id);
            }}
          >
            <Activity className="size-3.5" />
          </Button>
          {onRefreshToken && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Renovar token"
              onClick={(e) => {
                e.stopPropagation();
                onRefreshToken(credential.id);
              }}
            >
              <RefreshCw className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gym-danger hover:text-gym-danger"
            title="Deletar"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(credential.id);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </>
  );

  return (
    <PaginatedTable
      columns={COLUMNS}
      items={credentials}
      emptyText="Nenhuma credencial cadastrada."
      renderCells={renderCells}
      getRowKey={(c) => c.id}
      isLoading={isLoading}
      page={0}
      pageSize={50}
      total={credentials.length}
      hasNext={false}
      onPrevious={() => {}}
      onNext={() => {}}
      itemLabel="credenciais"
      tableAriaLabel="Tabela de credenciais WhatsApp"
    />
  );
}
