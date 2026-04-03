"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  MapPin,
  ArrowRight,
  Loader2,
  Clock,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import type { SuggestionOption } from "@/components/shared/suggestion-input";
import { useAcademiaSuggestion } from "@/backoffice/lib/use-academia-suggestion";
import { useUnidadeSuggestion } from "../../lib/use-unidade-suggestion";
import { setTenantContextApi } from "@/lib/api/contexto-unidades";
import { adminEntrarComoUnidadeApi } from "@/lib/api/auth";
import {
  clearOperationalTenantScope,
  rememberOperationalTenantScope,
  setPreferredTenantId,
} from "@/lib/api/session";
import { listBackofficeAcademiasApi, listBackofficeUnidadesApi } from "@/backoffice/api/backoffice";
import type { Academia, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const entrarComoSchema = z.object({
  justificativa: z.string().trim().max(400, "Máximo de 400 caracteres.").optional(),
});

type EntrarComoForm = z.infer<typeof entrarComoSchema>;

/* ------------------------------------------------------------------ */
/*  Tipos locais                                                       */
/* ------------------------------------------------------------------ */

interface RecentEntry {
  academiaId: string;
  academiaNome: string;
  tenantId: string;
  tenantNome: string;
  timestamp: number;
}

const STORAGE_KEY = "admin:entrar-como:recentes";
const MAX_RECENTES = 5;

function readRecentes(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTES) : [];
  } catch {
    return [];
  }
}

function saveRecente(entry: Omit<RecentEntry, "timestamp">) {
  try {
    const current = readRecentes().filter(
      (r) => !(r.academiaId === entry.academiaId && r.tenantId === entry.tenantId),
    );
    const next: RecentEntry[] = [
      { ...entry, timestamp: Date.now() },
      ...current,
    ].slice(0, MAX_RECENTES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage indisponível — ignore silenciosamente
  }
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function EntrarComoAcademiaPage() {
  const router = useRouter();

  // --- busca de academia via SuggestionInput ---
  const academiaSuggestion = useAcademiaSuggestion();
  const [academiaSearch, setAcademiaSearch] = useState("");
  const [selectedAcademia, setSelectedAcademia] = useState<{
    id: string;
    nome: string;
  } | null>(null);

  // --- unidades da academia selecionada ---
  const unidadeSuggestion = useUnidadeSuggestion(selectedAcademia?.id);
  const [unidadeSearch, setUnidadeSearch] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedTenantNome, setSelectedTenantNome] = useState("");

  // --- dados completos para impersonation ---
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  // --- recentes (SSR-safe: só lê após mount) ---
  const [recentes, setRecentes] = useState<RecentEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRecentes(readRecentes());
  }, []);

  // Carregar todos os tenants uma vez (necessário para impersonation scope)
  const loadAllTenants = useCallback(async () => {
    setLoadingTenants(true);
    try {
      const tenants = await listBackofficeUnidadesApi();
      setAllTenants(tenants.filter((t) => t.ativo !== false));
    } catch {
      // silencioso — os suggestion hooks já fazem fetch separado
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    void loadAllTenants();
  }, [loadAllTenants]);

  // Unidades da academia selecionada (para lista curta e scope)
  const unidadesDaAcademia = useMemo(() => {
    if (!selectedAcademia) return [];
    return allTenants.filter(
      (t) =>
        t.academiaId === selectedAcademia.id ||
        t.groupId === selectedAcademia.id,
    );
  }, [allTenants, selectedAcademia]);

  // Auto-selecionar se academia tem apenas 1 unidade
  useEffect(() => {
    if (unidadesDaAcademia.length === 1) {
      const unidade = unidadesDaAcademia[0];
      setSelectedTenantId(unidade.id);
      setSelectedTenantNome(unidade.nome);
      setUnidadeSearch(unidade.nome);
    }
  }, [unidadesDaAcademia]);

  // --- impersonation ---
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EntrarComoForm>({
    resolver: zodResolver(entrarComoSchema),
    defaultValues: { justificativa: "" },
  });

  async function handleEntrar(values: EntrarComoForm) {
    if (!selectedTenantId || !selectedAcademia) return;
    setSwitching(true);
    setError(null);
    try {
      const academiaId = selectedAcademia.id;
      const scopedTenantIds = allTenants
        .filter(
          (t) =>
            (t.academiaId ?? t.groupId ?? t.id) === academiaId,
        )
        .map((t) => t.id);

      rememberOperationalTenantScope({
        academiaId,
        tenantIds: scopedTenantIds,
        defaultTenantId: selectedTenantId,
      });

      await adminEntrarComoUnidadeApi({
        academiaId,
        tenantId: selectedTenantId,
        justificativa: values.justificativa?.trim() || undefined,
      });

      setPreferredTenantId(selectedTenantId);
      await setTenantContextApi(selectedTenantId);

      // Persistir nos recentes
      saveRecente({
        academiaId,
        academiaNome: selectedAcademia.nome,
        tenantId: selectedTenantId,
        tenantNome: selectedTenantNome,
      });

      window.location.assign("/dashboard");
    } catch (err) {
      clearOperationalTenantScope();
      setError(normalizeErrorMessage(err));
    } finally {
      setSwitching(false);
    }
  }

  function handleSelectAcademia(option: SuggestionOption) {
    setSelectedAcademia({ id: option.id, nome: option.label });
    setAcademiaSearch(option.label);
    // Limpar seleção de unidade
    setSelectedTenantId("");
    setSelectedTenantNome("");
    setUnidadeSearch("");
  }

  function handleSelectUnidade(option: SuggestionOption) {
    setSelectedTenantId(option.id);
    setSelectedTenantNome(option.label);
    setUnidadeSearch(option.label);
  }

  function handleClearAcademia() {
    setSelectedAcademia(null);
    setAcademiaSearch("");
    setSelectedTenantId("");
    setSelectedTenantNome("");
    setUnidadeSearch("");
  }

  function handleRecenteClick(entry: RecentEntry) {
    setSelectedAcademia({
      id: entry.academiaId,
      nome: entry.academiaNome,
    });
    setAcademiaSearch(entry.academiaNome);
    setSelectedTenantId(entry.tenantId);
    setSelectedTenantNome(entry.tenantNome);
    setUnidadeSearch(entry.tenantNome);
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      {/* Cabeçalho */}
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Entrar como academia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busque a academia e selecione a unidade para acessar a visão
          operacional.
        </p>
      </div>

      {/* Erro global */}
      {error ? (
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      {/* Busca de academia */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="size-4 text-gym-accent" />
            Buscar academia
          </CardTitle>
          <CardDescription>
            Digite o nome, CNPJ ou cidade da academia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <SuggestionInput
              inputAriaLabel="Buscar academia"
              value={academiaSearch}
              onValueChange={(v) => {
                setAcademiaSearch(v);
                // Se o texto mudar após seleção, limpar seleção
                if (selectedAcademia && v !== selectedAcademia.nome) {
                  setSelectedAcademia(null);
                  setSelectedTenantId("");
                  setSelectedTenantNome("");
                  setUnidadeSearch("");
                }
              }}
              onSelect={handleSelectAcademia}
              options={academiaSuggestion.options}
              onFocusOpen={academiaSuggestion.onFocusOpen}
              placeholder="Ex.: Academia Força Total, 12.345.678/0001-00..."
              emptyText="Nenhuma academia encontrada"
              preloadOnFocus
            />
            {selectedAcademia ? (
              <button
                type="button"
                onClick={handleClearAcademia}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Limpar seleção"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          {selectedAcademia ? (
            <p className="mt-2 text-xs text-gym-accent">
              <Building2 className="mr-1 inline-block size-3" />
              {selectedAcademia.nome} selecionada
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Acessos recentes */}
      {mounted && recentes.length > 0 && !selectedAcademia ? (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-muted-foreground" />
              Acessos recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {recentes.map((entry) => (
                <button
                  key={`${entry.academiaId}-${entry.tenantId}`}
                  type="button"
                  onClick={() => handleRecenteClick(entry)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-all hover:border-gym-accent/40 hover:bg-secondary/50"
                >
                  <Building2 className="size-4 shrink-0 text-gym-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.academiaNome}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      {entry.tenantNome}
                    </p>
                  </div>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Seleção de unidade + formulário de entrada */}
      {selectedAcademia ? (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-gym-accent" />
              Selecionar unidade
            </CardTitle>
            <CardDescription>
              {loadingTenants
                ? "Carregando unidades..."
                : unidadesDaAcademia.length === 1
                  ? "Esta academia possui apenas 1 unidade (selecionada automaticamente)."
                  : `${unidadesDaAcademia.length} unidade${unidadesDaAcademia.length !== 1 ? "s" : ""} disponíve${unidadesDaAcademia.length !== 1 ? "is" : "l"}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista curta (<= 5) ou SuggestionInput (> 5) */}
            {unidadesDaAcademia.length <= 5 ? (
              <div className="grid gap-2">
                {unidadesDaAcademia.map((tenant) => {
                  const isSelected = tenant.id === selectedTenantId;
                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => {
                        setSelectedTenantId(tenant.id);
                        setSelectedTenantNome(tenant.nome);
                        setUnidadeSearch(tenant.nome);
                      }}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                        isSelected
                          ? "border-gym-accent bg-gym-accent/10 text-foreground shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-secondary/50"
                      }`}
                    >
                      <MapPin
                        className={`size-3.5 shrink-0 ${isSelected ? "text-gym-accent" : ""}`}
                      />
                      <span className="truncate">{tenant.nome}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <SuggestionInput
                inputAriaLabel="Buscar unidade"
                value={unidadeSearch}
                onValueChange={(v) => {
                  setUnidadeSearch(v);
                  if (selectedTenantId && v !== selectedTenantNome) {
                    setSelectedTenantId("");
                    setSelectedTenantNome("");
                  }
                }}
                onSelect={handleSelectUnidade}
                options={unidadeSuggestion.options}
                onFocusOpen={unidadeSuggestion.onFocusOpen}
                placeholder="Buscar unidade por nome..."
                emptyText="Nenhuma unidade encontrada"
                preloadOnFocus
              />
            )}

            {/* Unidade selecionada + justificativa + botão */}
            {selectedTenantId ? (
              <div className="space-y-4 pt-2">
                <div className="rounded-lg border border-gym-accent/30 bg-gym-accent/5 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedTenantNome}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedAcademia.nome}
                  </p>
                </div>

                <form
                  className="space-y-3"
                  onSubmit={form.handleSubmit(handleEntrar)}
                >
                  <div className="space-y-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      htmlFor="justificativa"
                    >
                      Justificativa (opcional)
                    </label>
                    <Textarea
                      id="justificativa"
                      rows={3}
                      className="border-border bg-secondary"
                      placeholder="Ex.: auditoria de cadastro da unidade"
                      {...form.register("justificativa")}
                    />
                    {form.formState.errors.justificativa ? (
                      <p className="text-xs text-gym-danger">
                        {form.formState.errors.justificativa.message}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="submit"
                    disabled={!selectedTenantId || switching}
                    className="w-full"
                  >
                    {switching ? (
                      <>
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar na unidade
                        <ArrowRight className="ml-1 size-3.5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Voltar */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="border-border"
          onClick={() => router.push("/admin")}
        >
          Voltar ao backoffice
        </Button>
      </div>
    </div>
  );
}
