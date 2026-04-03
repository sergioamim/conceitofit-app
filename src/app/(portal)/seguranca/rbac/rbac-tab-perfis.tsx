import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { SecurityActiveBadge } from "@/components/security/security-badges";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import type { RbacPerfil } from "@/lib/types";
import type { UseFormReturn } from "react-hook-form";

export type PerfilFormState = {
  id?: string;
  roleName: string;
  displayName: string;
  description: string;
  active: boolean;
};

type RbacTabPerfisProps = {
  perfilForm: UseFormReturn<PerfilFormState>;
  perfilFormValues: PerfilFormState;
  perfis: RbacPerfil[];
  perfisLoading: boolean;
  perfilActionLoading: boolean;
  perfisError: string | null;
  perfisPage: number;
  perfisPageSize: number;
  perfisTotal: number;
  perfisHasNext: boolean;
  isActionLoading: boolean;
  tenantId: string;
  onSubmitPerfil: (values: PerfilFormState) => Promise<void>;
  onClearPerfilForm: () => void;
  onEditPerfil: (id: string) => void;
  onDesativarPerfil: (id: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
};

const profileColumns = [
  { label: "Perfil", className: "w-60" },
  { label: "Nome de exibição", className: "w-72" },
  { label: "Descrição", className: "w-80" },
  { label: "Status", className: "w-20" },
  { label: "Ações", className: "w-48" },
];

export function RbacTabPerfis({
  perfilForm,
  perfilFormValues,
  perfis,
  perfisLoading,
  perfilActionLoading,
  perfisError,
  perfisPage,
  perfisPageSize,
  perfisTotal,
  perfisHasNext,
  isActionLoading,
  tenantId,
  onSubmitPerfil,
  onClearPerfilForm,
  onEditPerfil,
  onDesativarPerfil,
  onNextPage,
  onPreviousPage,
}: RbacTabPerfisProps) {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-4" onSubmit={perfilForm.handleSubmit(onSubmitPerfil)}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">roleName *</label>
              <Input
                {...perfilForm.register("roleName")}
                className="bg-secondary border-border"
                placeholder="ADMIN"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">displayName *</label>
              <Input
                {...perfilForm.register("displayName")}
                className="bg-secondary border-border"
                placeholder="Administrador"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input
                {...perfilForm.register("description")}
                className="bg-secondary border-border"
                placeholder="Acesso administrativo completo"
              />
            </div>
            <div className="flex items-end gap-2 md:col-span-4">
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={perfilFormValues.active}
                  onChange={(event) => perfilForm.setValue("active", event.target.checked, { shouldDirty: true })}
                />
                Perfil ativo
              </label>
              <div className="ml-auto flex gap-2">
                {perfilFormValues.id ? (
                  <Button type="button" variant="outline" className="border-border" onClick={onClearPerfilForm}>
                    Cancelar edição
                  </Button>
                ) : null}
                <Button type="submit" disabled={isActionLoading || perfilActionLoading || !tenantId}>
                  {perfilFormValues.id ? "Atualizar" : "Salvar perfil"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <SecuritySectionFeedback loading={perfisLoading || perfilActionLoading} error={perfisError} />

      <PaginatedTable
        columns={profileColumns}
        items={perfis}
        getRowKey={(item) => item.id}
        emptyText="Nenhum perfil encontrado."
        page={perfisPage}
        pageSize={perfisPageSize}
        total={perfisTotal}
        hasNext={perfisHasNext}
        onPrevious={onPreviousPage}
        onNext={onNextPage}
        disablePrevious={perfisPage <= 0 || perfisLoading || perfilActionLoading}
        disableNext={!perfisHasNext || perfisLoading || perfilActionLoading}
        renderCells={(perfil) => (
          <>
            <TableCell className="px-3 py-2 font-mono text-xs">{perfil.roleName}</TableCell>
            <TableCell className="px-3 py-2">{perfil.displayName}</TableCell>
            <TableCell className="px-3 py-2 text-muted-foreground">{perfil.description || "—"}</TableCell>
            <TableCell className="px-3 py-2">
              <SecurityActiveBadge active={perfil.active} />
            </TableCell>
            <TableCell className="px-3 py-2">
              <DataTableRowActions
                actions={[
                  {
                    label: "Editar",
                    kind: "edit",
                    onClick: () => onEditPerfil(perfil.id),
                  },
                  {
                    label: perfil.active ? "Desativar" : "Remover",
                    kind: "delete",
                    onClick: () => onDesativarPerfil(perfil.id),
                  },
                ]}
              />
            </TableCell>
          </>
        )}
      />
    </section>
  );
}
