"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { SecurityActiveBadge } from "@/components/security/security-badges";
import { SecurityEmptyState, SecuritySectionFeedback } from "@/components/security/security-feedback";
import type { RbacPermission } from "@/lib/types";
import {
  useAuditoriaManager,
  useAuthAccess,
  useGrantManager,
  usePerfisManager,
  useRbacTenant,
  useUserPerfilManager,
} from "@/lib/rbac/hooks";

type RbacTab = "perfis" | "usuarios" | "grants" | "auditoria";

type PerfilFormState = {
  id?: string;
  roleName: string;
  displayName: string;
  description: string;
  active: boolean;
};

type GrantFormState = {
  id?: string;
  roleName: string;
  featureKey: string;
  permission: RbacPermission;
  allowed: boolean;
};

const PERFIL_DEFAULT: PerfilFormState = {
  roleName: "",
  displayName: "",
  description: "",
  active: true,
};

const GRANT_PERMISSION_OPTIONS: RbacPermission[] = ["VIEW", "EDIT", "MANAGE"];

function useStatusMessage() {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<"success" | "error" | null>(null);

  const show = useCallback((text: string, nextVariant: "success" | "error") => {
    setMessage(text);
    setVariant(nextVariant);
  }, []);

  const clear = useCallback(() => setMessage(null), []);

  const className =
    variant === "success"
      ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
      : "border-gym-danger/30 bg-gym-danger/10 text-gym-danger";

  return {
    message,
    show,
    clear,
    className,
    hasMessage: Boolean(message),
  };
}

export default function RbacPage() {
  const [activeTab, setActiveTab] = useState<RbacTab>("perfis");

  const access = useAuthAccess();
  const tenant = useRbacTenant();
  const tenantId = tenant.tenantId;

  const {
    perfis,
    activePerfis,
    loading: perfisLoading,
    actionLoading: perfilActionLoading,
    page: perfisPage,
    pageSize: perfisPageSize,
    hasNext: perfisHasNext,
    total: perfisTotal,
    error: perfisError,
    reload: reloadPerfis,
    goToNextPage: nextPerfisPage,
    goToPreviousPage: previousPerfisPage,
    savePerfil,
    deactivatePerfil,
  } = usePerfisManager(tenantId);

  const {
    users,
    selectedUser,
    selectedUserId,
    setSelectedUserId,
    userPerfis,
    loadingUsers,
    loadingPerfis,
    saving: userSaving,
    error: usuariosError,
    assignPerfil,
    removePerfil: removeUserPerfil,
    reload: reloadUsers,
  } = useUserPerfilManager(tenantId);

  const {
    features,
    grants,
    loading: grantsLoading,
    actionLoading: grantActionLoading,
    error: grantsError,
    reload: reloadGrants,
    saveFeature,
    saveGrant,
  } = useGrantManager(tenantId);

  const {
    items: logs,
    action,
    resourceType,
    limit,
    loading: logsLoading,
    error: logsError,
    setAction,
    setResourceType,
    setLimit,
  } = useAuditoriaManager(tenantId);

  const feedback = useStatusMessage();

  const [perfilForm, setPerfilForm] = useState<PerfilFormState>(PERFIL_DEFAULT);
  const [userQuery, setUserQuery] = useState("");

  useEffect(() => {
    if (selectedUser) {
      setUserQuery(selectedUser.fullName || selectedUser.name || selectedUser.email || "");
    }
  }, [selectedUser]);
  const [grantForm, setGrantForm] = useState<GrantFormState>({
    roleName: "",
    featureKey: "",
    permission: "VIEW",
    allowed: true,
  });
  const [perfilToAssign, setPerfilToAssign] = useState("");

  const [isActionLoading, setActionLoading] = useState(false);

  const tabButtons: Array<{ id: RbacTab; label: string }> = useMemo(
    () => [
      { id: "perfis", label: "Perfis" },
      { id: "usuarios", label: "Pessoas e Perfis" },
      { id: "grants", label: "Funcionalidades por Perfil" },
      { id: "auditoria", label: "Auditoria" },
    ],
    []
  );

  useEffect(() => {
    if (activeTab === "perfis") {
      void reloadPerfis();
    }
    if (activeTab === "usuarios") {
      void reloadUsers();
    }
    if (activeTab === "grants") {
      void reloadGrants();
    }
  }, [activeTab, reloadGrants, reloadPerfis, reloadUsers]);

  const clearPerfilForm = useCallback(() => {
    setPerfilForm(PERFIL_DEFAULT);
  }, []);

  const editPerfil = useCallback((id: string) => {
    const perfil = perfis.find((item) => item.id === id);
    if (!perfil) return;
    setPerfilForm({
      id: perfil.id,
      roleName: perfil.roleName,
      displayName: perfil.displayName,
      description: perfil.description ?? "",
      active: perfil.active,
    });
  }, [perfis]);

  const submitPerfil = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      feedback.clear();
      if (!perfilForm.roleName.trim()) {
        feedback.show("Informe o identificador do perfil.", "error");
        return;
      }
      if (!perfilForm.displayName.trim()) {
        feedback.show("Informe o nome de exibição.", "error");
        return;
      }

      setActionLoading(true);
      try {
        await savePerfil({
          id: perfilForm.id,
          data: {
            roleName: perfilForm.roleName.trim(),
            displayName: perfilForm.displayName.trim(),
            description: perfilForm.description.trim() || undefined,
            active: perfilForm.active,
          },
        });
        feedback.show(
          perfilForm.id ? "Perfil atualizado com sucesso." : "Perfil criado com sucesso.",
          "success"
        );
        clearPerfilForm();
      } catch (error) {
        feedback.show(error instanceof Error ? error.message : "Não foi possível salvar o perfil.", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [clearPerfilForm, feedback, perfilForm, savePerfil]
  );

  const desativarPerfil = useCallback(
    async (perfilId: string) => {
      const target = perfis.find((item) => item.id === perfilId);
      if (!target) return;
      if (target.active === false) {
        feedback.show("Perfil já está inativo.", "error");
        return;
      }
      setActionLoading(true);
      try {
        await deactivatePerfil(target);
        feedback.show("Perfil desativado.", "success");
      } finally {
        setActionLoading(false);
      }
    },
    [deactivatePerfil, feedback, perfis]
  );

  const assignPerfilToUser = useCallback(async () => {
    if (!perfilToAssign) {
      feedback.show("Selecione um perfil.", "error");
      return;
    }
    setActionLoading(true);
    try {
      await assignPerfil(perfilToAssign);
      feedback.show("Perfil vinculado com sucesso.", "success");
    } finally {
      setActionLoading(false);
    }
  }, [assignPerfil, feedback, perfilToAssign]);

  const submitFeatureConfig = useCallback(
    async (featureKey: string, enabled: boolean, rolloutRaw: string) => {
      const rollout = Number(rolloutRaw);
      if (Number.isNaN(rollout) || rollout < 0 || rollout > 100) {
        feedback.show("Rollout deve ser um número entre 0 e 100.", "error");
        setActionLoading(false);
        return;
      }
      setActionLoading(true);
      try {
        await saveFeature(featureKey, { enabled, rollout });
        feedback.show("Configuração da feature atualizada.", "success");
      } finally {
        setActionLoading(false);
      }
    },
    [feedback, saveFeature]
  );

  const submitGrant = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      feedback.clear();
      if (!grantForm.roleName || !grantForm.featureKey) {
        feedback.show("Selecione perfil e feature.", "error");
        setActionLoading(false);
        return;
      }
      setActionLoading(true);
      try {
        await saveGrant(grantForm);
        feedback.show("Grant salvo com sucesso.", "success");
      } finally {
        setActionLoading(false);
      }
    },
    [feedback, grantForm, saveGrant]
  );

  const filteredLogs = useMemo(() => logs, [logs]);

  const profileColumns = [
    { label: "Perfil", className: "w-60" },
    { label: "Nome de exibição", className: "w-72" },
    { label: "Descrição", className: "w-80" },
    { label: "Status", className: "w-20" },
    { label: "Ações", className: "w-48" },
  ];

  const userProfileColumns = [
    { label: "Perfil", className: "w-64" },
    { label: "Nome de exibição", className: "w-80" },
    { label: "Status", className: "w-20" },
    { label: "Ações", className: "w-24" },
  ];

  const grantColumns = [
    { label: "Perfil", className: "w-52" },
    { label: "Funcionalidade", className: "w-52" },
    { label: "Permissão", className: "w-28" },
    { label: "Permitido", className: "w-24" },
    { label: "Atualizado", className: "w-36" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Segurança</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">Perfis e Funcionalidades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Base técnica da segurança para governar perfis, vínculos e auditoria do tenant atual:
          <span className="font-semibold text-foreground"> {tenant.tenantName}</span>
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

      {tenant.error ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {tenant.error}
        </div>
      ) : null}

      {!access.loading && !access.canAccessElevatedModules ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          Acesso negado. Apenas perfis administrativos podem gerenciar a base técnica de perfis e funcionalidades.
        </div>
      ) : null}

      {!access.loading && access.canAccessElevatedModules ? (
        <>
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
        {tabButtons.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-semibold ${
              activeTab === tab.id
                ? "bg-gym-accent text-white"
                : "bg-transparent text-muted-foreground hover:bg-secondary"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {feedback.hasMessage ? (
        <div className={`rounded-md border px-4 py-3 text-sm ${feedback.className}`}>{feedback.message}</div>
      ) : null}

      {activeTab === "perfis" && (
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-4" onSubmit={submitPerfil}>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">roleName *</label>
                  <Input
                    value={perfilForm.roleName}
                    onChange={(event) => setPerfilForm((state) => ({ ...state, roleName: event.target.value }))}
                    className="bg-secondary border-border"
                    placeholder="ADMIN"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">displayName *</label>
                  <Input
                    value={perfilForm.displayName}
                    onChange={(event) => setPerfilForm((state) => ({ ...state, displayName: event.target.value }))}
                    className="bg-secondary border-border"
                    placeholder="Administrador"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
                  <Input
                    value={perfilForm.description}
                    onChange={(event) => setPerfilForm((state) => ({ ...state, description: event.target.value }))}
                    className="bg-secondary border-border"
                    placeholder="Acesso administrativo completo"
                  />
                </div>
                <div className="flex items-end gap-2 md:col-span-4">
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={perfilForm.active}
                      onChange={(event) =>
                        setPerfilForm((state) => ({ ...state, active: event.target.checked }))
                      }
                    />
                    Perfil ativo
                  </label>
                  <div className="ml-auto flex gap-2">
                    {perfilForm.id ? (
                      <Button type="button" variant="outline" className="border-border" onClick={clearPerfilForm}>
                        Cancelar edição
                      </Button>
                    ) : null}
                    <Button type="submit" disabled={isActionLoading || perfilActionLoading || !tenantId}>
                      {perfilForm.id ? "Atualizar" : "Salvar perfil"}
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
            onPrevious={previousPerfisPage}
            onNext={nextPerfisPage}
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
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-border"
                      onClick={() => editPerfil(perfil.id)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-gym-danger/40 text-gym-danger"
                      onClick={() => desativarPerfil(perfil.id)}
                    >
                      {perfil.active ? "Desativar" : "Remover"}
                    </Button>
                  </div>
                </TableCell>
              </>
            )}
          />
        </section>
          )}

      {activeTab === "usuarios" && (
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Pessoas e Perfis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                    <Select value={perfilToAssign} onValueChange={setPerfilToAssign}>
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
                  </div>
                  <Button className="mt-6" onClick={assignPerfilToUser} disabled={userSaving || loadingUsers || loadingPerfis || !selectedUserId}>
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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-gym-danger/40 text-gym-danger"
                        onClick={() => removeUserPerfil(item.id)}
                      >
                        Remover
                      </Button>
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
      )}

      {activeTab === "grants" && (
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Funcionalidades da plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.length === 0 ? (
                  <SecurityEmptyState text="Nenhuma funcionalidade definida." />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {features.map((feature) => (
                      <FeatureToggleRow
                        key={`${feature.featureKey}-${feature.enabled}-${feature.rollout}`}
                        feature={feature}
                        isSaving={grantActionLoading || isActionLoading}
                        onSave={(enabled, rollout) => submitFeatureConfig(feature.featureKey, enabled, rollout)}
                      />
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Feito em: {tenant.tenantName}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Permissões detalhadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3 md:grid-cols-5" onSubmit={submitGrant}>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Perfil</label>
                  <Select
                    value={grantForm.roleName}
                    onValueChange={(value) => setGrantForm((state) => ({ ...state, roleName: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePerfis.map((perfil) => (
                        <SelectItem key={perfil.id} value={perfil.roleName}>
                          {perfil.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Funcionalidade</label>
                  <Select
                    value={grantForm.featureKey}
                    onValueChange={(value) => setGrantForm((state) => ({ ...state, featureKey: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione a feature" />
                    </SelectTrigger>
                    <SelectContent>
                      {features.map((feature) => (
                        <SelectItem key={feature.featureKey} value={feature.featureKey}>
                          {feature.featureKey}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Permissão</label>
                  <Select
                    value={grantForm.permission}
                    onValueChange={(value) => setGrantForm((state) => ({ ...state, permission: value as RbacPermission }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRANT_PERMISSION_OPTIONS.map((permission) => (
                        <SelectItem key={permission} value={permission}>
                          {permission}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Permite</label>
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={grantForm.allowed}
                      onChange={(event) =>
                        setGrantForm((state) => ({ ...state, allowed: event.target.checked }))
                      }
                    />
                    Sim
                  </label>
                </div>

                <div className="flex items-end md:col-span-5 md:justify-end">
                  <Button type="submit" disabled={grantActionLoading}>
                    Salvar Grant
                  </Button>
                </div>
              </form>

              <SecuritySectionFeedback loading={grantsLoading || grantActionLoading} error={grantsError} />

              <PaginatedTable
                columns={grantColumns}
                items={grants}
                getRowKey={(grant) => `${grant.roleName}-${grant.featureKey}-${grant.permission}`}
                emptyText="Nenhum grant cadastrado."
                renderCells={(grant) => (
                  <>
                    <TableCell className="px-3 py-2 font-mono text-xs">{grant.roleName}</TableCell>
                    <TableCell className="px-3 py-2">{grant.featureKey}</TableCell>
                    <TableCell className="px-3 py-2">{grant.permission}</TableCell>
                    <TableCell className="px-3 py-2">{grant.allowed ? "SIM" : "NÃO"}</TableCell>
                    <TableCell className="px-3 py-2 text-muted-foreground">{"—"}</TableCell>
                  </>
                )}
                showPagination={false}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {activeTab === "auditoria" && (
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Auditoria de permissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</label>
                  <Input value={action} onChange={(event) => setAction(event.target.value)} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resource type</label>
                  <Input
                    value={resourceType}
                    onChange={(event) => setResourceType(event.target.value)}
                    className="bg-secondary border-border"
                    placeholder="ex: feature, perfil"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Limite</label>
                  <Select
                    value={String(limit)}
                    onValueChange={(nextValue) => setLimit(Number(nextValue))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SecuritySectionFeedback loading={logsLoading} error={logsError} />

              <PaginatedTable
                columns={[
                  { label: "createdAt" },
                  { label: "Action" },
                  { label: "Recurso" },
                  { label: "Usuário" },
                  { label: "Detalhes", className: "w-64" },
                ]}
                items={filteredLogs}
                getRowKey={(item) => item.id}
                emptyText="Nenhum evento encontrado."
                showPagination={false}
                renderCells={(item) => (
                  <>
                    <TableCell className="px-3 py-2">{item.createdAt}</TableCell>
                    <TableCell className="px-3 py-2">{item.action}</TableCell>
                    <TableCell className="px-3 py-2">{item.resourceType}</TableCell>
                    <TableCell className="px-3 py-2">{item.actorName ?? item.actorEmail ?? "—"}</TableCell>
                    <TableCell className="px-3 py-2 text-muted-foreground">{item.detalhes ?? "—"}</TableCell>
                  </>
                )}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {isActionLoading ? <p className="text-xs text-muted-foreground">Processando...</p> : null}
        </>
      ) : null}
    </div>
  );
}

function FeatureToggleRow({
  feature,
  isSaving,
  onSave,
}: {
  feature: {
    featureKey: string;
    enabled: boolean;
    rollout: number;
  };
  isSaving: boolean;
  onSave: (enabled: boolean, rollout: string) => void;
}) {
  const [enabled, setEnabled] = useState(feature.enabled);
  const [rollout, setRollout] = useState(String(feature.rollout));

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="space-y-2">
        <p className="text-sm font-semibold">{feature.featureKey}</p>
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Habilitada
        </label>
        <div className="flex gap-2">
          <Input
            value={rollout}
            onChange={(event) => setRollout(event.target.value)}
            className="bg-card border-border"
            aria-label={`Rollout da feature ${feature.featureKey}`}
          />
          <Button
            size="sm"
            onClick={() => onSave(enabled, rollout)}
            disabled={isSaving}
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
