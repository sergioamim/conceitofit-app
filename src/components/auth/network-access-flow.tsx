"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getAccessNetworkContextApi,
  loginApi,
  requestFirstAccessApi,
  requestPasswordRecoveryApi,
  type AccessNetworkContext,
} from "@/lib/api/auth";
import { getTenantContextApi, setTenantContextApi } from "@/lib/api/contexto-unidades";
import { getAccessToken, getPreferredTenantId, setPreferredTenantId } from "@/lib/api/session";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import { buildNetworkAccessHref } from "@/lib/network-subdomain";
import type { Tenant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FlowMode = "login" | "recovery" | "first-access";
type LoginStep = "LOGIN" | "TENANT";

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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<LoginStep>("LOGIN");
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadContext() {
      setLoadingContext(true);
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
        setError(nextError);
      } finally {
        if (mounted) setLoadingContext(false);
      }
    }

    void loadContext();
    return () => {
      mounted = false;
    };
  }, [networkSubdomain]);

  useEffect(() => {
    if (mode === "login" && getAccessToken()) {
      router.replace(resolvedNextPath);
    }
  }, [mode, resolvedNextPath, router]);

  async function finalizeTenantStep(targetTenantId: string) {
    await setTenantContextApi(targetTenantId);
    setPreferredTenantId(targetTenantId);
    router.push(resolvedNextPath);
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await loginApi({
        identifier: identifier.trim(),
        password,
        redeIdentifier: networkSubdomain,
        channel: "APP",
      });

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

      setTenantOptions(activeTenants);
      setTenantId(tenantContext.currentTenantId || activeTenants[0]?.id || "");
      setStep("TENANT");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao autenticar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCredentialFlowSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response =
        mode === "recovery"
          ? await requestPasswordRecoveryApi({
              redeIdentifier: networkSubdomain,
              identifier,
              channel: "APP",
            })
          : await requestFirstAccessApi({
              redeIdentifier: networkSubdomain,
              identifier,
              channel: "APP",
            });

      setSuccessMessage(response.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir a solicitação.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePreferredTenant() {
    if (!tenantId) {
      setError("Selecione a unidade ativa para continuar.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await finalizeTenantStep(tenantId);
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
    appName: "Acesso por rede",
    supportText: "Autentique-se no contexto correto da rede para evitar conflitos entre identidades iguais.",
    accentLabel: "Acesso por rede",
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,#f7f6f1_0%,#fbfbf8_100%)] px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gym-accent">
            {resolvedContext.accentLabel ?? "Acesso contextual"}
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
                {resolvedContext.appName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {buildDescription(mode, resolvedContext.name)}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rede</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{resolvedContext.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Subdomínio: {resolvedContext.subdomain}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Identificador</p>
                <p className="mt-1 text-sm text-foreground">E-mail ou CPF no mesmo campo</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Separação</p>
                <p className="mt-1 text-sm text-foreground">Recuperação e primeiro acesso isolados por rede</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-border bg-background/80 px-5 py-5">
              <p className="text-sm font-semibold text-foreground">Orientação desta rede</p>
              <p className="mt-2 text-sm text-muted-foreground">{resolvedContext.supportText}</p>
              {resolvedContext.helpEmail ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Suporte: <span className="font-medium text-foreground">{resolvedContext.helpEmail}</span>
                </p>
              ) : null}
              {contextError ? <p className="mt-3 text-sm text-gym-danger">{contextError}</p> : null}
            </div>
          </div>
        </section>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>{step === "TENANT" ? "Escolha a unidade ativa" : buildTitle(mode)}</CardTitle>
            <CardDescription>
              {step === "TENANT"
                ? "Sua unidade-base estrutural pode ser diferente da unidade ativa desta sessão."
                : buildDescription(mode, resolvedContext.name)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingContext ? (
              <p className="text-sm text-muted-foreground">Carregando branding e instruções da rede...</p>
            ) : null}

            {!loadingContext && contextError ? (
              <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/5 px-4 py-3 text-sm text-gym-danger">
                Esta URL não corresponde a uma rede válida ou a rede não está disponível no momento.
              </div>
            ) : null}

            {step === "TENANT" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Unidade ativa da sessão</Label>
                  <Select value={tenantId || "__empty__"} onValueChange={(value) => setTenantId(value === "__empty__" ? "" : value)}>
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
                </div>
                <p className="text-xs text-muted-foreground">
                  Essa seleção afeta apenas o contexto operacional atual. A unidade-base continua sendo tratada separadamente pela sessão.
                </p>
                {error ? <p className="text-sm text-gym-danger">{error}</p> : null}
                <Button type="button" className="w-full" onClick={handleSavePreferredTenant} disabled={saving}>
                  {saving ? "Confirmando..." : "Continuar"}
                </Button>
              </div>
            ) : mode === "login" ? (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="network-access-identifier">Identificador</Label>
                  <Input
                    id="network-access-identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="Seu e-mail ou CPF"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network-access-password">Senha</Label>
                  <Input
                    id="network-access-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                {error ? <p className="text-sm text-gym-danger">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={saving || loadingContext || Boolean(contextError)}>
                  {saving ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleCredentialFlowSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="network-access-identifier">Identificador</Label>
                  <Input
                    id="network-access-identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="Seu e-mail ou CPF"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    required
                  />
                </div>
                {error ? <p className="text-sm text-gym-danger">{error}</p> : null}
                {successMessage ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {successMessage}
                  </div>
                ) : null}
                <Button type="submit" className="w-full" disabled={saving || loadingContext || Boolean(contextError)}>
                  {saving
                    ? "Enviando..."
                    : mode === "recovery"
                      ? "Enviar instruções"
                      : "Solicitar primeiro acesso"}
                </Button>
              </form>
            )}

            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <Link className="font-medium text-foreground hover:underline" href={buildNetworkAccessHref("login", networkSubdomain)}>
                Voltar ao login
              </Link>
              <Link className="font-medium text-foreground hover:underline" href={buildNetworkAccessHref("forgot-password", networkSubdomain)}>
                Recuperar senha
              </Link>
              <Link className="font-medium text-foreground hover:underline" href={buildNetworkAccessHref("first-access", networkSubdomain)}>
                Primeiro acesso
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
