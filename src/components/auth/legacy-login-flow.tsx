"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginApi } from "@/lib/api/auth";
import { getTenantContextApi, setTenantContextApi } from "@/lib/api/contexto-unidades";
import { getAccessToken, getPreferredTenantId, setPreferredTenantId } from "@/lib/api/session";
import type { Tenant } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolvePostLoginPath } from "@/lib/tenant/auth-redirect";
import { legacyLoginFormSchema, legacyTenantStepFormSchema } from "@/lib/tenant/forms/auth-schemas";

type LegacyLoginFormValues = import("zod").input<typeof legacyLoginFormSchema>;
type LegacyTenantFormValues = import("zod").input<typeof legacyTenantStepFormSchema>;

export function LegacyLoginFlow({
  nextPath,
}: {
  nextPath?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"LOGIN" | "TENANT">("LOGIN");
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const resolvedNextPath = useMemo(() => resolvePostLoginPath(nextPath), [nextPath]);
  const loginForm = useForm<LegacyLoginFormValues>({
    resolver: zodResolver(legacyLoginFormSchema),
    defaultValues: {
      username: "admin@academia.local",
      password: "12345678",
    },
  });
  const tenantForm = useForm<LegacyTenantFormValues>({
    resolver: zodResolver(legacyTenantStepFormSchema),
    defaultValues: {
      tenantId: "",
    },
  });

  useEffect(() => {
    if (getAccessToken()) {
      router.replace(resolvedNextPath);
    }
  }, [resolvedNextPath, router]);

  useEffect(() => {
    if (step === "LOGIN") {
      loginForm.reset({
        username: "admin@academia.local",
        password: "12345678",
      });
      tenantForm.reset({ tenantId: "" });
    }
  }, [loginForm, step, tenantForm]);

  async function onSubmit(values: LegacyLoginFormValues) {
    setSaving(true);
    setError(null);
    try {
      await loginApi({ email: values.username.trim(), password: values.password });
      const context = await getTenantContextApi();
      const activeTenants = context.unidadesDisponiveis.filter((item) => item.ativo !== false);
      const preferredTenantId = getPreferredTenantId();
      const preferredIsValid = preferredTenantId && activeTenants.some((item) => item.id === preferredTenantId);

      if (preferredIsValid && preferredTenantId) {
        await setTenantContextApi(preferredTenantId);
        router.push(resolvedNextPath);
        return;
      }

      setTenantOptions(activeTenants);
      tenantForm.reset({ tenantId: context.currentTenantId || activeTenants[0]?.id || "" });
      setStep("TENANT");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao autenticar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePreferredTenant(values: LegacyTenantFormValues) {
    setSaving(true);
    setError(null);
    try {
      await setTenantContextApi(values.tenantId);
      setPreferredTenantId(values.tenantId);
      router.push(resolvedNextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível definir a unidade prioritária.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1 className="text-inherit">{step === "LOGIN" ? "Acesso" : "Unidade prioritária"}</h1>
          </CardTitle>
          <CardDescription>
            {step === "LOGIN"
              ? "Entre com usuário e senha para continuar."
              : "Defina a unidade padrão para abrir direto no próximo login."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "LOGIN" ? (
            <form className="space-y-4" onSubmit={loginForm.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="login-username">
                  Usuário
                </label>
                <Input id="login-username" type="text" autoComplete="username" required {...loginForm.register("username")} />
                {loginForm.formState.errors.username ? <p className="text-xs text-gym-danger">{loginForm.formState.errors.username.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="login-password">
                  Senha
                </label>
                <Input id="login-password" type="password" autoComplete="current-password" required {...loginForm.register("password")} />
                {loginForm.formState.errors.password ? <p className="text-xs text-gym-danger">{loginForm.formState.errors.password.message}</p> : null}
              </div>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={tenantForm.handleSubmit(handleSavePreferredTenant)}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidade prioritária</label>
                <Select
                  value={tenantForm.watch("tenantId") || "__none__"}
                  onValueChange={(value) => tenantForm.setValue("tenantId", value === "__none__" ? "" : value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecione</SelectItem>
                    {tenantOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tenantForm.formState.errors.tenantId ? <p className="text-xs text-gym-danger">{tenantForm.formState.errors.tenantId.message}</p> : null}
              </div>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Salvando..." : "Salvar e continuar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
