"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Button } from "@/components/ui/button";
import { useAuthAccess, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { extractAlunosFromListResponse, listAlunosApi } from "@/lib/api/alunos";
import { listTreinoExercicios, getTreinoWorkspace } from "@/lib/tenant/treinos/workspace";
import type { Aluno, Exercicio, Treino } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const TreinoV2Editor = dynamic(
  () => import("@/components/treinos/treino-v2-editor").then((mod) => mod.TreinoV2Editor),
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
  const [treino, setTreino] = useState<Treino | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    if (!treinoId.trim()) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [treinoData, exerciciosData, alunosResponse] = await Promise.all([
        getTreinoWorkspace({ tenantId, id: treinoId }),
        listTreinoExercicios({ tenantId, ativo: true }),
        listAlunosApi({ tenantId, status: "ATIVO", page: 0, size: 200 }),
      ]);

      if (!treinoData) {
        setNotFound(true);
        setTreino(null);
        return;
      }

      setNotFound(false);
      setTreino(treinoData);
      setExercicios(exerciciosData);
      setAlunos(extractAlunosFromListResponse(alunosResponse));
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantId, treinoId]);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void loadData();
  }, [loadData, tenantId, tenantResolved]);

  const role = useMemo(() => resolveRole(access), [access]);
  const autoOpenAssignment = searchParams?.get("assign") === "1";

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
        <ListErrorState error={error} onRetry={() => void loadData()} />
      ) : null}

      <TreinoV2Editor
        tenantId={tenantId ?? ""}
        treino={treino}
        alunos={alunos}
        exercicios={exercicios}
        role={role}
        autoOpenAssignment={autoOpenAssignment}
        onTreinoChange={setTreino}
        onCatalogChange={setExercicios}
      />
    </div>
  );
}
