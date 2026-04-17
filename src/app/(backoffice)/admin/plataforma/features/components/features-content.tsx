"use client";

import { useCallback, useEffect, useState } from "react";
import { Package } from "lucide-react";
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
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  listarModulos,
  listarFeaturesTenant,
  habilitarFeature,
  desabilitarFeature,
} from "@/lib/api/gestao-acessos";
import type { FeatureModule } from "@/lib/api/gestao-acessos.types";

export function FeaturesContent() {
  const { toast } = useToast();
  const tenant = useRbacTenant();

  const [allModules, setAllModules] = useState<FeatureModule[]>([]);
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const availableTenants = tenant.availableTenants ?? [];

  useEffect(() => {
    if (tenant.tenantId && !selectedTenantId) {
      setSelectedTenantId(tenant.tenantId);
    }
  }, [tenant.tenantId, selectedTenantId]);

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
      toast({ title: enable ? "Modulo habilitado" : "Modulo desabilitado" });
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

  const addonModules = allModules.filter((m) => m.tipo === "ADDON");
  const coreModules = allModules.filter((m) => m.tipo === "CORE" || m.tipo === "PLATAFORMA");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Feature Modules</h1>
          <p className="text-sm text-muted-foreground">
            Habilite ou desabilite modulos add-on por tenant.
          </p>
        </div>
        <div className="w-[280px]">
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar tenant" />
            </SelectTrigger>
            <SelectContent>
              {availableTenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome || t.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
            Carregando modulos...
          </CardContent>
        </Card>
      ) : (
        <>
          {addonModules.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Modulos Add-on</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {addonModules.map((mod) => {
                  const enabled = enabledKeys.has(mod.key);
                  return (
                    <Card key={mod.key}>
                      <CardContent className="px-5 py-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Package className="size-4 text-muted-foreground shrink-0" />
                              <p className="text-sm font-semibold">{mod.nome}</p>
                            </div>
                            {mod.descricao && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {mod.descricao}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 mt-2">
                              {mod.key}
                            </p>
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

          {coreModules.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Modulos Core / Plataforma</h2>
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
                            <p className="text-xs text-muted-foreground mt-1">
                              {mod.descricao}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full px-2 py-0.5 text-xs bg-secondary text-muted-foreground shrink-0">
                          Sempre ON
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
