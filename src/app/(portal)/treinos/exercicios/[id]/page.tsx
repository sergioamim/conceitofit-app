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
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, PlayCircle, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  getExercicioApi,
  listTemplatesUsandoExercicioApi,
} from "@/lib/api/treinos";
import type { Exercicio } from "@/lib/types";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";

export default function ExercicioDetalhePage() {
  const params = useParams<{ id: string }>();
  const exId = params?.id ?? "";
  const { tenantId, tenantResolved } = useTenantContext();

  // Fetch singular: GET /api/v1/exercicios/{id} via React Query.
  // Substitui o list+find anterior, que carregava todo o catálogo
  // pra pegar 1 item — caro em tenants com muitos exercícios.
  const {
    data: exercicio,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ["exercicio-detalhe", tenantId, exId],
    enabled: Boolean(tenantId && exId && tenantResolved),
    staleTime: 60_000,
    queryFn: async (): Promise<Exercicio> => {
      const res = await getExercicioApi({ tenantId, id: exId });
      // Normaliza nullables do response API para o tipo doméstico.
      // ExercicioApiResponse usa "aparelho" no backend → "equipamento".
      return {
        ...res,
        grupoMuscularId: res.grupoMuscularId ?? undefined,
        grupoMuscular: res.grupoMuscular ?? undefined,
        grupoMuscularNome: res.grupoMuscularNome ?? undefined,
        equipamento: res.aparelho ?? undefined,
        descricao: res.descricao ?? undefined,
        videoUrl: res.videoUrl ?? undefined,
        midiaUrl: res.midiaUrl ?? undefined,
        thumbnailUrl: res.thumbnailUrl ?? undefined,
        unidade: res.unidade ?? undefined,
      } as Exercicio;
    },
  });

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? "Exercício não encontrado"
        : null;

  // Wave J.1 — lista de templates que usam este exercício
  const { data: templatesUsando = [] } = useQuery({
    queryKey: ["exercicio-templates-usando", tenantId, exId],
    enabled: Boolean(tenantId && exId && tenantResolved && exercicio),
    staleTime: 60_000,
    queryFn: () =>
      listTemplatesUsandoExercicioApi({ tenantId, id: exId }),
  });

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
  const grupoCor = grupoColorByName(grupoNome);
  const equipamento = exercicio.equipamento ?? "—";

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Treinos", href: "/treinos" },
          { label: "Exercícios", href: "/treinos/exercicios" },
          { label: exercicio.nome },
        ]}
      />

      {/* Voltar */}
      <div>
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link href="/treinos/exercicios">
            <ArrowLeft className="mr-1 size-4" />
            Biblioteca
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Coluna esquerda: vídeo + execução + erros comuns */}
        <div className="space-y-4">
          {/* Vídeo / GIF / Imagem demonstrativa — fallback em ordem */}
          <Card className="relative overflow-hidden border-border bg-card">
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
            ) : exercicio.midiaUrl || exercicio.thumbnailUrl ? (
              // Sem vídeo, mas tem mídia rica (gif do catálogo importado, imagem estática etc.)
              // GIF anima sozinho — comportamento esperado pra demonstração de execução.
              <div className="aspect-video w-full bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exercicio.midiaUrl ?? exercicio.thumbnailUrl ?? ""}
                  alt={`Demonstração: ${exercicio.nome}`}
                  className="size-full object-contain"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="relative flex aspect-video w-full items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${grupoCor}1a, transparent), repeating-linear-gradient(45deg, transparent 0 10px, rgba(255,255,255,0.025) 10px 11px)`,
                }}
              >
                <div className="text-center text-muted-foreground">
                  <PlayCircle className="mx-auto size-12 opacity-40" />
                  <p className="mt-2 text-[11px] uppercase tracking-widest">
                    vídeo demonstrativo
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    16:9 · placeholder
                  </p>
                </div>
                <span
                  className="absolute left-3.5 top-3.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-black"
                  style={{ background: grupoCor }}
                >
                  {grupoNome}
                </span>
              </div>
            )}
          </Card>

          {/* Como executar */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm font-bold">
                Como executar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exercicio.descricao ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {exercicio.descricao}
                </p>
              ) : (
                <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
                  <li>
                    Posicione-se no {equipamento.toLowerCase()} com postura
                    neutra da coluna.
                  </li>
                  <li>
                    Inicie o movimento controlando a fase excêntrica em ~2
                    segundos.
                  </li>
                  <li>Pause brevemente no ponto de maior alongamento.</li>
                  <li>
                    Retorne à posição inicial mantendo tensão no músculo-alvo.
                  </li>
                  <li>
                    Mantenha respiração: inspira na descida, expira na subida.
                  </li>
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Erros comuns */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm font-bold">
                Erros comuns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Usar carga excessiva e perder amplitude",
                  "Acelerar a fase excêntrica",
                  "Trancar a respiração durante toda a série",
                ].map((err) => (
                  <li key={err} className="flex items-start gap-2">
                    <X className="mt-0.5 size-3.5 shrink-0 text-gym-danger" />
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] italic text-muted-foreground/60">
                Lista padrão. Edite a descrição do exercício para adicionar
                erros específicos do contexto.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita: card de info + usado em */}
        <aside className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="font-display text-xl font-bold leading-tight">
                {exercicio.nome}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground"
                  style={{
                    background: `${grupoCor}1a`,
                    borderColor: `${grupoCor}60`,
                    color: grupoCor,
                  }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: grupoCor }}
                  />
                  {grupoNome}
                </span>
                {!exercicio.ativo ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Inativo
                  </Badge>
                ) : null}
              </div>

              {/* Detalhe-grid 2x2 */}
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <Stat label="Equipamento" value={equipamento}>
                  {exercicio.unidade ? (
                    <span className="text-[10px] text-muted-foreground">
                      Unidade {exercicio.unidade}
                    </span>
                  ) : null}
                </Stat>
                <Stat label="Grupo principal" value={grupoNome} />
                <Stat label="Sugestão padrão" value="3-4 × 8-12">
                  <span className="text-[10px] text-muted-foreground">
                    RIR 1-2 · 60-90s descanso
                  </span>
                </Stat>
                <Stat label="Cadência típica" value="2-0-1" />
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  className="flex-1"
                  asChild
                  title="Abre a lista de templates — use 'Adicionar exercício' dentro de um template para incluir este exercício"
                >
                  <Link href="/treinos">
                    <Plus className="mr-1 size-4" />
                    Usar em um treino
                  </Link>
                </Button>
                {exercicio.videoUrl ? (
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="border-border"
                    title="Abrir vídeo original"
                  >
                    <a
                      href={exercicio.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] italic text-muted-foreground/70">
                O exercício é incluído pelo botão &ldquo;Adicionar exercício&rdquo;
                dentro de cada template.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                Usado em
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {templatesUsando.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">
                  Não está em nenhum template ainda.
                </p>
              ) : (
                templatesUsando.map((t) => (
                  <Link
                    key={t.treinoId}
                    href={`/treinos/${t.treinoId}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary/40 px-2.5 py-2 text-left text-[13px] transition-colors hover:border-gym-accent/40 hover:bg-secondary"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{t.treinoNome}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {t.totalItens}{" "}
                        {t.totalItens === 1 ? "uso" : "usos"}
                        {t.versaoTemplate ? ` · v${t.versaoTemplate}` : ""}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-display text-sm font-bold text-foreground">
        {value}
      </div>
      {children}
    </div>
  );
}
