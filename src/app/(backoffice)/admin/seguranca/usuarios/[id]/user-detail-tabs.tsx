"use client";

import Link from "next/link";
import {
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
} from "@/components/security/security-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  assignUserMembershipProfile,
  removeUserMembership,
  removeUserMembershipProfile,
  updateUserMembership,
} from "@/lib/backoffice/seguranca";
import type {
  GlobalAdminAccessException,
  GlobalAdminMembership,
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminUserDetail,
  RbacPerfil,
  Tenant,
  Academia,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

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

export function MetricCard({
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

// ---------------------------------------------------------------------------
// Tab: Resumo
// ---------------------------------------------------------------------------

export function ResumoTab({
  detail,
  mergedExceptions,
  riskFlags,
}: {
  detail: GlobalAdminUserDetail;
  mergedExceptions: GlobalAdminAccessException[];
  riskFlags: string[];
}) {
  return (
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
  );
}

// ---------------------------------------------------------------------------
// Tab: Acessos
// ---------------------------------------------------------------------------

export function AcessosTab({
  detail,
  saving,
  newTenantId,
  setNewTenantId,
  newMembershipDefault,
  setNewMembershipDefault,
  newMembershipProfileId,
  setNewMembershipProfileId,
  newMembershipProfiles,
  loadingNewMembershipProfiles,
  availableTenants,
  academias,
  selectedNewTenant,
  selectedNewTenantAcademia,
  selectedNewMembershipProfile,
  sortedMemberships,
  profileSelection,
  setProfileSelection,
  handleCreateMembership,
  runMutation,
  availableProfilesForMembership,
}: {
  detail: GlobalAdminUserDetail;
  saving: boolean;
  newTenantId: string;
  setNewTenantId: (value: string) => void;
  newMembershipDefault: boolean;
  setNewMembershipDefault: (value: boolean) => void;
  newMembershipProfileId: string;
  setNewMembershipProfileId: (value: string) => void;
  newMembershipProfiles: RbacPerfil[];
  loadingNewMembershipProfiles: boolean;
  availableTenants: Tenant[];
  academias: Academia[];
  selectedNewTenant: Tenant | null;
  selectedNewTenantAcademia: Academia | null;
  selectedNewMembershipProfile: RbacPerfil | null;
  sortedMemberships: GlobalAdminMembership[];
  profileSelection: Record<string, string>;
  setProfileSelection: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleCreateMembership: () => Promise<void>;
  runMutation: (
    action: () => Promise<GlobalAdminUserDetail>,
    successTitle: string,
    successDescription?: string
  ) => Promise<boolean>;
  availableProfilesForMembership: (membership: GlobalAdminMembership) => RbacPerfil[];
}) {
  const userId = detail.id;

  return (
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
          <MembershipCard
            key={membership.id}
            detail={detail}
            membership={membership}
            userId={userId}
            saving={saving}
            profileSelection={profileSelection}
            setProfileSelection={setProfileSelection}
            runMutation={runMutation}
            availableProfilesForMembership={availableProfilesForMembership}
          />
        ))
      )}
    </TabsContent>
  );
}

function MembershipCard({
  detail,
  membership,
  userId,
  saving,
  profileSelection,
  setProfileSelection,
  runMutation,
  availableProfilesForMembership,
}: {
  detail: GlobalAdminUserDetail;
  membership: GlobalAdminMembership;
  userId: string;
  saving: boolean;
  profileSelection: Record<string, string>;
  setProfileSelection: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  runMutation: (
    action: () => Promise<GlobalAdminUserDetail>,
    successTitle: string,
    successDescription?: string
  ) => Promise<boolean>;
  availableProfilesForMembership: (membership: GlobalAdminMembership) => RbacPerfil[];
}) {
  return (
    <Card>
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
  );
}

// ---------------------------------------------------------------------------
// Tab: Exceções
// ---------------------------------------------------------------------------

export function ExcecoesTab({
  detail,
  saving,
  sortedMemberships,
  mergedExceptions,
  exceptionTitle,
  setExceptionTitle,
  exceptionMembershipId,
  setExceptionMembershipId,
  exceptionScopeLabel,
  setExceptionScopeLabel,
  exceptionJustification,
  setExceptionJustification,
  exceptionExpiresAt,
  setExceptionExpiresAt,
  handleCreateException,
  handleRemoveException,
  resetExceptionForm,
}: {
  detail: GlobalAdminUserDetail;
  saving: boolean;
  sortedMemberships: GlobalAdminMembership[];
  mergedExceptions: GlobalAdminAccessException[];
  exceptionTitle: string;
  setExceptionTitle: (value: string) => void;
  exceptionMembershipId: string;
  setExceptionMembershipId: (value: string) => void;
  exceptionScopeLabel: string;
  setExceptionScopeLabel: (value: string) => void;
  exceptionJustification: string;
  setExceptionJustification: (value: string) => void;
  exceptionExpiresAt: string;
  setExceptionExpiresAt: (value: string) => void;
  handleCreateException: () => Promise<void>;
  handleRemoveException: (exception: GlobalAdminAccessException) => Promise<void>;
  resetExceptionForm: () => void;
}) {
  return (
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
  );
}

// ---------------------------------------------------------------------------
// Tab: Governança
// ---------------------------------------------------------------------------

export function GovernancaTab({
  detail,
  saving,
  policyEnabled,
  setPolicyEnabled,
  policyScope,
  setPolicyScope,
  policyRationale,
  setPolicyRationale,
  handleSavePolicy,
}: {
  detail: GlobalAdminUserDetail;
  saving: boolean;
  policyEnabled: string;
  setPolicyEnabled: (value: string) => void;
  policyScope: GlobalAdminNewUnitsPolicyScope;
  setPolicyScope: (value: GlobalAdminNewUnitsPolicyScope) => void;
  policyRationale: string;
  setPolicyRationale: (value: string) => void;
  handleSavePolicy: () => Promise<void>;
}) {
  return (
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
  );
}

// ---------------------------------------------------------------------------
// Tab: Histórico
// ---------------------------------------------------------------------------

export function HistoricoTab({ detail }: { detail: GlobalAdminUserDetail }) {
  return (
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
  );
}
