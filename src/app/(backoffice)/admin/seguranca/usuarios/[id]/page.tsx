"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  SecurityAccessOriginBadge,
  SecurityActiveBadge,
  SecurityEligibilityBadge,
  SecurityPolicyScopeBadge,
} from "@/components/security/security-badges";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import { listGlobalAcademias, listGlobalUnidades } from "@/lib/backoffice/admin";
import {
  addUserMembership,
  assignUserMembershipProfile,
  getGlobalSecurityUser,
  removeUserMembership,
  removeUserMembershipProfile,
  updateUserMembership,
  updateUserNewUnitsPolicy,
} from "@/lib/backoffice/seguranca";
import type {
  Academia,
  GlobalAdminMembership,
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminUserDetail,
  Tenant,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

function formatDateTime(value?: string) {
  if (!value) return "Não informado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(parsed);
}

function buildPolicySummary(detail: GlobalAdminUserDetail | null) {
  if (!detail) return "Carregando política...";
  if (!detail.policy.enabled) return "Esse usuário não recebe acesso automático em novas unidades.";
  return detail.policy.scope === "REDE"
    ? "Esse usuário recebe acesso automático em todas as novas unidades da rede."
    : "Esse usuário recebe acesso automático em novas unidades da mesma academia.";
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

  async function runMutation(action: () => Promise<GlobalAdminUserDetail>, successTitle: string, successDescription?: string) {
    setSaving(true);
    try {
      const updated = await action();
      setDetail(updated);
      setPolicyEnabled(updated.policy.enabled ? "SIM" : "NAO");
      setPolicyScope(updated.policy.scope);
      setPolicyRationale(updated.policy.rationale ?? "");
      toast({ title: successTitle, description: successDescription });
    } catch (mutationError) {
      toast({
        title: "Não foi possível concluir a operação",
        description: normalizeErrorMessage(mutationError),
        variant: "destructive",
      });
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
      toast({ title: "Acesso associado", description: "A unidade foi vinculada ao usuário." });
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
      "Política atualizada",
      "A elegibilidade para novas unidades foi salva."
    );
  }

  function availableProfilesForMembership(membership: GlobalAdminMembership) {
    const assigned = new Set(membership.profiles.map((profile) => profile.perfilId));
    return (membership.availableProfiles ?? []).filter((profile) => !assigned.has(profile.id) && profile.active);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Segurança</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold">Detalhe do usuário</h1>
            <p className="text-sm text-muted-foreground">
              Consolide memberships, perfis administrativos e política de novas unidades em uma operação só.
            </p>
          </div>
          <Button asChild variant="outline" className="border-border">
            <Link href="/admin/seguranca/usuarios">Voltar à lista</Link>
          </Button>
        </div>
      </header>

      <SecuritySectionFeedback loading={loading} error={error} />

      {detail ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">{detail.fullName || detail.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{detail.email}</p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                  <div className="flex flex-wrap gap-2">
                    <SecurityActiveBadge active={detail.active} activeLabel={detail.status} inactiveLabel={detail.status} />
                    <SecurityEligibilityBadge eligible={detail.eligibleForNewUnits} />
                    <SecurityPolicyScopeBadge scope={detail.policy.scope} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unidade padrão</p>
                  <p className="text-sm">{detail.defaultTenantName || "Não definida"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Academias</p>
                  <p className="text-sm">{detail.academias.map((item) => item.nome).join(", ") || "Sem academias"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Último acesso</p>
                  <p className="text-sm">{formatDateTime(detail.lastLoginAt)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Nova associação</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Vincule o usuário a uma nova unidade e, se necessário, já defina como padrão.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label>Unidade padrão no vínculo</Label>
                  <Select
                    value={newMembershipDefault ? "SIM" : "NAO"}
                    onValueChange={(value) => setNewMembershipDefault(value === "SIM")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NAO">Não</SelectItem>
                      <SelectItem value="SIM">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateMembership} disabled={saving || !newTenantId}>
                  Associar unidade
                </Button>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="acessos" className="space-y-4">
            <TabsList>
              <TabsTrigger value="acessos">Memberships e perfis</TabsTrigger>
              <TabsTrigger value="politica">Novas unidades</TabsTrigger>
            </TabsList>

            <TabsContent value="acessos" className="space-y-4">
              {sortedMemberships.map((membership) => (
                <Card key={membership.id}>
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{membership.tenantName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {membership.academiaName || "Sem academia"} · atualizado em {formatDateTime(membership.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SecurityActiveBadge active={membership.active} />
                      <SecurityAccessOriginBadge origin={membership.accessOrigin} />
                      <SecurityEligibilityBadge eligible={membership.eligibleForNewUnits ?? detail.policy.enabled} />
                      {membership.defaultTenant ? <span className="rounded-full bg-secondary px-2 py-1 text-xs">Padrão</span> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {membership.inheritedFrom ? (
                      <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                        Origem detalhada: {membership.inheritedFrom}
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
                              "Unidade padrão atualizada",
                              membership.tenantName
                            )
                          }
                        >
                          Tornar padrão
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
                        {membership.active ? "Desativar" : "Reativar"}
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
                        Remover acesso
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Perfis administrativos</p>
                      <div className="flex flex-wrap gap-2">
                        {membership.profiles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Nenhum perfil vinculado.</span>
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
                                  "Perfil removido",
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
                        <Label>Adicionar perfil nesta unidade</Label>
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
                            <SelectValue placeholder="Selecione um perfil" />
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
                              "Perfil atribuído",
                              membership.tenantName
                            ).then(() =>
                              setProfileSelection((current) => ({
                                ...current,
                                [membership.id]: "",
                              }))
                            )
                          }
                        >
                          Atribuir perfil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="politica" className="space-y-4">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">Política de novas unidades</CardTitle>
                  <p className="text-sm text-muted-foreground">{buildPolicySummary(detail)}</p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Elegibilidade</Label>
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
                    <Select
                      value={policyScope}
                      onValueChange={(value) => setPolicyScope(value as GlobalAdminNewUnitsPolicyScope)}
                    >
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
                    {detail.policy.inherited ? "A política atual veio do backend como herdada." : "Política editável no backoffice global."}
                    {" "}
                    Última atualização: {formatDateTime(detail.policy.updatedAt)}
                  </div>
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    <Button onClick={handleSavePolicy} disabled={saving}>
                      Salvar política
                    </Button>
                    <Button asChild variant="outline" className="border-border">
                      <Link
                        href={`/admin/unidades${detail.academias[0]?.id ? `?academiaId=${detail.academias[0].id}` : ""}`}
                      >
                        Abrir unidades
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
