"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { impersonateUserApi } from "@/lib/api/admin-audit";
import { getAuthSessionSnapshot, startImpersonationSession } from "@/lib/api/session";
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
import { impersonationDialogSchema, type ImpersonationDialogValues } from "@/lib/forms/admin-audit-schemas";
import { listPerfisService } from "@/lib/tenant/rbac/services";
import type {
  Academia,
  GlobalAdminAccessException,
  GlobalAdminMembership,
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminUserDetail,
  RbacPerfil,
  Tenant,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

function getScopeLabel(scopeType?: GlobalAdminUserDetail["scopeType"]) {
  switch (scopeType) {
    case "GLOBAL":
      return "Global";
    case "REDE":
      return "Rede";
    case "UNIDADE":
      return "Unidade";
    default:
      return "Não informado";
  }
}

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
  const [newMembershipProfileId, setNewMembershipProfileId] = useState("");
  const [newMembershipProfiles, setNewMembershipProfiles] = useState<RbacPerfil[]>([]);
  const [loadingNewMembershipProfiles, setLoadingNewMembershipProfiles] = useState(false);
  const [profileSelection, setProfileSelection] = useState<Record<string, string>>({});
  const [policyEnabled, setPolicyEnabled] = useState("NAO");
  const [policyScope, setPolicyScope] = useState<GlobalAdminNewUnitsPolicyScope>("ACADEMIA_ATUAL");
  const [policyRationale, setPolicyRationale] = useState("");
  const [exceptionTitle, setExceptionTitle] = useState("");
  const [exceptionMembershipId, setExceptionMembershipId] = useState("");
  const [exceptionScopeLabel, setExceptionScopeLabel] = useState("");
  const [exceptionJustification, setExceptionJustification] = useState("");
  const [exceptionExpiresAt, setExceptionExpiresAt] = useState("");
  const [impersonationDialogOpen, setImpersonationDialogOpen] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  const impersonationForm = useForm<ImpersonationDialogValues>({
    resolver: zodResolver(impersonationDialogSchema),
    defaultValues: {
      justification: "",
    },
  });

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

  const selectedNewTenant = useMemo(
    () => unidades.find((tenant) => tenant.id === newTenantId) ?? null,
    [newTenantId, unidades]
  );

  const selectedNewTenantAcademia = useMemo(
    () => academias.find((academia) => academia.id === (selectedNewTenant?.academiaId ?? selectedNewTenant?.groupId)) ?? null,
    [academias, selectedNewTenant]
  );

  const selectedNewMembershipProfile = useMemo(
    () => newMembershipProfiles.find((profile) => profile.id === newMembershipProfileId) ?? null,
    [newMembershipProfileId, newMembershipProfiles]
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

  useEffect(() => {
    let mounted = true;

    async function loadNewMembershipProfiles() {
      if (!newTenantId) {
        setNewMembershipProfiles([]);
        setNewMembershipProfileId("");
        return;
      }

      setLoadingNewMembershipProfiles(true);
      try {
        const response = await listPerfisService({
          tenantId: newTenantId,
          includeInactive: false,
          page: 0,
          size: 100,
        });
        if (!mounted) return;
        setNewMembershipProfiles(response.items.filter((profile) => profile.active));
        setNewMembershipProfileId("");
      } catch (loadProfilesError) {
        if (!mounted) return;
        toast({
          title: "Não foi possível carregar os papéis da unidade",
          description: normalizeErrorMessage(loadProfilesError),
          variant: "destructive",
        });
        setNewMembershipProfiles([]);
      } finally {
        if (mounted) setLoadingNewMembershipProfiles(false);
      }
    }

    void loadNewMembershipProfiles();
    return () => {
      mounted = false;
    };
  }, [newTenantId, toast]);

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

  function resetImpersonationDialog() {
    impersonationForm.reset({
      justification: "",
    });
    setImpersonationDialogOpen(false);
  }

  async function handleCreateMembership() {
    if (!newTenantId) {
      toast({ title: "Selecione uma unidade", variant: "destructive" });
      return;
    }
    if (!newMembershipProfileId) {
      toast({
        title: "Escolha o papel do novo acesso",
        description: "A concessão principal agora exige perfil explícito no mesmo fluxo.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const membershipSnapshot = await addUserMembership({
        userId,
        tenantId: newTenantId,
        defaultTenant: newMembershipDefault,
      });
      const createdMembership = membershipSnapshot.memberships.find((membership) => membership.tenantId === newTenantId);
      if (!createdMembership) {
        throw new Error("A unidade foi associada, mas o vínculo não voltou no resumo do backend.");
      }
      const updated = await assignUserMembershipProfile({
        userId,
        membershipId: createdMembership.id,
        perfilId: newMembershipProfileId,
      });
      updateDetailSnapshot(updated);
      setNewTenantId("");
      setNewMembershipDefault(false);
      setNewMembershipProfileId("");
      setNewMembershipProfiles([]);
      toast({
        title: "Acesso concedido",
        description: "A unidade foi vinculada com papel explícito e resumo de impacto.",
      });
    } catch (mutationError) {
      toast({
        title: "Não foi possível conceder o acesso",
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

  async function handleStartImpersonation(values: ImpersonationDialogValues) {
    if (!detail) return;

    setImpersonating(true);
    try {
      const currentSession = getAuthSessionSnapshot();
      if (!currentSession) {
        toast({
          title: "Sessão administrativa indisponível",
          description: "Não foi possível capturar a sessão original antes da impersonação.",
          variant: "destructive",
        });
        return;
      }

      const response = await impersonateUserApi({
        userId,
        justification: values.justification,
      });

      startImpersonationSession({
        originalSession: currentSession,
        impersonatedSession: response.session,
        targetUserId: detail.id,
        targetUserName: detail.fullName || detail.name,
        actorDisplayName: currentSession.displayName,
        justification: values.justification,
        auditContextId: response.auditContextId,
        returnPath: `/admin/seguranca/usuarios/${detail.id}`,
      });

      resetImpersonationDialog();
      window.location.assign(response.redirectTo || "/dashboard");
    } catch (error) {
      toast({
        title: "Não foi possível iniciar a impersonação",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setImpersonating(false);
    }
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
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setImpersonationDialogOpen(true)}
            disabled={loading || saving || !detail?.active}
          >
            Entrar como este usuário
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href="/admin/seguranca/usuarios">Voltar à lista</Link>
          </Button>
        </div>
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
      <Dialog open={impersonationDialogOpen} onOpenChange={(open) => {
        if (!open && !impersonating) {
          resetImpersonationDialog();
          return;
        }
        setImpersonationDialogOpen(open);
      }}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Entrar como este usuário</DialogTitle>
            <DialogDescription>
              A impersonação troca temporariamente a sua sessão administrativa pela visão operacional de {detail?.fullName || detail?.name || "este usuário"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              Use apenas para suporte, diagnóstico e reprodução de contexto. O início e o encerramento serão registrados no audit log.
            </div>
            <div className="space-y-2">
              <Label htmlFor="impersonation-justification">Justificativa obrigatória</Label>
              <Textarea
                id="impersonation-justification"
                {...impersonationForm.register("justification")}
                placeholder="Explique por que você precisa operar temporariamente com a visão desta pessoa."
                className="min-h-28"
              />
              {impersonationForm.formState.errors.justification?.message ? (
                <p className="text-xs text-gym-danger">{impersonationForm.formState.errors.justification.message}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={resetImpersonationDialog} disabled={impersonating}>
              Cancelar
            </Button>
            <Button type="button" onClick={impersonationForm.handleSubmit(handleStartImpersonation)} disabled={impersonating}>
              {impersonating ? "Entrando..." : "Confirmar e entrar como usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    Quem é a pessoa, em qual rede ela autentica, qual a base estrutural e onde o contexto ativo pode variar.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <SummaryBlock label="Pessoa" value={detail.fullName || detail.name} secondary={detail.email} />
                  <SummaryBlock
                    label="Rede"
                    value={detail.networkName || "Rede não informada"}
                    secondary={
                      detail.networkSubdomain || detail.networkSlug
                        ? `subdomínio: ${detail.networkSubdomain ?? detail.networkSlug}`
                        : detail.userKind
                    }
                  />
                  <SummaryBlock
                    label="Identificadores de login"
                    value={
                      detail.loginIdentifiers?.length
                        ? detail.loginIdentifiers.map((identifier) => `${identifier.label}: ${identifier.value}`).join(" · ")
                        : detail.email
                    }
                  />
                  <SummaryBlock label="Escopo efetivo" value={getScopeLabel(detail.scopeType)} />
                  <SummaryBlock label="Unidade-base" value={detail.defaultTenantName || "Sem unidade base"} />
                  <SummaryBlock
                    label="Unidade ativa da sessão"
                    value={detail.activeTenantName || detail.defaultTenantName || "Sem unidade ativa informada"}
                    secondary={
                      detail.activeTenantName && detail.activeTenantName !== detail.defaultTenantName
                        ? "Diferente da base estrutural"
                        : "Mesmo contexto da base"
                    }
                  />
                  <SummaryBlock
                    label="Academias em atuação"
                    value={detail.academias.map((item) => item.nome).join(", ") || "Sem academia vinculada"}
                  />
                  <SummaryBlock label="Próxima revisão" value={formatSecurityDateTime(detail.nextReviewAt, "Sem data definida")} />
                  <div className="space-y-2 md:col-span-2 xl:col-span-3">
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
                {detail.domainLinksSummary?.length ? (
                  <SecurityContextNote
                    title="Leituras gerenciais agregadas"
                    text={`${detail.domainLinksSummary.join(" · ")}. Essas visões são somente leitura e não mudam o escopo operacional do login.`}
                  />
                ) : null}
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
                <CardTitle className="text-base">Conceder novo acesso</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Escolha o escopo e o papel no mesmo fluxo, com um resumo simples antes da confirmação.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)_auto]">
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
                <div className="space-y-2">
                  <Label>Papel inicial</Label>
                  <Select
                    value={newMembershipProfileId || "__empty__"}
                    onValueChange={(value) => setNewMembershipProfileId(value === "__empty__" ? "" : value)}
                    disabled={!newTenantId || loadingNewMembershipProfiles}
                  >
                    <SelectTrigger aria-label="Papel inicial do acesso">
                      <SelectValue placeholder={loadingNewMembershipProfiles ? "Carregando papéis" : "Selecione o papel"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">Selecione</SelectItem>
                      {newMembershipProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCreateMembership} disabled={saving || !newTenantId || !newMembershipProfileId}>
                    Confirmar acesso
                  </Button>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-4 xl:col-span-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview do impacto</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <SummaryBlock
                      label="Escopo"
                      value={
                        selectedNewTenant
                          ? selectedNewTenantAcademia?.nome
                            ? `${selectedNewTenantAcademia.nome} · ${selectedNewTenant.nome}`
                            : selectedNewTenant.nome
                          : "Selecione a unidade"
                      }
                    />
                    <SummaryBlock
                      label="Papel"
                      value={selectedNewMembershipProfile?.displayName ?? "Escolha o papel explicitamente"}
                      secondary={selectedNewMembershipProfile?.description}
                    />
                    <SummaryBlock
                      label="Efeito imediato"
                      value={newMembershipDefault ? "Também vira base operacional" : "Acesso adicional sem trocar a base"}
                      secondary={
                        selectedNewMembershipProfile
                          ? "O acesso nasce com papel definido, sem depender de perfil implícito."
                          : "Sem papel não há concessão do novo acesso."
                      }
                    />
                  </div>
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
                      <p className="text-xs text-muted-foreground">
                        {membership.networkName || detail.networkName || "Rede não informada"}
                        {" · "}
                        Escopo: {getScopeLabel(membership.scopeType ?? detail.scopeType)}
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

                    <div className="grid gap-3 md:grid-cols-3">
                      <SummaryBlock
                        label="Unidade-base"
                        value={membership.tenantBaseName || detail.defaultTenantName || "Sem base informada"}
                      />
                      <SummaryBlock
                        label="Unidade ativa"
                        value={membership.activeTenantName || detail.activeTenantName || membership.tenantName}
                        secondary={
                          membership.activeTenantName && membership.activeTenantName !== (membership.tenantBaseName || detail.defaultTenantName)
                            ? "Contexto transitório de sessão"
                            : "Mesmo contexto da base"
                        }
                      />
                      <SummaryBlock
                        label="Origem do acesso"
                        value={membership.inheritedFrom || membership.accessOrigin}
                        secondary="Mostra de onde veio a concessão efetiva"
                      />
                    </div>

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
