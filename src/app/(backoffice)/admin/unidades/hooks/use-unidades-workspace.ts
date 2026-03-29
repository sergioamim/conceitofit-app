"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  createGlobalUnidade,
  listGlobalAcademias,
  listGlobalUnidades,
  toggleGlobalUnidade,
  updateGlobalUnidade,
} from "@/lib/backoffice/admin";
import {
  getUnidadeOnboarding,
  getUnidadeOnboardingStatusLabel,
  getUnidadeOnboardingStrategyLabel,
  listUnidadesOnboarding,
  saveUnidadeOnboarding,
} from "@/lib/backoffice/onboarding";
import { listEligibleNewUnitAdminsPreview } from "@/lib/backoffice/seguranca";
import type {
  Academia,
  GlobalAdminUserSummary,
  Tenant,
  UnidadeOnboardingState,
  UnidadeOnboardingStrategy,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export type PageSize = 20 | 50 | 100;

export type UnitForm = {
  nome: string;
  academiaId: string;
  razaoSocial: string;
  documento: string;
  groupId: string;
  subdomain: string;
  email: string;
  telefone: string;
  cupomPrintMode: "58MM" | "80MM" | "CUSTOM";
  cupomCustomWidthMm: string;
  onboardingStrategy: UnidadeOnboardingStrategy;
  evoFilialId: string;
};

const EMPTY_FORM: UnitForm = {
  nome: "",
  academiaId: "",
  razaoSocial: "",
  documento: "",
  groupId: "",
  subdomain: "",
  email: "",
  telefone: "",
  cupomPrintMode: "80MM",
  cupomCustomWidthMm: "80",
  onboardingStrategy: "IMPORTAR_DEPOIS",
  evoFilialId: "",
};

function resolveAcademiaId(unit?: Tenant | null) {
  return unit?.academiaId ?? unit?.groupId ?? "";
}

function buildEmptyForm(academiaId = ""): UnitForm {
  return {
    ...EMPTY_FORM,
    academiaId,
    groupId: academiaId,
  };
}

function buildForm(unit?: Tenant | null, onboarding?: UnidadeOnboardingState | null): UnitForm {
  const academiaId = resolveAcademiaId(unit);
  return {
    nome: unit?.nome ?? "",
    academiaId,
    razaoSocial: unit?.razaoSocial ?? "",
    documento: unit?.documento ?? "",
    groupId: academiaId || unit?.groupId || "",
    subdomain: unit?.subdomain ?? "",
    email: unit?.email ?? "",
    telefone: unit?.telefone ?? "",
    cupomPrintMode: unit?.configuracoes?.impressaoCupom?.modo ?? "80MM",
    cupomCustomWidthMm: String(unit?.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80),
    onboardingStrategy: onboarding?.estrategia ?? "IMPORTAR_DEPOIS",
    evoFilialId: onboarding?.evoFilialId ?? "",
  };
}

function isUnitFormDirty(form: UnitForm) {
  return [
    form.nome,
    form.razaoSocial,
    form.documento,
    form.subdomain,
    form.email,
    form.telefone,
    form.evoFilialId,
  ].some((value) => value.trim().length > 0);
}

function isOnboardingCollectionRouteError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("invalid uuid string: onboarding") || normalized.includes("/admin/unidades/onboarding");
}

function isOnboardingEndpointUnavailable(message: string) {
  const normalized = message.toLowerCase();
  return isOnboardingCollectionRouteError(message) || normalized.includes("not found");
}

export type UnidadesWorkspace = ReturnType<typeof useUnidadesWorkspace>;

export function useUnidadesWorkspace() {
  const searchParams = useSearchParams();
  const requestedAcademiaId = searchParams.get("academiaId")?.trim() ?? "";
  const requestedEditId = searchParams.get("edit")?.trim() ?? "";
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [onboarding, setOnboarding] = useState<UnidadeOnboardingState[]>([]);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [selectedAcademiaId, setSelectedAcademiaId] = useState("");
  const [form, setForm] = useState<UnitForm>(EMPTY_FORM);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [error, setError] = useState<string | null>(null);
  const [onboardingWarning, setOnboardingWarning] = useState<string | null>(null);
  const [eligiblePreview, setEligiblePreview] = useState<{
    items: GlobalAdminUserSummary[];
    total: number;
    loading: boolean;
  }>({
    items: [],
    total: 0,
    loading: false,
  });

  const academiaIndex = useMemo(() => {
    const map = new Map<string, Academia>();
    academias.forEach((academia) => {
      map.set(academia.id, academia);
    });
    return map;
  }, [academias]);

  const onboardingIndex = useMemo(() => {
    const map = new Map<string, UnidadeOnboardingState>();
    onboarding.forEach((item) => {
      map.set(item.tenantId, item);
    });
    return map;
  }, [onboarding]);

  const unitCountByAcademia = useMemo(() => {
    const map = new Map<string, number>();
    unidades.forEach((unit) => {
      const academiaId = resolveAcademiaId(unit);
      if (!academiaId) return;
      map.set(academiaId, (map.get(academiaId) ?? 0) + 1);
    });
    return map;
  }, [unidades]);

  const academiasOrdenadas = useMemo(
    () => [...academias].sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR")),
    [academias]
  );

  const selectedAcademia = selectedAcademiaId ? academiaIndex.get(selectedAcademiaId) ?? null : null;

  const hydrateOnboardingForUnit = useCallback(async (unit: Tenant, options?: { updateForm?: boolean; silent?: boolean }) => {
    try {
      const state = await getUnidadeOnboarding(unit.id);
      if (!state) return null;
      setOnboarding((current) => [state, ...current.filter((item) => item.tenantId !== state.tenantId)]);
      if (options?.updateForm !== false) {
        setForm(buildForm(unit, state));
      }
      return state;
    } catch (loadError) {
      if (!options?.silent) {
        toast({
          title: "Não foi possível consultar o onboarding da unidade",
          description: normalizeErrorMessage(loadError),
          variant: "destructive",
        });
      }
      return null;
    }
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const [academiasResponse, unidadesResponse] = await Promise.all([listGlobalAcademias(), listGlobalUnidades()]);
      setAcademias(academiasResponse);
      setUnidades(unidadesResponse);

      let onboardingResponse: UnidadeOnboardingState[] = [];
      try {
        onboardingResponse = await listUnidadesOnboarding();
        setOnboarding(onboardingResponse);
        setOnboardingWarning(null);
      } catch (onboardingError) {
        const message = normalizeErrorMessage(onboardingError);
        setOnboarding([]);
        setOnboardingWarning(
          isOnboardingCollectionRouteError(message)
            ? "A listagem global de onboarding não está disponível no backend atual. O cadastro e a edição das unidades seguem funcionando normalmente."
            : `Não foi possível carregar o onboarding global: ${message}`
        );
      }

      const requestedUnit = requestedEditId ? unidadesResponse.find((item) => item.id === requestedEditId) ?? null : null;
      const defaultAcademiaId =
        (requestedUnit ? resolveAcademiaId(requestedUnit) : "") ||
        (requestedAcademiaId && academiasResponse.some((item) => item.id === requestedAcademiaId) ? requestedAcademiaId : "") ||
        academiasResponse[0]?.id ||
        "";

      setSelectedAcademiaId(defaultAcademiaId);

      if (requestedUnit) {
        const cachedOnboarding = onboardingResponse.find((item) => item.tenantId === requestedUnit.id) ?? null;
        setEditing(requestedUnit);
        setForm(buildForm(requestedUnit, cachedOnboarding));
        if (!cachedOnboarding) {
          void hydrateOnboardingForUnit(requestedUnit, { silent: true });
        }
      } else {
        setEditing(null);
        setForm((current) => {
          if (!isUnitFormDirty(current)) {
            return buildEmptyForm(defaultAcademiaId);
          }
          return {
            ...current,
            academiaId: current.academiaId || defaultAcademiaId,
            groupId: current.academiaId || defaultAcademiaId,
          };
        });
      }
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [hydrateOnboardingForUnit, requestedAcademiaId, requestedEditId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let mounted = true;
    async function loadEligiblePreview() {
      if (!selectedAcademiaId) {
        if (!mounted) return;
        setEligiblePreview({ items: [], total: 0, loading: false });
        return;
      }

      setEligiblePreview((current) => ({ ...current, loading: true }));
      try {
        const response = await listEligibleNewUnitAdminsPreview({
          academiaId: selectedAcademiaId,
          size: 4,
        });
        if (!mounted) return;
        setEligiblePreview({
          items: response.items,
          total: response.total ?? response.items.length,
          loading: false,
        });
      } catch {
        if (!mounted) return;
        setEligiblePreview({ items: [], total: 0, loading: false });
      }
    }

    void loadEligiblePreview();
    return () => {
      mounted = false;
    };
  }, [selectedAcademiaId]);

  const unidadesDaAcademia = useMemo(() => {
    if (!selectedAcademiaId) return unidades;
    return unidades.filter((unit) => resolveAcademiaId(unit) === selectedAcademiaId);
  }, [selectedAcademiaId, unidades]);

  const unidadesFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return unidadesDaAcademia;
    return unidadesDaAcademia.filter((unit) => {
      const onboardingState = onboardingIndex.get(unit.id);
      return [
        unit.nome,
        unit.razaoSocial,
        unit.documento,
        unit.groupId,
        unit.subdomain,
        unit.email,
        selectedAcademia?.nome,
        getUnidadeOnboardingStrategyLabel(onboardingState?.estrategia),
        getUnidadeOnboardingStatusLabel(onboardingState?.status),
        onboardingState?.evoFilialId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [busca, onboardingIndex, selectedAcademia?.nome, unidadesDaAcademia]);

  const paginaItens = useMemo(
    () => unidadesFiltradas.slice(page * pageSize, page * pageSize + pageSize),
    [page, pageSize, unidadesFiltradas]
  );
  const hasNext = (page + 1) * pageSize < unidadesFiltradas.length;
  const onboardingPronto = onboarding.filter((item) => item.status === "PRONTA").length;
  const onboardingPendente = onboarding.filter((item) =>
    item.status === "PENDENTE_SEED" || item.status === "AGUARDANDO_IMPORTACAO" || item.status === "EM_IMPORTACAO"
  ).length;

  function resetForm(nextAcademiaId = selectedAcademiaId || academias[0]?.id || "") {
    setEditing(null);
    setForm(buildEmptyForm(nextAcademiaId));
  }

  function handleSelectAcademia(academiaId: string) {
    setSelectedAcademiaId(academiaId);
    setBusca("");
    setPage(0);
    setForm((current) => ({
      ...current,
      academiaId,
      groupId: academiaId,
    }));
  }

  async function handleEdit(unit: Tenant) {
    const academiaId = resolveAcademiaId(unit);
    setSelectedAcademiaId(academiaId);
    setEditing(unit);
    const cachedOnboarding = onboardingIndex.get(unit.id) ?? null;
    setForm(buildForm(unit, cachedOnboarding));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!cachedOnboarding) {
      await hydrateOnboardingForUnit(unit, { silent: true });
    }
  }

  async function handleSubmit() {
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome da unidade", variant: "destructive" });
      return;
    }
    if (!form.academiaId) {
      toast({ title: "Selecione a academia da unidade", variant: "destructive" });
      return;
    }
    if (!form.documento.trim()) {
      toast({ title: "Informe o documento da unidade", variant: "destructive" });
      return;
    }
    if (!form.email.trim()) {
      toast({ title: "Informe o e-mail da unidade", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Tenant> = {
        nome: form.nome.trim(),
        academiaId: form.academiaId,
        razaoSocial: form.razaoSocial.trim() || undefined,
        documento: form.documento.trim() || undefined,
        groupId: form.academiaId,
        subdomain: form.subdomain.trim() || undefined,
        email: form.email.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        ativo: editing?.ativo ?? true,
        configuracoes: {
          impressaoCupom: {
            modo: form.cupomPrintMode,
            larguraCustomMm: Number(form.cupomCustomWidthMm) || 80,
          },
        },
      };

      let persisted: Tenant;
      if (editing) {
        persisted = await updateGlobalUnidade(editing.id, payload);
        setUnidades((current) => current.map((item) => (item.id === editing.id ? persisted : item)));
        toast({ title: "Unidade atualizada", description: persisted.nome });
      } else {
        persisted = await createGlobalUnidade(payload);
        setUnidades((current) => [persisted, ...current]);
        toast({
          title: "Unidade criada",
          description:
            eligiblePreview.total > 0
              ? `${persisted.nome}. ${eligiblePreview.total} usuário(s) elegíveis receberão acesso automático nesta academia.`
              : persisted.nome,
        });
      }

      try {
        const savedOnboarding = await saveUnidadeOnboarding({
          tenantId: persisted.id,
          academiaId: persisted.academiaId ?? persisted.groupId,
          estrategia: form.onboardingStrategy,
          evoFilialId: form.evoFilialId.trim() || undefined,
        });
        setOnboarding((current) => [savedOnboarding, ...current.filter((item) => item.tenantId !== savedOnboarding.tenantId)]);
      } catch (onboardingError) {
        const message = normalizeErrorMessage(onboardingError);
        if (isOnboardingEndpointUnavailable(message)) {
          setOnboardingWarning(
            "O backend atual não expõe os endpoints de onboarding desta tela. A unidade continua salva e pode ser operada normalmente."
          );
        } else {
          toast({
            title: "Unidade salva, mas o onboarding não foi atualizado",
            description: message,
            variant: "destructive",
          });
        }
      }

      const persistedAcademiaId = resolveAcademiaId(persisted);
      setSelectedAcademiaId(persistedAcademiaId);
      resetForm(persistedAcademiaId);
      setBusca("");
      setPage(0);
    } catch (saveError) {
      toast({
        title: editing ? "Não foi possível atualizar a unidade" : "Não foi possível criar a unidade",
        description: normalizeErrorMessage(saveError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(unit: Tenant) {
    try {
      const toggled = await toggleGlobalUnidade(unit.id);
      setUnidades((current) => current.map((item) => (item.id === unit.id ? toggled : item)));
      toast({
        title: toggled.ativo === false ? "Unidade desativada" : "Unidade reativada",
        description: toggled.nome,
      });
    } catch (toggleError) {
      toast({
        title: "Não foi possível alterar o status da unidade",
        description: normalizeErrorMessage(toggleError),
        variant: "destructive",
      });
    }
  }

  return {
    loading,
    saving,
    academias,
    unidades,
    onboarding,
    editing,
    selectedAcademiaId,
    form,
    setForm,
    busca,
    setBusca,
    page,
    setPage,
    pageSize,
    setPageSize,
    error,
    onboardingWarning,
    eligiblePreview,
    academiaIndex,
    onboardingIndex,
    unitCountByAcademia,
    academiasOrdenadas,
    selectedAcademia,
    unidadesDaAcademia,
    unidadesFiltradas,
    paginaItens,
    hasNext,
    onboardingPronto,
    onboardingPendente,
    resetForm,
    handleSelectAcademia,
    handleEdit,
    handleSubmit,
    handleToggle,
  };
}
