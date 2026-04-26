"use client";

/**
 * Tela de detalhe do exercício (Wave 5 PRD V3).
 * Rota: /treinos/exercicios/[id]
 *
 * Exibe vídeo (placeholder se vazio), descrição, grupo muscular,
 * equipamento e ações. "Usado em N templates" fica como TODO até a
 * Wave 6 quando temos o campo agregado no backend.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { listExerciciosApi } from "@/lib/api/treinos";
import type { Exercicio } from "@/lib/types";

export default function ExercicioDetalhePage() {
  const params = useParams<{ id: string }>();
  const exId = params?.id ?? "";
  const { tenantId } = useTenantContext();
  const [exercicio, setExercicio] = useState<Exercicio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId || !exId) return;
    let cancelled = false;
    setLoading(true);
    void listExerciciosApi({ tenantId })
      .then((items) => {
        if (cancelled) return;
        const found = items.find((e) => e.id === exId);
        if (!found) {
          setError("Exercício não encontrado");
          setExercicio(null);
        } else {
          // Normaliza nullables do response API para o tipo doméstico.
          // ExercicioApiResponse usa "aparelho" no backend; mapeamos
          // pra "equipamento" do tipo doméstico.
          setExercicio({
            ...found,
            grupoMuscularId: found.grupoMuscularId ?? undefined,
            grupoMuscular: found.grupoMuscular ?? undefined,
            grupoMuscularNome: found.grupoMuscularNome ?? undefined,
            equipamento: found.aparelho ?? undefined,
            descricao: found.descricao ?? undefined,
            videoUrl: found.videoUrl ?? undefined,
            unidade: found.unidade ?? undefined,
          } as Exercicio);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, exId]);

  const videoEmbedUrl = useMemo(() => {
    if (!exercicio?.videoUrl) return null;
    // YouTube short link → embed
    const ytMatch = exercicio.videoUrl.match(/youtu\.?be(?:\.com)?\/(?:watch\?v=|embed\/)?([\w-]+)/);
    if (ytMatch?.[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return exercicio.videoUrl;
  }, [exercicio?.videoUrl]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando exercício...
      </div>
    );
  }

  if (error || !exercicio) {
    return (
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Treinos", href: "/treinos" },
            { label: "Exercícios", href: "/treinos/exercicios" },
            { label: "Não encontrado" },
          ]}
        />
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {error ?? "Exercício não encontrado"}
            </p>
            <Button asChild variant="outline" className="border-border">
              <Link href="/treinos/exercicios">
                <ArrowLeft className="mr-1 size-4" />
                Voltar à biblioteca
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const grupoNome = exercicio.grupoMuscularNome ?? exercicio.grupoMuscular ?? "Sem grupo";

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Treinos", href: "/treinos" },
          { label: "Exercícios", href: "/treinos/exercicios" },
          { label: exercicio.nome },
        ]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">{exercicio.nome}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-gym-accent/30 text-gym-accent">
              {grupoNome}
            </Badge>
            {exercicio.equipamento ? (
              <Badge variant="outline" className="border-border">
                {exercicio.equipamento}
              </Badge>
            ) : null}
            {exercicio.unidade ? <span>Unidade: {exercicio.unidade}</span> : null}
            {!exercicio.ativo ? (
              <Badge variant="secondary">Inativo</Badge>
            ) : null}
          </div>
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link href="/treinos/exercicios">
            <ArrowLeft className="mr-1 size-4" />
            Biblioteca
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Coluna principal: vídeo + descrição */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-border bg-card">
            {videoEmbedUrl ? (
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={videoEmbedUrl}
                  title={`Vídeo demonstração: ${exercicio.nome}`}
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-secondary/30 text-muted-foreground">
                <div className="text-center">
                  <PlayCircle className="mx-auto size-12 opacity-50" />
                  <p className="mt-2 text-xs">Sem vídeo demonstrativo</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Descrição e execução</CardTitle>
            </CardHeader>
            <CardContent>
              {exercicio.descricao ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {exercicio.descricao}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Sem descrição cadastrada. Edite o exercício na biblioteca para adicionar
                  instruções de execução, dicas e erros comuns.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Erros comuns / dicas — placeholders pra Wave 6+ */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Erros comuns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic text-muted-foreground">
                Campo de erros comuns será adicionado ao schema na próxima iteração.
                Por ora, use o campo "Descrição" para listar tudo.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: metadata + "usado em" placeholder */}
        <aside className="space-y-3">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Row label="Grupo muscular" value={grupoNome} />
              <Row label="Equipamento" value={exercicio.equipamento ?? "—"} />
              <Row label="Unidade" value={exercicio.unidade ?? "—"} />
              <Row
                label="Status"
                value={exercicio.ativo ? "Ativo" : "Inativo"}
              />
              {exercicio.videoUrl ? (
                <div className="pt-2">
                  <a
                    href={exercicio.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gym-accent hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    Abrir vídeo original
                  </a>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Usado em
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs italic text-muted-foreground">
                Lista de templates que usam este exercício será adicionada na Wave 6.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
