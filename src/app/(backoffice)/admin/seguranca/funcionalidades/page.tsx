"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GlobalSecurityShell } from "@/components/security/global-security-shell";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import { SecurityRiskBadge } from "@/components/security/security-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getFeatureFlagsMatrixApi, toggleFeatureForAcademiaApi } from "@/lib/api/admin-config";
import { listBackofficeAcademiasApi, listBackofficeUnidadesApi } from "@/lib/api/backoffice";
import { ApiRequestError } from "@/lib/api/http";
import { buildSecurityFeatureCatalog } from "@/lib/backoffice/security-governance";
import { useAuthAccess, useRbacTenant } from "@/lib/tenant/rbac/hooks";
import {
  listFeaturesService,
  listGrantsService,
  listPerfisService,
  updateFeatureService,
} from "@/lib/tenant/rbac/services";
import type {
  Academia,
  FeatureFlagMatrix,
  FeatureFlagMatrixCell,
  SecurityFeatureCatalogItem,
  RbacFeature,
  RbacGrant,
  RbacPermission,
  RbacPerfil,
  SecurityBusinessScope,
  Tenant,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

function permissionLabel(permission: RbacPermission) {
  if (permission === "MANAGE") return "Administrar";
  if (permission === "EDIT") return "Editar";
  return "Visualizar";
}

function isMissingFeatureFlagsMatrixEndpoint(error: unknown) {
  return error instanceof ApiRequestError && [404, 405, 501].includes(error.status);
}

function buildFeatureFlagsMatrixFallback(input: {
  catalog: SecurityFeatureCatalogItem[];
  academias: Academia[];
  unidades: Tenant[];
}): FeatureFlagMatrix {
  const academias = input.academias.map((academia) => {
    const unidadesDaAcademia = input.unidades.filter((tenant) => tenant.academiaId === academia.id || tenant.groupId === academia.id);
    return {
      academiaId: academia.id,
      academiaNome: academia.nome,
      totalUnits: unidadesDaAcademia.length,
      activeUnits: unidadesDaAcademia.filter((tenant) => tenant.ativo !== false).length,
    };
  });

  return {
    academias,
    features: input.catalog.map((item) => ({
      featureKey: item.featureKey,
      featureLabel: item.businessLabel,
      moduleLabel: item.moduleLabel,
      description: item.description,
      globalEnabled: item.enabled,
      globalSource: "GLOBAL",
      academias: academias.map((academia) => ({
        academiaId: academia.academiaId,
        academiaNome: academia.academiaNome,
        enabled: item.enabled,
        effectiveEnabled: item.enabled,
        inheritedFromGlobal: true,
        propagationStatus: academia.totalUnits > 0 ? "TOTAL" : "PENDENTE",
        propagatedUnits: academia.totalUnits,
        totalUnits: academia.totalUnits,
      })),
    })),
  };
}

function propagationLabel(cell: FeatureFlagMatrixCell) {
  if (cell.totalUnits === 0) {
    return "Sem unidades";
  }
  if (cell.propagationStatus === "TOTAL") {
    return `${cell.propagatedUnits}/${cell.totalUnits} unidades`;
  }
  if (cell.propagationStatus === "PARCIAL") {
    return `Parcial ${cell.propagatedUnits}/${cell.totalUnits}`;
  }
  return `Pendente ${cell.propagatedUnits}/${cell.totalUnits}`;
}

export default function AdminSegurancaFuncionalidadesPage() {
  const { toast } = useToast();
  const access = useAuthAccess();
  const tenant = useRbacTenant();
  const [perfis, setPerfis] = useState<RbacPerfil[]>([]);
  const [features, setFeatures] = useState<RbacFeature[]>([]);
  const [grants, setGrants] = useState<RbacGrant[]>([]);
  const [selectedFeatureKey, setSelectedFeatureKey] = useState("");
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("TODOS");
  const [actionFilter, setActionFilter] = useState<"TODOS" | RbacPermission>("TODOS");
  const [riskFilter, setRiskFilter] = useState<"TODOS" | "BAIXO" | "MEDIO" | "ALTO" | "CRITICO">("TODOS");
  const [scopeFilter, setScopeFilter] = useState<"TODOS" | SecurityBusinessScope>("TODOS");
  const [enabledValue, setEnabledValue] = useState("ATIVA");
  const [rolloutValue, setRolloutValue] = useState("100");
  const [featureFlagsMatrix, setFeatureFlagsMatrix] = useState<FeatureFlagMatrix | null>(null);
  const [featureFlagsMatrixFallback, setFeatureFlagsMatrixFallback] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [matrixSavingKey, setMatrixSavingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tenant.tenantId) return;
    setLoading(true);
    try {
      setError(null);
      const [perfisResponse, featuresResponse, grantsResponse, academiasResponse, unidadesResponse] = await Promise.all([
        listPerfisService({
          tenantId: tenant.tenantId,
          includeInactive: true,
          page: 0,
          size: 100,
        }),
        listFeaturesService({ tenantId: tenant.tenantId }),
        listGrantsService({ tenantId: tenant.tenantId }),
        listBackofficeAcademiasApi(),
        listBackofficeUnidadesApi(),
      ]);
      const fallbackMatrix = buildFeatureFlagsMatrixFallback({
        catalog: buildSecurityFeatureCatalog(featuresResponse, grantsResponse),
        academias: academiasResponse,
        unidades: unidadesResponse,
      });
      setPerfis(perfisResponse.items);
      setFeatures(featuresResponse);
      setGrants(grantsResponse);
      try {
        const matrix = await getFeatureFlagsMatrixApi();
        setFeatureFlagsMatrix(matrix);
        setFeatureFlagsMatrixFallback(false);
        setMatrixError(null);
      } catch (matrixLoadError) {
        setFeatureFlagsMatrix(fallbackMatrix);
        setFeatureFlagsMatrixFallback(true);
        setMatrixError(
          isMissingFeatureFlagsMatrixEndpoint(matrixLoadError)
            ? null
            : normalizeErrorMessage(matrixLoadError)
        );
      }
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
  const filteredCatalog = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return catalog.filter((item) => {
      if (moduleFilter !== "TODOS" && item.moduleLabel !== moduleFilter) return false;
      if (actionFilter !== "TODOS" && !item.permissionLevels.includes(actionFilter)) return false;
      if (riskFilter !== "TODOS" && item.riskLevel !== riskFilter) return false;
      if (scopeFilter !== "TODOS" && !item.scopes.includes(scopeFilter)) return false;
      if (!normalizedQuery) return true;
      return [item.businessLabel, item.featureKey, item.description, item.moduleLabel]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [actionFilter, catalog, moduleFilter, query, riskFilter, scopeFilter]);
  const visibleMatrixRows = useMemo(() => {
    if (!featureFlagsMatrix) return [];
    const visibleKeys = new Set(filteredCatalog.map((item) => item.featureKey));
    return featureFlagsMatrix.features.filter((item) => visibleKeys.has(item.featureKey));
  }, [featureFlagsMatrix, filteredCatalog]);

  const selectedItem = useMemo(
    () => filteredCatalog.find((item) => item.featureKey === selectedFeatureKey) ?? filteredCatalog[0] ?? null,
    [filteredCatalog, selectedFeatureKey]
  );

  useEffect(() => {
    if (!selectedItem) {
      setSelectedFeatureKey("");
      setEnabledValue("ATIVA");
      setRolloutValue("100");
      return;
    }
    setSelectedFeatureKey(selectedItem.featureKey);
    setEnabledValue(selectedItem.enabled ? "ATIVA" : "INATIVA");
    setRolloutValue(String(selectedItem.rollout));
  }, [selectedItem]);

  async function handleSaveFeature() {
    if (!tenant.tenantId || !selectedItem) return;
    const rollout = Number(rolloutValue);
    if (!Number.isFinite(rollout) || rollout < 0 || rollout > 100) {
      toast({
        title: "Rollout inválido",
        description: "Informe um percentual entre 0 e 100.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updateFeatureService({
        tenantId: tenant.tenantId,
        featureKey: selectedItem.featureKey,
        enabled: enabledValue === "ATIVA",
        rollout,
      });
      toast({ title: "Catálogo atualizado", description: selectedItem.businessLabel });
      await reload();
    } catch (saveError) {
      toast({
        title: "Não foi possível salvar a feature",
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

  const activeFeatures = catalog.filter((item) => item.enabled).length;
  const criticalFeatures = catalog.filter((item) => item.riskLevel === "ALTO" || item.riskLevel === "CRITICO").length;
  const averageRollout = catalog.length === 0 ? 0 : Math.round(catalog.reduce((total, item) => total + item.rollout, 0) / catalog.length);
  const profilesWithAssignments = new Set(
    catalog.flatMap((item) => item.assignedProfiles)
  ).size;
  const matrixAcademiasCount = featureFlagsMatrix?.academias.length ?? 0;
  const matrixGlobalDisabled = featureFlagsMatrix?.features.filter((item) => !item.globalEnabled).length ?? 0;
  const matrixPropagationTotal = featureFlagsMatrix?.features.flatMap((item) => item.academias)
    .filter((cell) => cell.totalUnits > 0 && cell.propagationStatus === "TOTAL").length ?? 0;
  const matrixPropagationUniverse = featureFlagsMatrix?.features.flatMap((item) => item.academias)
    .filter((cell) => cell.totalUnits > 0).length ?? 0;

  async function handleToggleFeatureFlagMatrix(input: {
    featureKey: string;
    enabled: boolean;
    academiaId?: string;
  }) {
    const savingKey = `${input.featureKey}:${input.academiaId ?? "GLOBAL"}`;
    setMatrixSavingKey(savingKey);
    try {
      const nextMatrix = await toggleFeatureForAcademiaApi(input);
      setFeatureFlagsMatrix(nextMatrix);
      setFeatureFlagsMatrixFallback(false);
      setMatrixError(null);
      toast({
        title: input.academiaId ? "Override por academia atualizado" : "Override global atualizado",
        description: input.academiaId
          ? "A feature foi recalculada para a academia e suas unidades."
          : "A feature foi propagada para toda a malha de academias.",
      });
    } catch (toggleError) {
      toast({
        title: "Não foi possível atualizar a matriz",
        description: normalizeErrorMessage(toggleError),
        variant: "destructive",
      });
    } finally {
      setMatrixSavingKey(null);
    }
  }

  return (
    <GlobalSecurityShell
      title="Funcionalidades"
      description="Catálogo pesquisável de capacidades, criticidade, escopo suportado e rollout técnico usado pelos perfis padronizados."
      actions={
        <>
          <Button asChild variant="outline" className="border-border">
            <Link href="/admin/seguranca/perfis">Abrir perfis</Link>
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href="/seguranca/rbac">Abrir base técnica</Link>
          </Button>
        </>
      }
    >
      {!access.loading && !access.canAccessElevatedModules ? (
        <Card>
          <CardContent className="px-5 py-5 text-sm text-gym-danger">
            Apenas perfis administrativos podem editar o catálogo governado de funcionalidades.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Capacidades listadas" value={String(catalog.length)} />
            <MetricCard title="Ativas no tenant" value={String(activeFeatures)} />
            <MetricCard title="Críticas" value={String(criticalFeatures)} />
            <MetricCard title="Rollout médio" value={`${averageRollout}%`} />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Academias governadas" value={String(matrixAcademiasCount)} />
            <MetricCard title="Overrides globais off" value={String(matrixGlobalDisabled)} />
            <MetricCard
              title="Propagação integral"
              value={matrixPropagationUniverse === 0 ? "0" : `${matrixPropagationTotal}/${matrixPropagationUniverse}`}
            />
            <MetricCard
              title="Modo da matriz"
              value={featureFlagsMatrixFallback ? "Compat." : "Canônico"}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filtros do catálogo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="feature-query">Buscar</Label>
                <Input id="feature-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Financeiro" />
              </div>
              <div className="space-y-2">
                <Label>Módulo</Label>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {modules.map((moduleLabel) => (
                      <SelectItem key={moduleLabel} value={moduleLabel}>
                        {moduleLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ação</Label>
                <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as typeof actionFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas</SelectItem>
                    <SelectItem value="VIEW">Visualizar</SelectItem>
                    <SelectItem value="EDIT">Editar</SelectItem>
                    <SelectItem value="MANAGE">Administrar</SelectItem>
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
                    <SelectItem value="TODOS">Todas</SelectItem>
                    <SelectItem value="BAIXO">Baixo</SelectItem>
                    <SelectItem value="MEDIO">Médio</SelectItem>
                    <SelectItem value="ALTO">Alto</SelectItem>
                    <SelectItem value="CRITICO">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Escopo</Label>
                <Select value={scopeFilter} onValueChange={(value) => setScopeFilter(value as typeof scopeFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="UNIDADE">Unidade</SelectItem>
                    <SelectItem value="ACADEMIA">Academia</SelectItem>
                    <SelectItem value="REDE">Rede</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <SecuritySectionFeedback loading={loading} error={error} />

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Catálogo canonizado</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Perfis usando o catálogo hoje: {profilesWithAssignments} perfil(is).
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredCatalog.map((item) => (
                  <button
                    key={item.featureKey}
                    type="button"
                    onClick={() => setSelectedFeatureKey(item.featureKey)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                      selectedItem?.featureKey === item.featureKey ? "border-gym-accent/40 bg-gym-accent/5" : "border-border bg-background"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{item.businessLabel}</p>
                      <Tag label={item.moduleLabel} />
                      <SecurityRiskBadge level={item.riskLevel} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{item.featureKey}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">{selectedItem?.businessLabel ?? "Detalhe da funcionalidade"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tradução de negócio da feature técnica com guardrails de rollout e auditoria.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedItem ? (
                    <>
                      <div className="grid gap-3 md:grid-cols-4">
                        <SummaryStat label="Módulo" value={selectedItem.moduleLabel} />
                        <SummaryStat label="Perfis ligados" value={String(selectedItem.assignedProfiles.length)} />
                        <SummaryStat label="Rollout" value={`${selectedItem.rollout}%`} />
                        <SummaryStat label="Estado" value={selectedItem.enabled ? "Ativa" : "Inativa"} />
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-4 text-sm text-muted-foreground">
                        <p className="font-semibold text-foreground">Definição</p>
                        <p className="mt-1">{selectedItem.description}</p>
                        <p className="mt-3 text-xs">{selectedItem.featureKey}</p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Status da feature</Label>
                          <Select value={enabledValue} onValueChange={setEnabledValue}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ATIVA">Ativa</SelectItem>
                              <SelectItem value="INATIVA">Inativa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="feature-rollout">Rollout (%)</Label>
                          <Input
                            id="feature-rollout"
                            inputMode="numeric"
                            value={rolloutValue}
                            onChange={(event) => setRolloutValue(event.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleSaveFeature} disabled={saving}>
                          Salvar governança
                        </Button>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>

              {selectedItem ? (
                <Card>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base">Leitura operacional</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      O catálogo mostra criticidade, escopo, ações possíveis e quais perfis dependem da capacidade.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.scopes.map((scope) => (
                        <Tag key={`${selectedItem.featureKey}-${scope}`} label={scope} />
                      ))}
                      {selectedItem.actionLabels.map((action) => (
                        <Tag key={`${selectedItem.featureKey}-${action}`} label={action} subtle />
                      ))}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <SummaryStat label="Exige auditoria" value={selectedItem.requiresAudit ? "Sim" : "Não"} />
                      <SummaryStat label="Exige aprovação" value={selectedItem.requiresApproval ? "Sim" : "Não"} />
                      <SummaryStat label="Exige MFA" value={selectedItem.requiresMfa ? "Sim" : "Não"} />
                    </div>

                    <div className="rounded-2xl border border-border bg-background px-4 py-4">
                      <p className="text-sm font-semibold">Perfis atribuídos</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedItem.assignedProfiles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Nenhum perfil consome esta capacidade no momento.</span>
                        ) : (
                          selectedItem.assignedProfiles.map((profileName) => {
                            const profile = perfis.find((item) => item.roleName === profileName);
                            return (
                              <Tag key={`${selectedItem.featureKey}-${profileName}`} label={profile?.displayName ?? profileName} />
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background px-4 py-4">
                      <p className="text-sm font-semibold">Níveis técnicos mapeados</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedItem.permissionLevels.map((permission) => (
                          <Tag key={`${selectedItem.featureKey}-${permission}`} label={permissionLabel(permission)} />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Feature flags por academia</CardTitle>
              <p className="text-sm text-muted-foreground">
                Override global por feature com ajuste fino por academia e leitura de propagação para unidades.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureFlagsMatrixFallback ? (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  A matriz está em modo de compatibilidade. O frontend derivou a malha a partir do catálogo e da estrutura de academias/unidades porque o endpoint canônico ainda não respondeu.
                </div>
              ) : null}

              {matrixError ? (
                <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
                  {matrixError}
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="min-w-[960px] w-full border-collapse text-sm">
                  <thead className="bg-secondary/40">
                    <tr>
                      <th scope="col" className="min-w-[280px] px-4 py-3 text-left font-semibold">Feature</th>
                      <th scope="col" className="min-w-[180px] px-4 py-3 text-left font-semibold">Override global</th>
                      {(featureFlagsMatrix?.academias ?? []).map((academia) => (
                        <th key={academia.academiaId} className="min-w-[220px] px-4 py-3 text-left font-semibold">
                          <div className="space-y-1">
                            <p>{academia.academiaNome}</p>
                            <p className="text-xs font-normal text-muted-foreground">
                              {academia.activeUnits}/{academia.totalUnits} unidades ativas
                            </p>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMatrixRows.map((feature) => (
                      <tr key={feature.featureKey} className="border-t border-border align-top">
                        <td className="space-y-2 px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{feature.featureLabel}</p>
                            <Tag label={feature.moduleLabel} />
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.featureKey}</p>
                          {feature.description ? (
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          ) : null}
                        </td>
                        <td className="space-y-2 px-4 py-4">
                          <Button
                            type="button"
                            variant={feature.globalEnabled ? "default" : "outline"}
                            size="sm"
                            disabled={matrixSavingKey === `${feature.featureKey}:GLOBAL`}
                            aria-label={`Override global ${feature.featureLabel}`}
                            onClick={() =>
                              void handleToggleFeatureFlagMatrix({
                                featureKey: feature.featureKey,
                                enabled: !feature.globalEnabled,
                              })
                            }
                          >
                            {matrixSavingKey === `${feature.featureKey}:GLOBAL`
                              ? "Salvando..."
                              : feature.globalEnabled
                                ? "Ligada"
                                : "Desligada"}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Origem: {feature.globalSource === "ACADEMIA" ? "Academia" : "Global"}
                          </p>
                        </td>
                        {feature.academias.map((cell) => (
                          <td key={`${feature.featureKey}:${cell.academiaId}`} className="space-y-2 px-4 py-4">
                            <Button
                              type="button"
                              variant={cell.enabled ? "default" : "outline"}
                              size="sm"
                              disabled={matrixSavingKey === `${feature.featureKey}:${cell.academiaId}`}
                              aria-label={`${cell.academiaNome ?? cell.academiaId} ${feature.featureLabel}`}
                              onClick={() =>
                                void handleToggleFeatureFlagMatrix({
                                  featureKey: feature.featureKey,
                                  academiaId: cell.academiaId,
                                  enabled: !cell.enabled,
                                })
                              }
                            >
                              {matrixSavingKey === `${feature.featureKey}:${cell.academiaId}`
                                ? "Salvando..."
                                : cell.enabled
                                  ? "Ligada"
                                  : "Desligada"}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              {cell.inheritedFromGlobal ? "Herdada do global" : "Override local"}
                            </p>
                            <p className="text-xs text-muted-foreground">{propagationLabel(cell)}</p>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {visibleMatrixRows.length === 0 ? (
                      <tr className="border-t border-border">
                        <td colSpan={(featureFlagsMatrix?.academias.length ?? 0) + 2} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Nenhuma feature corresponde aos filtros atuais.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </GlobalSecurityShell>
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
