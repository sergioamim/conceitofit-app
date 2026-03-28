"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UnidadesWorkspace } from "../hooks/use-unidades-workspace";

interface AcademiaSidebarProps {
  workspace: UnidadesWorkspace;
}

export function AcademiaSidebar({ workspace }: AcademiaSidebarProps) {
  const {
    loading,
    academiasOrdenadas,
    selectedAcademiaId,
    unitCountByAcademia,
    handleSelectAcademia,
  } = workspace;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">Academias</CardTitle>
        <p className="text-sm text-muted-foreground">
          Escolha a academia para abrir a listagem das unidades e iniciar um novo cadastro já no contexto certo.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {academiasOrdenadas.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground">Nenhuma academia cadastrada.</p>
        ) : null}
        {academiasOrdenadas.map((academia) => {
          const isSelected = academia.id === selectedAcademiaId;
          const unitCount = unitCountByAcademia.get(academia.id) ?? 0;
          return (
            <button
              key={academia.id}
              type="button"
              onClick={() => handleSelectAcademia(academia.id)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                isSelected
                  ? "border-gym-accent bg-gym-accent/10"
                  : "border-border bg-card hover:bg-secondary/40"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{academia.nome}</p>
                  <p className="text-xs text-muted-foreground">{academia.documento || "Sem documento cadastrado"}</p>
                </div>
                <Badge variant={isSelected ? "default" : "secondary"}>
                  {unitCount} unidade{unitCount === 1 ? "" : "s"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {academia.ativo === false ? "Academia inativa" : "Academia ativa"}
              </p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
