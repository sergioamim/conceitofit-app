"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginApi } from "@/lib/api/auth";
import { getAccessToken } from "@/lib/api/session";

const backofficeLoginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail."),
  password: z.string().min(1, "Informe a senha."),
  redeIdentifier: z.string().min(1, "Informe o identificador da rede."),
});

type BackofficeLoginForm = z.infer<typeof backofficeLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<BackofficeLoginForm>({
    resolver: zodResolver(backofficeLoginSchema),
    defaultValues: { email: "", password: "", redeIdentifier: "" },
  });

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/admin");
    }
  }, [router]);

  async function onSubmit(values: BackofficeLoginForm) {
    setSaving(true);
    setError(null);
    try {
      await loginApi({
        email: values.email.trim(),
        password: values.password,
        redeIdentifier: values.redeIdentifier.trim(),
        channel: "BACKOFFICE",
      });
      router.push("/admin");
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
            <h1 className="font-display text-xl font-bold">Backoffice Conceito Fit</h1>
          </CardTitle>
          <CardDescription>
            Acesso administrativo da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-rede">Rede (subdomínio)</label>
              <Input
                id="admin-rede"
                type="text"
                placeholder="demo"
                className="border-border bg-secondary"
                {...form.register("redeIdentifier")}
              />
              {form.formState.errors.redeIdentifier ? (
                <p className="text-xs text-gym-danger">{form.formState.errors.redeIdentifier.message}</p>
              ) : null}
            </div>
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
              {saving ? "Entrando..." : "Entrar no Backoffice"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
