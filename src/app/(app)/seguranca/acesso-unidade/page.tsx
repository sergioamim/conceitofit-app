"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { TableCell } from "@/components/ui/table";
import { listTenants } from "@/lib/mock/services";
import {
  linkUserPerfilApi,
  listPerfisApi,
  listUserPerfisApi,
  listUsersApi,
  unlinkUserPerfilApi,
} from "@/lib/api/rbac";
import type { RbacPerfil, RbacUser, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useAuthAccess } from "@/hooks/use-session-context";

function isCustomerRole(roleName: string | undefined): boolean {
  return (roleName ?? "").trim().toUpperCase() === "CUSTOMER";
}

export default function AcessoUnidadePage() {
  const access = useAuthAccess();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [users, setUsers] = useState<RbacUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [perfis, setPerfis] = useState<RbacPerfil[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userPerfis, setUserPerfis] = useState<RbacPerfil[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === tenantId) ?? null,
    [tenantId, tenants]
  );

  const activePerfis = useMemo(
    () => perfis.filter((perfil) => perfil.active && !isCustomerRole(perfil.roleName)),
    [perfis]
  );

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
    const loaded = await listTenants();
    const deduped = Array.from(new Map(loaded.map((item) => [item.id, item] as const)).values());
    setTenants(deduped);
    setTenantId((current) => current || deduped[0]?.id || "");
  }, []);

  const loadTenantData = useCallback(async (targetTenantId: string) => {
    if (!targetTenantId) return;
    setLoading(true);
    setError(null);
    try {
      const perfisResponse = await listPerfisApi({ tenantId: targetTenantId, includeInactive: false, page: 0, size: 200 });
      setPerfis(perfisResponse.items);
      setUsers([]);
      setUsersLoaded(false);
      setSelectedUserId("");
      setUserQuery("");
      setUserPerfis([]);
    } catch (loadError) {
      setUsers([]);
      setUsersLoaded(false);
      setPerfis([]);
      setSelectedUserId("");
      setUserQuery("");
      setUserPerfis([]);
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsersOnDemand = useCallback(async () => {
    if (!tenantId || usersLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const usersResponse = await listUsersApi({ tenantId });
      setUsers(usersResponse);
      setUsersLoaded(true);
    } catch (loadError) {
      setUsers([]);
      setUsersLoaded(false);
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantId, usersLoaded]);

  const loadUserPerfis = useCallback(async () => {
    if (!tenantId || !selectedUserId) {
      setUserPerfis([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const linkedPerfis = await listUserPerfisApi({
        tenantId,
        userId: selectedUserId,
      });
      setUserPerfis(linkedPerfis);
    } catch (loadError) {
      setUserPerfis([]);
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, tenantId]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (!tenantId) return;
    void loadTenantData(tenantId);
  }, [loadTenantData, tenantId]);

  useEffect(() => {
    void loadUserPerfis();
  }, [loadUserPerfis]);

  async function handleGrant(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!tenantId || !selectedUserId) {
      setError("Selecione unidade e funcionário para conceder acesso.");
      return;
    }

    if (!defaultPerfil || isCustomerRole(defaultPerfil.roleName)) {
      setError("Nenhum perfil interno padrão disponível para conceder acesso.");
      return;
    }

    setSaving(true);
    try {
      await linkUserPerfilApi({
        tenantId,
        userId: selectedUserId,
        perfilId: defaultPerfil.id,
      });
      setSuccess("Acesso concedido na unidade selecionada.");
      await loadUserPerfis();
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
      await loadUserPerfis();
    } catch (removeError) {
      setError(normalizeErrorMessage(removeError));
    } finally {
      setSaving(false);
    }
  }

  const internalProfilesLinked = userPerfis.filter((perfil) => !isCustomerRole(perfil.roleName));
  const hasInternalAccess = internalProfilesLinked.length > 0;
  const accessRows = selectedUser && hasInternalAccess ? [selectedUser] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Acesso por Unidade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conceda acesso de funcionário interno para operar em uma unidade específica.
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
          Acesso negado. Apenas perfis administrativos podem gerenciar acessos por unidade.
        </div>
      ) : null}

      {!access.loading && access.canAccessElevatedModules ? (
        <>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Conceder acesso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-4 md:grid-cols-4" onSubmit={handleGrant}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade</label>
              <Select value={tenantId} onValueChange={setTenantId}>
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
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Funcionário</label>
              <SuggestionInput
                value={userQuery}
                onValueChange={(value) => {
                  setUserQuery(value);
                  if ((selectedUser?.fullName || selectedUser?.name || selectedUser?.email || "") !== value) {
                    setSelectedUserId("");
                    setUserPerfis([]);
                  }
                  if (value.trim().length >= 3) {
                    void loadUsersOnDemand();
                  }
                }}
                onSelect={(option) => {
                  setSelectedUserId(option.id);
                  setUserQuery(option.label);
                }}
                onFocusOpen={() => {
                  void loadUsersOnDemand();
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
            </div>

            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={saving || loading || !tenantId || !selectedUserId || !defaultPerfil}>
                {saving ? "Salvando..." : "Conceder acesso"}
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
                <TableCell className="px-3 py-2">{hasInternalAccess ? "Ativo" : "Sem acesso"}</TableCell>
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
