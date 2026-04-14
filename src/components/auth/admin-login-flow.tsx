"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminLoginApi, logoutApi } from "@/lib/api/auth";
import { clearAuthSession, consumeBackofficeReauthRequired, hasActiveSession } from "@/lib/api/session";
import { buildForcedPasswordChangeHref, resolveHomeForSession } from "@/lib/tenant/auth-redirect";
import { isPlatformUser } from "@/lib/shared/user-kind";

const backofficeLoginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail."),
  password: z.string().min(1, "Informe a senha."),
});

type BackofficeLoginForm = z.infer<typeof backofficeLoginSchema>;

export function AdminLoginFlow({
  nextPath,
  reason,
}: {
  nextPath?: string | null;
  reason?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [storageReason, setStorageReason] = useState<string | null>(null);
  const resolvedNextPath = useMemo(() => nextPath || "/admin", [nextPath]);
  const infoMessage = useMemo(() => {
    if (reason !== "backoffice-reauth" && storageReason !== "backoffice-reauth") {
      return null;
    }
    return "Sua sessão administrativa precisa ser autenticada novamente para voltar ao backoffice.";
  }, [reason, storageReason]);

  const form = useForm<BackofficeLoginForm>({
    resolver: zodResolver(backofficeLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (hasActiveSession()) {
      router.replace(resolvedNextPath);
    }
  }, [router, resolvedNextPath]);

  useEffect(() => {
    void router.prefetch(resolvedNextPath);
    void router.prefetch(buildForcedPasswordChangeHref(resolvedNextPath));
  }, [router, resolvedNextPath]);

  useEffect(() => {
    if (consumeBackofficeReauthRequired()) {
      setStorageReason("backoffice-reauth");
    }
  }, []);

  async function onSubmit(values: BackofficeLoginForm) {
    setSaving(true);
    setError(null);
    try {
      const session = await adminLoginApi({
        email: values.email.trim(),
        password: values.password,
      });
      if (session.forcePasswordChangeRequired) {
        router.replace(buildForcedPasswordChangeHref(resolvedNextPath));
        return;
      }
      if (!isPlatformUser(session)) {
        await logoutApi().catch(() => undefined);
        clearAuthSession();
        setError("Esta conta não tem acesso administrativo à plataforma.");
        return;
      }
      router.replace(resolveHomeForSession(session));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao autenticar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-gym-accent/10">
            <Shield className="size-6 text-gym-accent" />
          </div>
          <CardTitle>
            <h1 className="font-display text-xl font-bold">Conceito Fit</h1>
          </CardTitle>
          <CardDescription>
            Acesso administrativo da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {infoMessage ? (
            <div className="mb-4 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
              {infoMessage}
            </div>
          ) : null}
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-email">E-mail</label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@conceito.fit"
                className="border-border bg-secondary"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-gym-danger">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-password">Senha</label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                className="border-border bg-secondary"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-gym-danger">{form.formState.errors.password.message}</p>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
