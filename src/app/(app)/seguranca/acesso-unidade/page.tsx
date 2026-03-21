"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { TableCell } from "@/components/ui/table";
import { SecurityActiveBadge } from "@/components/security/security-badges";
import { listUnidadesApi } from "@/lib/api/contexto-unidades";
import {
  createUserApi,
  linkUserPerfilApi,
  listPerfisApi,
  listUserPerfisApi,
  listUsersApi,
  unlinkUserPerfilApi,
} from "@/lib/api/rbac";
import { validateAcademiaUserCreateDraft } from "@/lib/security-user-create";
import { academiaUserCreateBaseFormSchema } from "@/lib/forms/security-user-create-schemas";
import type { RbacPerfil, RbacUser, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useAuthAccess, useTenantContext } from "@/hooks/use-session-context";

function isCustomerRole(roleName: string | undefined): boolean {
  return (roleName ?? "").trim().toUpperCase() === "CUSTOMER";
}

type CreateUserFormValues = {
  name: string;
  email: string;
  cpf: string;
  initialPerfilIds: string[];
};

type GrantAccessFormValues = {
  tenantId: string;
  userId: string;
  userQuery: string;
};

const grantAccessFormSchema = z.object({
  tenantId: z.string().trim().min(1, "Selecione a unidade para conceder acesso."),
  userId: z.string().trim().min(1, "Selecione o funcionário para conceder acesso."),
  userQuery: z.string(),
});

export default function AcessoUnidadePage() {
  const access = useAuthAccess();
  const tenantContext = useTenantContext();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<RbacUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [perfis, setPerfis] = useState<RbacPerfil[]>([]);
  const [userPerfis, setUserPerfis] = useState<RbacPerfil[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const createUserForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(
      academiaUserCreateBaseFormSchema.pick({
        name: true,
        email: true,
        cpf: true,
        initialPerfilIds: true,
      })
    ),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      initialPerfilIds: [],
    },
  });
  const grantAccessForm = useForm<GrantAccessFormValues>({
    resolver: zodResolver(grantAccessFormSchema),
    defaultValues: {
      tenantId: tenantContext.tenantId || "",
      userId: "",
      userQuery: "",
    },
  });
  const createProfileIds = useWatch({ control: createUserForm.control, name: "initialPerfilIds" }) ?? [];
  const tenantId = useWatch({ control: grantAccessForm.control, name: "tenantId" }) ?? "";
  const selectedUserId = useWatch({ control: grantAccessForm.control, name: "userId" }) ?? "";
  const effectiveTenantId = tenantId || tenantContext.tenantId || "";

  const selectedTenant = useMemo(
    () =>
      tenants.find((tenant) => tenant.id === effectiveTenantId)
      ?? (tenantContext.activeTenant?.id === effectiveTenantId ? tenantContext.activeTenant : null),
    [effectiveTenantId, tenantContext.activeTenant, tenants]
  );

  const activePerfis = useMemo(
    () => perfis.filter((perfil) => perfil.active && !isCustomerRole(perfil.roleName)),
    [perfis]
  );

  const networkTenantOptions = useMemo(() => {
    if (!selectedTenant) return tenants;
    const networkId = selectedTenant.academiaId ?? selectedTenant.groupId;
    if (!networkId) return tenants;
    return tenants.filter((tenant) => (tenant.academiaId ?? tenant.groupId) === networkId);
  }, [selectedTenant, tenants]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  const defaultPerfil = useMemo(() => {
    if (activePerfis.length === 0) return null;
    return (
      activePerfis.find((perfil) => ["RECEPCAO", "GERENTE", "ADMIN"].includes((perfil.roleName ?? "").toUpperCase())) ??
      activePerfis[0]
    );
  }, [activePerfis]);

  const loadTenants = useCallback(async () => {
    const loaded = await listUnidadesApi();
    const merged = [
      ...loaded,
      ...tenantContext.availableTenants,
      ...(tenantContext.activeTenant ? [tenantContext.activeTenant] : []),
    ];
    const deduped = Array.from(new Map(merged.map((item) => [item.id, item] as const)).values());
    setTenants(deduped);
    const nextTenantId = grantAccessForm.getValues("tenantId") || tenantContext.tenantId || deduped[0]?.id || "";
    grantAccessForm.setValue("tenantId", nextTenantId, { shouldDirty: false });
  }, [grantAccessForm, tenantContext.activeTenant, tenantContext.availableTenants, tenantContext.tenantId]);

  const loadTenantData = useCallback(async (targetTenantId: string) => {
    if (!targetTenantId) return;
    setLoading(true);
    setError(null);
    try {
      const perfisResponse = await listPerfisApi({ tenantId: targetTenantId, includeInactive: false, page: 0, size: 200 });
      setPerfis(perfisResponse.items);
      setUsers([]);
      setUsersLoaded(false);
      grantAccessForm.reset({
        tenantId: targetTenantId,
        userId: "",
        userQuery: "",
      });
      setUserPerfis([]);
    } catch (loadError) {
      setUsers([]);
      setUsersLoaded(false);
      setPerfis([]);
      grantAccessForm.reset({
        tenantId: targetTenantId,
        userId: "",
        userQuery: "",
      });
      setUserPerfis([]);
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [grantAccessForm]);

  const loadUsersOnDemand = useCallback(async () => {
    if (!effectiveTenantId || usersLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const usersResponse = await listUsersApi({ tenantId: effectiveTenantId });
      setUsers(usersResponse);
      setUsersLoaded(true);
    } catch (loadError) {
      setUsers([]);
      setUsersLoaded(false);
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [effectiveTenantId, usersLoaded]);

  const loadUserPerfisFor = useCallback(async (targetTenantId: string, targetUserId: string) => {
    if (!targetTenantId || !targetUserId) {
      setUserPerfis([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const linkedPerfis = await listUserPerfisApi({
        tenantId: targetTenantId,
        userId: targetUserId,
      });
      setUserPerfis(linkedPerfis);
    } catch (loadError) {
      setUserPerfis([]);
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (!tenantId && tenantContext.tenantId) {
      grantAccessForm.setValue("tenantId", tenantContext.tenantId, { shouldDirty: false });
    }
  }, [grantAccessForm, tenantContext.tenantId, tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    void loadTenantData(tenantId);
  }, [loadTenantData, tenantId]);

  useEffect(() => {
    void loadUserPerfisFor(tenantId, selectedUserId);
  }, [loadUserPerfisFor, selectedUserId, tenantId]);

  async function handleGrant(values: GrantAccessFormValues) {
    setError(null);
    setSuccess(null);

    if (!defaultPerfil || isCustomerRole(defaultPerfil.roleName)) {
      setError("Nenhum perfil interno padrão disponível para conceder acesso.");
      return;
    }

    setSaving(true);
    try {
      await linkUserPerfilApi({
        tenantId: values.tenantId,
        userId: values.userId,
        perfilId: defaultPerfil.id,
      });
      setSuccess("Acesso concedido na unidade selecionada.");
      await loadUserPerfisFor(values.tenantId, values.userId);
    } catch (grantError) {
      setError(normalizeErrorMessage(grantError));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveAccess() {
    if (!tenantId || !selectedUserId) return;
    if (internalProfilesLinked.length === 0) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await Promise.all(
        internalProfilesLinked.map((perfil) =>
          unlinkUserPerfilApi({
            tenantId,
            userId: selectedUserId,
            perfilId: perfil.id,
          })
        )
      );
      setSuccess("Acesso removido da unidade selecionada.");
      await loadUserPerfisFor(tenantId, selectedUserId);
    } catch (removeError) {
      setError(normalizeErrorMessage(removeError));
    } finally {
      setSaving(false);
    }
  }

  const internalProfilesLinked = userPerfis.filter((perfil) => !isCustomerRole(perfil.roleName));
  const hasInternalAccess = internalProfilesLinked.length > 0;
  const accessRows = selectedUser && hasInternalAccess ? [selectedUser] : [];

  async function handleCreateUser(values: CreateUserFormValues) {
    setError(null);
    setSuccess(null);
    if (!effectiveTenantId) {
      setError("Selecione a unidade atual antes de criar o usuário.");
      return;
    }
    setSaving(true);
    try {
      const networkId = selectedTenant?.academiaId ?? selectedTenant?.groupId;
      const payload = validateAcademiaUserCreateDraft({
        name: values.name,
        email: values.email,
        cpf: values.cpf,
        networkId,
        networkName: selectedTenant?.nome ?? tenantContext.tenantName,
        tenantIds: [effectiveTenantId],
        defaultTenantId: effectiveTenantId,
        initialPerfilIds: values.initialPerfilIds,
        allowedTenantIds: networkTenantOptions.map((tenant) => tenant.id),
        allowedPerfilIds: activePerfis.map((perfil) => perfil.id),
      });
      const created = await createUserApi({
        tenantId: effectiveTenantId,
        data: payload,
      });
      if (values.initialPerfilIds.length > 0) {
        await Promise.all(
          values.initialPerfilIds.map((perfilId) =>
            linkUserPerfilApi({
              tenantId: effectiveTenantId,
              userId: created.id,
              perfilId,
            })
          )
        );
      }
      setUsers((current) => [...current, created]);
      setUsersLoaded(true);
      grantAccessForm.setValue("userId", created.id, { shouldDirty: false });
      grantAccessForm.setValue("userQuery", created.fullName || created.name || created.email, { shouldDirty: false });
      await loadUserPerfisFor(effectiveTenantId, created.id);
      createUserForm.reset();
      setSuccess("Usuário criado na rede atual.");
    } catch (createError) {
      setError(normalizeErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Usuários e Acessos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conceda acesso operacional por unidade para pessoas internas da academia.
        </p>
      </div>

      {access.loading ? (
        <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Validando permissões de acesso...
        </div>
      ) : null}

      {access.error ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {access.error}
        </div>
      ) : null}

      {!access.loading && !access.canAccessElevatedModules ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          Acesso negado. Apenas perfis administrativos podem gerenciar usuários e acessos por unidade.
        </div>
      ) : null}

      {!access.loading && access.canAccessElevatedModules ? (
        <>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Criar usuário da rede atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A criação nesta área fica limitada à unidade e à rede operacional atual, sem alcance global nem outras redes.
          </p>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={createUserForm.handleSubmit(handleCreateUser)}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                <Input
                  aria-label="Nome do usuário da unidade"
                  {...createUserForm.register("name")}
                className="border-border bg-secondary"
                placeholder="Carla Operações"
              />
              {createUserForm.formState.errors.name ? (
                <p className="text-xs text-gym-danger">{createUserForm.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail *</label>
                <Input
                  aria-label="E-mail do usuário da unidade"
                  type="email"
                  {...createUserForm.register("email")}
                className="border-border bg-secondary"
                placeholder="carla@academia.local"
              />
              {createUserForm.formState.errors.email ? (
                <p className="text-xs text-gym-danger">{createUserForm.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF</label>
              <Input
                aria-label="CPF do usuário da unidade"
                {...createUserForm.register("cpf")}
                className="border-border bg-secondary"
                placeholder="111.222.333-44"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade base</label>
              <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
                {selectedTenant?.nome ?? tenantContext.tenantName ?? "Selecione a unidade ativa para fixar a base do novo usuário."}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Perfis iniciais</label>
              <div className="grid gap-2 rounded-lg border border-border bg-secondary/30 p-3 md:grid-cols-2">
                {activePerfis.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum perfil interno disponível para vínculo inicial.</p>
                ) : (
                  activePerfis.map((perfil) => (
                    <label key={perfil.id} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={createProfileIds.includes(perfil.id)}
                        onChange={() => {
                          const nextValues = createProfileIds.includes(perfil.id)
                            ? createProfileIds.filter((item) => item !== perfil.id)
                            : [...createProfileIds, perfil.id];
                          createUserForm.setValue("initialPerfilIds", nextValues, { shouldDirty: true });
                        }}
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

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving || loading || !effectiveTenantId}>
                {saving ? "Criando..." : "Criar usuário"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>


      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Conceder acesso operacional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-4 md:grid-cols-4" onSubmit={grantAccessForm.handleSubmit(handleGrant)}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade</label>
              <Controller
                control={grantAccessForm.control}
                name="tenantId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {grantAccessForm.formState.errors.tenantId ? (
                <p className="text-xs text-gym-danger">{grantAccessForm.formState.errors.tenantId.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Funcionário</label>
              <Controller
                control={grantAccessForm.control}
                name="userQuery"
                render={({ field }) => (
                  <SuggestionInput
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if ((selectedUser?.fullName || selectedUser?.name || selectedUser?.email || "") !== value) {
                        grantAccessForm.setValue("userId", "", { shouldDirty: true });
                        setUserPerfis([]);
                      }
                      if (value.trim().length >= 3) {
                        void loadUsersOnDemand();
                      }
                    }}
                    onSelect={(option) => {
                      grantAccessForm.setValue("userId", option.id, { shouldDirty: true });
                      field.onChange(option.label);
                    }}
                    options={users.map((user) => ({
                      id: user.id,
                      label: user.fullName || user.name || user.email || "Sem nome",
                      searchText: `${user.name ?? ""} ${user.fullName ?? ""} ${user.email ?? ""}`.trim(),
                    }))}
                    placeholder="Digite nome ou e-mail do funcionário"
                    emptyText="Nenhum funcionário encontrado"
                    minCharsToSearch={3}
                  />
                )}
              />
              {grantAccessForm.formState.errors.userId ? (
                <p className="text-xs text-gym-danger">{grantAccessForm.formState.errors.userId.message}</p>
              ) : null}
            </div>

            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={saving || loading || !tenantId || !selectedUserId || !defaultPerfil}>
                {saving ? "Salvando..." : "Conceder acesso operacional"}
              </Button>
            </div>
          </form>

          {selectedTenant ? (
            <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
              Unidade selecionada: <span className="font-medium text-foreground">{selectedTenant.nome}</span>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">{error}</div>
          ) : null}
          {success ? (
            <div className="rounded-lg border border-gym-teal/30 bg-gym-teal/10 px-3 py-2 text-sm text-gym-teal">{success}</div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Acesso do funcionário na unidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
            Status:{" "}
            <span className={hasInternalAccess ? "font-semibold text-gym-teal" : "font-semibold text-gym-warning"}>
              {hasInternalAccess ? "Acesso interno ativo" : "Sem acesso interno"}
            </span>
          </div>

          <PaginatedTable<RbacUser>
            columns={[
              { label: "Funcionário" },
              { label: "Perfis" },
              { label: "Status" },
              { label: "Ação" },
            ]}
            items={accessRows}
            getRowKey={(user) => user.id}
            emptyText={loading ? "Carregando..." : "Nenhum funcionário com acesso interno vinculado na unidade."}
            total={accessRows.length}
            page={0}
            pageSize={accessRows.length || 1}
            showPagination={false}
            renderCells={(user) => (
              <>
                <TableCell className="px-3 py-2">{user.fullName || user.name || user.email || "Funcionário"}</TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {internalProfilesLinked.map((perfil) => (
                      <span
                        key={perfil.id}
                        className="rounded-full border border-border bg-secondary px-2 py-1 text-xs font-medium text-foreground"
                      >
                        {perfil.roleName || perfil.displayName}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <SecurityActiveBadge
                    active={hasInternalAccess}
                    activeLabel="Ativo"
                    inactiveLabel="Sem acesso"
                  />
                </TableCell>
                <TableCell className="px-3 py-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8"
                    disabled={saving}
                    onClick={() => {
                      void handleRemoveAccess();
                    }}
                  >
                    Remover
                  </Button>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>
        </>
      ) : null}
    </div>
  );
}
