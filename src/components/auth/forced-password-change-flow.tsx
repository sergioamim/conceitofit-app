"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changeForcedPasswordApi } from "@/lib/api/auth";
import {
  getAccessToken,
  getForcePasswordChangeRequiredFromSession,
  getNetworkNameFromSession,
  getNetworkSubdomainFromSession,
} from "@/lib/api/session";
import { buildLoginHref, resolvePostLoginPath } from "@/lib/tenant/auth-redirect";
import { forcedPasswordChangeFormSchema } from "@/lib/tenant/forms/auth-schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ForcedPasswordChangeFormValues = import("zod").input<typeof forcedPasswordChangeFormSchema>;

export function ForcedPasswordChangeFlow({
  nextPath,
}: {
  nextPath?: string | null;
}) {
  const router = useRouter();
  const resolvedNextPath = useMemo(() => resolvePostLoginPath(nextPath), [nextPath]);
  const [guardStatus, setGuardStatus] = useState<"checking" | "allowed">("checking");
  const [networkName, setNetworkName] = useState<string>("sua rede");
  const [networkSubdomain, setNetworkSubdomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<ForcedPasswordChangeFormValues>({
    resolver: zodResolver(forcedPasswordChangeFormSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    const token = getAccessToken();
    const requiresForcePasswordChange = getForcePasswordChangeRequiredFromSession();
    const nextNetworkSubdomain = getNetworkSubdomainFromSession() ?? null;

    if (!token || !requiresForcePasswordChange) {
      router.replace(buildLoginHref(undefined, nextNetworkSubdomain));
      return;
    }

    setNetworkName(getNetworkNameFromSession() ?? "sua rede");
    setNetworkSubdomain(nextNetworkSubdomain);
    setGuardStatus("allowed");
  }, [router]);

  async function handleSubmit(values: ForcedPasswordChangeFormValues) {
    setSaving(true);
    setError(null);

    try {
      await changeForcedPasswordApi({
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      router.replace(resolvedNextPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível atualizar a senha.");
    } finally {
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
          {guardStatus === "checking" ? (
            <p className="text-sm text-muted-foreground">Validando contexto do primeiro acesso...</p>
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
