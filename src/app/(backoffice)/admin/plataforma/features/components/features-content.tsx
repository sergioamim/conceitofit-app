"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Package, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  listarModulos,
  listarFeaturesTenant,
  habilitarFeature,
  desabilitarFeature,
  habilitarFeatureGlobal,
  desabilitarFeatureGlobal,
} from "@/lib/api/gestao-acessos";
import { listUnidadesApi } from "@/lib/api/contexto-unidades";
import type { FeatureModule } from "@/lib/api/gestao-acessos.types";
import type { Tenant } from "@/lib/types";

interface AcademiaGroup {
  id: string;
  nome: string;
  unidades: Tenant[];
}

export function FeaturesContent() {
  const { toast } = useToast();

  const [allModules, setAllModules] = useState<FeatureModule[]>([]);
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedAcademiaId, setSelectedAcademiaId] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [togglingGlobal, setTogglingGlobal] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    listUnidadesApi()
      .then(setTenants)
      .catch(() => {});
  }, []);

  const academiaGroups = useMemo<AcademiaGroup[]>(() => {
    const map = new Map<string, AcademiaGroup>();
    for (const t of tenants) {
      const raw = t as unknown as { academiaId?: string; academiaNome?: string };
      const acadId = raw.academiaId ?? "sem-academia";
      const acadNome = raw.academiaNome ?? "Sem Academia";
      if (!map.has(acadId)) {
        map.set(acadId, { id: acadId, nome: acadNome, unidades: [] });
      }
      map.get(acadId)!.unidades.push(t);
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [tenants]);

  const unidadesFiltradas = useMemo(() => {
    if (!selectedAcademiaId) return [];
    return academiaGroups.find((g) => g.id === selectedAcademiaId)?.unidades ?? [];
  }, [academiaGroups, selectedAcademiaId]);

  useEffect(() => {
    if (academiaGroups.length === 1 && !selectedAcademiaId) {
      setSelectedAcademiaId(academiaGroups[0].id);
    }
  }, [academiaGroups, selectedAcademiaId]);

  useEffect(() => {
    if (unidadesFiltradas.length === 1 && !selectedTenantId) {
      setSelectedTenantId(unidadesFiltradas[0].id);
    }
  }, [unidadesFiltradas, selectedTenantId]);

  function handleAcademiaChange(acadId: string) {
    setSelectedAcademiaId(acadId);
    setSelectedTenantId("");
    setEnabledKeys(new Set());
  }

  const reload = useCallback(async () => {
    if (!selectedTenantId) return;
    setLoading(true);
    try {
      const [modules, tenantFeatures] = await Promise.all([
        listarModulos(),
        listarFeaturesTenant(selectedTenantId),
      ]);
      setAllModules(Array.isArray(modules) ? modules : []);
      const keys = new Set<string>();
      for (const f of tenantFeatures) {
        if (f.ativo) keys.add(f.key);
      }
      setEnabledKeys(keys);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    if (selectedTenantId) void reload();
  }, [reload, selectedTenantId]);

  async function handleToggleGlobal(featureKey: string, enable: boolean) {
    setTogglingGlobal(featureKey);
    try {
      if (enable) {
        await habilitarFeatureGlobal(featureKey);
      } else {
        await desabilitarFeatureGlobal(featureKey);
      }
      // Atualizar lista local
      setAllModules((prev) =>
        prev.map((m) => (m.key === featureKey ? { ...m, ativo: enable } : m))
      );
      toast({
        title: enable
          ? `${featureKey} habilitado globalmente`
          : `${featureKey} desabilitado globalmente`,
        description: enable
          ? "Tenants com toggle individual ON terão acesso."
          : "NENHUM tenant terá acesso, mesmo com toggle individual.",
      });
    } catch (err) {
      toast({
        title: "Erro ao alterar feature global",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setTogglingGlobal(null);
    }
  }

  async function handleToggle(featureKey: string, enable: boolean) {
    if (!selectedTenantId) return;
    setToggling(featureKey);
    try {
      if (enable) {
        await habilitarFeature(selectedTenantId, featureKey);
        setEnabledKeys((prev) => new Set([...prev, featureKey]));
      } else {
        await desabilitarFeature(selectedTenantId, featureKey);
        setEnabledKeys((prev) => {
          const next = new Set(prev);
          next.delete(featureKey);
          return next;
        });
      }
      toast({ title: enable ? "Módulo habilitado" : "Módulo desabilitado" });
    } catch (err) {
      toast({
        title: "Erro ao alterar feature",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setToggling(null);
    }
  }

  if (!hydrated) return null;

  const addonModules = allModules.filter((m) => m.tipo === "ADDON");
  const coreModules = allModules.filter(
    (m) => m.tipo === "CORE" || m.tipo === "PLATAFORMA"
  );
  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
  const selectedAcademia = academiaGroups.find((g) => g.id === selectedAcademiaId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Feature Modules</h1>
        <p className="text-sm text-muted-foreground">
          Habilite ou desabilite módulos add-on por unidade. Selecione a academia e depois a unidade.
        </p>
      </div>

      {/* ===== CONTROLE GLOBAL ===== */}
      {allModules.length > 0 && (
        <Card>
          <CardContent className="px-5 py-5">
            <h2 className="text-sm font-semibold mb-1">Controle Global</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Desabilitar globalmente impede acesso em TODOS os tenants, mesmo que
              o toggle individual esteja ON. Use para features não terminadas ou em manutenção.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allModules
                .filter((m) => m.tipo === "ADDON")
                .map((mod) => (
                  <div
                    key={mod.key}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                      mod.ativo ? "" : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{mod.nome}</span>
                      {!mod.ativo && (
                        <Badge variant="destructive" className="text-[10px] shrink-0">
                          DESABILITADO GLOBAL
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={mod.ativo}
                      onCheckedChange={(val) => handleToggleGlobal(mod.key, val)}
                      disabled={togglingGlobal === mod.key}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== POR TENANT: Academia → Unidade ===== */}
      {/* Seletores: Academia → Unidade */}
      <Card>
        <CardContent className="px-5 py-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-[280px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Academia (Rede)
              </label>
              <Select value={selectedAcademiaId} onValueChange={handleAcademiaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar academia" />
                </SelectTrigger>
                <SelectContent>
                  {academiaGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        <span>{g.nome}</span>
                        <Badge variant="secondary" className="ml-1 text-[10px]">
                          {g.unidades.length}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[280px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Unidade
              </label>
              <Select
                value={selectedTenantId}
                onValueChange={setSelectedTenantId}
                disabled={!selectedAcademiaId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedAcademiaId
                        ? "Selecionar unidade"
                        : "Selecione a academia primeiro"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {unidadesFiltradas.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTenant && selectedAcademia && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">{selectedTenant.nome}</span>
                {" — "}
                {selectedAcademia.nome}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sem seleção */}
      {!selectedTenantId && (
        <Card>
          <CardContent className="px-5 py-12 text-center">
            <Building2 className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Selecione uma academia e unidade para gerenciar os módulos.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedTenantId && loading && (
        <Card>
          <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
            Carregando módulos...
          </CardContent>
        </Card>
      )}

      {/* Add-ons */}
      {selectedTenantId && !loading && addonModules.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Zap className="size-4 text-gym-accent" />
            Módulos Add-on
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addonModules.map((mod) => {
              const enabled = enabledKeys.has(mod.key);
              return (
                <Card key={mod.key} className={enabled ? "border-gym-accent/30" : ""}>
                  <CardContent className="px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Package className="size-4 text-muted-foreground shrink-0" />
                          <p className="text-sm font-semibold">{mod.nome}</p>
                        </div>
                        {mod.descricao && (
                          <p className="text-xs text-muted-foreground mt-1">{mod.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={enabled ? "default" : "secondary"} className="text-[10px]">
                            {enabled ? "Habilitado" : "Desabilitado"}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(val) => handleToggle(mod.key, val)}
                        disabled={toggling === mod.key}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Core */}
      {selectedTenantId && !loading && coreModules.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Módulos Core / Plataforma</h2>
          <p className="text-xs text-muted-foreground mb-4">Sempre ativos. Não podem ser desabilitados.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coreModules.map((mod) => (
              <Card key={mod.key} className="opacity-60">
                <CardContent className="px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-muted-foreground shrink-0" />
                        <p className="text-sm font-semibold">{mod.nome}</p>
                      </div>
                      {mod.descricao && (
                        <p className="text-xs text-muted-foreground mt-1">{mod.descricao}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">Sempre ON</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
