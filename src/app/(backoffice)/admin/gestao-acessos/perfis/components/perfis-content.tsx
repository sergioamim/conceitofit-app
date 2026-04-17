"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  listarPerfis,
  criarPerfil,
  listarPerfilTemplates,
  importarPerfil,
} from "@/lib/api/gestao-acessos";
import type { PerfilAcesso } from "@/lib/api/gestao-acessos.types";

export function PerfisContent() {
  const { toast } = useToast();
  const tenant = useRbacTenant();

  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Novo Perfil
  const [criarOpen, setCriarOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoDescricao, setNovoDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal Importar
  const [importarOpen, setImportarOpen] = useState(false);
  const [templates, setTemplates] = useState<PerfilAcesso[]>([]);
  const [templateSelecionado, setTemplateSelecionado] = useState("");
  const [importNome, setImportNome] = useState("");

  const reload = useCallback(async () => {
    if (!tenant.tenantId) return;
    setLoading(true);
    try {
      setError(null);
      const data = await listarPerfis("ACADEMIA", tenant.tenantId);
      setPerfis(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenant.tenantId]);

  useEffect(() => {
    if (tenant.tenantId) void reload();
  }, [reload, tenant.tenantId]);

  async function handleCriar() {
    if (!tenant.tenantId || !novoNome.trim()) return;
    setSaving(true);
    try {
      await criarPerfil({
        dominio: "ACADEMIA",
        tenantId: tenant.tenantId,
        nome: novoNome.trim(),
        descricao: novoDescricao.trim() || undefined,
      });
      toast({ title: "Perfil criado", description: novoNome });
      setCriarOpen(false);
      setNovoNome("");
      setNovoDescricao("");
      await reload();
    } catch (err) {
      toast({
        title: "Erro ao criar perfil",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenImportar() {
    setImportarOpen(true);
    try {
      const tpls = await listarPerfilTemplates("ACADEMIA");
      setTemplates(Array.isArray(tpls) ? tpls : []);
    } catch {
      setTemplates([]);
    }
  }

  async function handleImportar() {
    if (!tenant.tenantId || !templateSelecionado) return;
    setSaving(true);
    try {
      await importarPerfil(
        templateSelecionado,
        tenant.tenantId,
        importNome.trim() || undefined,
      );
      toast({ title: "Perfil importado" });
      setImportarOpen(false);
      setTemplateSelecionado("");
      setImportNome("");
      await reload();
    } catch (err) {
      toast({
        title: "Erro ao importar perfil",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Perfis de Acesso</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie perfis de operadores para esta unidade.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importarOpen} onOpenChange={setImportarOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border" onClick={handleOpenImportar}>
                <Download className="mr-2 size-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar perfil</DialogTitle>
                <DialogDescription>
                  Importe um perfil-template da plataforma para esta unidade.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Perfil de origem</Label>
                  <Select value={templateSelecionado} onValueChange={setTemplateSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-nome">Novo nome (opcional)</Label>
                  <Input
                    id="import-nome"
                    value={importNome}
                    onChange={(e) => setImportNome(e.target.value)}
                    placeholder="Manter nome original"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-border" onClick={() => setImportarOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleImportar} disabled={saving || !templateSelecionado}>
                  Importar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={criarOpen} onOpenChange={setCriarOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Novo Perfil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo perfil de acesso</DialogTitle>
                <DialogDescription>
                  Crie um perfil customizado para os operadores desta unidade.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="novo-nome">Nome</Label>
                  <Input
                    id="novo-nome"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Recepcionista Noturno"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novo-descricao">Descricao</Label>
                  <Textarea
                    id="novo-descricao"
                    value={novoDescricao}
                    onChange={(e) => setNovoDescricao(e.target.value)}
                    placeholder="Descreva a responsabilidade do perfil"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-border" onClick={() => setCriarOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCriar} disabled={saving || !novoNome.trim()}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="px-5 py-5 text-sm text-gym-danger">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
            Carregando perfis...
          </CardContent>
        </Card>
      ) : perfis.length === 0 ? (
        <Card>
          <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhum perfil encontrado. Crie um novo ou importe um template.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {perfis.length} perfil(is)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {perfis.map((perfil) => (
                <Link
                  key={perfil.id}
                  href={`/admin/gestao-acessos/perfis/${perfil.id}`}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:bg-secondary/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Shield className="size-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{perfil.nome}</p>
                      {perfil.descricao && (
                        <p className="text-xs text-muted-foreground truncate">{perfil.descricao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      perfil.tipo === "PADRAO"
                        ? "bg-gym-accent/10 text-gym-accent"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {perfil.tipo === "PADRAO" ? "Padrao" : "Customizado"}
                    </span>
                    {!perfil.ativo && (
                      <span className="rounded-full px-2 py-0.5 text-xs bg-gym-danger/10 text-gym-danger">
                        Inativo
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
