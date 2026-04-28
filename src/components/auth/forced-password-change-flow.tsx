"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { changeForcedPasswordApi } from "@/lib/api/auth";
import {
  AUTH_SESSION_CLEARED_EVENT,
  AUTH_SESSION_UPDATED_EVENT,
  getForcePasswordChangeRequiredFromSession,
  getNetworkNameFromSession,
  getNetworkSubdomainFromSession,
  hasActiveSession,
} from "@/lib/api/session";
import { buildLoginHref, resolvePostLoginPath } from "@/lib/tenant/auth-redirect";
import { forcedPasswordChangeFormSchema } from "@/lib/tenant/forms/auth-schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ForcedPasswordChangeFormValues = import("zod").input<typeof forcedPasswordChangeFormSchema>;
type GuardStatus = "checking" | "allowed" | "redirecting" | "error";
const FIRST_ACCESS_GUARD_TIMEOUT_MS = 4_000;

export function ForcedPasswordChangeFlow({
  nextPath,
}: {
  nextPath?: string | null;
}) {
  const router = useRouter();
  const resolvedNextPath = useMemo(() => resolvePostLoginPath(nextPath), [nextPath]);
  const [guardStatus, setGuardStatus] = useState<GuardStatus>("checking");
  const [guardError, setGuardError] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>("sua rede");
  const [networkSubdomain, setNetworkSubdomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const form = useForm<ForcedPasswordChangeFormValues>({
    resolver: zodResolver(forcedPasswordChangeFormSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    let mounted = true;
    let settled = false;

    const syncGuard = () => {
      if (!mounted || passwordChanged) return;

      const nextNetworkSubdomain = getNetworkSubdomainFromSession() ?? null;
      setNetworkName(getNetworkNameFromSession() ?? "sua rede");
      setNetworkSubdomain(nextNetworkSubdomain);

      if (!hasActiveSession()) {
        settled = true;
        setGuardError("Sua sessão de primeiro acesso expirou ou não foi carregada. Faça login novamente para continuar.");
        setGuardStatus("redirecting");
        router.replace(buildLoginHref(undefined, nextNetworkSubdomain));
        return;
      }

      if (!getForcePasswordChangeRequiredFromSession()) {
        settled = true;
        setGuardError(null);
        setGuardStatus("redirecting");
        router.replace(resolvedNextPath);
        return;
      }

      settled = true;
      setGuardError(null);
      setGuardStatus("allowed");
    };

    const timeoutId = window.setTimeout(() => {
      if (!mounted || settled) return;
      setNetworkName(getNetworkNameFromSession() ?? "sua rede");
      setNetworkSubdomain(getNetworkSubdomainFromSession() ?? null);
      setGuardError("Não foi possível validar o contexto do primeiro acesso. Tente entrar novamente.");
      setGuardStatus("error");
    }, FIRST_ACCESS_GUARD_TIMEOUT_MS);

    syncGuard();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncGuard);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, syncGuard);
    window.addEventListener("storage", syncGuard);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncGuard);
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, syncGuard);
      window.removeEventListener("storage", syncGuard);
    };
  }, [passwordChanged, resolvedNextPath, router]);

  useEffect(() => {
    void router.prefetch(resolvedNextPath);
    void router.prefetch(buildLoginHref(undefined, networkSubdomain));
  }, [networkSubdomain, resolvedNextPath, router]);

  async function handleSubmit(values: ForcedPasswordChangeFormValues) {
    setSaving(true);
    setError(null);
    form.clearErrors();

    try {
      await changeForcedPasswordApi({
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      setPasswordChanged(true);

      // Não chamar setSaving(false) no caminho de sucesso.
      // router.replace() usa startTransition internamente e um setState
      // de alta prioridade (setSaving) pode cancelar a transição de navegação.
      router.replace(resolvedNextPath);

      // Fallback: se o router.replace não efetuar o redirect em 2s,
      // forçar navegação via window.location como rede de segurança.
      window.setTimeout(() => {
        window.location.replace(resolvedNextPath);
      }, 2000);
    } catch (submitError) {
      const fieldResult = applyApiFieldErrors(submitError, form.setError, {
        mapField: {
          newPassword: "newPassword",
          novaSenha: "newPassword",
          confirmNewPassword: "confirmNewPassword",
          confirmarNovaSenha: "confirmNewPassword",
        },
      });
      setError(buildFormApiErrorMessage(submitError, {
        appliedFields: fieldResult.appliedFields,
        fallbackMessage: "Não foi possível atualizar a senha.",
      }));
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md border-border/70 bg-card shadow-sm">
        <CardHeader className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Primeiro acesso
            </p>
            <CardTitle>
              <h1 className="text-inherit">Defina sua nova senha</h1>
            </CardTitle>
            <CardDescription>
              Atualize a senha inicial antes de continuar para o dashboard.
            </CardDescription>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 px-3 py-3 text-sm">
            <p className="font-medium text-foreground">{networkName}</p>
            <p className="mt-1 text-muted-foreground">
              {networkSubdomain ? `Subdomínio: ${networkSubdomain}` : "Sessão autenticada para primeiro acesso."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {guardStatus === "checking" || guardStatus === "redirecting" ? (
            <p className="text-sm text-muted-foreground">
              {guardStatus === "redirecting"
                ? "Redirecionando com o contexto autenticado..."
                : "Validando contexto do primeiro acesso..."}
            </p>
          ) : guardStatus === "error" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-3 text-sm text-gym-danger">
                {guardError ?? "Não foi possível validar o contexto do primeiro acesso."}
              </div>
              <Button asChild className="w-full">
                <Link href={buildLoginHref(undefined, networkSubdomain)}>Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="forced-password-new">Nova senha</Label>
                <Input
                  id="forced-password-new"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Digite a nova senha"
                  disabled={saving}
                  {...form.register("newPassword")}
                />
                {form.formState.errors.newPassword ? (
                  <p className="text-xs text-gym-danger">{form.formState.errors.newPassword.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="forced-password-confirm">Confirmar nova senha</Label>
                <Input
                  id="forced-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  disabled={saving}
                  {...form.register("confirmNewPassword")}
                />
                {form.formState.errors.confirmNewPassword ? (
                  <p className="text-xs text-gym-danger">{form.formState.errors.confirmNewPassword.message}</p>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground">
                A nova senha precisa ter pelo menos 8 caracteres, com letras e números.
              </p>

              {error ? (
                <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Atualizando..." : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
