"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authLogin, getCurrentTenant, listTenants, setCurrentTenant } from "@/lib/mock/services";
import { getAccessToken, getPreferredTenantId, isMockSessionActive, setPreferredTenantId } from "@/lib/api/session";
import { isRealApiEnabled } from "@/lib/api/http";
import type { Tenant } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin@academia.local");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"LOGIN" | "TENANT">("LOGIN");
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState("");

  useEffect(() => {
    if (isRealApiEnabled() ? getAccessToken() : isMockSessionActive()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await authLogin({ email: username.trim(), password });
      const [allTenants, currentTenant] = await Promise.all([listTenants(), getCurrentTenant()]);
      const activeTenants = allTenants.filter((item) => item.ativo !== false);
      const preferredTenantId = getPreferredTenantId();
      const preferredIsValid = preferredTenantId && activeTenants.some((item) => item.id === preferredTenantId);

      if (preferredIsValid && preferredTenantId) {
        await setCurrentTenant(preferredTenantId);
        router.push("/dashboard");
        return;
      }

      setTenantOptions(activeTenants);
      setTenantId(currentTenant.id || activeTenants[0]?.id || "");
      setStep("TENANT");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao autenticar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePreferredTenant() {
    if (!tenantId) {
      setError("Selecione a unidade prioritária.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setCurrentTenant(tenantId);
      setPreferredTenantId(tenantId);
      router.push("/dashboard");
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
          <CardTitle>{step === "LOGIN" ? "Acesso" : "Unidade prioritária"}</CardTitle>
          <CardDescription>
            {step === "LOGIN"
              ? "Entre com usuário e senha para continuar."
              : "Defina a unidade padrão para abrir direto no próximo login."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "LOGIN" ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Usuário</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidade prioritária</label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button type="button" className="w-full" onClick={handleSavePreferredTenant} disabled={saving}>
                {saving ? "Salvando..." : "Salvar e continuar"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
