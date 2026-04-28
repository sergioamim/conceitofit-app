"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@/lib/forms/zod-resolver";
import {
  getAccessibleContextsApi,
  loginApi,
  type AccessibleNetworkContext,
  type AccessibleNetworkUnit,
} from "@/lib/api/auth";
import { setTenantContextApi } from "@/lib/api/contexto-unidades";
import {
  getAuthSessionSnapshot,
  getPreferredTenantId,
  hasActiveSession,
  setPreferredTenantId,
} from "@/lib/api/session";
import {
  buildForcedPasswordChangeHref,
  resolveHomeForSession,
  resolvePostLoginPath,
  resolvePostLoginPathForSession,
} from "@/lib/tenant/auth-redirect";
import { persistTenantThemeCookie } from "@/lib/tenant/theme-cookie";
import { isPlatformUser } from "@/lib/shared/user-kind";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const globalLoginSchema = z.object({
  identifier: z.string().trim().min(1, "Informe e-mail, CPF ou usuário."),
  password: z.string().min(1, "Informe a senha."),
});

const tenantStepSchema = z.object({
  tenantId: z.string().trim().min(1, "Escolha uma unidade."),
});

type GlobalLoginForm = z.infer<typeof globalLoginSchema>;
type TenantStepForm = z.infer<typeof tenantStepSchema>;
type LoginStep = "LOGIN" | "REDE" | "TENANT";

export function GlobalLoginFlow({
  nextPath,
  reason,
}: {
  nextPath?: string | null;
  reason?: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedNextPath = useMemo(() => resolvePostLoginPath(nextPath), [nextPath]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<LoginStep>("LOGIN");
  const [accessibleContexts, setAccessibleContexts] = useState<AccessibleNetworkContext[]>([]);
  const [selectedRedeId, setSelectedRedeId] = useState<string>("");
  const [tenantOptions, setTenantOptions] = useState<AccessibleNetworkUnit[]>([]);

  const loginForm = useForm<GlobalLoginForm>({
    resolver: zodResolver(globalLoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  const tenantForm = useForm<TenantStepForm>({
    resolver: zodResolver(tenantStepSchema),
    defaultValues: {
      tenantId: "",
    },
  });

  useEffect(() => {
    if (!hasActiveSession()) return;
    const session = getAuthSessionSnapshot();
    router.replace(session ? resolvePostLoginPathForSession(resolvedNextPath, session) : resolvedNextPath);
  }, [resolvedNextPath, router]);

  useEffect(() => {
    void router.prefetch(resolvedNextPath);
    void router.prefetch(buildForcedPasswordChangeHref(resolvedNextPath));
  }, [resolvedNextPath, router]);

  async function finalizeTenantStep(targetTenantId: string) {
    const tenantContext = await setTenantContextApi(targetTenantId);
    persistTenantThemeCookie({
      tenantId: tenantContext.currentTenantId || targetTenantId,
      tenant: tenantContext.tenantAtual,
    });
    setPreferredTenantId(targetTenantId);
    queryClient.clear();
    router.replace(resolvedNextPath);
    router.refresh();
  }

  async function resolveRedeSelection(
    rede: AccessibleNetworkContext,
    activeTenantId?: string | null,
  ) {
    const preferredTenantId = getPreferredTenantId()?.trim();
    const preferredIsValid =
      preferredTenantId && rede.unidades.some((item) => item.id === preferredTenantId);
    if (preferredIsValid && preferredTenantId) {
      await finalizeTenantStep(preferredTenantId);
      return;
    }

    if (rede.unidades.length === 1 && rede.unidades[0]) {
      await finalizeTenantStep(rede.unidades[0].id);
      return;
    }

    const fallbackTenantId = activeTenantId && rede.unidades.some((item) => item.id === activeTenantId)
      ? activeTenantId
      : rede.unidades[0]?.id ?? "";

    setSelectedRedeId(rede.redeId);
    setTenantOptions(rede.unidades);
    tenantForm.reset({ tenantId: fallbackTenantId });
    setStep("TENANT");
  }

  async function handleLoginSubmit(values: GlobalLoginForm) {
    setSaving(true);
    setError(null);

    try {
      const session = await loginApi({
        identifier: values.identifier.trim(),
        password: values.password,
        channel: "WEB",
      });

      if (session.forcePasswordChangeRequired) {
        router.replace(buildForcedPasswordChangeHref(resolvedNextPath));
        return;
      }

      if (isPlatformUser(session)) {
        router.replace(resolveHomeForSession(session));
        return;
      }

      const contexts = await getAccessibleContextsApi();
      const redes = contexts.redes.filter((rede) => rede.unidades.length > 0);
      if (redes.length === 0) {
        throw new Error("Nenhum contexto operacional disponível para esta conta.");
      }

      setAccessibleContexts(redes);
      if (redes.length === 1) {
        await resolveRedeSelection(redes[0], session.activeTenantId);
        return;
      }

      setSelectedRedeId("");
      setTenantOptions([]);
      setStep("REDE");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao autenticar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRedeContinue() {
    if (!selectedRedeId) {
      setError("Escolha uma rede para continuar.");
      return;
    }
    const rede = accessibleContexts.find((item) => item.redeId === selectedRedeId);
    if (!rede) {
      setError("Rede selecionada não está mais disponível.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await resolveRedeSelection(rede, null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível definir o contexto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTenantSubmit(values: TenantStepForm) {
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

  const selectedRede = accessibleContexts.find((item) => item.redeId === selectedRedeId) ?? null;
  const title = step === "LOGIN"
    ? "Conceito Fit"
    : step === "REDE"
      ? "Escolha a rede"
      : "Escolha a unidade";
  const description = step === "LOGIN"
    ? "Acesso global da plataforma. Operadores entram no contexto correto após autenticar."
    : step === "REDE"
      ? "Sua conta tem acesso a mais de uma rede. Escolha o contexto para continuar."
      : `Selecione a unidade ativa${selectedRede ? ` em ${selectedRede.redeName}` : ""}.`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {step === "LOGIN" ? "Acesso global" : "Contexto operacional"}
            </p>
            <CardTitle>
              <h1 className="font-display text-xl font-bold">{title}</h1>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {reason === "backoffice-reauth" ? (
            <div className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
              Sua sessão administrativa precisa ser autenticada novamente para voltar ao backoffice.
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {step === "LOGIN" ? (
            <form className="space-y-4" onSubmit={loginForm.handleSubmit(handleLoginSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="global-identifier">E-mail, CPF ou usuário</Label>
                <Input
                  id="global-identifier"
                  autoComplete="username"
                  placeholder="ana@conceito.fit"
                  className="border-border bg-secondary"
                  {...loginForm.register("identifier")}
                />
                {loginForm.formState.errors.identifier ? (
                  <p className="text-xs text-gym-danger">{loginForm.formState.errors.identifier.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="global-password">Senha</Label>
                <Input
                  id="global-password"
                  type="password"
                  autoComplete="current-password"
                  className="border-border bg-secondary"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password ? (
                  <p className="text-xs text-gym-danger">{loginForm.formState.errors.password.message}</p>
                ) : null}
              </div>
              {error ? (
                <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
                  {error}
                </div>
              ) : null}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Entrando..." : "Entrar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={saving}
                onClick={() => router.push("/admin-login")}
              >
                Usar login administrativo
              </Button>
            </form>
          ) : null}

          {step === "REDE" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="global-rede">Rede</Label>
                <Select value={selectedRedeId} onValueChange={setSelectedRedeId}>
                  <SelectTrigger id="global-rede">
                    <SelectValue placeholder="Selecione a rede" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessibleContexts.map((rede) => (
                      <SelectItem key={rede.redeId} value={rede.redeId}>
                        {rede.redeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error ? (
                <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
                  {error}
                </div>
              ) : null}
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("LOGIN")} disabled={saving}>
                  Voltar
                </Button>
                <Button type="button" className="flex-1" onClick={handleRedeContinue} disabled={saving}>
                  {saving ? "Carregando..." : "Continuar"}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "TENANT" ? (
            <form className="space-y-4" onSubmit={tenantForm.handleSubmit(handleTenantSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="global-tenant">Unidade</Label>
                <Select
                  value={tenantForm.watch("tenantId")}
                  onValueChange={(tenantId) => tenantForm.setValue("tenantId", tenantId, { shouldValidate: true })}
                >
                  <SelectTrigger id="global-tenant">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantOptions.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.nome}{tenant.matriz ? " (Matriz)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tenantForm.formState.errors.tenantId ? (
                  <p className="text-xs text-gym-danger">{tenantForm.formState.errors.tenantId.message}</p>
                ) : null}
              </div>
              {error ? (
                <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
                  {error}
                </div>
              ) : null}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(accessibleContexts.length > 1 ? "REDE" : "LOGIN")}
                  disabled={saving}
                >
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Entrando..." : "Entrar na unidade"}
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
