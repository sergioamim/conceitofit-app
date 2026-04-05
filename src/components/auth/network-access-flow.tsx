"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getAccessNetworkContextApi,
  loginApi,
  requestFirstAccessApi,
  requestPasswordRecoveryApi,
  type AccessNetworkContext,
} from "@/lib/api/auth";
import { getTenantContextApi, setTenantContextApi } from "@/lib/api/contexto-unidades";
import { getPreferredTenantId, hasActiveSession, setPreferredTenantId } from "@/lib/api/session";
import { buildForcedPasswordChangeHref, resolvePostLoginPath } from "@/lib/tenant/auth-redirect";
import { buildNetworkAccessHref } from "@/lib/network-subdomain";
import {
  networkCredentialFormSchema,
  networkLoginFormSchema,
  tenantStepFormSchema,
} from "@/lib/tenant/forms/auth-schemas";
import type { Tenant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FlowMode = "login" | "recovery" | "first-access";
type LoginStep = "LOGIN" | "TENANT";
const NETWORK_CONTEXT_TIMEOUT_MS = 4_000;

type LoginFormValues = import("zod").input<typeof networkLoginFormSchema>;
type CredentialFormValues = import("zod").input<typeof networkCredentialFormSchema>;
type TenantStepFormValues = import("zod").input<typeof tenantStepFormSchema>;

function buildTitle(mode: FlowMode) {
  switch (mode) {
    case "recovery":
      return "Recuperar senha";
    case "first-access":
      return "Primeiro acesso";
    default:
      return "Acesso por rede";
  }
}

function buildDescription(mode: FlowMode, networkName: string) {
  switch (mode) {
    case "recovery":
      return `Informe seu identificador em ${networkName}. A recuperação vale apenas para esta rede.`;
    case "first-access":
      return `Ative sua credencial no contexto de ${networkName} sem misturar contas de outras redes.`;
    default:
      return `Use e-mail ou CPF vinculado a ${networkName}. A autenticação respeita o contexto da rede atual.`;
  }
}

export function NetworkAccessFlow({
  networkSubdomain,
  nextPath,
  mode,
}: {
  networkSubdomain: string;
  nextPath?: string | null;
  mode: FlowMode;
}) {
  const router = useRouter();
  const resolvedNextPath = useMemo(() => resolvePostLoginPath(nextPath), [nextPath]);
  const [context, setContext] = useState<AccessNetworkContext | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const [step, setStep] = useState<LoginStep>("LOGIN");
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(networkLoginFormSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  const credentialForm = useForm<CredentialFormValues>({
    resolver: zodResolver(networkCredentialFormSchema),
    defaultValues: {
      identifier: "",
    },
  });
  const tenantForm = useForm<TenantStepFormValues>({
    resolver: zodResolver(tenantStepFormSchema),
    defaultValues: {
      tenantId: "",
    },
  });

  useEffect(() => {
    let mounted = true;
    const timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      setLoadingContext(false);
      setContextError((current) => current ?? "Tempo esgotado ao carregar o contexto da rede.");
    }, NETWORK_CONTEXT_TIMEOUT_MS);

    async function loadContext() {
      setLoadingContext(true);
      setContextError(null);
      try {
        const response = await getAccessNetworkContextApi(networkSubdomain, { allowDefaultFallback: false });
        if (!mounted) return;
        setContext(response);
        setContextError(null);
        setError(null);
      } catch (loadError) {
        if (!mounted) return;
        const nextError =
          loadError instanceof Error ? loadError.message : "Não foi possível carregar o contexto da rede.";
        setContext(null);
        setContextError(nextError);
      } finally {
        if (mounted) setLoadingContext(false);
        window.clearTimeout(timeoutId);
      }
    }

    void loadContext();
    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [networkSubdomain]);

  useEffect(() => {
    if (mode === "login" && hasActiveSession()) {
      router.replace(resolvedNextPath);
    }
  }, [mode, resolvedNextPath, router]);

  useEffect(() => {
    if (mode !== "login") return;
    void router.prefetch(resolvedNextPath);
    void router.prefetch(buildForcedPasswordChangeHref(resolvedNextPath));
  }, [mode, resolvedNextPath, router]);

  useEffect(() => {
    loginForm.reset({
      identifier: "",
      password: "",
    });
    credentialForm.reset({
      identifier: "",
    });
    tenantForm.reset({
      tenantId: "",
    });
    setError(null);
    setSuccessMessage(null);
    setStep("LOGIN");
    setTenantOptions([]);
  }, [credentialForm, loginForm, mode, networkSubdomain, tenantForm]);

  async function finalizeTenantStep(targetTenantId: string) {
    await setTenantContextApi(targetTenantId);
    setPreferredTenantId(targetTenantId);
    queryClient.clear();
    router.replace(resolvedNextPath);
    router.refresh();
  }

  async function handleLoginSubmit(values: LoginFormValues) {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const session = await loginApi({
        identifier: values.identifier.trim(),
        password: values.password,
        redeIdentifier: networkSubdomain,
        channel: "APP",
      });

      if (session.forcePasswordChangeRequired) {
        router.replace(buildForcedPasswordChangeHref(resolvedNextPath));
        return;
      }

      const tenantContext = await getTenantContextApi();
      const activeTenants = tenantContext.unidadesDisponiveis.filter((item) => item.ativo !== false);
      const preferredTenantId = getPreferredTenantId();
      const preferredIsValid =
        preferredTenantId && activeTenants.some((item) => item.id === preferredTenantId);

      if (preferredIsValid && preferredTenantId) {
        await finalizeTenantStep(preferredTenantId);
        return;
      }

      if (activeTenants.length === 1) {
        const fallbackTenantId = tenantContext.currentTenantId || activeTenants[0]?.id;
        if (fallbackTenantId) {
          await finalizeTenantStep(fallbackTenantId);
          return;
        }
      }

      const nextTenantId = tenantContext.currentTenantId || activeTenants[0]?.id || "";
      setTenantOptions(activeTenants);
      tenantForm.reset({ tenantId: nextTenantId });
      setStep("TENANT");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao autenticar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCredentialFlowSubmit(values: CredentialFormValues) {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response =
        mode === "recovery"
          ? await requestPasswordRecoveryApi({
              redeIdentifier: networkSubdomain,
              identifier: values.identifier.trim(),
              channel: "APP",
            })
          : await requestFirstAccessApi({
              redeIdentifier: networkSubdomain,
              identifier: values.identifier.trim(),
              channel: "APP",
            });

      setSuccessMessage(response.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir a solicitação.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePreferredTenant(values: TenantStepFormValues) {
    setSaving(true);
    setError(null);
    try {
      await finalizeTenantStep(values.tenantId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível definir a unidade ativa.");
    } finally {
      setSaving(false);
    }
  }

  const resolvedContext = context ?? {
    subdomain: networkSubdomain,
    slug: networkSubdomain,
    name: networkSubdomain,
    appName: "Acesso",
    supportText: "Autentique-se no contexto correto da rede.",
    accentLabel: "Acesso por rede",
  };
  const canonicalNetworkSubdomain = resolvedContext.subdomain || networkSubdomain;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md border-border/70 bg-card shadow-sm">
        <CardHeader className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {resolvedContext.accentLabel ?? "Acesso por rede"}
            </p>
            <CardTitle>
              <h1 className="text-inherit">
                {step === "TENANT"
                  ? "Escolha a unidade ativa"
                  : mode === "login"
                    ? resolvedContext.appName || buildTitle(mode)
                    : buildTitle(mode)}
              </h1>
            </CardTitle>
            <CardDescription>
              {step === "TENANT"
                ? "Sua unidade-base estrutural pode ser diferente da unidade ativa desta sessão."
                : buildDescription(mode, resolvedContext.name)}
            </CardDescription>
          </div>

          {step !== "TENANT" ? (
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-3 text-sm">
              <p className="font-medium text-foreground">{resolvedContext.name}</p>
              <p className="mt-1 text-muted-foreground">Subdomínio: {resolvedContext.subdomain}</p>
              {resolvedContext.helpEmail ? (
                <p className="mt-1 text-muted-foreground">Suporte: {resolvedContext.helpEmail}</p>
              ) : null}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4">
          {loadingContext ? <p className="text-sm text-muted-foreground">Carregando contexto da rede...</p> : null}

          {!loadingContext && contextError ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              Não foi possível carregar o contexto visual da rede agora. Você ainda pode continuar e validar o acesso no envio.
            </div>
          ) : null}

          {step === "TENANT" ? (
            <form className="space-y-4" onSubmit={tenantForm.handleSubmit(handleSavePreferredTenant)}>
              <div className="space-y-2">
                <Label>Unidade ativa da sessão</Label>
                <Controller
                  control={tenantForm.control}
                  name="tenantId"
                  render={({ field }) => (
                    <Select value={field.value || "__empty__"} onValueChange={(value) => field.onChange(value === "__empty__" ? "" : value)}>
                      <SelectTrigger aria-label="Selecionar unidade ativa">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">Selecione</SelectItem>
                        {tenantOptions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">Essa seleção afeta apenas o contexto operacional atual.</p>
              {error ? <p className="text-sm text-gym-danger">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Confirmando..." : "Continuar"}
              </Button>
            </form>
          ) : mode === "login" ? (
            <form className="space-y-4" onSubmit={loginForm.handleSubmit(handleLoginSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="network-access-identifier">Identificador</Label>
                <Input
                  id="network-access-identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Seu e-mail ou CPF"
                  disabled={saving}
                  {...loginForm.register("identifier")}
                />
                {loginForm.formState.errors.identifier ? (
                  <p className="text-xs text-gym-danger">{loginForm.formState.errors.identifier.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="network-access-password">Senha</Label>
                <Input
                  id="network-access-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  disabled={saving}
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password ? (
                  <p className="text-xs text-gym-danger">{loginForm.formState.errors.password.message}</p>
                ) : null}
              </div>
              {error ? <p className="text-sm text-gym-danger">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={credentialForm.handleSubmit(handleCredentialFlowSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="network-access-identifier">Identificador</Label>
                <Input
                  id="network-access-identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Seu e-mail ou CPF"
                  disabled={saving}
                  {...credentialForm.register("identifier")}
                />
                {credentialForm.formState.errors.identifier ? (
                  <p className="text-xs text-gym-danger">{credentialForm.formState.errors.identifier.message}</p>
                ) : null}
              </div>
              {error ? <p className="text-sm text-gym-danger">{error}</p> : null}
              {successMessage ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
                  {successMessage}
                </div>
              ) : null}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Enviando..." : mode === "recovery" ? "Enviar instruções" : "Solicitar primeiro acesso"}
              </Button>
            </form>
          )}

          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <Link className="font-medium text-foreground hover:underline" href={buildNetworkAccessHref("login", canonicalNetworkSubdomain)}>
              Voltar ao login
            </Link>
            <Link className="font-medium text-foreground hover:underline" href={buildNetworkAccessHref("forgot-password", canonicalNetworkSubdomain)}>
              Recuperar senha
            </Link>
            <Link className="font-medium text-foreground hover:underline" href={buildNetworkAccessHref("first-access", canonicalNetworkSubdomain)}>
              Primeiro acesso
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
