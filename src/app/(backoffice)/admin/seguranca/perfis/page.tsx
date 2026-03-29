"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GlobalSecurityShell, formatSecurityDateTime } from "@/components/security/global-security-shell";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import {
  SecurityActiveBadge,
  SecurityRiskBadge,
} from "@/components/security/security-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { buildSecurityFeatureCatalog, buildStandardizedProfiles } from "@/lib/backoffice/security-governance";
import { listGlobalSecurityUsers } from "@/lib/backoffice/seguranca";
import { useAuthAccess, useRbacTenant } from "@/lib/tenant/rbac/hooks";
import {
  createPerfilService,
  listAuditoriaService,
  listFeaturesService,
  listGrantsService,
  listPerfisService,
  saveGrantService,
  updatePerfilService,
} from "@/lib/tenant/rbac/services";
import type {
  GlobalAdminUserSummary,
  RbacAuditoriaItem,
  RbacFeature,
  RbacGrant,
  RbacPerfil,
  RbacPermission,
  SecurityBusinessScope,
  SecurityProfileMatrixItem,
} from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type ProfileFormState = {
  id?: string;
  roleName: string;
  displayName: string;
  description: string;
  active: boolean;
};

type PendingGrantChange = {
  featureKey: string;
  permission: RbacPermission;
  nextAllowed: boolean;
};

const EMPTY_FORM: ProfileFormState = {
  roleName: "",
  displayName: "",
  description: "",
  active: true,
};

const PERMISSIONS: RbacPermission[] = ["VIEW", "EDIT", "MANAGE"];

async function loadUsersSnapshot() {
  const items: GlobalAdminUserSummary[] = [];

  for (let page = 0; page < 10; page += 1) {
    const response = await listGlobalSecurityUsers({
      status: undefined,
      page,
      size: 100,
    });
    items.push(...response.items);
    if (!response.hasNext || response.items.length === 0) {
      break;
    }
  }

  return items;
}

function permissionLabel(permission: RbacPermission) {
  if (permission === "MANAGE") return "Administrar";
  if (permission === "EDIT") return "Editar";
  return "Visualizar";
}

export default function AdminSegurancaPerfisPage() {
  const { toast } = useToast();
  const access = useAuthAccess();
  const tenant = useRbacTenant();
  const [perfis, setPerfis] = useState<RbacPerfil[]>([]);
  const [features, setFeatures] = useState<RbacFeature[]>([]);
  const [grants, setGrants] = useState<RbacGrant[]>([]);
  const [users, setUsers] = useState<GlobalAdminUserSummary[]>([]);
  const [auditoria, setAuditoria] = useState<RbacAuditoriaItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<SecurityBusinessScope | typeof FILTER_ALL>(FILTER_ALL);
  const [riskFilter, setRiskFilter] = useState<typeof FILTER_ALL | "BAIXO" | "MEDIO" | "ALTO" | "CRITICO">(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState<typeof FILTER_ALL | "ATIVOS" | "INATIVOS">("ATIVOS");
  const [matrixQuery, setMatrixQuery] = useState("");
  const [matrixModuleFilter, setMatrixModuleFilter] = useState(FILTER_ALL);
  const [matrixRiskFilter, setMatrixRiskFilter] = useState<typeof FILTER_ALL | "BAIXO" | "MEDIO" | "ALTO" | "CRITICO">(FILTER_ALL);
  const [matrixAssignedFilter, setMatrixAssignedFilter] = useState<typeof FILTER_ALL | "ATRIBUIDAS" | "SEM_ATRIBUICAO">(FILTER_ALL);
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [pendingGrantChange, setPendingGrantChange] = useState<PendingGrantChange | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tenant.tenantId) return;
    setLoading(true);
    try {
      setError(null);
      const [perfisResponse, featuresResponse, grantsResponse, usersResponse, auditResponse] = await Promise.all([
        listPerfisService({
          tenantId: tenant.tenantId,
          includeInactive: true,
          page: 0,
          size: 100,
        }),
        listFeaturesService({ tenantId: tenant.tenantId }),
        listGrantsService({ tenantId: tenant.tenantId }),
        loadUsersSnapshot(),
        listAuditoriaService({ tenantId: tenant.tenantId, limit: 25 }),
      ]);
      setPerfis(perfisResponse.items);
      setFeatures(featuresResponse);
      setGrants(grantsResponse);
      setUsers(usersResponse);
      setAuditoria(auditResponse);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenant.tenantId]);

  useEffect(() => {
    if (!tenant.tenantId || access.loading || !access.canAccessElevatedModules) return;
    void reload();
  }, [access.canAccessElevatedModules, access.loading, reload, tenant.tenantId]);

  const catalog = useMemo(() => buildSecurityFeatureCatalog(features, grants), [features, grants]);
  const standardizedProfiles = useMemo(
    () => buildStandardizedProfiles({ perfis, grants, catalog, users }),
    [catalog, grants, perfis, users]
  );

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return standardizedProfiles.filter((profile) => {
      if (statusFilter === "ATIVOS" && !profile.active) return false;
      if (statusFilter === "INATIVOS" && profile.active) return false;
      if (scopeFilter !== FILTER_ALL && profile.recommendedScope !== scopeFilter) return false;
      if (riskFilter !== FILTER_ALL && profile.riskLevel !== riskFilter) return false;
      if (!normalizedQuery) return true;
      return [profile.displayName, profile.roleName, profile.objective]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, riskFilter, scopeFilter, standardizedProfiles, statusFilter]);

  const selectedProfile = useMemo(
    () => filteredProfiles.find((profile) => profile.id === selectedProfileId) ?? filteredProfiles[0] ?? null,
    [filteredProfiles, selectedProfileId]
  );

  const matrixItems = useMemo(() => {
    if (!selectedProfile) return [];
    const normalizedQuery = matrixQuery.trim().toLocaleLowerCase();
    return selectedProfile.matrix.filter((item) => {
      if (matrixModuleFilter !== FILTER_ALL && item.moduleLabel !== matrixModuleFilter) return false;
      if (matrixRiskFilter !== FILTER_ALL && item.riskLevel !== matrixRiskFilter) return false;
      if (matrixAssignedFilter === "ATRIBUIDAS" && item.permissions.length === 0) return false;
      if (matrixAssignedFilter === "SEM_ATRIBUICAO" && item.permissions.length > 0) return false;
      if (!normalizedQuery) return true;
      return [item.businessLabel, item.moduleLabel, item.featureKey, item.description]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [matrixAssignedFilter, matrixModuleFilter, matrixQuery, matrixRiskFilter, selectedProfile]);

  const recentProfileChanges = useMemo(() => auditoria.slice(0, 6), [auditoria]);

  const selectedPendingMatrixItem = useMemo(() => {
    if (!selectedProfile || !pendingGrantChange) return null;
    return selectedProfile.matrix.find((item) => item.featureKey === pendingGrantChange.featureKey) ?? null;
  }, [pendingGrantChange, selectedProfile]);

  useEffect(() => {
    if (!selectedProfile) {
      setSelectedProfileId("");
      setForm(EMPTY_FORM);
      return;
    }
    setSelectedProfileId(selectedProfile.id);
    setForm({
      id: selectedProfile.id,
      roleName: selectedProfile.roleName,
      displayName: selectedProfile.displayName,
      description: selectedProfile.description ?? "",
      active: selectedProfile.active,
    });
  }, [selectedProfile]);

  async function handleSaveProfile() {
    if (!tenant.tenantId) return;
    if (!form.roleName.trim() || !form.displayName.trim()) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Role técnico e nome amigável são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await updatePerfilService({
          tenantId: tenant.tenantId,
          perfilId: form.id,
          data: {
            roleName: form.roleName.trim(),
            displayName: form.displayName.trim(),
            description: form.description.trim() || undefined,
            active: form.active,
          },
        });
        toast({ title: "Perfil atualizado", description: form.displayName });
      } else {
        await createPerfilService({
          tenantId: tenant.tenantId,
          data: {
            roleName: form.roleName.trim(),
            displayName: form.displayName.trim(),
            description: form.description.trim() || undefined,
            active: form.active,
          },
        });
        toast({ title: "Perfil criado", description: form.displayName });
      }
      await reload();
    } catch (saveError) {
      toast({
        title: "Não foi possível salvar o perfil",
        description: normalizeErrorMessage(saveError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmGrantChange() {
    if (!tenant.tenantId || !selectedProfile || !pendingGrantChange) return;
    setSaving(true);
    try {
      await saveGrantService({
        tenantId: tenant.tenantId,
        perfilRoleName: selectedProfile.roleName,
        featureKey: pendingGrantChange.featureKey,
        permission: pendingGrantChange.permission,
        allowed: pendingGrantChange.nextAllowed,
      });
      toast({
        title: "Matriz atualizada",
        description: `${permissionLabel(pendingGrantChange.permission)} em ${selectedPendingMatrixItem?.businessLabel ?? pendingGrantChange.featureKey}`,
      });
      setPendingGrantChange(null);
      await reload();
    } catch (saveError) {
      toast({
        title: "Não foi possível salvar a matriz",
        description: normalizeErrorMessage(saveError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const modules = useMemo(
    () => [...new Set(catalog.map((item) => item.moduleLabel))].sort((left, right) => left.localeCompare(right, "pt-BR")),
    [catalog]
  );

  return (
    <GlobalSecurityShell
      title="Perfis padronizados"
      description="Governança visual para papéis reutilizáveis, com impacto operacional, risco e matriz de permissões em linguagem de negócio."
      actions={
        <>
          <Button variant="outline" className="border-border" onClick={() => setForm(EMPTY_FORM)}>
            Novo perfil
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href="/admin/seguranca/funcionalidades">Abrir catálogo</Link>
          </Button>
        </>
      }
    >
      {access.loading || tenant.loading ? <SecuritySectionFeedback loading error={null} /> : null}

      {!access.loading && !access.canAccessElevatedModules ? (
        <Card>
          <CardContent className="px-5 py-5 text-sm text-gym-danger">
            Apenas perfis administrativos podem governar perfis padronizados e a matriz fina de permissões.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Perfis ativos" value={String(standardizedProfiles.filter((item) => item.active).length)} />
            <MetricCard title="Perfis no tenant" value={String(standardizedProfiles.length)} />
            <MetricCard title="Pessoas impactadas" value={String(standardizedProfiles.reduce((total, item) => total + item.usersImpacted, 0))} />
            <MetricCard title="Mudanças recentes" value={String(recentProfileChanges.length)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leitura e filtros</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="profiles-query">Buscar perfil</Label>
                <Input id="profiles-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Administrador" />
              </div>
              <div className="space-y-2">
                <Label>Escopo recomendado</Label>
                <Select value={scopeFilter} onValueChange={(value) => setScopeFilter(value as SecurityBusinessScope | typeof FILTER_ALL)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                    <SelectItem value="UNIDADE">Unidade</SelectItem>
                    <SelectItem value="ACADEMIA">Academia</SelectItem>
                    <SelectItem value="REDE">Rede</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Criticidade</Label>
                <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as typeof riskFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas</SelectItem>
                    <SelectItem value="BAIXO">Baixo</SelectItem>
                    <SelectItem value="MEDIO">Médio</SelectItem>
                    <SelectItem value="ALTO">Alto</SelectItem>
                    <SelectItem value="CRITICO">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVOS">Ativos</SelectItem>
                    <SelectItem value="INATIVOS">Inativos</SelectItem>
                    <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <SecuritySectionFeedback loading={loading} error={error} />

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Perfis governados</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Fonte técnica: tenant ativo {tenant.tenantName ? `· ${tenant.tenantName}` : ""}.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                      selectedProfile?.id === profile.id ? "border-gym-accent/40 bg-gym-accent/5" : "border-border bg-background"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{profile.displayName}</p>
                        <p className="text-xs text-muted-foreground">{profile.roleName}</p>
                      </div>
                      <SecurityActiveBadge active={profile.active} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SecurityRiskBadge level={profile.riskLevel} />
                      <Tag label={profile.recommendedScope} />
                      <Tag label={`${profile.usersImpacted} pessoa(s)`} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{profile.objective}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">{form.id ? "Detalhe e edição" : "Novo perfil padronizado"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Mantenha o nome amigável alinhado com a responsabilidade operacional, não com o código interno.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProfile ? (
                    <div className="grid gap-3 md:grid-cols-4">
                      <SummaryStat label="Versão" value={selectedProfile.versionLabel} />
                      <SummaryStat label="Funcionalidades" value={String(selectedProfile.featureCount)} />
                      <SummaryStat label="Críticas" value={String(selectedProfile.criticalFeatureCount)} />
                      <SummaryStat label="Usuários" value={String(selectedProfile.usersImpacted)} />
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="profile-role-name">Role técnico</Label>
                      <Input
                        id="profile-role-name"
                        value={form.roleName}
                        disabled={Boolean(form.id)}
                        onChange={(event) => setForm((current) => ({ ...current, roleName: event.target.value }))}
                        placeholder="ADMIN_REDE"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-display-name">Nome amigável</Label>
                      <Input
                        id="profile-display-name"
                        value={form.displayName}
                        onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                        placeholder="Administrador de Rede"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="profile-description">Objetivo</Label>
                      <Textarea
                        id="profile-description"
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Explique a responsabilidade principal do perfil."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={form.active ? "ATIVO" : "INATIVO"}
                        onValueChange={(value) => setForm((current) => ({ ...current, active: value === "ATIVO" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedProfile ? (
                      <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-4 text-sm text-muted-foreground">
                        Escopo recomendado: <span className="font-semibold text-foreground">{selectedProfile.recommendedScope}</span>
                        <br />
                        Última atualização: {formatSecurityDateTime(selectedProfile.lastUpdatedAt)}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {form.id ? "Salvar perfil" : "Criar perfil"}
                    </Button>
                    <Button variant="outline" className="border-border" onClick={() => setForm(EMPTY_FORM)}>
                      Limpar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">Histórico recente</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Mudanças técnicas ajudam a entender quando o papel ficou mais amplo ou mais restrito.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentProfileChanges.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{item.action}</p>
                        <span className="text-xs text-muted-foreground">{formatSecurityDateTime(item.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detalhes || item.resourceType}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Matriz visual de permissões</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ajuste uma capacidade por vez com preview do impacto antes de confirmar.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="matrix-query">Buscar funcionalidade</Label>
                  <Input id="matrix-query" value={matrixQuery} onChange={(event) => setMatrixQuery(event.target.value)} placeholder="Financeiro" />
                </div>
                <div className="space-y-2">
                  <Label>Módulo</Label>
                  <Select value={matrixModuleFilter} onValueChange={setMatrixModuleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                      {modules.map((moduleLabel) => (
                        <SelectItem key={moduleLabel} value={moduleLabel}>
                          {moduleLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Criticidade</Label>
                  <Select value={matrixRiskFilter} onValueChange={(value) => setMatrixRiskFilter(value as typeof matrixRiskFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FILTER_ALL}>Todas</SelectItem>
                      <SelectItem value="BAIXO">Baixo</SelectItem>
                      <SelectItem value="MEDIO">Médio</SelectItem>
                      <SelectItem value="ALTO">Alto</SelectItem>
                      <SelectItem value="CRITICO">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Atribuição</Label>
                  <Select value={matrixAssignedFilter} onValueChange={(value) => setMatrixAssignedFilter(value as typeof matrixAssignedFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FILTER_ALL}>Todas</SelectItem>
                      <SelectItem value="ATRIBUIDAS">Só atribuídas</SelectItem>
                      <SelectItem value="SEM_ATRIBUICAO">Só lacunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {pendingGrantChange && selectedPendingMatrixItem && selectedProfile ? (
                <div className="rounded-2xl border border-gym-accent/30 bg-gym-accent/5 px-4 py-4">
                  <p className="text-sm font-semibold">Preview de impacto</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pendingGrantChange.nextAllowed ? "Adicionar" : "Remover"} {permissionLabel(pendingGrantChange.permission)} em{" "}
                    <span className="font-semibold text-foreground">{selectedPendingMatrixItem.businessLabel}</span> para{" "}
                    <span className="font-semibold text-foreground">{selectedProfile.displayName}</span>.
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <SummaryStat label="Pessoas afetadas" value={String(selectedProfile.usersImpacted)} />
                    <SummaryStat label="Acessos afetados" value={String(selectedProfile.membershipsImpacted)} />
                    <SummaryStat label="Revisões pendentes" value={String(selectedProfile.impact.pendingReviews)} />
                    <SummaryStat label="Acessos amplos" value={String(selectedProfile.impact.broadAccessUsers)} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={handleConfirmGrantChange} disabled={saving}>
                      Confirmar ajuste
                    </Button>
                    <Button variant="outline" className="border-border" onClick={() => setPendingGrantChange(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {matrixItems.map((item) => (
                  <MatrixRow
                    key={`${selectedProfile?.id ?? "empty"}-${item.featureKey}`}
                    item={item}
                    onToggle={(permission, nextAllowed) =>
                      setPendingGrantChange({
                        featureKey: item.featureKey,
                        permission,
                        nextAllowed,
                      })
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </GlobalSecurityShell>
  );
}

function MatrixRow({
  item,
  onToggle,
}: {
  item: SecurityProfileMatrixItem;
  onToggle: (permission: RbacPermission, nextAllowed: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{item.businessLabel}</p>
            <Tag label={item.moduleLabel} />
            <SecurityRiskBadge level={item.riskLevel} />
            {!item.enabled ? <Tag label="Feature desativada" subtle /> : null}
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <p className="text-xs text-muted-foreground">{item.featureKey}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERMISSIONS.map((permission) => {
            const active = item.permissions.includes(permission);
            return (
              <Button
                key={`${item.featureKey}-${permission}`}
                size="sm"
                variant={active ? "default" : "outline"}
                className={active ? undefined : "border-border"}
                onClick={() => onToggle(permission, !active)}
              >
                {permissionLabel(permission)}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-display font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Tag({ label, subtle = false }: { label: string; subtle?: boolean }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs ${subtle ? "bg-secondary text-muted-foreground" : "bg-secondary/70 text-foreground"}`}>
      {label}
    </span>
  );
}
