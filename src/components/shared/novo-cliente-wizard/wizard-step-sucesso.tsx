"use client";

import { CheckCircle2 } from "lucide-react";
import type { Plano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/formatters";
import { formatDate, type CriarAlunoComMatriculaResponse } from "./wizard-types";

export function StepSucesso({ result, plano, onClose }: { result: CriarAlunoComMatriculaResponse; plano?: Plano; onClose: () => void }) {
  return (
    <div className="space-y-5 text-center py-2">
      <div className="flex justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-gym-teal/15">
          <CheckCircle2 className="size-7 text-gym-teal" />
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">Cadastro realizado!</h3>
        <p className="mt-1 text-sm text-muted-foreground">{result.aluno.nome} está ativo com {plano?.nome}.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-left text-sm">
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cliente</p>
          <p className="mt-1 font-semibold truncate" title={result.aluno.nome}>{result.aluno.nome}</p>
          <p className="text-xs text-muted-foreground">{result.aluno.cpf}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Matrícula</p>
          <p className="mt-1 font-semibold truncate" title={plano?.nome}>{plano?.nome}</p>
          {result.matricula && (
            <p className="text-xs text-muted-foreground">Inicia {formatDate(result.matricula.dataInicio)}</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pagamento</p>
          <p className="mt-1 font-display font-bold text-gym-accent">{formatBRL(result.pagamento?.valorFinal || 0)}</p>
          <p className="text-xs text-gym-warning">Pendente</p>
        </div>
      </div>
      <Button onClick={onClose} className="w-full">Fechar</Button>
    </div>
  );
}
