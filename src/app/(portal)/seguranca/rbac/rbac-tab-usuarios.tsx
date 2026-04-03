import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { SecurityActiveBadge } from "@/components/security/security-badges";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import type { RbacPerfil, RbacUser } from "@/lib/types";
import type { UseFormReturn } from "react-hook-form";

export type CreateTenantUserFormState = {
  name: string;
  email: string;
  cpf: string;
  userKind: string;
  tenantIds: string[];
  defaultTenantId: string;
  initialPerfilIds: string[];
};

type TenantScopeOption = {
  id: string;
  nome: string;
  academiaId?: string;
  groupId?: string;
};

type RbacTabUsuariosProps = {
  tenantUserForm: UseFormReturn<CreateTenantUserFormState>;
  tenantUserFormValues: CreateTenantUserFormState;
  assignPerfilForm: UseFormReturn<{ perfilId: string }>;
  perfilToAssign: string;
  users: RbacUser[];
  selectedUser: RbacUser | null;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  userPerfis: RbacPerfil[];
  activePerfis: RbacPerfil[];
  loadingUsers: boolean;
  loadingPerfis: boolean;
  userSaving: boolean;
  usuariosError: string | null;
  isActionLoading: boolean;
  tenantId: string;
  tenantName: string;
  networkName: string | undefined;
  networkSubdomain: string | undefined;
  tenantScopeOptions: TenantScopeOption[];
  userQuery: string;
  setUserQuery: (query: string) => void;
  onSubmitTenantUser: (values: CreateTenantUserFormState) => Promise<void>;
  onToggleTenantUserTenant: (tenantId: string) => void;
  onToggleTenantUserPerfil: (perfilId: string) => void;
  onAssignPerfilToUser: () => void;
  onRemoveUserPerfil: (perfilId: string) => void;
};

const userProfileColumns = [
  { label: "Perfil", className: "w-64" },
  { label: "Nome de exibição", className: "w-80" },
  { label: "Status", className: "w-20" },
  { label: "Ações", className: "w-24" },
];

export function RbacTabUsuarios({
  tenantUserForm,
  tenantUserFormValues,
  assignPerfilForm,
  perfilToAssign,
  users,
  selectedUserId,
  userPerfis,
  activePerfis,
  loadingUsers,
  loadingPerfis,
  userSaving,
  usuariosError,
  isActionLoading,
  tenantId,
  tenantName,
  networkName,
  networkSubdomain,
  tenantScopeOptions,
  userQuery,
  setUserQuery,
  setSelectedUserId,
  onSubmitTenantUser,
  onToggleTenantUserTenant,
  onToggleTenantUserPerfil,
  onAssignPerfilToUser,
  onRemoveUserPerfil,
}: RbacTabUsuariosProps) {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Pessoas e Perfis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-sm font-semibold text-foreground">Criar usuário da rede atual</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Este fluxo é restrito à rede
              <span className="font-medium text-foreground"> {networkName ?? tenantName}</span>
              {networkSubdomain ? ` (${networkSubdomain})` : ""}.
              A UI não expõe escopo global nem unidades fora do contexto disponível.
            </p>

            <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={tenantUserForm.handleSubmit(onSubmitTenantUser)}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                <Input
                  aria-label="Nome do usuário da rede"
                  {...tenantUserForm.register("name")}
                  className="border-border bg-background"
                  placeholder="Carla Operações"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail *</label>
                <Input
                  aria-label="E-mail do usuário da rede"
                  type="email"
                  {...tenantUserForm.register("email")}
                  className="border-border bg-background"
                  placeholder="carla@academia.local"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF</label>
                <Input
                  aria-label="CPF do usuário da rede"
                  {...tenantUserForm.register("cpf")}
                  className="border-border bg-background"
                  placeholder="111.222.333-44"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</label>
                <Controller
                  control={tenantUserForm.control}
                  name="userKind"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Tipo do usuário da rede" className="border-border bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                        <SelectItem value="SUPORTE">Suporte</SelectItem>
                        <SelectItem value="PRESTADOR">Prestador</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidades da rede</label>
                <div className="grid gap-2 rounded-lg border border-border bg-background p-3 md:grid-cols-2">
                  {tenantScopeOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma unidade elegível disponível no contexto atual.</p>
                  ) : (
                    tenantScopeOptions.map((item) => (
                      <label key={item.id} className="flex items-start gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={tenantUserFormValues.tenantIds.includes(item.id)}
                          onChange={() => onToggleTenantUserTenant(item.id)}
                        />
                        <span className="font-medium text-foreground">{item.nome}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade base</label>
                <Controller
                  control={tenantUserForm.control}
                  name="defaultTenantId"
                  render={({ field }) => (
                    <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                      <SelectTrigger aria-label="Unidade base da rede" className="border-border bg-background">
                        <SelectValue placeholder="Selecione a base" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Selecione</SelectItem>
                        {tenantScopeOptions
                          .filter((item) => tenantUserFormValues.tenantIds.includes(item.id))
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Perfis iniciais</label>
                <div className="grid gap-2 rounded-lg border border-border bg-background p-3">
                  {activePerfis.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum perfil ativo disponível para vínculo inicial.</p>
                  ) : (
                    activePerfis.map((perfil) => (
                      <label key={perfil.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={tenantUserFormValues.initialPerfilIds.includes(perfil.id)}
                          onChange={() => onToggleTenantUserPerfil(perfil.id)}
                        />
                        <span>
                          <span className="block font-medium text-foreground">{perfil.displayName}</span>
                          <span className="block text-xs text-muted-foreground">{perfil.roleName}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={isActionLoading || userSaving || loadingUsers || loadingPerfis || !tenantId}>
                  {isActionLoading ? "Criando..." : "Criar usuário"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  onClick={() => tenantUserForm.reset({
                    name: "",
                    email: "",
                    cpf: "",
                    userKind: "COLABORADOR",
                    tenantIds: [],
                    defaultTenantId: "",
                    initialPerfilIds: [],
                  })}
                >
                  Limpar
                </Button>
              </div>
            </form>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Usuário</label>
              <SuggestionInput
                value={userQuery}
                onValueChange={(value) => setUserQuery(value)}
                onSelect={(option) => {
                  setSelectedUserId(option.id);
                  setUserQuery(option.label);
                }}
                options={users.map((user) => ({
                  id: user.id,
                  label: user.fullName || user.name || user.email || "Sem nome",
                  searchText: `${user.name ?? ""} ${user.fullName ?? ""} ${user.email ?? ""}`.trim(),
                }))}
                placeholder={loadingUsers ? "Carregando usuários..." : "Buscar por nome ou e-mail"}
                minCharsToSearch={0}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Perfil</label>
                <Controller
                  control={assignPerfilForm.control}
                  name="perfilId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Selecionar perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {activePerfis.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Button className="mt-6" onClick={onAssignPerfilToUser} disabled={userSaving || loadingUsers || loadingPerfis || !selectedUserId}>
                Vincular
              </Button>
            </div>
          </div>

          <SecuritySectionFeedback loading={loadingUsers || loadingPerfis || userSaving} error={usuariosError} />

          <PaginatedTable
            columns={userProfileColumns}
            items={userPerfis}
            getRowKey={(item) => item.id}
            emptyText="Nenhum perfil vinculado."
            renderCells={(item) => (
              <>
                <TableCell className="px-3 py-2 font-mono text-xs">{item.roleName}</TableCell>
                <TableCell className="px-3 py-2">{item.displayName}</TableCell>
                <TableCell className="px-3 py-2">
                  <SecurityActiveBadge active={item.active} />
                </TableCell>
                <TableCell className="px-3 py-2">
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Remover",
                        kind: "delete",
                        onClick: () => onRemoveUserPerfil(item.id),
                      },
                    ]}
                  />
                </TableCell>
              </>
            )}
            page={0}
            pageSize={0}
            total={userPerfis.length}
            hasNext={false}
            showPagination={false}
          />
        </CardContent>
      </Card>
    </section>
  );
}
