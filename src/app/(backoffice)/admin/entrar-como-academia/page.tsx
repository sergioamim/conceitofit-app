"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTenantContextApi } from "@/lib/api/contexto-unidades";
import { setPreferredTenantId } from "@/lib/api/session";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export default function EntrarComoAcademiaPage() {
  const router = useRouter();
  const { switchActiveTenant } = useTenantContext();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const context = await getTenantContextApi();
      const available = context.unidadesDisponiveis.filter((t) => t.ativo !== false);
      setTenants(available);
      setSelectedTenantId(context.currentTenantId || available[0]?.id || "");
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const academias = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; tenants: Tenant[] }>();
    for (const t of tenants) {
      const academiaId = t.academiaId ?? t.groupId ?? t.id;
      const academiaNome = t.academiaNome ?? t.nome;
      if (!map.has(academiaId)) {
        map.set(academiaId, { id: academiaId, nome: academiaNome, tenants: [] });
      }
      map.get(academiaId)!.tenants.push(t);
    }
    return Array.from(map.values());
  }, [tenants]);

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  async function handleEntrar() {
    if (!selectedTenantId) return;
    setSwitching(true);
    setError(null);
    try {
      await switchActiveTenant(selectedTenantId);
      setPreferredTenantId(selectedTenantId);
      router.push("/dashboard");
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setSwitching(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Carregando academias e unidades...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Entrar como academia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione a academia e unidade para acessar a visão operacional.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      {tenants.length === 0 ? (
        <Card className="border-border">
          <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
            Nenhuma unidade disponível para o seu usuário.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-gym-accent" />
                Academias e unidades
              </CardTitle>
              <CardDescription>
                {academias.length} academia{academias.length > 1 ? "s" : ""} · {tenants.length} unidade{tenants.length > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {academias.map((academia) => (
                <div key={academia.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">{academia.nome}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {academia.tenants.map((tenant) => {
                      const isSelected = tenant.id === selectedTenantId;
                      return (
                        <button
                          key={tenant.id}
                          type="button"
                          onClick={() => setSelectedTenantId(tenant.id)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                            isSelected
                              ? "border-gym-accent bg-gym-accent/10 text-foreground shadow-sm"
                              : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-secondary/50"
                          }`}
                        >
                          <MapPin className={`size-3.5 shrink-0 ${isSelected ? "text-gym-accent" : ""}`} />
                          <span className="truncate">{tenant.nome}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Unidade selecionada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTenant ? (
                  <div className="rounded-lg border border-gym-accent/30 bg-gym-accent/5 p-3">
                    <p className="text-sm font-semibold text-foreground">{selectedTenant.nome}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedTenant.subdomain ?? selectedTenant.nome}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Selecione uma unidade ao lado.</p>
                )}

                <Button
                  onClick={handleEntrar}
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
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full border-border"
              onClick={() => router.push("/admin")}
            >
              Voltar ao backoffice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
