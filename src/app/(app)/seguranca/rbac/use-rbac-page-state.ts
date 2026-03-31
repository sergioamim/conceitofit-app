import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { validateAcademiaUserCreateDraft } from "@/lib/tenant/security-user-create";
import { academiaUserCreateBaseFormSchema } from "@/lib/tenant/forms/security-user-create-schemas";
import type { RbacPermission } from "@/lib/types";
import {
  useAuditoriaManager,
  useAuthAccess,
  useGrantManager,
  usePerfisManager,
  useRbacTenant,
  useUserPerfilManager,
} from "@/lib/tenant/rbac/hooks";
import type { PerfilFormState } from "./rbac-tab-perfis";
import type { CreateTenantUserFormState } from "./rbac-tab-usuarios";
import type { GrantFormState } from "./rbac-tab-grants";

export type RbacTab = "perfis" | "usuarios" | "grants" | "auditoria";

const PERFIL_DEFAULT: PerfilFormState = {
  roleName: "",
  displayName: "",
  description: "",
  active: true,
};

const TENANT_USER_DEFAULT: CreateTenantUserFormState = {
  name: "",
  email: "",
  cpf: "",
  userKind: "COLABORADOR",
  tenantIds: [],
  defaultTenantId: "",
  initialPerfilIds: [],
};

const perfilFormSchema = z.object({
  id: z.string().optional(),
  roleName: z.string().trim().min(1, "Informe o identificador do perfil."),
  displayName: z.string().trim().min(1, "Informe o nome de exibição."),
  description: z.string(),
  active: z.boolean(),
});

const grantFormSchema = z.object({
  id: z.string().optional(),
  roleName: z.string().trim().min(1, "Selecione perfil e feature."),
  featureKey: z.string().trim().min(1, "Selecione perfil e feature."),
  permission: z.enum(["VIEW", "EDIT", "MANAGE"]),
  allowed: z.boolean(),
});

const assignPerfilFormSchema = z.object({
  perfilId: z.string().trim().min(1, "Selecione um perfil."),
});

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

export function useRbacPageState() {
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
    createUser,
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

  const [userQuery, setUserQuery] = useState("");
  const perfilForm = useForm<PerfilFormState>({
    resolver: zodResolver(perfilFormSchema),
    defaultValues: PERFIL_DEFAULT,
  });
  const grantForm = useForm<GrantFormState>({
    resolver: zodResolver(grantFormSchema),
    defaultValues: {
      roleName: "",
      featureKey: "",
      permission: "VIEW",
      allowed: true,
    },
  });
  const assignPerfilForm = useForm<{ perfilId: string }>({
    resolver: zodResolver(assignPerfilFormSchema),
    defaultValues: {
      perfilId: "",
    },
  });
  const tenantUserForm = useForm<CreateTenantUserFormState>({
    resolver: zodResolver(
      academiaUserCreateBaseFormSchema.pick({
        name: true,
        email: true,
        cpf: true,
        userKind: true,
        tenantIds: true,
        defaultTenantId: true,
        initialPerfilIds: true,
      })
    ),
    defaultValues: TENANT_USER_DEFAULT,
  });
  const perfilFormValues = (useWatch({ control: perfilForm.control }) ?? PERFIL_DEFAULT) as PerfilFormState;
  const grantFormValues = (useWatch({ control: grantForm.control }) ?? {
    roleName: "",
    featureKey: "",
    permission: "VIEW" as RbacPermission,
    allowed: true,
  }) as GrantFormState;
  const tenantUserFormValues = (useWatch({ control: tenantUserForm.control }) ?? TENANT_USER_DEFAULT) as CreateTenantUserFormState;
  const perfilToAssign = useWatch({ control: assignPerfilForm.control, name: "perfilId" }) ?? "";

  useEffect(() => {
    if (selectedUser) {
      setUserQuery(selectedUser.fullName || selectedUser.name || selectedUser.email || "");
    }
  }, [selectedUser]);

  const [isActionLoading, setActionLoading] = useState(false);

  const tenantScopeOptions = useMemo(() => {
    if (!tenant.networkId) return tenant.availableTenants;
    return tenant.availableTenants.filter(
      (item) => (item.academiaId ?? item.groupId) === tenant.networkId
    );
  }, [tenant.availableTenants, tenant.networkId]);

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
    perfilForm.reset(PERFIL_DEFAULT);
  }, [perfilForm]);

  const toggleTenantUserTenant = useCallback((selectedTenantId: string) => {
    const tenantIds = tenantUserFormValues.tenantIds.includes(selectedTenantId)
      ? tenantUserFormValues.tenantIds.filter((item) => item !== selectedTenantId)
      : [...tenantUserFormValues.tenantIds, selectedTenantId];
    tenantUserForm.setValue("tenantIds", tenantIds, { shouldDirty: true });
    tenantUserForm.setValue(
      "defaultTenantId",
      tenantIds.includes(tenantUserFormValues.defaultTenantId)
        ? tenantUserFormValues.defaultTenantId
        : tenantIds[0] ?? "",
      { shouldDirty: true }
    );
  }, [tenantUserForm, tenantUserFormValues.defaultTenantId, tenantUserFormValues.tenantIds]);

  const toggleTenantUserPerfil = useCallback((perfilId: string) => {
    const nextPerfis = tenantUserFormValues.initialPerfilIds.includes(perfilId)
      ? tenantUserFormValues.initialPerfilIds.filter((item) => item !== perfilId)
      : [...tenantUserFormValues.initialPerfilIds, perfilId];
    tenantUserForm.setValue("initialPerfilIds", nextPerfis, { shouldDirty: true });
  }, [tenantUserForm, tenantUserFormValues.initialPerfilIds]);

  const editPerfil = useCallback((id: string) => {
    const perfil = perfis.find((item) => item.id === id);
    if (!perfil) return;
    perfilForm.reset({
      id: perfil.id,
      roleName: perfil.roleName,
      displayName: perfil.displayName,
      description: perfil.description ?? "",
      active: perfil.active,
    });
  }, [perfilForm, perfis]);

  const submitPerfil = useCallback(
    async (values: PerfilFormState) => {
      feedback.clear();
      setActionLoading(true);
      try {
        await savePerfil({
          id: values.id,
          data: {
            roleName: values.roleName.trim(),
            displayName: values.displayName.trim(),
            description: values.description.trim() || undefined,
            active: values.active,
          },
        });
        feedback.show(
          values.id ? "Perfil atualizado com sucesso." : "Perfil criado com sucesso.",
          "success"
        );
        clearPerfilForm();
      } catch (error) {
        feedback.show(error instanceof Error ? error.message : "Não foi possível salvar o perfil.", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [clearPerfilForm, feedback, savePerfil]
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
      assignPerfilForm.reset({ perfilId: "" });
    } finally {
      setActionLoading(false);
    }
  }, [assignPerfil, assignPerfilForm, feedback, perfilToAssign]);

  const submitTenantUser = useCallback(
    async (values: CreateTenantUserFormState) => {
      feedback.clear();
      setActionLoading(true);
      try {
        const payload = validateAcademiaUserCreateDraft({
          ...values,
          networkId: tenant.networkId,
          networkName: tenant.networkName,
          networkSubdomain: tenant.networkSubdomain,
          allowedTenantIds: tenantScopeOptions.map((item) => item.id),
          allowedPerfilIds: activePerfis.map((item) => item.id),
        });
        await createUser(payload);
        tenantUserForm.reset(TENANT_USER_DEFAULT);
        feedback.show("Usuário criado na rede atual.", "success");
      } catch (error) {
        feedback.show(error instanceof Error ? error.message : "Não foi possível criar o usuário.", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [activePerfis, createUser, feedback, tenant.networkId, tenant.networkName, tenant.networkSubdomain, tenantScopeOptions, tenantUserForm]
  );

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
    async (values: GrantFormState) => {
      feedback.clear();
      setActionLoading(true);
      try {
        await saveGrant(values);
        feedback.show("Grant salvo com sucesso.", "success");
      } finally {
        setActionLoading(false);
      }
    },
    [feedback, saveGrant]
  );

  const filteredLogs = useMemo(() => logs, [logs]);

  return {
    activeTab,
    setActiveTab,
    access,
    tenant,
    tenantId,
    tabButtons,
    feedback,
    isActionLoading,

    // Perfis tab
    perfilForm,
    perfilFormValues,
    perfis,
    perfisLoading,
    perfilActionLoading,
    perfisError,
    perfisPage,
    perfisPageSize,
    perfisTotal,
    perfisHasNext,
    clearPerfilForm,
    editPerfil,
    submitPerfil,
    desativarPerfil,
    nextPerfisPage,
    previousPerfisPage,

    // Usuarios tab
    tenantUserForm,
    tenantUserFormValues,
    assignPerfilForm,
    perfilToAssign,
    users,
    selectedUser,
    selectedUserId,
    setSelectedUserId,
    userPerfis,
    activePerfis,
    loadingUsers,
    loadingPerfis,
    userSaving,
    usuariosError,
    tenantScopeOptions,
    userQuery,
    setUserQuery,
    submitTenantUser,
    toggleTenantUserTenant,
    toggleTenantUserPerfil,
    assignPerfilToUser,
    removeUserPerfil,

    // Grants tab
    grantForm,
    grantFormValues,
    features,
    grants,
    grantsLoading,
    grantActionLoading,
    grantsError,
    submitGrant,
    submitFeatureConfig,

    // Auditoria tab
    filteredLogs,
    action,
    resourceType,
    limit,
    logsLoading,
    logsError,
    setAction,
    setResourceType,
    setLimit,
  };
}
