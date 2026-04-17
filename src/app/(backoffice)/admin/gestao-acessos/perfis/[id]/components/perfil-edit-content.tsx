"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  obterPerfil,
  listarCapacidades,
  atualizarCapacidadesPerfil,
  atualizarPerfil,
  listarFeaturesTenant,
} from "@/lib/api/gestao-acessos";
import type {
  PerfilAcessoDetalhe,
  Capacidade,
  CapacidadesPorGrupo,
  FeatureModule,
} from "@/lib/api/gestao-acessos.types";

interface PerfilEditContentProps {
  perfilId: string;
}

export function PerfilEditContent({ perfilId }: PerfilEditContentProps) {
  const { toast } = useToast();
  const tenant = useRbacTenant();

  const [perfil, setPerfil] = useState<PerfilAcessoDetalhe | null>(null);
  const [capacidadesPorGrupo, setCapacidadesPorGrupo] = useState<CapacidadesPorGrupo>({});
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const [perfilData, capsData, featuresData] = await Promise.all([
        obterPerfil(perfilId),
        listarCapacidades("ACADEMIA"),
        tenant.tenantId ? listarFeaturesTenant(tenant.tenantId) : Promise.resolve([]),
      ]);
      setPerfil(perfilData);
      setNome(perfilData.nome);
      setSelectedKeys(new Set(perfilData.capacidades));
      setCapacidadesPorGrupo(capsData);
      const moduleSet = new Set<string>();
      // Core modules are always enabled
      moduleSet.add("core");
      for (const feat of featuresData) {
        if (feat.ativo) moduleSet.add(feat.key);
      }
      setEnabledModules(moduleSet);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [perfilId, tenant.tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const grupos = useMemo(() => {
    return Object.entries(capacidadesPorGrupo).sort(([a], [b]) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [capacidadesPorGrupo]);

  function toggleCapacidade(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function isModuleEnabled(modulo: string): boolean {
    return enabledModules.has(modulo) || modulo === "core";
  }

  async function handleSave() {
    if (!perfil) return;
    setSaving(true);
    try {
      // Update nome if changed
      if (nome.trim() && nome.trim() !== perfil.nome) {
        await atualizarPerfil(perfilId, { nome: nome.trim() });
      }
      // Bulk update capacidades
      await atualizarCapacidadesPerfil(perfilId, Array.from(selectedKeys));
      toast({ title: "Perfil salvo", description: nome || perfil.nome });
      await load();
    } catch (err) {
      toast({
        title: "Erro ao salvar perfil",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
          Carregando perfil...
        </CardContent>
      </Card>
    );
  }

  if (error || !perfil) {
    return (
      <Card>
        <CardContent className="px-5 py-5 text-sm text-gym-danger">
          {error || "Perfil nao encontrado"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="border-border" asChild>
            <Link href="/admin/gestao-acessos/perfis">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="text-lg font-display font-bold h-auto py-1 px-2 border-transparent hover:border-border focus:border-border"
              />
              <span
                className={`rounded-full px-2 py-0.5 text-xs shrink-0 ${
                  perfil.tipo === "PADRAO"
                    ? "bg-gym-accent/10 text-gym-accent"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {perfil.tipo === "PADRAO" ? "Padrao" : "Customizado"}
              </span>
            </div>
            {perfil.descricao && (
              <p className="text-sm text-muted-foreground ml-2">{perfil.descricao}</p>
            )}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 size-4" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <TooltipProvider>
        {grupos.map(([grupo, capacidades]) => (
          <Card key={grupo}>
            <CardHeader>
              <CardTitle className="text-base capitalize">{grupo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {capacidades.map((cap: Capacidade) => {
                  const enabled = isModuleEnabled(cap.modulo);
                  const checked = selectedKeys.has(cap.key);

                  const checkboxItem = (
                    <label
                      key={cap.key}
                      className={`flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors ${
                        enabled
                          ? "border-border cursor-pointer hover:bg-secondary/30"
                          : "border-border/50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => enabled && toggleCapacidade(cap.key)}
                        disabled={!enabled}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{cap.nome}</p>
                        {cap.descricao && (
                          <p className="text-xs text-muted-foreground">{cap.descricao}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{cap.key}</p>
                      </div>
                    </label>
                  );

                  if (!enabled) {
                    return (
                      <Tooltip key={cap.key}>
                        <TooltipTrigger asChild>{checkboxItem}</TooltipTrigger>
                        <TooltipContent>
                          <p>Modulo &quot;{cap.modulo}&quot; nao habilitado para esta unidade</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return checkboxItem;
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </TooltipProvider>
    </div>
  );
}
