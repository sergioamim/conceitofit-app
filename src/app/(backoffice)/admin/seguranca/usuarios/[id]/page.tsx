"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  GlobalSecurityShell,
  formatSecurityDateTime,
  formatSecurityDateTimeInput,
} from "@/components/security/global-security-shell";
import {
  SecurityAccessOriginBadge,
  SecurityActiveBadge,
  SecurityBroadAccessBadge,
  SecurityEligibilityBadge,
  SecurityPolicyScopeBadge,
  SecurityReviewBadge,
  SecurityRiskBadge,
} from "@/components/security/security-badges";
import {
  SecurityContextNote,
  SecurityEmptyState,
  SecuritySectionFeedback,
} from "@/components/security/security-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { listGlobalAcademias, listGlobalUnidades } from "@/lib/backoffice/admin";
import {
  addUserMembership,
  assignUserMembershipProfile,
  createUserAccessException,
  getGlobalSecurityUser,
  removeUserAccessException,
  removeUserMembership,
  removeUserMembershipProfile,
  updateUserMembership,
  updateUserNewUnitsPolicy,
} from "@/lib/backoffice/seguranca";
import type {
  Academia,
  GlobalAdminAccessException,
  GlobalAdminMembership,
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminUserDetail,
  Tenant,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

function buildPolicySummary(detail: GlobalAdminUserDetail | null) {
  if (!detail) return "Carregando governança...";
  if (!detail.policy.enabled) return "Essa pessoa não recebe acesso automático quando uma nova unidade é criada.";
  return detail.policy.scope === "REDE"
    ? "Essa pessoa recebe acesso automático em toda nova unidade da rede."
    : "Essa pessoa recebe acesso automático apenas nas novas unidades da mesma academia.";
}

function mergeExceptions(detail: GlobalAdminUserDetail | null) {
  if (!detail) return [];
  const combined = [
    ...detail.exceptions,
    ...detail.memberships.flatMap((membership) => membership.exceptions ?? []),
  ];
  const seen = new Set<string>();
  return combined.filter((item) => {
    const key = item.id || `${item.title}-${item.scopeLabel ?? ""}-${item.expiresAt ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AdminSegurancaUsuarioDetalhePage() {
  const params = useParams<{ id: string }>();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
  const { toast } = useToast();
  const [detail, setDetail] = useState<GlobalAdminUserDetail | null>(null);
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTenantId, setNewTenantId] = useState("");
  const [newMembershipDefault, setNewMembershipDefault] = useState(false);
  const [profileSelection, setProfileSelection] = useState<Record<string, string>>({});
  const [policyEnabled, setPolicyEnabled] = useState("NAO");
  const [policyScope, setPolicyScope] = useState<GlobalAdminNewUnitsPolicyScope>("ACADEMIA_ATUAL");
  const [policyRationale, setPolicyRationale] = useState("");
  const [exceptionTitle, setExceptionTitle] = useState("");
  const [exceptionMembershipId, setExceptionMembershipId] = useState("");
  const [exceptionScopeLabel, setExceptionScopeLabel] = useState("");
  const [exceptionJustification, setExceptionJustification] = useState("");
  const [exceptionExpiresAt, setExceptionExpiresAt] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        setError(null);
        const [detailResponse, academiasResponse, unidadesResponse] = await Promise.all([
          getGlobalSecurityUser(userId),
          listGlobalAcademias(),
          listGlobalUnidades(),
        ]);
        if (!mounted) return;
        setDetail(detailResponse);
        setAcademias(academiasResponse);
        setUnidades(unidadesResponse);
        setPolicyEnabled(detailResponse.policy.enabled ? "SIM" : "NAO");
        setPolicyScope(detailResponse.policy.scope);
        setPolicyRationale(detailResponse.policy.rationale ?? "");
      } catch (loadError) {
        if (!mounted) return;
        setError(normalizeErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (userId) {
      void load();
    }
    return () => {
      mounted = false;
    };
  }, [userId]);

  const membershipTenantIds = useMemo(
    () => new Set(detail?.memberships.map((membership) => membership.tenantId) ?? []),
    [detail?.memberships]
  );

  const availableTenants = useMemo(
    () => unidades.filter((tenant) => !membershipTenantIds.has(tenant.id)),
    [membershipTenantIds, unidades]
  );

  const sortedMemberships = useMemo(() => {
    return [...(detail?.memberships ?? [])].sort((left, right) => {
      if (left.defaultTenant !== right.defaultTenant) return left.defaultTenant ? -1 : 1;
      if (left.active !== right.active) return left.active ? -1 : 1;
      return left.tenantName.localeCompare(right.tenantName, "pt-BR");
    });
  }, [detail?.memberships]);

  const mergedExceptions = useMemo(() => mergeExceptions(detail), [detail]);

  const riskFlags = useMemo(() => {
    const items = [
      ...(detail?.riskFlags ?? []),
      ...(detail?.memberships.flatMap((membership) => membership.riskFlags ?? []) ?? []),
    ];
    return [...new Set(items)];
  }, [detail]);

  async function runMutation(
    action: () => Promise<GlobalAdminUserDetail>,
    successTitle: string,
    successDescription?: string
  ) {
    setSaving(true);
    try {
      const updated = await action();
      updateDetailSnapshot(updated);
      toast({ title: successTitle, description: successDescription });
      return true;
    } catch (mutationError) {
      toast({
        title: "Não foi possível concluir a operação",
        description: normalizeErrorMessage(mutationError),
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  function updateDetailSnapshot(updated: GlobalAdminUserDetail) {
    setDetail(updated);
    setPolicyEnabled(updated.policy.enabled ? "SIM" : "NAO");
    setPolicyScope(updated.policy.scope);
    setPolicyRationale(updated.policy.rationale ?? "");
  }

  function resetExceptionForm() {
    setExceptionTitle("");
    setExceptionMembershipId("");
    setExceptionScopeLabel("");
    setExceptionJustification("");
    setExceptionExpiresAt("");
  }

  async function handleCreateMembership() {
    if (!newTenantId) {
      toast({ title: "Selecione uma unidade", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const updated = await addUserMembership({
        userId,
        tenantId: newTenantId,
        defaultTenant: newMembershipDefault,
      });
      updateDetailSnapshot(updated);
      setNewTenantId("");
      setNewMembershipDefault(false);
      toast({ title: "Acesso associado", description: "A unidade foi vinculada à pessoa." });
    } catch (mutationError) {
      toast({
        title: "Não foi possível associar a unidade",
        description: normalizeErrorMessage(mutationError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePolicy() {
    await runMutation(
      () =>
        updateUserNewUnitsPolicy({
          userId,
          enabled: policyEnabled === "SIM",
          scope: policyScope,
          academiaIds: policyScope === "ACADEMIA_ATUAL" ? detail?.academias.map((academia) => academia.id) : undefined,
          rationale: policyRationale,
        }),
      "Governança atualizada",
      "A política para novas unidades foi salva."
    );
  }

  async function handleCreateException() {
    if (!exceptionTitle.trim() || !exceptionJustification.trim()) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Título e justificativa são obrigatórios para registrar uma exceção.",
        variant: "destructive",
      });
      return;
    }
    const success = await runMutation(
      () =>
        createUserAccessException({
          userId,
          membershipId: exceptionMembershipId || undefined,
          title: exceptionTitle,
          scopeLabel: exceptionScopeLabel || undefined,
          justification: exceptionJustification,
          expiresAt: exceptionExpiresAt || undefined,
        }),
      "Exceção registrada",
      "A exceção agora aparece separada do papel base."
    );
    if (success) {
      resetExceptionForm();
    }
  }

  async function handleRemoveException(exception: GlobalAdminAccessException) {
    await runMutation(
      () =>
        removeUserAccessException({
          userId,
          exceptionId: exception.id,
        }),
      "Exceção removida",
      exception.title
    );
  }

  function availableProfilesForMembership(membership: GlobalAdminMembership) {
    const assigned = new Set(membership.profiles.map((profile) => profile.perfilId));
    return (membership.availableProfiles ?? []).filter((profile) => !assigned.has(profile.id) && profile.active);
  }

  return (
    <GlobalSecurityShell
      title={detail ? detail.fullName || detail.name : "Governança de acesso"}
      description="Separe operação cotidiana, exceções e política ampla de novas unidades para reduzir ambiguidade na gestão de acesso."
      actions={
        <Button asChild variant="outline" className="border-border">
          <Link href="/admin/seguranca/usuarios">Voltar à lista</Link>
        </Button>
      }
      highlight={
        detail ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Acessos ativos" value={String(detail.memberships.filter((membership) => membership.active).length)} />
            <MetricCard title="Exceções ativas" value={String(mergedExceptions.filter((item) => item.active).length)} />
            <MetricCard title="Mudanças recentes" value={String(detail.recentChanges.length)} />
            <MetricCard title="Último acesso" value={formatSecurityDateTime(detail.lastLoginAt)} compact />
          </div>
        ) : null
      }
    >
      <SecuritySectionFeedback loading={loading} error={error} />

      {detail ? (
        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="resumo">Resumo efetivo</TabsTrigger>
            <TabsTrigger value="acessos">Escopos e acessos</TabsTrigger>
            <TabsTrigger value="excecoes">Exceções</TabsTrigger>
            <TabsTrigger value="governanca">Novas unidades</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">Leitura operacional</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Quem é a pessoa, qual a base operacional, onde há risco e o que precisa de governança separada.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <SummaryBlock label="Pessoa" value={detail.fullName || detail.name} secondary={detail.email} />
                  <SummaryBlock label="Base operacional" value={detail.defaultTenantName || "Sem unidade base"} />
                  <SummaryBlock
                    label="Academias em atuação"
                    value={detail.academias.map((item) => item.nome).join(", ") || "Sem academia vinculada"}
                  />
                  <SummaryBlock label="Próxima revisão" value={formatSecurityDateTime(detail.nextReviewAt, "Sem data definida")} />
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sinais de governança</p>
                    <div className="flex flex-wrap gap-2">
                      <SecurityActiveBadge active={detail.active} activeLabel={detail.status} inactiveLabel={detail.status} />
                      <SecurityRiskBadge level={detail.riskLevel} />
                      <SecurityReviewBadge status={detail.reviewStatus} />
                      <SecurityEligibilityBadge eligible={detail.eligibleForNewUnits} />
                      <SecurityBroadAccessBadge broadAccess={detail.broadAccess} />
                      <SecurityPolicyScopeBadge scope={detail.policy.scope} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <SecurityContextNote
                  title="Governança de novas unidades"
                  text={buildPolicySummary(detail)}
                />
                <SecurityContextNote
                  title="Exceções fora do papel base"
                  text={
                    mergedExceptions.length === 0
                      ? "Nenhuma exceção ativa registrada. O acesso efetivo depende apenas dos papéis e do escopo."
                      : `${mergedExceptions.length} exceção(ões) separadas do papel base exigem acompanhamento próprio.`
                  }
                />
                <SecurityContextNote
                  title="Risco em destaque"
                  text={
                    riskFlags.length === 0
                      ? "Sem alertas específicos vindos do backend."
                      : riskFlags.join(" · ")
                  }
                />
              </div>
            </div>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Mudanças mais recentes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Últimas alterações que ajudam a explicar o acesso efetivo atual.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.recentChanges.length === 0 ? (
                  <SecurityEmptyState text="Nenhuma mudança recente foi informada pelo backend." />
                ) : (
                  detail.recentChanges.map((change) => (
                    <div key={change.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{change.title}</p>
                        <SecurityRiskBadge level={change.severity} />
                      </div>
                      {change.description ? <p className="mt-1 text-sm text-muted-foreground">{change.description}</p> : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {change.actorName ? `${change.actorName} · ` : ""}
                        {formatSecurityDateTime(change.happenedAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acessos" className="space-y-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Adicionar escopo operacional</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Vincule a pessoa a uma nova unidade e, se necessário, já marque essa unidade como base operacional.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select value={newTenantId || "__empty__"} onValueChange={(value) => setNewTenantId(value === "__empty__" ? "" : value)}>
                    <SelectTrigger aria-label="Unidade para associar">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">Selecione</SelectItem>
                      {availableTenants.map((tenant) => {
                        const academia = academias.find((item) => item.id === (tenant.academiaId ?? tenant.groupId));
                        return (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {academia?.nome ? `${academia.nome} · ${tenant.nome}` : tenant.nome}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Virar base operacional</Label>
                  <Select value={newMembershipDefault ? "SIM" : "NAO"} onValueChange={(value) => setNewMembershipDefault(value === "SIM")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NAO">Não</SelectItem>
                      <SelectItem value="SIM">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCreateMembership} disabled={saving || !newTenantId}>
                    Associar unidade
                  </Button>
                </div>
              </CardContent>
            </Card>

            {sortedMemberships.length === 0 ? (
              <SecurityEmptyState text="Nenhum escopo operacional foi configurado para essa pessoa." />
            ) : (
              sortedMemberships.map((membership) => (
                <Card key={membership.id}>
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{membership.tenantName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {membership.academiaName || "Sem academia"} · atualizado em {formatSecurityDateTime(membership.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SecurityActiveBadge active={membership.active} />
                      <SecurityAccessOriginBadge origin={membership.accessOrigin} />
                      <SecurityEligibilityBadge eligible={membership.eligibleForNewUnits ?? detail.policy.enabled} />
                      <SecurityRiskBadge level={membership.riskLevel} />
                      <SecurityReviewBadge status={membership.reviewStatus} />
                      <SecurityBroadAccessBadge broadAccess={membership.broadAccess} />
                      {membership.defaultTenant ? <span className="rounded-full bg-secondary px-2 py-1 text-xs">Base operacional</span> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {membership.inheritedFrom ? (
                      <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                        Origem detalhada: {membership.inheritedFrom}
                      </div>
                    ) : null}

                    {membership.exceptions && membership.exceptions.length > 0 ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {membership.exceptions.length} exceção(ões) aplicadas especificamente a este escopo.
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {!membership.defaultTenant && membership.active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          disabled={saving}
                          onClick={() =>
                            runMutation(
                              () =>
                                updateUserMembership({
                                  userId,
                                  membershipId: membership.id,
                                  defaultTenant: true,
                                }),
                              "Base operacional atualizada",
                              membership.tenantName
                            )
                          }
                        >
                          Tornar base operacional
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border"
                        disabled={saving}
                        onClick={() =>
                          runMutation(
                            () =>
                              updateUserMembership({
                                userId,
                                membershipId: membership.id,
                                active: !membership.active,
                              }),
                            membership.active ? "Acesso desativado" : "Acesso reativado",
                            membership.tenantName
                          )
                        }
                      >
                        {membership.active ? "Desativar acesso" : "Reativar acesso"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gym-danger/30 text-gym-danger hover:bg-gym-danger/10"
                        disabled={saving}
                        onClick={() =>
                          runMutation(
                            () =>
                              removeUserMembership({
                                userId,
                                membershipId: membership.id,
                              }),
                            "Acesso removido",
                            membership.tenantName
                          )
                        }
                      >
                        Remover escopo
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Papéis ativos nesse escopo</p>
                      <div className="flex flex-wrap gap-2">
                        {membership.profiles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Nenhum papel atribuído.</span>
                        ) : (
                          membership.profiles.map((profile) => (
                            <button
                              key={`${membership.id}-${profile.perfilId}`}
                              type="button"
                              className="rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary/60"
                              disabled={saving}
                              onClick={() =>
                                runMutation(
                                  () =>
                                    removeUserMembershipProfile({
                                      userId,
                                      membershipId: membership.id,
                                      perfilId: profile.perfilId,
                                    }),
                                  "Papel removido",
                                  profile.displayName
                                )
                              }
                            >
                              {profile.displayName}
                              {profile.inherited ? " · herdado" : ""}
                              {" · remover"}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="space-y-2">
                        <Label>Adicionar papel nesse escopo</Label>
                        <Select
                          value={profileSelection[membership.id] ?? "__empty__"}
                          onValueChange={(value) =>
                            setProfileSelection((current) => ({
                              ...current,
                              [membership.id]: value === "__empty__" ? "" : value,
                            }))
                          }
                        >
                          <SelectTrigger aria-label={`Perfil para ${membership.tenantName}`}>
                            <SelectValue placeholder="Selecione um papel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__empty__">Selecione</SelectItem>
                            {availableProfilesForMembership(membership).map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          disabled={saving || !profileSelection[membership.id]}
                          onClick={() =>
                            runMutation(
                              () =>
                                assignUserMembershipProfile({
                                  userId,
                                  membershipId: membership.id,
                                  perfilId: profileSelection[membership.id],
                                }),
                              "Papel atribuído",
                              membership.tenantName
                            ).then(() =>
                              setProfileSelection((current) => ({
                                ...current,
                                [membership.id]: "",
                              }))
                            )
                          }
                        >
                          Atribuir papel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="excecoes" className="space-y-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Registrar exceção controlada</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Use exceções apenas quando o papel base não explicar o acesso. Sempre registre justificativa e, quando
                  possível, prazo final.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="security-exception-title">Título</Label>
                  <Input
                    id="security-exception-title"
                    value={exceptionTitle}
                    onChange={(event) => setExceptionTitle(event.target.value)}
                    placeholder="Ex.: suporte temporário em fechamento"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Escopo afetado</Label>
                  <Select value={exceptionMembershipId || "__global__"} onValueChange={(value) => setExceptionMembershipId(value === "__global__" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__global__">Exceção geral da pessoa</SelectItem>
                      {sortedMemberships.map((membership) => (
                        <SelectItem key={membership.id} value={membership.id}>
                          {membership.tenantName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security-exception-scope-label">Rótulo visível</Label>
                  <Input
                    id="security-exception-scope-label"
                    value={exceptionScopeLabel}
                    onChange={(event) => setExceptionScopeLabel(event.target.value)}
                    placeholder="Ex.: cobertura de auditoria externa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security-exception-expiration">Expira em</Label>
                  <Input
                    id="security-exception-expiration"
                    type="datetime-local"
                    value={formatSecurityDateTimeInput(exceptionExpiresAt)}
                    onChange={(event) => setExceptionExpiresAt(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="security-exception-justification">Justificativa</Label>
                  <Textarea
                    id="security-exception-justification"
                    value={exceptionJustification}
                    onChange={(event) => setExceptionJustification(event.target.value)}
                    placeholder="Descreva por que o papel base não cobre esse caso e qual o prazo esperado."
                  />
                </div>
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <Button onClick={handleCreateException} disabled={saving}>
                    Registrar exceção
                  </Button>
                  <Button variant="outline" className="border-border" onClick={resetExceptionForm} disabled={saving}>
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {mergedExceptions.length === 0 ? (
              <SecurityEmptyState text="Nenhuma exceção foi registrada para essa pessoa." />
            ) : (
              <div className="space-y-3">
                {mergedExceptions.map((exception) => (
                  <Card key={exception.id || `${exception.title}-${exception.scopeLabel ?? ""}`}>
                    <CardContent className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{exception.title}</p>
                          <SecurityActiveBadge active={exception.active} activeLabel="Ativa" inactiveLabel="Encerrada" />
                        </div>
                        {exception.scopeLabel ? <p className="text-sm text-muted-foreground">{exception.scopeLabel}</p> : null}
                        <p className="text-sm text-muted-foreground">{exception.justification}</p>
                        <p className="text-xs text-muted-foreground">
                          {exception.createdBy ? `${exception.createdBy} · ` : ""}
                          Criada em {formatSecurityDateTime(exception.createdAt)}
                          {" · "}
                          Expira em {formatSecurityDateTime(exception.expiresAt, "sem prazo")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gym-danger/30 text-gym-danger hover:bg-gym-danger/10"
                          disabled={saving}
                          onClick={() => void handleRemoveException(exception)}
                        >
                          Remover exceção
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="governanca" className="space-y-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Política de novas unidades</CardTitle>
                <p className="text-sm text-muted-foreground">{buildPolicySummary(detail)}</p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Propagação automática</Label>
                  <Select value={policyEnabled} onValueChange={setPolicyEnabled}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NAO">Não propagar</SelectItem>
                      <SelectItem value="SIM">Propagar automaticamente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Escopo</Label>
                  <Select value={policyScope} onValueChange={(value) => setPolicyScope(value as GlobalAdminNewUnitsPolicyScope)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACADEMIA_ATUAL">Mesma academia</SelectItem>
                      <SelectItem value="REDE">Rede inteira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="security-policy-rationale">Justificativa operacional</Label>
                  <Textarea
                    id="security-policy-rationale"
                    value={policyRationale}
                    onChange={(event) => setPolicyRationale(event.target.value)}
                    placeholder="Ex.: diretoria regional deve receber acesso em toda unidade nova."
                  />
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-3 text-sm text-muted-foreground md:col-span-2">
                  {detail.policy.inherited
                    ? "A política atual veio do backend como herdada."
                    : "A política está sendo editada diretamente no backoffice global."}
                  {detail.policy.sourceLabel ? ` Origem informada: ${detail.policy.sourceLabel}.` : ""}
                  {" "}
                  Última atualização: {formatSecurityDateTime(detail.policy.updatedAt)}
                </div>
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <Button onClick={handleSavePolicy} disabled={saving}>
                    Salvar política
                  </Button>
                  <Button asChild variant="outline" className="border-border">
                    <Link href={`/admin/unidades${detail.academias[0]?.id ? `?academiaId=${detail.academias[0].id}` : ""}`}>
                      Abrir unidades
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Histórico e trilha de apoio</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Use essa trilha para preparar revisões e justificar mudanças fora do padrão.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.recentChanges.length === 0 ? (
                  <SecurityEmptyState text="Nenhuma trilha recente foi informada pelo backend." />
                ) : (
                  detail.recentChanges.map((change) => (
                    <div key={change.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{change.title}</p>
                        <SecurityRiskBadge level={change.severity} />
                      </div>
                      {change.description ? <p className="mt-1 text-sm text-muted-foreground">{change.description}</p> : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {change.actorName ? `${change.actorName} · ` : ""}
                        {formatSecurityDateTime(change.happenedAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </GlobalSecurityShell>
  );
}

function MetricCard({
  title,
  value,
  compact = false,
}: {
  title: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={compact ? "text-sm font-semibold" : "text-3xl font-display font-bold"}>{value}</p>
      </CardContent>
    </Card>
  );
}

function SummaryBlock({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
      {secondary ? <p className="text-xs text-muted-foreground">{secondary}</p> : null}
    </div>
  );
}
