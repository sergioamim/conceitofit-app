"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDateTimeBR } from "@/lib/formatters";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  getStorefrontTheme,
  saveStorefrontTheme,
} from "@/lib/api/storefront-theme";
import {
  storefrontThemeSchema,
  type StorefrontThemeFormValues,
} from "@/lib/forms/storefront-theme-schema";
import { TENANT_THEME_OPTIONS } from "@/lib/tenant/tenant-theme";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { StorefrontTheme, TenantThemePreset } from "@/lib/types";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
      />
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="mt-1 h-8 text-xs"
        />
      </div>
    </div>
  );
}

export function StorefrontConfigContent() {
  const { tenantId } = useTenantContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingTheme, setExistingTheme] = useState<StorefrontTheme | null>(null);

  const form = useForm<StorefrontThemeFormValues>({
    resolver: zodResolver(storefrontThemeSchema),
    mode: "onChange",
    defaultValues: {
      logoUrl: "",
      faviconUrl: "",
      heroImageUrl: "",
      heroTitle: "",
      heroSubtitle: "",
      themePreset: "",
      useCustomColors: false,
      colors: {
        accent: "",
        primary: "",
        background: "",
        surface: "",
        foreground: "",
        mutedForeground: "",
        border: "",
      },
      footerText: "",
      instagram: "",
      facebook: "",
      whatsapp: "",
    },
  });

  const watchUseCustomColors = form.watch("useCustomColors");

  const loadTheme = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const theme = await getStorefrontTheme(tenantId);
      setExistingTheme(theme);
      if (theme) {
        // BE retorna redes sociais como campos flat (instagram/facebook/whatsapp)
        // e também como mapa (redesSociais). Preferimos os campos flat, com fallback
        // para o mapa e depois para o antigo socialLinks aninhado (temas salvos antes do fix).
        const social = {
          instagram:
            theme.instagram ??
            theme.redesSociais?.instagram ??
            theme.socialLinks?.instagram ??
            "",
          facebook:
            theme.facebook ??
            theme.redesSociais?.facebook ??
            theme.socialLinks?.facebook ??
            "",
          whatsapp:
            theme.whatsapp ??
            theme.redesSociais?.whatsapp ??
            theme.socialLinks?.whatsapp ??
            "",
        };
        form.reset({
          logoUrl: theme.logoUrl ?? "",
          faviconUrl: theme.faviconUrl ?? "",
          heroImageUrl: theme.heroImageUrl ?? theme.bannerUrl ?? "",
          heroTitle: theme.heroTitle ?? theme.titulo ?? "",
          heroSubtitle: theme.heroSubtitle ?? theme.subtitulo ?? "",
          themePreset: theme.themePreset ?? "",
          useCustomColors: theme.useCustomColors ?? false,
          colors: {
            accent: theme.colors?.accent ?? "",
            primary: theme.colors?.primary ?? theme.corPrimaria ?? "",
            background: theme.colors?.background ?? theme.corFundo ?? "",
            surface: theme.colors?.surface ?? theme.corSecundaria ?? "",
            foreground: theme.colors?.foreground ?? theme.corTexto ?? "",
            mutedForeground: theme.colors?.mutedForeground ?? "",
            border: theme.colors?.border ?? "",
          },
          footerText: theme.footerText ?? "",
          ...social,
        });
      }
    } catch (e) {
      setError(normalizeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [tenantId, form]);

  useEffect(() => {
    void loadTheme();
  }, [loadTheme]);

  const onSubmit = async (values: StorefrontThemeFormValues) => {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // IMPORTANTE: enviar redes sociais como campos FLAT (instagram/facebook/whatsapp).
      // O DTO Java StorefrontThemeRequest ignora `socialLinks` aninhado — isso era o
      // bug silencioso onde nada era salvo. Ver docs/API_AUDIT_BACKEND_VS_FRONTEND.md C1.
      const payload = {
        logoUrl: values.logoUrl || undefined,
        faviconUrl: values.faviconUrl || undefined,
        heroImageUrl: values.heroImageUrl || undefined,
        heroTitle: values.heroTitle || undefined,
        heroSubtitle: values.heroSubtitle || undefined,
        themePreset: (values.themePreset as TenantThemePreset) || undefined,
        useCustomColors: values.useCustomColors,
        colors: values.useCustomColors
          ? Object.fromEntries(
              Object.entries(values.colors ?? {}).filter(([, v]) => v && v.trim() !== "")
            )
          : undefined,
        footerText: values.footerText || undefined,
        instagram: values.instagram || undefined,
        facebook: values.facebook || undefined,
        whatsapp: values.whatsapp || undefined,
      };
      const saved = await saveStorefrontTheme(tenantId, payload);
      setExistingTheme(saved);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(normalizeErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Tema da Storefront</h1>
          <p className="mt-1 text-sm text-muted-foreground">Carregando configurações...</p>
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Tema da Storefront</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a aparência da página pública de adesão da sua academia.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal">
          Tema salvo com sucesso!
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Identidade visual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidade visual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="logoUrl">URL do logo</Label>
                <Input id="logoUrl" placeholder="https://..." {...form.register("logoUrl")} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="faviconUrl">URL do favicon</Label>
                <Input id="faviconUrl" placeholder="https://..." {...form.register("faviconUrl")} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hero (banner principal)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroImageUrl">URL da imagem do hero</Label>
              <Input id="heroImageUrl" placeholder="https://..." {...form.register("heroImageUrl")} className="mt-1" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="heroTitle">Título do hero</Label>
                <Input id="heroTitle" placeholder="Sua academia, sua marca" {...form.register("heroTitle")} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="heroSubtitle">Subtítulo</Label>
                <Input id="heroSubtitle" placeholder="Planos a partir de..." {...form.register("heroSubtitle")} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tema de cores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Preset de tema</Label>
              <Select
                value={form.watch("themePreset") ?? ""}
                onValueChange={(v) => form.setValue("themePreset", v)}
              >
                <SelectTrigger className="mt-1 w-full md:w-72">
                  <SelectValue placeholder="Selecione um preset" />
                </SelectTrigger>
                <SelectContent>
                  {TENANT_THEME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={watchUseCustomColors ?? false}
                onChange={(e) => form.setValue("useCustomColors", e.target.checked)}
                className="size-4 rounded border-border accent-gym-accent"
              />
              <span className="text-sm">Usar cores customizadas (sobrescreve preset)</span>
            </label>

            {watchUseCustomColors && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ColorField label="Accent (CTA)" value={form.watch("colors.accent") ?? ""} onChange={(v) => form.setValue("colors.accent", v)} />
                <ColorField label="Primary" value={form.watch("colors.primary") ?? ""} onChange={(v) => form.setValue("colors.primary", v)} />
                <ColorField label="Background" value={form.watch("colors.background") ?? ""} onChange={(v) => form.setValue("colors.background", v)} />
                <ColorField label="Surface" value={form.watch("colors.surface") ?? ""} onChange={(v) => form.setValue("colors.surface", v)} />
                <ColorField label="Foreground (texto)" value={form.watch("colors.foreground") ?? ""} onChange={(v) => form.setValue("colors.foreground", v)} />
                <ColorField label="Muted foreground" value={form.watch("colors.mutedForeground") ?? ""} onChange={(v) => form.setValue("colors.mutedForeground", v)} />
                <ColorField label="Border" value={form.watch("colors.border") ?? ""} onChange={(v) => form.setValue("colors.border", v)} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rodapé e redes sociais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rodapé e redes sociais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="footerText">Texto do rodapé</Label>
              <Textarea id="footerText" placeholder="© 2026 Sua Academia. Todos os direitos reservados." {...form.register("footerText")} className="mt-1" rows={2} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" placeholder="@suaacademia" {...form.register("instagram")} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" placeholder="https://facebook.com/..." {...form.register("facebook")} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" placeholder="5511999999999" {...form.register("whatsapp")} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !form.formState.isValid}>
            {saving ? "Salvando..." : existingTheme ? "Atualizar tema" : "Salvar tema"}
          </Button>
          {(existingTheme?.dataAtualizacao ?? existingTheme?.updatedAt) && (
            <p className="text-xs text-muted-foreground">
              Última atualização:{" "}
              {formatDateTimeBR(
                (existingTheme?.dataAtualizacao ?? existingTheme?.updatedAt) as string,
              )}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
