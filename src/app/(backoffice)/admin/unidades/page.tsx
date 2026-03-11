"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  deleteGlobalUnidade,
  listGlobalAcademias,
  listGlobalUnidades,
  toggleGlobalUnidade,
  updateGlobalUnidade,
} from "@/lib/backoffice/admin";
import {
  getUnidadeOnboardingStatusLabel,
  getUnidadeOnboardingStrategyLabel,
  listUnidadesOnboarding,
  saveUnidadeOnboarding,
} from "@/lib/backoffice/onboarding";
import type { Academia, Tenant, UnidadeOnboardingState, UnidadeOnboardingStrategy } from "@/lib/types";
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

function buildForm(unit?: Tenant | null, onboarding?: UnidadeOnboardingState | null): UnitForm {
  return {
    nome: unit?.nome ?? "",
    academiaId: unit?.academiaId ?? unit?.groupId ?? "",
    razaoSocial: unit?.razaoSocial ?? "",
    documento: unit?.documento ?? "",
    groupId: unit?.groupId ?? unit?.academiaId ?? "",
    subdomain: unit?.subdomain ?? "",
    email: unit?.email ?? "",
    telefone: unit?.telefone ?? "",
    cupomPrintMode: unit?.configuracoes?.impressaoCupom?.modo ?? "80MM",
    cupomCustomWidthMm: String(unit?.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80),
    onboardingStrategy: onboarding?.estrategia ?? "IMPORTAR_DEPOIS",
    evoFilialId: onboarding?.evoFilialId ?? "",
  };
}

export default function UnidadesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [onboarding, setOnboarding] = useState<UnidadeOnboardingState[]>([]);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState<UnitForm>(EMPTY_FORM);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setError(null);
      const [academiasResponse, unidadesResponse, onboardingResponse] = await Promise.all([
        listGlobalAcademias(),
        listGlobalUnidades(),
        listUnidadesOnboarding(),
      ]);
      setAcademias(academiasResponse);
      setUnidades(unidadesResponse);
      setOnboarding(onboardingResponse);
      setForm((current) => ({
        ...current,
        academiaId: current.academiaId || academiasResponse[0]?.id || "",
      }));
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const onboardingIndex = useMemo(() => {
    const map = new Map<string, UnidadeOnboardingState>();
    onboarding.forEach((item) => {
      map.set(item.tenantId, item);
    });
    return map;
  }, [onboarding]);

  const unidadesFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return unidades;
    return unidades.filter((unit) => {
      const academiaNome =
        academias.find((academia) => academia.id === (unit.academiaId ?? unit.groupId))?.nome ?? "";
      const onboardingState = onboardingIndex.get(unit.id);
      return [
        unit.nome,
        unit.razaoSocial,
        unit.documento,
        unit.groupId,
        unit.subdomain,
        unit.email,
        academiaNome,
        getUnidadeOnboardingStrategyLabel(onboardingState?.estrategia),
        getUnidadeOnboardingStatusLabel(onboardingState?.status),
        onboardingState?.evoFilialId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [academias, busca, onboardingIndex, unidades]);

  const paginaItens = useMemo(
    () => unidadesFiltradas.slice(page * pageSize, page * pageSize + pageSize),
    [page, pageSize, unidadesFiltradas]
  );
  const hasNext = (page + 1) * pageSize < unidadesFiltradas.length;
  const onboardingPronto = onboarding.filter((item) => item.status === "PRONTA").length;
  const onboardingPendente = onboarding.filter((item) =>
    item.status === "PENDENTE_SEED" || item.status === "AGUARDANDO_IMPORTACAO" || item.status === "EM_IMPORTACAO"
  ).length;

  function resetForm() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      academiaId: academias[0]?.id ?? "",
    });
  }

  function handleEdit(unit: Tenant) {
    setEditing(unit);
    setForm(buildForm(unit, onboardingIndex.get(unit.id) ?? null));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!form.groupId.trim()) {
      toast({ title: "Informe o grupo da unidade", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Tenant> = {
        nome: form.nome.trim(),
        academiaId: form.academiaId,
        razaoSocial: form.razaoSocial.trim() || undefined,
        documento: form.documento.trim() || undefined,
        groupId: form.groupId.trim(),
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
        toast({ title: "Unidade criada", description: persisted.nome });
      }

      const savedOnboarding = await saveUnidadeOnboarding({
        tenantId: persisted.id,
        academiaId: persisted.academiaId ?? persisted.groupId,
        estrategia: form.onboardingStrategy,
        evoFilialId: form.evoFilialId.trim() || undefined,
      });
      setOnboarding((current) => [savedOnboarding, ...current.filter((item) => item.tenantId !== savedOnboarding.tenantId)]);
      resetForm();
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

  async function handleDelete(unit: Tenant) {
    try {
      await deleteGlobalUnidade(unit.id);
      setUnidades((current) => current.filter((item) => item.id !== unit.id));
      if (editing?.id === unit.id) resetForm();
      toast({ title: "Unidade removida", description: unit.nome });
    } catch (deleteError) {
      toast({
        title: "Não foi possível remover a unidade",
        description: normalizeErrorMessage(deleteError),
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
          Gestão global de unidades com vínculo explícito à academia, grupo e configuração operacional.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editing ? "Editar unidade" : "Cadastrar nova unidade"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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
              onValueChange={(academiaId) => setForm((current) => ({ ...current, academiaId }))}
            >
              <SelectTrigger aria-label="Academia da unidade" className="w-full">
                <SelectValue placeholder="Selecione a academia" />
              </SelectTrigger>
              <SelectContent>
                {academias.map((academia) => (
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
            <Label htmlFor="backoffice-unidade-documento">Documento</Label>
            <Input
              id="backoffice-unidade-documento"
              value={form.documento}
              onChange={(event) => setForm((current) => ({ ...current, documento: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backoffice-unidade-group">Grupo *</Label>
            <Input
              id="backoffice-unidade-group"
              value={form.groupId}
              onChange={(event) => setForm((current) => ({ ...current, groupId: event.target.value }))}
            />
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
            <Label htmlFor="backoffice-unidade-email">E-mail</Label>
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
              <Button variant="outline" className="border-border" onClick={resetForm} disabled={saving}>
                Cancelar edição
              </Button>
            ) : null}
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar unidade" : "Criar unidade"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de unidades</p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "…" : unidades.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academias atendidas</p>
          <p className="mt-2 text-2xl font-bold text-gym-teal">
            {loading ? "…" : new Set(unidades.map((item) => item.academiaId ?? item.groupId).filter(Boolean)).size}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Onboarding ativo</p>
          <p className="mt-2 text-2xl font-bold text-gym-warning">{loading ? "…" : onboardingPendente}</p>
          <p className="mt-1 text-xs text-muted-foreground">Prontas: {loading ? "…" : onboardingPronto}</p>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unidades cadastradas</CardTitle>
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
                placeholder="Buscar por unidade, academia, grupo, documento ou subdomínio"
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
            emptyText={loading ? "Carregando unidades..." : "Nenhuma unidade encontrada."}
            getRowKey={(item) => item.id}
            renderCells={(unit) => {
              const academiaNome =
                academias.find((academia) => academia.id === (unit.academiaId ?? unit.groupId))?.nome ?? "—";
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
                        {onboardingState?.ultimaMensagem || "Sem histórico operacional."}
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
                        <Link href={`/admin/importacao-evo-p0?tenantId=${encodeURIComponent(unit.id)}`}>Importação</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="border-border" onClick={() => handleEdit(unit)}>
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="border-border" onClick={() => void handleToggle(unit)}>
                        {unit.ativo === false ? "Ativar" : "Desativar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-gym-danger hover:text-gym-danger"
                        onClick={() => void handleDelete(unit)}
                      >
                        Remover
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
        </CardContent>
      </Card>
    </div>
  );
}
