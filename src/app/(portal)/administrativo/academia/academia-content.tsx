"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BrushCleaning, Building2, Check, MonitorSmartphone, Palette, ShieldCheck, Sparkles, Store } from "lucide-react";
import { zodResolver } from "@/lib/forms/zod-resolver";
import {
  getAcademiaAtualApi,
  listUnidadesApi,
  updateAcademiaAtualApi,
} from "@/lib/api/contexto-unidades";
import type { Academia, TenantThemeColors, TenantThemePreset } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_THEME_PRESET,
  TENANT_THEME_OPTIONS,
  TENANT_THEME_PRESETS,
  createDefaultBranding,
  resolveTenantTheme,
} from "@/lib/tenant/tenant-theme";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { PageError } from "@/components/shared/page-error";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { cn } from "@/lib/utils";
import { academiaThemeFormSchema, type AcademiaThemeFormValues } from "./academia-form-schema";

type ThemeColorKey = Exclude<keyof TenantThemeColors, "ring">;
type ThemeColorFieldName = `branding.colors.${ThemeColorKey}`;

const THEME_COLOR_FIELDS: Array<{ key: ThemeColorKey; label: string; description: string }> = [
  { key: "primary", label: "Cor principal", description: "Botões, CTAs e pontos de maior ação." },
  { key: "accent", label: "Cor secundária", description: "Links, tags, highlights e acentos do fluxo." },
  { key: "secondary", label: "Superfícies de apoio", description: "Menus, inputs e áreas neutras do sistema." },
  { key: "background", label: "Plano de fundo", description: "Canvas geral da aplicação e do checkout." },
  { key: "surface", label: "Cards", description: "Blocos internos, resumos e contêineres." },
  { key: "border", label: "Bordas", description: "Divisórias e contornos estruturais." },
  { key: "foreground", label: "Texto principal", description: "Cabeçalhos e textos de alta prioridade." },
  { key: "mutedForeground", label: "Texto auxiliar", description: "Ajuda, labels e informações secundárias." },
  { key: "danger", label: "Estados críticos", description: "Erros, recusas e alertas de risco." },
  { key: "warning", label: "Atenção", description: "Pontos de observação e avisos intermediários." },
  { key: "teal", label: "Confirmação", description: "Sucesso, aprovação e sinal verde operacional." },
];

const PRIMARY_THEME_FIELDS = THEME_COLOR_FIELDS.slice(0, 3);
const SUPPORT_THEME_FIELDS = THEME_COLOR_FIELDS.slice(3);

const EMPTY_FORM_VALUES: AcademiaThemeFormValues = {
  nome: "",
  razaoSocial: "",
  documento: "",
  email: "",
  telefone: "",
  endereco: {
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  },
  branding: {
    appName: "",
    logoUrl: "",
    themePreset: DEFAULT_THEME_PRESET,
    useCustomColors: false,
    colors: {
      accent: "",
      primary: "",
      secondary: "",
      background: "",
      surface: "",
      border: "",
      foreground: "",
      mutedForeground: "",
      danger: "",
      warning: "",
      teal: "",
    },
  },
};

function normalizeHexInput(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  return raw.startsWith("#") ? raw.slice(0, 7) : `#${raw.slice(0, 6)}`;
}

function isValidHexColor(value?: string): value is string {
  return Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value));
}

function blankToUndefined(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function buildFormValues(academia: Academia): AcademiaThemeFormValues {
  const branding = { ...createDefaultBranding(), ...(academia.branding ?? {}) };

  return {
    nome: academia.nome ?? "",
    razaoSocial: academia.razaoSocial ?? "",
    documento: academia.documento ?? "",
    email: academia.email ?? "",
    telefone: academia.telefone ?? "",
    endereco: {
      cep: academia.endereco?.cep ?? "",
      logradouro: academia.endereco?.logradouro ?? "",
      numero: academia.endereco?.numero ?? "",
      complemento: academia.endereco?.complemento ?? "",
      bairro: academia.endereco?.bairro ?? "",
      cidade: academia.endereco?.cidade ?? "",
      estado: academia.endereco?.estado ?? "",
    },
    branding: {
      appName: branding.appName ?? "",
      logoUrl: branding.logoUrl ?? "",
      themePreset: branding.themePreset ?? DEFAULT_THEME_PRESET,
      useCustomColors: branding.useCustomColors ?? false,
      colors: {
        accent: branding.colors?.accent ?? "",
        primary: branding.colors?.primary ?? "",
        secondary: branding.colors?.secondary ?? "",
        background: branding.colors?.background ?? "",
        surface: branding.colors?.surface ?? "",
        border: branding.colors?.border ?? "",
        foreground: branding.colors?.foreground ?? "",
        mutedForeground: branding.colors?.mutedForeground ?? "",
        danger: branding.colors?.danger ?? "",
        warning: branding.colors?.warning ?? "",
        teal: branding.colors?.teal ?? "",
      },
    },
  };
}

function sanitizeCustomColors(colors: AcademiaThemeFormValues["branding"]["colors"]) {
  return Object.fromEntries(
    Object.entries(colors).filter(([, value]) => isValidHexColor(value))
  ) as Partial<Record<ThemeColorKey, string>>;
}

function buildPreviewAcademia(
  values: AcademiaThemeFormValues,
  current: Academia | null
): Academia {
  return {
    id: current?.id ?? "",
    ativo: current?.ativo,
    nome: values.nome,
    razaoSocial: blankToUndefined(values.razaoSocial),
    documento: blankToUndefined(values.documento),
    email: blankToUndefined(values.email),
    telefone: blankToUndefined(values.telefone),
    endereco: {
      cep: blankToUndefined(values.endereco.cep),
      logradouro: blankToUndefined(values.endereco.logradouro),
      numero: blankToUndefined(values.endereco.numero),
      complemento: blankToUndefined(values.endereco.complemento),
      bairro: blankToUndefined(values.endereco.bairro),
      cidade: blankToUndefined(values.endereco.cidade),
      estado: blankToUndefined(values.endereco.estado),
    },
    branding: {
      ...createDefaultBranding(),
      ...(current?.branding ?? {}),
      appName: blankToUndefined(values.branding.appName),
      logoUrl: blankToUndefined(values.branding.logoUrl),
      themePreset: values.branding.themePreset,
      useCustomColors: values.branding.useCustomColors,
      colors: sanitizeCustomColors(values.branding.colors),
    },
  };
}

function FieldMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-gym-danger">{message}</p>;
}

function ThemePreview({
  appName,
  selectedPresetLabel,
  theme,
  unitsCount,
}: {
  appName: string;
  selectedPresetLabel: string;
  theme: TenantThemeColors;
  unitsCount: number;
}) {
  const [previewMode, setPreviewMode] = useState<"checkout" | "portal" | "mobile">("checkout");

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border p-5 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.65)]"
      style={{
        background: `linear-gradient(145deg, ${theme.surface} 0%, ${theme.background} 100%)`,
        borderColor: `${theme.border}80`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(circle at top left, ${theme.primary}22, transparent 38%), radial-gradient(circle at bottom right, ${theme.teal}24, transparent 32%)`,
        }}
      />

      <div className="relative space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {["#ff6b6b", "#ffd166", "#7bd88f"].map((dot) => (
                  <span key={dot} className="size-2.5 rounded-full" style={{ backgroundColor: dot }} />
                ))}
              </div>
              <span className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: theme.mutedForeground }}>
                Preview do tema
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "checkout", label: "Checkout" },
                { id: "portal", label: "Portal" },
                { id: "mobile", label: "Mobile" },
              ].map((item) => {
                const active = previewMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreviewMode(item.id as typeof previewMode)}
                    className="rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-85"
                    style={{
                      borderColor: active ? `${theme.primary}99` : `${theme.border}b8`,
                      backgroundColor: active ? `${theme.primary}20` : `${theme.surface}cc`,
                      color: active ? theme.primary : theme.foreground,
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-full border px-3 py-1 text-[11px] font-medium" style={{ borderColor: `${theme.border}cc`, color: theme.foreground }}>
            {selectedPresetLabel}
          </div>
        </div>

        {previewMode === "checkout" ? (
          <div className="overflow-hidden rounded-[1.5rem] border bg-white/95 shadow-inner" style={{ borderColor: `${theme.border}cc` }}>
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: `${theme.border}66`, backgroundColor: `${theme.background}e6` }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-2xl text-sm font-semibold"
                  style={{ backgroundColor: theme.primary, color: theme.background }}
                >
                  {appName.slice(0, 1).toUpperCase() || "A"}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: theme.foreground }}>{appName}</p>
                  <p className="text-xs" style={{ color: theme.mutedForeground }}>Rede · {Math.max(unitsCount, 1)} unidades</p>
                </div>
              </div>
              <div className="hidden rounded-full px-3 py-1 text-[11px] font-medium md:block" style={{ backgroundColor: `${theme.secondary}cc`, color: theme.foreground }}>
                Tema multi-tenant
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-5 p-5" style={{ backgroundColor: "#ffffff" }}>
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded-full" style={{ backgroundColor: `${theme.border}88` }} />
                  <div className="h-5 w-56 rounded-full" style={{ backgroundColor: `${theme.secondary}aa` }} />
                  <div className="flex gap-2 pt-2">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-12 flex-1 rounded-2xl border" style={{ borderColor: `${theme.border}55`, backgroundColor: `${theme.background}bb` }} />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Cartão de crédito", tone: theme.secondary, active: false },
                    { label: "Pix com desconto", tone: theme.primary, active: true },
                    { label: "Boleto bancário", tone: theme.accent, active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: item.active ? `${theme.primary}66` : `${theme.border}66`,
                        backgroundColor: item.active ? `${theme.primary}14` : "#ffffff",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="size-4 rounded-full border" style={{ borderColor: item.active ? theme.primary : theme.border, backgroundColor: item.active ? theme.primary : "transparent" }} />
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          backgroundColor: item.active ? theme.primary : `${item.tone}20`,
                          color: item.active ? theme.background : item.tone,
                        }}
                      >
                        {item.active ? "ativo" : "alternativo"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-11 rounded-2xl" style={{ backgroundColor: `${theme.background}cc` }} />
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: `${theme.border}66`, backgroundColor: `${theme.surface}b8` }}>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: theme.teal }} />
                    <span className="text-xs font-medium" style={{ color: theme.mutedForeground }}>Checkout acessível preservado</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2 text-xs font-semibold"
                    style={{ backgroundColor: theme.primary, color: theme.background }}
                  >
                    Continuar
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5" style={{ backgroundColor: `${theme.background}f2` }}>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedForeground }}>
                    Vendido por {appName}
                  </p>
                  <div className="h-5 w-32 rounded-full" style={{ backgroundColor: `${theme.secondary}cc` }} />
                </div>

                <div className="space-y-3 rounded-[1.6rem] border p-4" style={{ borderColor: `${theme.border}70`, backgroundColor: "#ffffff" }}>
                  <div className="h-3 w-20 rounded-full" style={{ backgroundColor: `${theme.border}99` }} />
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-3 rounded-full" style={{ backgroundColor: index === 2 ? `${theme.primary}28` : `${theme.secondary}aa`, width: `${100 - index * 4}%` }} />
                  ))}
                  <div className="flex gap-2 pt-2">
                    <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ backgroundColor: theme.primary, color: theme.background }}>
                      1 unidade
                    </span>
                    <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}>
                      checkout guiado
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 rounded-[1.6rem] border p-4" style={{ borderColor: `${theme.border}70`, backgroundColor: "#ffffff" }}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-3 w-16 rounded-full" style={{ backgroundColor: `${theme.border}99` }} />
                      <div className="h-5 w-28 rounded-full" style={{ backgroundColor: `${theme.secondary}aa` }} />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-12 rounded-full" style={{ backgroundColor: `${theme.border}88` }} />
                      <div className="h-5 w-16 rounded-full" style={{ backgroundColor: `${theme.primary}2b` }} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="h-3 w-full rounded-full" style={{ backgroundColor: `${theme.secondary}aa` }} />
                    <div className="h-3 w-5/6 rounded-full" style={{ backgroundColor: `${theme.secondary}82` }} />
                    <div className="h-3 w-2/3 rounded-full" style={{ backgroundColor: `${theme.secondary}66` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {previewMode === "portal" ? (
          <div className="overflow-hidden rounded-[1.5rem] border shadow-inner" style={{ borderColor: `${theme.border}cc`, backgroundColor: theme.background }}>
            <div className="grid min-h-[430px] md:grid-cols-[230px_1fr]">
              <aside className="border-r p-4" style={{ borderColor: `${theme.border}88`, backgroundColor: theme.surface }}>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl text-sm font-semibold" style={{ backgroundColor: theme.primary, color: theme.background }}>
                    {appName.slice(0, 1).toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: theme.foreground }}>{appName}</p>
                    <p className="text-xs" style={{ color: theme.mutedForeground }}>Portal operacional</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {[
                    { label: "Dashboard", active: true },
                    { label: "Clientes", active: false },
                    { label: "Financeiro", active: false },
                    { label: "Configurações", active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl px-3 py-2.5 text-sm font-medium"
                      style={{
                        backgroundColor: item.active ? `${theme.primary}20` : "transparent",
                        color: item.active ? theme.primary : theme.foreground,
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </aside>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between rounded-[1.4rem] border px-4 py-3" style={{ borderColor: `${theme.border}88`, backgroundColor: theme.surface }}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedForeground }}>Visão geral</p>
                    <p className="mt-1 text-base font-semibold" style={{ color: theme.foreground }}>Painel da rede</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2 text-xs font-semibold"
                    style={{ backgroundColor: theme.primary, color: theme.background }}
                  >
                    Nova ação
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Receita", value: "R$ 128k", tone: theme.teal },
                    { label: "Inadimplência", value: "3,2%", tone: theme.warning },
                    { label: "Alertas", value: "5", tone: theme.danger },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.4rem] border p-4" style={{ borderColor: `${theme.border}88`, backgroundColor: theme.surface }}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedForeground }}>{item.label}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-lg font-semibold" style={{ color: theme.foreground }}>{item.value}</p>
                        <span className="size-3 rounded-full" style={{ backgroundColor: item.tone }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[1.5rem] border p-4" style={{ borderColor: `${theme.border}88`, backgroundColor: theme.surface }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: theme.foreground }}>Fluxo operacional</p>
                        <p className="text-xs" style={{ color: theme.mutedForeground }}>Como o tema aparece em listas e status.</p>
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
                        Ativo
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        { label: "Cobranças conciliadas", tone: theme.teal },
                        { label: "Revisão pendente", tone: theme.warning },
                        { label: "Falha em integração", tone: theme.danger },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-2xl border px-3 py-3" style={{ borderColor: `${theme.border}70`, backgroundColor: `${theme.background}c8` }}>
                          <span className="text-sm font-medium" style={{ color: theme.foreground }}>{item.label}</span>
                          <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${item.tone}20`, color: item.tone }}>
                            status
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border p-4" style={{ borderColor: `${theme.border}88`, backgroundColor: theme.surface }}>
                    <p className="text-sm font-semibold" style={{ color: theme.foreground }}>Resumo</p>
                    <div className="mt-4 space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-2 rounded-2xl border p-3" style={{ borderColor: `${theme.border}70`, backgroundColor: `${theme.background}c8` }}>
                          <div className="h-3 w-20 rounded-full" style={{ backgroundColor: `${theme.border}a0` }} />
                          <div className="h-4 w-full rounded-full" style={{ backgroundColor: `${theme.secondary}b0` }} />
                          <div className="h-4 w-4/5 rounded-full" style={{ backgroundColor: `${theme.secondary}80` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {previewMode === "mobile" ? (
          <div className="flex justify-center rounded-[1.5rem] border p-6 shadow-inner" style={{ borderColor: `${theme.border}cc`, backgroundColor: `${theme.background}d8` }}>
            <div className="w-[290px] rounded-[2.2rem] border-[10px] p-3 shadow-2xl" style={{ borderColor: theme.surface, backgroundColor: theme.background }}>
              <div className="mb-3 flex justify-center">
                <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: `${theme.border}cc` }} />
              </div>

              <div className="overflow-hidden rounded-[1.6rem] border" style={{ borderColor: `${theme.border}88`, backgroundColor: theme.surface }}>
                <div className="px-4 pb-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedForeground }}>App da rede</p>
                      <p className="mt-1 text-base font-semibold" style={{ color: theme.foreground }}>{appName}</p>
                    </div>
                    <div className="flex size-11 items-center justify-center rounded-2xl text-sm font-semibold" style={{ backgroundColor: theme.primary, color: theme.background }}>
                      {appName.slice(0, 1).toUpperCase() || "A"}
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.4rem] p-4" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, color: theme.background }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Preview mobile</p>
                    <p className="mt-2 text-lg font-semibold">Tema aplicado em navegação compacta</p>
                    <p className="mt-2 text-xs opacity-85">Bom para app-cliente e experiências rápidas da rede.</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      { label: "Check-in liberado", tone: theme.teal },
                      { label: "Pagamento pendente", tone: theme.warning },
                      { label: "Ação bloqueada", tone: theme.danger },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl border px-3 py-3" style={{ borderColor: `${theme.border}70`, backgroundColor: `${theme.background}c8` }}>
                        <span className="text-sm font-medium" style={{ color: theme.foreground }}>{item.label}</span>
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: item.tone }} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 rounded-[1.3rem] p-2" style={{ backgroundColor: `${theme.secondary}aa` }}>
                    {["Início", "Planos", "Pix", "Perfil"].map((item, index) => (
                      <div
                        key={item}
                        className="rounded-xl px-2 py-2 text-center text-[10px] font-semibold"
                        style={{
                          backgroundColor: index === 0 ? theme.primary : "transparent",
                          color: index === 0 ? theme.background : theme.foreground,
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ColorTokenField({
  control,
  name,
  label,
  description,
  previewValue,
  featured = false,
}: {
  control: ReturnType<typeof useForm<AcademiaThemeFormValues>>["control"];
  name: ThemeColorFieldName;
  label: string;
  description: string;
  previewValue: string;
  featured?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const effectiveColor = isValidHexColor(field.value) ? field.value : previewValue;
        const inherited = !field.value;

        return (
          <div
            className={cn(
              "rounded-[1.6rem] border p-4 transition-colors",
              featured ? "bg-card shadow-sm" : "bg-secondary/20",
              fieldState.error ? "border-gym-danger/40" : "border-border/70"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </div>
              <span
                className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  borderColor: `${effectiveColor}55`,
                  color: effectiveColor,
                  backgroundColor: `${effectiveColor}18`,
                }}
              >
                {effectiveColor}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="color"
                value={effectiveColor}
                onChange={(event) => field.onChange(normalizeHexInput(event.target.value))}
                className="h-12 w-12 rounded-2xl border border-border bg-transparent p-1"
              />
              <div className="flex-1 space-y-2">
                <Input
                  value={field.value}
                  onChange={(event) => field.onChange(normalizeHexInput(event.target.value))}
                  placeholder={previewValue}
                  className="border-border bg-background font-mono text-sm uppercase"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{inherited ? "Herdando a cor do preset selecionado." : "Override customizado ativo."}</span>
                  <button
                    type="button"
                    onClick={() => field.onChange("")}
                    className="font-semibold text-foreground transition-opacity hover:opacity-75"
                  >
                    Usar preset
                  </button>
                </div>
              </div>
            </div>

            <FieldMessage message={fieldState.error?.message} />
          </div>
        );
      }}
    />
  );
}

export function AcademiaContent() {
  const { syncAcademiaBranding } = useTenantContext();
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unitsCount, setUnitsCount] = useState(0);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("dados");

  const form = useForm<AcademiaThemeFormValues>({
    resolver: zodResolver(academiaThemeFormSchema),
    defaultValues: EMPTY_FORM_VALUES,
    mode: "onTouched",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [current, units] = await Promise.all([getAcademiaAtualApi(), listUnidadesApi()]);
      const normalized = { ...current, branding: { ...createDefaultBranding(), ...(current.branding ?? {}) } };
      setAcademia(normalized);
      form.reset(buildFormValues(normalized));
      setUnitsCount(units.length);
    } catch (err) {
      setAcademia(null);
      setUnitsCount(0);
      setLoadError(normalizeErrorMessage(err) || "Falha ao carregar academia.");
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void load();
  }, [load]);

  const watchedValues = form.watch();

  const previewAcademia = useMemo(
    () => buildPreviewAcademia(watchedValues, academia),
    [academia, watchedValues]
  );
  const previewTheme = useMemo(() => resolveTenantTheme(previewAcademia), [previewAcademia]);
  const selectedTheme = useMemo(
    () =>
      TENANT_THEME_OPTIONS.find((item) => item.id === watchedValues.branding.themePreset) ??
      TENANT_THEME_OPTIONS.find((item) => item.id === DEFAULT_THEME_PRESET)!,
    [watchedValues.branding.themePreset]
  );
  const canSave = !saving && !loading && form.formState.isDirty;

  async function handleSave(values: AcademiaThemeFormValues) {
    if (!academia) return;
    setMessage(null);
    setSaving(true);
    try {
      const payload = buildPreviewAcademia(values, academia);
      const updated = await updateAcademiaAtualApi({
        data: payload,
      });
      const normalized = { ...updated, branding: { ...createDefaultBranding(), ...(updated.branding ?? {}) } };
      setAcademia(normalized);
      form.reset(buildFormValues(normalized));
      syncAcademiaBranding(normalized);
      setMessage({ kind: "success", text: "Configuração da rede atualizada com sucesso." });
    } catch (saveError) {
      const { appliedFields } = applyApiFieldErrors(saveError, form.setError);
      setMessage({
        kind: "error",
        text: buildFormApiErrorMessage(saveError, {
          appliedFields,
          fallbackMessage: normalizeErrorMessage(saveError) || "Falha ao salvar academia.",
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading && !academia) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Configuração da academia</h1>
          <p className="mt-1 text-sm text-muted-foreground">Carregando configuração multi-tenant da rede...</p>
        </div>
        <div className="h-64 animate-pulse rounded-[1.75rem] border border-border bg-card/80" />
      </div>
    );
  }

  if (!academia) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Academia</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entidade principal da rede, compartilhada por todas as unidades.</p>
        </div>
        <PageError error={loadError} onRetry={load} />
        {!loadError && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Carregando academia...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 border-border/70">
              <Store className="size-3.5" />
              Rede / Academia
            </Badge>
            <Badge variant="outline" className="gap-1 border-border/70">
              <ShieldCheck className="size-3.5" />
              Multi-tenant
            </Badge>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Configuração da academia</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Branding, identidade e tema aplicados na rede inteira. Alterações aqui não pertencem a uma unidade isolada.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Escopo</p>
            <p className="mt-2 text-base font-semibold text-foreground">Rede inteira</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Unidades afetadas</p>
            <p className="mt-2 text-base font-semibold text-foreground">{Math.max(unitsCount, 1)} unidades</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preset atual</p>
            <p className="mt-2 text-base font-semibold text-foreground">{selectedTheme.nome}</p>
          </div>
        </div>
      </div>

      {message ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            message.kind === "success"
              ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
              : "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
          )}
        >
          {message.text}
        </div>
      ) : null}

      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid h-auto grid-cols-2 gap-1 rounded-2xl bg-secondary/50 p-1 md:w-fit">
            <TabsTrigger value="dados" className="rounded-xl px-4 py-2">
              <Building2 className="mr-2 size-4" />
              Dados da rede
            </TabsTrigger>
            <TabsTrigger value="tema" className="rounded-xl px-4 py-2">
              <Palette className="mr-2 size-4" />
              Tema do checkout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-6">
            <Card className="border-border/70 bg-card/95">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dados principais</p>
                    <h2 className="mt-2 text-lg font-semibold text-foreground">Identidade institucional da rede</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esses dados alimentam os títulos operacionais e a identificação central da academia.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="nome">Nome da academia</Label>
                      <Input id="nome" {...form.register("nome")} className="border-border bg-secondary/35" />
                      <FieldMessage message={form.formState.errors.nome?.message} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="razaoSocial">Razão social</Label>
                      <Input id="razaoSocial" {...form.register("razaoSocial")} className="border-border bg-secondary/35" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="documento">Documento</Label>
                      <Input id="documento" {...form.register("documento")} className="border-border bg-secondary/35" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" {...form.register("email")} className="border-border bg-secondary/35" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Controller
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <PhoneInput value={field.value ?? ""} onChange={field.onChange} className="border-border bg-secondary/35" />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-border/70 bg-secondary/20 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <MonitorSmartphone className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Escopo de aplicação</p>
                      <p className="text-sm text-muted-foreground">Tudo aqui reflete no shell, no checkout e nas páginas da rede.</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      "Academia é a entidade principal e distribui branding para todas as unidades.",
                      "A customização de tema é da rede, não da unidade ativa.",
                      "O backend continua como fonte de verdade do payload salvo em branding.",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl bg-card/80 p-3">
                        <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                          <Check className="size-3" />
                        </span>
                        <p className="text-sm text-muted-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95">
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Endereço da sede</p>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">Base administrativa da rede</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cep">CEP</Label>
                    <Controller
                      control={form.control}
                      name="endereco.cep"
                      render={({ field }) => (
                        <MaskedInput mask="cep" value={field.value ?? ""} onChange={field.onChange} className="border-border bg-secondary/35" />
                      )}
                    />
                  </div>
                  <div className="space-y-1.5 lg:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input id="logradouro" {...form.register("endereco.logradouro")} className="border-border bg-secondary/35" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" {...form.register("endereco.numero")} className="border-border bg-secondary/35" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input id="complemento" {...form.register("endereco.complemento")} className="border-border bg-secondary/35" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" {...form.register("endereco.bairro")} className="border-border bg-secondary/35" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" {...form.register("endereco.cidade")} className="border-border bg-secondary/35" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="estado">Estado</Label>
                    <Input id="estado" {...form.register("endereco.estado")} className="border-border bg-secondary/35" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tema" className="space-y-6">
            <Card className="overflow-hidden border-border/70 bg-card/95">
              <CardContent className="grid gap-6 p-6 xl:grid-cols-[0.96fr_1.04fr]">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-fit gap-1 border-border/70">
                      <Sparkles className="size-3.5" />
                      Inspiração checkout-first
                    </Badge>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Área de customização da marca da rede</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Reorganizamos a configuração para ficar próxima do modelo de preview guiado do checkout: preview maior, presets claros e cores assistidas.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Escopo</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">Configuração da Rede / Academia</p>
                      <p className="mt-1 text-xs text-muted-foreground">Não depende da unidade ativa.</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Aplicação</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">Shell + checkout + fluxos públicos</p>
                      <p className="mt-1 text-xs text-muted-foreground">Tudo sai do mesmo `branding` da academia.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="branding.appName">Nome da marca no sistema</Label>
                      <Input
                        id="branding.appName"
                        {...form.register("branding.appName")}
                        placeholder="Ex.: Conceito Fit"
                        className="border-border bg-secondary/35"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="branding.logoUrl">URL do logo</Label>
                      <Input
                        id="branding.logoUrl"
                        {...form.register("branding.logoUrl")}
                        placeholder="https://..."
                        className="border-border bg-secondary/35"
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-border/70 bg-secondary/15 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Preset base</p>
                        <p className="text-xs text-muted-foreground">Escolha a direção visual antes do ajuste fino.</p>
                      </div>
                      <Controller
                        control={form.control}
                        name="branding.themePreset"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={(value) => field.onChange(value as TenantThemePreset)}>
                            <SelectTrigger className="w-[220px] border-border bg-background">
                              <SelectValue placeholder="Selecione o preset" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-card">
                              {TENANT_THEME_OPTIONS.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {TENANT_THEME_OPTIONS.map((option) => {
                        const palette = TENANT_THEME_PRESETS[option.id];
                        const selected = option.id === watchedValues.branding.themePreset;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => form.setValue("branding.themePreset", option.id, { shouldDirty: true })}
                            className={cn(
                              "rounded-[1.35rem] border p-4 text-left transition-all",
                              selected
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border/70 bg-card hover:border-primary/30 hover:bg-primary/5"
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{option.nome}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{option.descricao}</p>
                              </div>
                              {selected ? (
                                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <Check className="size-3.5" />
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-4 grid grid-cols-5 gap-2">
                              {[palette.primary, palette.secondary, palette.surface, palette.teal, palette.danger].map((color) => (
                                <span key={color} className="h-8 rounded-xl border" style={{ backgroundColor: color, borderColor: `${color}99` }} />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <ThemePreview
                  appName={previewAcademia.branding?.appName?.trim() || previewAcademia.nome?.trim() || "Sua rede"}
                  selectedPresetLabel={selectedTheme.nome}
                  theme={previewTheme}
                  unitsCount={unitsCount}
                />
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95">
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Personalização manual das cores</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ao ativar, a rede sobrescreve o preset base com tokens específicos, mantendo o mesmo escopo para todas as unidades.
                    </p>
                  </div>

                  <Controller
                    control={form.control}
                    name="branding.useCustomColors"
                    render={({ field }) => (
                      <div className="flex items-center gap-3 rounded-full border border-border/70 bg-secondary/20 px-4 py-2">
                        <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Usar cores customizadas</p>
                          <p className="text-xs text-muted-foreground">
                            {field.value ? "Overrides ativos" : "Somente preset base"}
                          </p>
                        </div>
                      </div>
                    )}
                  />
                </div>

                {watchedValues.branding.useCustomColors ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 xl:grid-cols-3">
                      {PRIMARY_THEME_FIELDS.map((field) => (
                        <ColorTokenField
                          key={field.key}
                          control={form.control}
                          name={`branding.colors.${field.key}`}
                          label={field.label}
                          description={field.description}
                          previewValue={previewTheme[field.key]}
                          featured
                        />
                      ))}
                    </div>

                    <div className="rounded-[1.7rem] border border-border/70 bg-secondary/10 p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Paleta expandida</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ajuste contraste, mensagens de estado e superfícies secundárias sem sair do branding da rede.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-border bg-background"
                          onClick={() => {
                            for (const field of THEME_COLOR_FIELDS) {
                              form.setValue(`branding.colors.${field.key}`, "", { shouldDirty: true });
                            }
                          }}
                        >
                          <BrushCleaning className="mr-2 size-4" />
                          Limpar overrides
                        </Button>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {SUPPORT_THEME_FIELDS.map((field) => (
                          <ColorTokenField
                            key={field.key}
                            control={form.control}
                            name={`branding.colors.${field.key}`}
                            label={field.label}
                            description={field.description}
                            previewValue={previewTheme[field.key]}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.7rem] border border-dashed border-border/70 bg-secondary/15 p-5">
                    <p className="text-sm font-semibold text-foreground">Preset governando a experiência</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      O preset <strong>{selectedTheme.nome}</strong> está controlando toda a paleta. Ative a personalização manual apenas quando precisar sair dessa base.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-5">
                      {[previewTheme.primary, previewTheme.secondary, previewTheme.surface, previewTheme.accent, previewTheme.teal].map((color) => (
                        <div key={color} className="rounded-2xl border px-3 py-4 text-center font-mono text-xs" style={{ backgroundColor: `${color}18`, borderColor: `${color}44`, color }}>
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/95 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Salvar configuração da rede</p>
            <p className="text-xs text-muted-foreground">
              O payload continua sendo salvo em `Academia.branding`, preservando o escopo multi-tenant da rede.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-border bg-background"
              onClick={() => {
                if (!academia) return;
                form.reset(buildFormValues(academia));
                setMessage(null);
              }}
              disabled={saving || !form.formState.isDirty}
            >
              Descartar alterações
            </Button>
            <Button type="submit" disabled={!canSave}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
