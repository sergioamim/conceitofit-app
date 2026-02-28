"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { createTenant, listAcademias, listTenantsGlobal } from "@/lib/mock/services";
import type { Academia, Tenant } from "@/lib/types";

interface UnidadeForm {
  nome: string;
  academiaId: string;
}

export default function UnidadesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [form, setForm] = useState<UnidadeForm>({ nome: "", academiaId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [acs, uns] = await Promise.all([listAcademias(), listTenantsGlobal()]);
        if (!mounted) return;
        setAcademias(acs);
        setUnidades(uns);
        if (!form.academiaId && acs[0]?.id) {
          setForm((prev) => ({ ...prev, academiaId: prev.academiaId || acs[0].id }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [form.academiaId]);

  async function handleCreate() {
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome da unidade", variant: "destructive" });
      return;
    }
    if (!form.academiaId) {
      toast({ title: "Selecione a academia desta unidade", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await createTenant({
        nome: form.nome.trim(),
        academiaId: form.academiaId,
        ativo: true,
      });
      setUnidades((prev) => [created, ...prev]);
      setForm((prev) => ({ ...prev, nome: "" }));
      toast({ title: "Unidade criada", description: created.nome });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Unidades</p>
        <h1 className="text-3xl font-display font-bold">Unidades (tenants)</h1>
        <p className="text-sm text-muted-foreground">Cadastre unidades vinculadas a academias e veja as já existentes.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cadastrar nova unidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unidade-nome">Nome *</Label>
            <Input
              id="unidade-nome"
              placeholder="Unidade Santana"
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Academia *</Label>
            <Select
              value={form.academiaId}
              onValueChange={(academiaId) => setForm((prev) => ({ ...prev, academiaId }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a academia" />
              </SelectTrigger>
              <SelectContent>
                {academias.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Criando..." : "Criar unidade"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unidades cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && unidades.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada.</p>
          )}
          {!loading &&
            unidades.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="font-semibold">{u.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Academia: {academias.find((a) => a.id === (u.academiaId ?? u.groupId))?.nome ?? "—"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{u.ativo === false ? "Inativa" : "Ativa"}</span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
