"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  criarPerfil,
  importarPerfil,
  listarPerfilTemplates,
  obterPerfil,
  atualizarCapacidadesPerfil,
} from "@/lib/api/gestao-acessos";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";

import type { Dominio } from "../api/types";
import { useRbacHref } from "../context";

interface NewRoleProps {
  dominio: Dominio;
  tenantId?: string;
}

const PALETA = [
  "#6b8c1a", "#1ea06a", "#7c5cbf", "#0ea5e9",
  "#e09020", "#dc3545", "#a78bfa", "#64697a",
];

export function RbacNewRole({ dominio, tenantId }: NewRoleProps) {
  const router = useRouter();
  const { toast } = useToast();
  const href = useRbacHref();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState(PALETA[0]);
  const [seed, setSeed] = useState<"blank" | "clone">("blank");
  const [templateId, setTemplateId] = useState<string>("");

  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  const templatesQ = useQuery({
    queryKey: ["rbac", "perfil-templates", dominio],
    queryFn: () => listarPerfilTemplates(dominio),
    enabled,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (seed === "clone" && templateId) {
        const novo = await importarPerfil(templateId, tenantId!, nome.trim());
        // Atualiza descrição se diferente
        return novo;
      }
      return criarPerfil({
        dominio,
        tenantId: tenantId!,
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        cor,
      });
    },
    onSuccess: (created) => {
      toast({ title: `Papel "${created.nome}" criado` });
      router.push(href(`/papeis/${created.id}`));
    },
    onError: (err) =>
      toast({
        title: "Falha ao criar papel",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  const canSubmit =
    nome.trim().length > 0 &&
    !mutation.isPending &&
    (seed === "blank" || (seed === "clone" && templateId));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-auto p-0">
          <Link href={href("/papeis")}>
            <ArrowLeft className="mr-1 size-3" /> Papéis
          </Link>
        </Button>
        <span>/</span>
        <span>Novo papel</span>
      </div>

      <h1 className="text-2xl font-display font-bold">Novo papel customizado</h1>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do papel</Label>
            <Input
              id="nome"
              placeholder="Ex: Recepcionista Noturno"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea
              id="desc"
              rows={2}
              placeholder="O que esse papel faz?"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PALETA.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    cor === c
                      ? "scale-110 border-foreground"
                      : "border-transparent",
                  )}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Aplicada no RoleChip e nos KPIs. Pode ser alterada depois no editor.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Como começar</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSeed("blank")}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  seed === "blank"
                    ? "border-gym-accent bg-gym-accent/10"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                <b className="text-sm">Sem permissões</b>
                <p className="text-xs text-muted-foreground">Você define tudo manualmente.</p>
              </button>
              <button
                type="button"
                onClick={() => setSeed("clone")}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  seed === "clone"
                    ? "border-gym-accent bg-gym-accent/10"
                    : "border-border hover:bg-secondary/50",
                )}
              >
                <b className="text-sm">Clonar de um papel-template</b>
                <p className="text-xs text-muted-foreground">Copia as permissões de um sistema.</p>
              </button>
            </div>
          </div>

          {seed === "clone" && (
            <div className="space-y-2">
              <Label>Papel-template de origem</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesQ.data?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button asChild variant="outline">
              <Link href={href("/papeis")}>Cancelar</Link>
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
              {mutation.isPending ? "Criando…" : "Criar papel"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
