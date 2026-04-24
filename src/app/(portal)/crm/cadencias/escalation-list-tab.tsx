"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CrmCadencia, CrmEscalationRule } from "@/lib/types";
import { CRM_ESCALATION_ACTION_LABEL } from "@/lib/tenant/crm/workspace";

export interface EscalationListTabProps {
  cadencias: CrmCadencia[];
  escalationRules: CrmEscalationRule[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (rule: CrmEscalationRule) => void;
  onRequestDelete: (rule: CrmEscalationRule) => void;
}

export function EscalationListTab({
  cadencias,
  escalationRules,
  loading,
  onCreate,
  onEdit,
  onRequestDelete,
}: EscalationListTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Regras de escalação</p>
          <p className="text-sm text-muted-foreground">
            Definem o que acontece quando uma tarefa de cadência vence sem ação ou
            o prospect fica sem resposta após o ciclo completo.
          </p>
        </div>
        <Button
          onClick={onCreate}
          className="bg-gym-accent text-black hover:bg-gym-accent/90"
          disabled={cadencias.length === 0}
        >
          <Plus className="mr-2 size-4" />
          Nova regra
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-secondary/40">
              <TableHead>Regra</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {escalationRules.map((rule) => (
              <TableRow key={rule.id} className="border-border">
                <TableCell className="font-medium">{rule.nome}</TableCell>
                <TableCell className="text-sm">
                  <Badge variant="outline" className="text-xs">
                    {rule.condicao === "TAREFA_VENCIDA" && "Tarefa vencida"}
                    {rule.condicao === "SEM_RESPOSTA_APOS_CADENCIA" &&
                      "Sem resposta após cadência"}
                    {rule.condicao === "SLA_EXCEDIDO" && "SLA excedido"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {CRM_ESCALATION_ACTION_LABEL[rule.acao]}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      rule.ativo
                        ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
                        : "border-border bg-secondary/50 text-muted-foreground"
                    }
                  >
                    {rule.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(rule)}
                      aria-label={`Editar regra ${rule.nome}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-gym-danger hover:text-gym-danger"
                      onClick={() => onRequestDelete(rule)}
                      aria-label={`Remover regra ${rule.nome}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && escalationRules.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Nenhuma regra de escalação configurada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
