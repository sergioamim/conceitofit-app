"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Button } from "@/components/ui/button";
import { useAuthAccess, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useTreinoDetail } from "@/lib/query/use-treinos";
import { isTreinoEditorV3Enabled } from "@/lib/feature-flags";

const TreinoV2Editor = dynamic(
  () => import("@/components/treinos/treino-v2-editor").then((mod) => mod.TreinoV2Editor),
  { ssr: false },
);

const TreinoV3Editor = dynamic(
  () => import("@/components/treinos/treino-v3-editor").then((mod) => mod.TreinoV3Editor),
  { ssr: false },
);
import { ListErrorState } from "@/components/shared/list-states";

function resolveRole(access: ReturnType<typeof useAuthAccess>) {
  if (access.canAccessElevatedModules) return "ADMINISTRADOR" as const;
  if (access.roles.some((role) => /coord/i.test(role))) return "COORDENADOR_TECNICO" as const;
  if (access.roles.some((role) => /oper/i.test(role))) return "OPERACAO" as const;
  return "PROFESSOR" as const;
}

export default function TreinoDetalhePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const treinoId = params?.id ?? "";
  const { tenantId, tenantResolved } = useTenantContext();
  const access = useAuthAccess();

  const { data: detailData, isLoading: loading, isError, error: queryError } = useTreinoDetail({
    tenantId,
    tenantResolved,
    treinoId,
  });

  const treino = detailData?.treino ?? null;
  const exercicios = detailData?.exercicios ?? [];
  const alunos = detailData?.alunos ?? [];
  const queryClient = useQueryClient();
  const notFound = !loading && !treino && !isError;
  const error = isError ? (queryError instanceof Error ? queryError.message : "Falha ao carregar treino.") : null;

  const handleInvalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["treinos"] });
  }, [queryClient]);

  const role = useMemo(() => resolveRole(access), [access]);
  const autoOpenAssignment = searchParams?.get("assign") === "1";
  const useV3Editor = useMemo(() => isTreinoEditorV3Enabled(), []);
  const customizeMode = searchParams?.get("customize") === "1";
  const customAlunoId = searchParams?.get("alunoId") ?? undefined;
  const customAlunoNome = searchParams?.get("alunoNome") ?? undefined;

  if (loading) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando editor de treino...
      </div>
    );
  }

  if (notFound || !treino) {
    return (
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Treinos", href: "/treinos" },
            { label: "Treino não encontrado" },
          ]}
        />
        <h1 className="font-display text-2xl font-bold tracking-tight">Treino não encontrado</h1>
        <Button asChild variant="outline">
          <Link href="/treinos">Voltar para treinos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Treinos", href: "/treinos" },
          { label: treino.templateNome ?? treino.nome ?? "Editor" },
        ]}
      />

      {error ? (
        <ListErrorState error={error} onRetry={handleInvalidate} />
      ) : null}

      {useV3Editor ? (
        <TreinoV3Editor
          tenantId={tenantId ?? ""}
          treino={treino}
          alunos={alunos}
          exercicios={exercicios}
          role={role}
          autoOpenAssignment={autoOpenAssignment}
          mode={customizeMode && customAlunoId ? "instance" : "template"}
          alunoId={customAlunoId}
          alunoNome={customAlunoNome}
          onTreinoChange={() => handleInvalidate()}
          onCatalogChange={() => handleInvalidate()}
        />
      ) : (
        <TreinoV2Editor
          tenantId={tenantId ?? ""}
          treino={treino}
          alunos={alunos}
          exercicios={exercicios}
          role={role}
          autoOpenAssignment={autoOpenAssignment}
          onTreinoChange={() => handleInvalidate()}
          onCatalogChange={() => handleInvalidate()}
        />
      )}
    </div>
  );
}
