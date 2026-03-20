"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAcademiaAtualApi,
  listUnidadesApi,
  updateAcademiaAtualApi,
} from "@/lib/api/contexto-unidades";
import type { Academia, TenantThemeColors, TenantThemePreset } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDefaultBranding, TENANT_THEME_OPTIONS, resolveTenantTheme } from "@/lib/tenant-theme";
import { useTenantContext } from "@/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const COLOR_FIELDS: Array<{ key: keyof TenantThemeColors; label: string }> = [
  { key: "accent", label: "Accent (botoes e links)" },
  { key: "primary", label: "Primaria" },
  { key: "secondary", label: "Secundaria" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Superficie (cards/menu)" },
  { key: "border", label: "Bordas" },
  { key: "foreground", label: "Texto principal" },
  { key: "mutedForeground", label: "Texto auxiliar" },
  { key: "danger", label: "Perigo" },
  { key: "warning", label: "Aviso" },
  { key: "teal", label: "Sucesso/teal" },
];

function normalizeHex(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  return raw.startsWith("#") ? raw.slice(0, 7) : `#${raw.slice(0, 6)}`;
}

export default function AcademiaAdminPage() {
  const { syncAcademiaBranding } = useTenantContext();
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [saving, setSaving] = useState(false);
  const [unitsCount, setUnitsCount] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [current, units] = await Promise.all([getAcademiaAtualApi(), listUnidadesApi()]);
      setAcademia({ ...current, branding: { ...createDefaultBranding(), ...(current.branding ?? {}) } });
      setUnitsCount(units.length);
    } catch (loadError) {
      setAcademia(null);
      setUnitsCount(0);
      setError(normalizeErrorMessage(loadError) || "Falha ao carregar academia.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const preview = useMemo(() => resolveTenantTheme(academia ?? undefined), [academia]);

  async function handleSave() {
    if (!academia) return;
    setError("");
    setSaving(true);
    try {
      const updated = await updateAcademiaAtualApi({
        data: academia,
      });
      const normalized = { ...updated, branding: { ...createDefaultBranding(), ...(updated.branding ?? {}) } };
      setAcademia(normalized);
      syncAcademiaBranding(normalized);
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError) || "Falha ao salvar academia.");
    } finally {
      setSaving(false);
    }
  }

  if (!academia) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Academia</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entidade principal da rede.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {error || "Carregando academia..."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Academia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entidade principal da rede. Tema e marca aplicam em todas as {unitsCount} unidades.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dados da academia</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
            <Input value={academia.nome} onChange={(e) => setAcademia({ ...academia, nome: e.target.value })} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Razao social</label>
            <Input value={academia.razaoSocial ?? ""} onChange={(e) => setAcademia({ ...academia, razaoSocial: e.target.value })} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documento</label>
            <Input value={academia.documento ?? ""} onChange={(e) => setAcademia({ ...academia, documento: e.target.value })} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
            <Input type="email" value={academia.email ?? ""} onChange={(e) => setAcademia({ ...academia, email: e.target.value })} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
            <PhoneInput value={academia.telefone ?? ""} onChange={(v) => setAcademia({ ...academia, telefone: v })} className="border-border bg-secondary" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Endereco da sede</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CEP</label>
            <MaskedInput mask="cep" value={academia.endereco?.cep ?? ""} onChange={(v) => setAcademia({ ...academia, endereco: { ...academia.endereco, cep: v } })} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Logradouro</label>
            <Input value={academia.endereco?.logradouro ?? ""} onChange={(e) => setAcademia({ ...academia, endereco: { ...academia.endereco, logradouro: e.target.value } })} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Numero</label>
            <Input value={academia.endereco?.numero ?? ""} onChange={(e) => setAcademia({ ...academia, endereco: { ...academia.endereco, numero: e.target.value } })} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bairro</label>
            <Input value={academia.endereco?.bairro ?? ""} onChange={(e) => setAcademia({ ...academia, endereco: { ...academia.endereco, bairro: e.target.value } })} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cidade</label>
            <Input value={academia.endereco?.cidade ?? ""} onChange={(e) => setAcademia({ ...academia, endereco: { ...academia.endereco, cidade: e.target.value } })} className="border-border bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</label>
            <Input value={academia.endereco?.estado ?? ""} onChange={(e) => setAcademia({ ...academia, endereco: { ...academia.endereco, estado: e.target.value } })} className="border-border bg-secondary" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Whitelabel da academia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tema unico da academia, compartilhado por todas as unidades.
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome da marca no sistema</label>
            <Input
              value={academia.branding?.appName ?? ""}
              onChange={(e) => setAcademia({ ...academia, branding: { ...(academia.branding ?? createDefaultBranding()), appName: e.target.value } })}
              placeholder="Ex.: Conceito Fit"
              className="border-border bg-secondary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">URL do logo</label>
            <Input
              value={academia.branding?.logoUrl ?? ""}
              onChange={(e) => setAcademia({ ...academia, branding: { ...(academia.branding ?? createDefaultBranding()), logoUrl: e.target.value } })}
              placeholder="https://..."
              className="border-border bg-secondary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tema base</label>
            <Select
              value={academia.branding?.themePreset ?? "CONCEITO_DARK"}
              onValueChange={(value) =>
                setAcademia({
                  ...academia,
                  branding: { ...(academia.branding ?? createDefaultBranding()), themePreset: value as TenantThemePreset },
                })
              }
            >
              <SelectTrigger className="w-full border-border bg-secondary">
                <SelectValue placeholder="Selecione um tema" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {TENANT_THEME_OPTIONS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {TENANT_THEME_OPTIONS.find((x) => x.id === (academia.branding?.themePreset ?? "CONCEITO_DARK"))?.descricao}
            </p>
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-secondary/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preview rapido</p>
            <div className="grid grid-cols-5 gap-2">
              <div className="h-6 rounded-md border" style={{ backgroundColor: preview.background, borderColor: preview.border }} />
              <div className="h-6 rounded-md border" style={{ backgroundColor: preview.surface, borderColor: preview.border }} />
              <div className="h-6 rounded-md border" style={{ backgroundColor: preview.accent, borderColor: preview.accent }} />
              <div className="h-6 rounded-md border" style={{ backgroundColor: preview.danger, borderColor: preview.danger }} />
              <div className="h-6 rounded-md border" style={{ backgroundColor: preview.teal, borderColor: preview.teal }} />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={academia.branding?.useCustomColors ?? false}
              onChange={(e) =>
                setAcademia({
                  ...academia,
                  branding: { ...(academia.branding ?? createDefaultBranding()), useCustomColors: e.target.checked },
                })
              }
            />
            Personalizar cores manualmente
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Quando ativado, as cores customizadas substituem o tema base para todas as unidades.
          </p>
        </div>

        {academia.branding?.useCustomColors ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {COLOR_FIELDS.map((field) => {
              const value = academia.branding?.colors?.[field.key] ?? preview[field.key];
              return (
                <div key={field.key} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) =>
                        setAcademia({
                          ...academia,
                          branding: {
                            ...(academia.branding ?? createDefaultBranding()),
                            colors: {
                              ...(academia.branding?.colors ?? {}),
                              [field.key]: e.target.value,
                            },
                          },
                        })
                      }
                      className="h-9 w-11 rounded border border-border bg-secondary p-1"
                    />
                    <Input
                      value={value}
                      onChange={(e) =>
                        setAcademia({
                          ...academia,
                          branding: {
                            ...(academia.branding ?? createDefaultBranding()),
                            colors: {
                              ...(academia.branding?.colors ?? {}),
                              [field.key]: normalizeHex(e.target.value),
                            },
                          },
                        })
                      }
                      className="border-border bg-secondary"
                    />
                  </div>
                </div>
              );
            })}
            <div className="md:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={() =>
                  setAcademia({
                    ...academia,
                    branding: { ...(academia.branding ?? createDefaultBranding()), colors: {} },
                  })
                }
              >
                Limpar cores customizadas
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </div>
    </div>
  );
}
