"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getGlobalAcademiaById, listGlobalUnidades, updateGlobalAcademia } from "@/lib/backoffice/admin";
import type { Academia, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type AcademiaForm = {
  nome: string;
  razaoSocial: string;
  documento: string;
  email: string;
  telefone: string;
  ativo: "ATIVA" | "INATIVA";
};

function buildManageUnitHref(academiaId: string, unitId?: string) {
  const params = new URLSearchParams({ academiaId });
  if (unitId) params.set("edit", unitId);
  return `/admin/unidades?${params.toString()}`;
}

function buildForm(academia: Academia | null): AcademiaForm {
  return {
    nome: academia?.nome ?? "",
    razaoSocial: academia?.razaoSocial ?? "",
    documento: academia?.documento ?? "",
    email: academia?.email ?? "",
    telefone: academia?.telefone ?? "",
    ativo: academia?.ativo === false ? "INATIVA" : "ATIVA",
  };
}

export default function AcademiaDetalhePage() {
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [form, setForm] = useState<AcademiaForm>(() => buildForm(null));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        setError(null);
        const [academiaResponse, unidadesResponse] = await Promise.all([
          getGlobalAcademiaById(id),
          listGlobalUnidades(),
        ]);
        if (!mounted) return;
        setAcademia(academiaResponse);
        setForm(buildForm(academiaResponse));
        setUnidades(unidadesResponse);
      } catch (loadError) {
        if (!mounted) return;
        setError(normalizeErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const unidadesDaAcademia = useMemo(
    () => unidades.filter((unit) => (unit.academiaId ?? unit.groupId) === id),
    [id, unidades]
  );

  async function handleSave() {
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome da academia", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateGlobalAcademia(id, {
        nome: form.nome.trim(),
        razaoSocial: form.razaoSocial.trim() || undefined,
        documento: form.documento.trim() || undefined,
        email: form.email.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        ativo: form.ativo === "ATIVA",
      });
      setAcademia(updated);
      setForm(buildForm(updated));
      toast({ title: "Academia atualizada", description: updated.nome });
    } catch (saveError) {
      toast({
        title: "Não foi possível salvar a academia",
        description: normalizeErrorMessage(saveError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Academias</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {loading ? "Carregando..." : academia?.nome ?? "Academia não encontrada"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Carregando dados..." : academia?.documento || "Sem documento cadastrado"}
            </p>
          </div>
          <Button asChild variant="outline" className="border-border">
            <Link href="/admin/academias">Voltar para academias</Link>
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da academia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-nome">Nome *</Label>
            <Input
              id="academia-detalhe-nome"
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
              disabled={loading || !academia}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-razao">Razão social</Label>
            <Input
              id="academia-detalhe-razao"
              value={form.razaoSocial}
              onChange={(event) => setForm((current) => ({ ...current, razaoSocial: event.target.value }))}
              disabled={loading || !academia}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-documento">Documento</Label>
            <Input
              id="academia-detalhe-documento"
              value={form.documento}
              onChange={(event) => setForm((current) => ({ ...current, documento: event.target.value }))}
              disabled={loading || !academia}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-email">E-mail</Label>
            <Input
              id="academia-detalhe-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              disabled={loading || !academia}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-telefone">Telefone</Label>
            <Input
              id="academia-detalhe-telefone"
              value={form.telefone}
              onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))}
              disabled={loading || !academia}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.ativo}
              onValueChange={(value) => setForm((current) => ({ ...current, ativo: value as AcademiaForm["ativo"] }))}
              disabled={loading || !academia}
            >
              <SelectTrigger aria-label="Status da academia" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVA">Ativa</SelectItem>
                <SelectItem value="INATIVA">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading || !academia}>
              {saving ? "Salvando..." : "Salvar academia"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Unidades desta academia</CardTitle>
            <p className="text-sm text-muted-foreground">
              Crie uma nova unidade já vinculada a esta academia ou abra uma unidade existente para edição.
            </p>
          </div>
          {academia ? (
            <Button asChild variant="outline" className="border-border">
              <Link href={buildManageUnitHref(academia.id)}>Nova unidade</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Carregando unidades...</p> : null}
          {!loading && academia == null ? (
            <p className="text-sm text-muted-foreground">A academia solicitada não foi encontrada.</p>
          ) : null}
          {!loading && academia != null && unidadesDaAcademia.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed border-border px-4 py-4">
              <p className="text-sm text-muted-foreground">Nenhuma unidade vinculada.</p>
              <Button asChild variant="outline" className="border-border">
                <Link href={buildManageUnitHref(academia.id)}>Criar primeira unidade</Link>
              </Button>
            </div>
          ) : null}
          {!loading &&
            unidadesDaAcademia.map((unit) => (
              <div key={unit.id} className="flex flex-col gap-3 rounded-md border border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">{unit.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {unit.subdomain || unit.id}
                    {unit.groupId ? ` · ${unit.groupId}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{unit.email || unit.telefone || "Sem contato cadastrado"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">{unit.ativo === false ? "Inativa" : "Ativa"}</span>
                  <Button asChild variant="outline" size="sm" className="border-border">
                    <Link href={buildManageUnitHref(id, unit.id)}>Editar unidade</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="border-border">
                    <Link href={`/admin/importacao-evo?tenantId=${encodeURIComponent(unit.id)}`}>Importação</Link>
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
