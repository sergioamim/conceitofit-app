"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { PaginatedTable } from "@/components/shared/paginated-table";
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
import { cn } from "@/lib/utils";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type PageSize = 20 | 50 | 100;

type UnitForm = {
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

function buildManageUnitHref(academiaId?: string, unitId?: string) {
  const params = new URLSearchParams();
  if (academiaId) params.set("academiaId", academiaId);
  if (unitId) params.set("edit", unitId);
  const query = params.toString();
  return query ? `/admin/unidades?${query}` : "/admin/unidades";
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

export default function UnidadesPage() {
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

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Unidades</p>
        <h1 className="text-3xl font-display font-bold">Unidades (tenants)</h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma academia para criar, editar e acompanhar as unidades vinculadas sem sair do contexto.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      {onboardingWarning ? (
        <div className="rounded-xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
          {onboardingWarning}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de unidades</p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "…" : unidades.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academias atendidas</p>
          <p className="mt-2 text-2xl font-bold text-gym-teal">
            {loading ? "…" : new Set(unidades.map((item) => resolveAcademiaId(item)).filter(Boolean)).size}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Onboarding ativo</p>
          <p className="mt-2 text-2xl font-bold text-gym-warning">{loading ? "…" : onboardingPendente}</p>
          <p className="mt-1 text-xs text-muted-foreground">Prontas: {loading ? "…" : onboardingPronto}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Academias</CardTitle>
            <p className="text-sm text-muted-foreground">
              Escolha a academia para abrir a listagem das unidades e iniciar um novo cadastro já no contexto certo.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {academiasOrdenadas.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">Nenhuma academia cadastrada.</p>
            ) : null}
            {academiasOrdenadas.map((academia) => {
              const isSelected = academia.id === selectedAcademiaId;
              const unitCount = unitCountByAcademia.get(academia.id) ?? 0;
              return (
                <button
                  key={academia.id}
                  type="button"
                  onClick={() => handleSelectAcademia(academia.id)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "border-gym-accent bg-gym-accent/10"
                      : "border-border bg-card hover:bg-secondary/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{academia.nome}</p>
                      <p className="text-xs text-muted-foreground">{academia.documento || "Sem documento cadastrado"}</p>
                    </div>
                    <Badge variant={isSelected ? "default" : "secondary"}>
                      {unitCount} unidade{unitCount === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {academia.ativo === false ? "Academia inativa" : "Academia ativa"}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {editing ? "Editar unidade" : "Cadastrar nova unidade"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedAcademia
                    ? `Contexto atual: ${selectedAcademia.nome}.`
                    : "Selecione uma academia para começar."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAcademia ? (
                  <Button asChild variant="outline" className="border-border">
                    <Link href={`/admin/academias/${selectedAcademia.id}`}>Abrir academia</Link>
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={() => resetForm(selectedAcademiaId)}
                  disabled={saving || !selectedAcademiaId}
                >
                  Nova unidade nesta academia
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {selectedAcademia ? (
                <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm md:col-span-2">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">
                        {eligiblePreview.loading
                          ? "Consultando política de novas unidades..."
                          : eligiblePreview.total > 0
                            ? `${eligiblePreview.total} usuário(s) receberão acesso automático nas novas unidades desta academia.`
                            : "Nenhum usuário está elegível para propagação automática nesta academia."}
                      </p>
                      {eligiblePreview.items.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Preview: {eligiblePreview.items.map((item) => item.fullName || item.name).join(", ")}.
                        </p>
                      ) : null}
                    </div>
                    <Button asChild size="sm" variant="outline" className="border-border">
                      <Link href={`/admin/seguranca/usuarios?academiaId=${selectedAcademia.id}&eligible=1`}>
                        Abrir segurança
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="backoffice-unidade-nome">Nome da unidade *</Label>
                <Input
                  id="backoffice-unidade-nome"
                  value={form.nome}
                  onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Academia *</Label>
                <Select
                  value={form.academiaId}
                  onValueChange={handleSelectAcademia}
                >
                  <SelectTrigger aria-label="Academia da unidade" className="w-full">
                    <SelectValue placeholder="Selecione a academia" />
                  </SelectTrigger>
                  <SelectContent>
                    {academiasOrdenadas.map((academia) => (
                      <SelectItem key={academia.id} value={academia.id}>
                        {academia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backoffice-unidade-razao">Razão social</Label>
                <Input
                  id="backoffice-unidade-razao"
                  value={form.razaoSocial}
                  onChange={(event) => setForm((current) => ({ ...current, razaoSocial: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backoffice-unidade-documento">Documento *</Label>
                <Input
                  id="backoffice-unidade-documento"
                  value={form.documento}
                  onChange={(event) => setForm((current) => ({ ...current, documento: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backoffice-unidade-group">Grupo da academia</Label>
                <Input
                  id="backoffice-unidade-group"
                  value={form.groupId}
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground">Derivado automaticamente da academia selecionada.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backoffice-unidade-subdomain">Subdomínio</Label>
                <Input
                  id="backoffice-unidade-subdomain"
                  value={form.subdomain}
                  onChange={(event) => setForm((current) => ({ ...current, subdomain: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backoffice-unidade-email">E-mail *</Label>
                <Input
                  id="backoffice-unidade-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backoffice-unidade-telefone">Telefone</Label>
                <Input
                  id="backoffice-unidade-telefone"
                  value={form.telefone}
                  onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Modo do cupom</Label>
                <Select
                  value={form.cupomPrintMode}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, cupomPrintMode: value as UnitForm["cupomPrintMode"] }))
                  }
                >
                  <SelectTrigger aria-label="Modo do cupom" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80MM">80mm</SelectItem>
                    <SelectItem value="58MM">58mm</SelectItem>
                    <SelectItem value="CUSTOM">Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backoffice-unidade-cupom-width">Largura custom (mm)</Label>
                <Input
                  id="backoffice-unidade-cupom-width"
                  type="number"
                  min={40}
                  max={120}
                  value={form.cupomCustomWidthMm}
                  onChange={(event) => setForm((current) => ({ ...current, cupomCustomWidthMm: event.target.value }))}
                  disabled={form.cupomPrintMode !== "CUSTOM"}
                />
              </div>

              <div className="space-y-2">
                <Label>Estratégia inicial *</Label>
                <Select
                  value={form.onboardingStrategy}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, onboardingStrategy: value as UnidadeOnboardingStrategy }))
                  }
                >
                  <SelectTrigger aria-label="Estratégia inicial da unidade" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CARGA_INICIAL">Carregar dados iniciais</SelectItem>
                    <SelectItem value="IMPORTAR_DEPOIS">Importar depois</SelectItem>
                    <SelectItem value="PREPARAR_ETL">Preparar ETL agora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backoffice-unidade-evo-filial">ID Filial EVO</Label>
                <Input
                  id="backoffice-unidade-evo-filial"
                  inputMode="numeric"
                  placeholder="123"
                  value={form.evoFilialId}
                  onChange={(event) => setForm((current) => ({ ...current, evoFilialId: event.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Estratégia atual: {getUnidadeOnboardingStrategyLabel(form.onboardingStrategy)}.
                </p>
              </div>

              <div className="md:col-span-2 flex flex-wrap justify-end gap-2">
                {editing ? (
                  <Button variant="outline" className="border-border" onClick={() => resetForm(selectedAcademiaId)} disabled={saving}>
                    Cancelar edição
                  </Button>
                ) : null}
                <Button onClick={handleSubmit} disabled={saving || !form.academiaId}>
                  {saving ? "Salvando..." : editing ? "Salvar unidade" : "Criar unidade"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {selectedAcademia ? `Unidades de ${selectedAcademia.nome}` : "Unidades cadastradas"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedAcademia
                    ? "Edite uma unidade existente ou inicie uma nova criação já vinculada à academia selecionada."
                    : "Selecione uma academia para filtrar a operação."}
                </p>
              </div>
              {selectedAcademia ? (
                <Button variant="outline" className="border-border" onClick={() => resetForm(selectedAcademia.id)}>
                  Nova unidade
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-72 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(event) => {
                      setBusca(event.target.value);
                      setPage(0);
                    }}
                    placeholder="Buscar por unidade, grupo, documento, subdomínio ou contato"
                    className="pl-8"
                  />
                </div>
                <div className="w-full max-w-44">
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value) as PageSize);
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-full bg-secondary border-border text-xs">
                      <SelectValue placeholder="Itens por página" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="20">20 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                      <SelectItem value="100">100 por página</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <PaginatedTable<Tenant>
                columns={[
                  { label: "Unidade" },
                  { label: "Academia" },
                  { label: "Onboarding" },
                  { label: "Grupo / contato" },
                  { label: "Status" },
                  { label: "Ações" },
                ]}
                items={paginaItens}
                emptyText={
                  loading
                    ? "Carregando unidades..."
                    : selectedAcademia
                      ? "Nenhuma unidade encontrada para a academia selecionada."
                      : "Nenhuma unidade encontrada."
                }
                getRowKey={(item) => item.id}
                renderCells={(unit) => {
                  const academiaNome = academiaIndex.get(resolveAcademiaId(unit))?.nome ?? "—";
                  const onboardingState = onboardingIndex.get(unit.id);
                  return (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{unit.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            {unit.subdomain || "Sem subdomínio"}
                            {unit.documento ? ` · ${unit.documento}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{academiaNome}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{getUnidadeOnboardingStrategyLabel(onboardingState?.estrategia)}</Badge>
                            <Badge variant="outline">{getUnidadeOnboardingStatusLabel(onboardingState?.status)}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {onboardingState?.ultimaMensagem ||
                              (onboardingWarning
                                ? "Abra a unidade para consultar ou atualizar o onboarding."
                                : "Sem histórico operacional.")}
                          </span>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>EVO: {onboardingState?.evoFilialId || "não vinculado"}</span>
                            <span>Eventos: {onboardingState?.eventos.length ?? 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div>{unit.groupId || "Sem grupo"}</div>
                        <div>{unit.email || unit.telefone || "Sem contato"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            unit.ativo === false ? "bg-muted text-muted-foreground" : "bg-gym-teal/15 text-gym-teal"
                          }`}
                        >
                          {unit.ativo === false ? "Inativa" : "Ativa"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline" size="sm" className="border-border">
                            <Link href={`/admin/importacao-evo?tenantId=${encodeURIComponent(unit.id)}`}>Importação</Link>
                          </Button>
                          <Button variant="outline" size="sm" className="border-border" onClick={() => void handleEdit(unit)}>
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="border-border" onClick={() => void handleToggle(unit)}>
                            {unit.ativo === false ? "Ativar" : "Desativar"}
                          </Button>
                        </div>
                      </td>
                    </>
                  );
                }}
                page={page}
                pageSize={pageSize}
                total={unidadesFiltradas.length}
                hasNext={hasNext}
                onPrevious={() => setPage((current) => Math.max(0, current - 1))}
                onNext={() => setPage((current) => current + 1)}
                itemLabel="unidades"
                showPagination={unidadesFiltradas.length > pageSize}
              />

              {selectedAcademia ? (
                <p className="text-xs text-muted-foreground">
                  Acesso direto desta academia:
                  <Link href={buildManageUnitHref(selectedAcademia.id)} className="ml-1 text-gym-accent underline underline-offset-4">
                    compartilhar filtro atual
                  </Link>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
