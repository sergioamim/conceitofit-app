"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Bell, Check, Globe, Lock, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

import { atualizarPoliticaSeguranca, obterPoliticaSeguranca } from "../api/client";
import type { Dominio, PoliticaSeguranca } from "../api/types";

interface SecurityPolicyProps {
  dominio: Dominio;
  tenantId?: string;
}

export function RbacSecurityPolicy({ dominio, tenantId }: SecurityPolicyProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  const policyQ = useQuery({
    queryKey: ["rbac", "security-policy", dominio, tenantId ?? null],
    queryFn: () => obterPoliticaSeguranca({ dominio, tenantId }),
    enabled,
  });

  const [form, setForm] = useState<PoliticaSeguranca | null>(null);
  useEffect(() => {
    if (policyQ.data) setForm(policyQ.data);
  }, [policyQ.data]);

  const piso = (form?.pisoCamposBloqueados ?? "[]") as string;
  const camposBloqueados = (() => {
    try {
      return new Set(JSON.parse(piso) as string[]);
    } catch {
      return new Set<string>();
    }
  })();

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form) throw new Error("policy not loaded");
      const { id: _id, pisoCamposBloqueados: _piso, ...payload } = form;
      void _id;
      void _piso;
      return atualizarPoliticaSeguranca(payload);
    },
    onSuccess: () => {
      toast({ title: "Política atualizada" });
      qc.invalidateQueries({ queryKey: ["rbac", "security-policy"] });
    },
    onError: (err) =>
      toast({
        title: "Falha ao salvar",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  if (policyQ.isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  function set<K extends keyof PoliticaSeguranca>(key: K, value: PoliticaSeguranca[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function isLocked(field: string): boolean {
    return dominio === "ACADEMIA" && camposBloqueados.has(field);
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Gestão de Acesso / Política de Segurança
          </p>
          <h1 className="text-2xl font-display font-bold mt-1">Política de segurança</h1>
          <p className="text-sm text-muted-foreground">
            {dominio === "ACADEMIA"
              ? "Regras aplicadas a todos os usuários da rede."
              : "Regras aplicadas ao staff da plataforma."}
            {dominio === "ACADEMIA" && camposBloqueados.size > 0 && (
              <> Campos bloqueados são definidos pela plataforma SaaS.</>
            )}
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Check className="mr-1 size-3" />
          {saveMutation.isPending ? "Salvando…" : "Salvar política"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Política de senha */}
        <Card>
          <CardContent className="p-0">
            <Header icon={<Lock className="size-4" />} title="Política de senha" sub="Aplicada na criação e troca." />
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider">Mínimo de caracteres</Label>
                  <Input
                    type="number"
                    min={8}
                    value={form.senhaMinCaracteres}
                    disabled={isLocked("senha.minCaracteres")}
                    onChange={(e) =>
                      set("senhaMinCaracteres", Number(e.target.value) || 8)
                    }
                  />
                  {isLocked("senha.minCaracteres") && (
                    <p className="text-[10px] text-muted-foreground">
                      Definido pela plataforma
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider">Expira (dias)</Label>
                  <Input
                    type="number"
                    placeholder="nunca"
                    value={form.senhaExpiraEmDias ?? ""}
                    onChange={(e) =>
                      set(
                        "senhaExpiraEmDias",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </div>
              </div>
              <CheckboxRow
                label="Exigir letra maiúscula"
                value={form.senhaExigirMaiuscula}
                onChange={(v) => set("senhaExigirMaiuscula", v)}
              />
              <CheckboxRow
                label="Exigir número"
                value={form.senhaExigirNumero}
                onChange={(v) => set("senhaExigirNumero", v)}
              />
              <CheckboxRow
                label="Exigir símbolo"
                value={form.senhaExigirSimbolo}
                onChange={(v) => set("senhaExigirSimbolo", v)}
              />
              <CheckboxRow
                label="Bloquear reúso das últimas 5 senhas"
                value={form.senhaBloquearReuso5}
                onChange={(v) => set("senhaBloquearReuso5", v)}
              />
              <CheckboxRow
                label="Bloquear senhas comuns (HaveIBeenPwned)"
                value={form.senhaBloquearComuns}
                onChange={(v) => set("senhaBloquearComuns", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sessões */}
        <Card>
          <CardContent className="p-0">
            <Header icon={<Activity className="size-4" />} title="Sessões e dispositivos" sub="Comportamento de login e expiração." />
            <div className="flex items-center gap-4 border-b border-border px-5 py-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gym-accent/15 text-gym-accent">
                <User className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Expira por inatividade</p>
                <p className="text-xs text-muted-foreground">
                  Encerra a sessão automaticamente após N min sem atividade.
                </p>
              </div>
              <Select
                value={String(form.sessaoExpiraInatividadeMin)}
                onValueChange={(v) => set("sessaoExpiraInatividadeMin", Number(v))}
                disabled={isLocked("sessao.expiraInatividadeMin")}
              >
                <SelectTrigger className="w-[110px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 h</SelectItem>
                  <SelectItem value="240">4 h</SelectItem>
                  <SelectItem value="-1">nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ToggleRow
              icon={<Users />}
              title="Limite de 3 sessões simultâneas"
              desc="Acima do limite, encerra a sessão mais antiga."
              checked={form.sessaoLimite3Simultaneas}
              onChange={(v) => set("sessaoLimite3Simultaneas", v)}
            />
            <ToggleRow
              icon={<Globe />}
              title="Restrição por IP / faixa"
              desc="Aceita apenas conexões originadas das faixas autorizadas."
              checked={form.sessaoRestricaoIp}
              onChange={(v) => set("sessaoRestricaoIp", v)}
            />
            <ToggleRow
              icon={<Bell />}
              title="Alerta de novo dispositivo"
              desc="Envia email + push em login não-reconhecido."
              checked={form.sessaoAlertaNovoDispositivo}
              onChange={(v) => set("sessaoAlertaNovoDispositivo", v)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Header({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border p-4">
      <div className="grid size-8 place-items-center rounded-lg bg-gym-accent/15 text-gym-accent">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function CheckboxRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-border p-2.5">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function ToggleRow({
  icon,
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gym-accent/15 text-gym-accent [&>svg]:size-4">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
