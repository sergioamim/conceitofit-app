"use client";

import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { impersonateUserApi } from "@/backoffice/api/admin-audit";
import { getAuthSessionSnapshot, startImpersonationSession } from "@/lib/api/session";
import { listGlobalAcademias, listGlobalUnidades } from "@/backoffice/lib/admin";
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
} from "@/backoffice/lib/seguranca";
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

export function useUserDetailWorkspace() {
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
    const impersonationTenantId =
      detail.activeTenantId ||
      detail.defaultTenantId ||
      detail.memberships.find((membership) => membership.defaultTenant)?.tenantId ||
      detail.memberships[0]?.tenantId;
    if (!impersonationTenantId) {
      toast({
        title: "Usuário sem unidade operacional",
        description: "A impersonação exige um tenant ativo ou padrão para carregar a visão do cliente.",
        variant: "destructive",
      });
      return;
    }

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
        tenantId: impersonationTenantId,
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
      window.setTimeout(() => {
        window.location.assign(response.redirectTo || "/dashboard");
      }, 0);
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

  return {
    userId,
    detail,
    academias,
    loading,
    saving,
    error,
    newTenantId,
    setNewTenantId,
    newMembershipDefault,
    setNewMembershipDefault,
    newMembershipProfileId,
    setNewMembershipProfileId,
    newMembershipProfiles,
    loadingNewMembershipProfiles,
    profileSelection,
    setProfileSelection,
    policyEnabled,
    setPolicyEnabled,
    policyScope,
    setPolicyScope,
    policyRationale,
    setPolicyRationale,
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
    impersonationDialogOpen,
    setImpersonationDialogOpen,
    impersonating,
    impersonationForm,
    availableTenants,
    selectedNewTenant,
    selectedNewTenantAcademia,
    selectedNewMembershipProfile,
    sortedMemberships,
    mergedExceptions,
    riskFlags,
    runMutation,
    resetImpersonationDialog,
    handleCreateMembership,
    handleSavePolicy,
    handleCreateException,
    handleRemoveException,
    handleStartImpersonation,
    availableProfilesForMembership,
  };
}

type UserDetailWorkspace = ReturnType<typeof useUserDetailWorkspace>;
