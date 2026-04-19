"use client";

import { CalendarDays, Dumbbell, Users } from "lucide-react";

interface ClienteTabAtividadesProps {
  alunoId: string;
  tenantId: string;
}

export function ClienteTabAtividades({ alunoId, tenantId }: ClienteTabAtividadesProps) {
  // Dados de turmas/atividades serao carregados quando o backend estiver pronto.
  // Por enquanto, mostra placeholder com a estrutura visual final.

  return (
    <div className="space-y-4">
      {/* Turmas inscritas */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="font-display text-base font-bold">Turmas inscritas</h2>
        </div>
        <div className="mt-4">
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma turma encontrada para este cliente.
          </p>
        </div>
      </div>

      {/* Grade semanal */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <h2 className="font-display text-base font-bold">Grade semanal</h2>
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((dia) => (
              <div key={dia} className="rounded-md border border-border/50 bg-secondary/30 py-6">
                <p className="font-semibold text-foreground">{dia}</p>
                <p className="mt-1 text-[10px]">Sem aulas</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Treino ativo */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Dumbbell className="size-4 text-muted-foreground" />
          <h2 className="font-display text-base font-bold">Treino ativo</h2>
        </div>
        <div className="mt-4">
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum treino prescrito para este cliente.
          </p>
        </div>
      </div>
    </div>
  );
}
