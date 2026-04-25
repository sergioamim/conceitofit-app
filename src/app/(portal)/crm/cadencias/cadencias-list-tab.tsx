"use client";

import { Pencil, Send, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CrmCadencia } from "@/lib/types";
import {
  CRM_CADENCIA_ACTION_LABEL,
  CRM_CADENCIA_TRIGGER_LABEL,
  getCrmStageName,
} from "@/lib/tenant/crm/workspace";
import { formatDateTime } from "@/lib/formatters";

export interface CadenciasListTabProps {
  cadencias: CrmCadencia[];
  loading: boolean;
  onEdit: (cadencia: CrmCadencia) => void;
  onTrigger: (cadencia: CrmCadencia) => void;
  onToggle: (cadencia: CrmCadencia) => void;
  onDelete: (cadencia: CrmCadencia) => void;
}

export function CadenciasListTab({
  cadencias,
  loading,
  onEdit,
  onTrigger,
  onToggle,
  onDelete,
}: CadenciasListTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        {cadencias.map((cadencia) => (
          <Card key={cadencia.id} className="border-border/80 bg-card/70">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{cadencia.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground">{cadencia.objetivo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      cadencia.ativo
                        ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
                        : "border-border bg-secondary/50 text-muted-foreground"
                    }
                  >
                    {cadencia.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {CRM_CADENCIA_TRIGGER_LABEL[cadencia.gatilho]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getCrmStageName(cadencia.stageStatus)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {cadencia.passos.length} passo(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {cadencia.passos.map((passo, index) => (
                  <div
                    key={passo.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 px-4 py-2.5"
                  >
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{passo.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {CRM_CADENCIA_ACTION_LABEL[passo.acao]} · D+{passo.delayDias}
                        {passo.automatica ? " · Automático" : " · Manual"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <p className="text-xs text-muted-foreground">
                  Última execução: {formatDateTime(cadencia.ultimaExecucao ?? "")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border"
                    onClick={() => onTrigger(cadencia)}
                    disabled={!cadencia.ativo}
                  >
                    <Send className="mr-1.5 size-3.5" />
                    Disparar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border"
                    onClick={() => onEdit(cadencia)}
                  >
                    <Pencil className="mr-1.5 size-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggle(cadencia)}
                  >
                    {cadencia.ativo ? "Desativar" : "Ativar"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-gym-danger hover:text-gym-danger"
                      >
                        <Trash2 className="mr-1.5 size-3.5" />
                        Deletar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deletar cadência?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar &quot;{cadencia.nome}
                          &quot;? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-gym-danger text-white hover:bg-gym-danger/90"
                          onClick={() => onDelete(cadencia)}
                        >
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && cadencias.length === 0 && (
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma cadência configurada. Crie cadências no CRM para automatizar o pipeline.
        </div>
      )}
    </div>
  );
}
