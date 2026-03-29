import type { Prospect, StatusProspect, Funcionario } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_COLUMNS, ORIGEM_LABEL, formatDatetime } from "./prospect-shared";

export function ProspectInfoTab({
  prospect,
  responsavel,
  nextStatus,
  selectableStatuses,
  onStatusChange,
  onAdvance,
}: {
  prospect: Prospect;
  responsavel: Funcionario | null | undefined;
  nextStatus: StatusProspect | null;
  selectableStatuses: StatusProspect[];
  onStatusChange: (status: StatusProspect) => void;
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-5 p-5">
      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-border bg-secondary/30 p-4 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</p>
          <p className="mt-0.5 font-medium">{prospect.telefone}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">E-mail</p>
          <p className="mt-0.5 font-medium">{prospect.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CPF</p>
          <p className="mt-0.5 font-medium">{prospect.cpf ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Origem</p>
          <p className="mt-0.5 font-medium">{ORIGEM_LABEL[prospect.origem] ?? prospect.origem}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Responsável</p>
          <p className="mt-0.5 font-medium">{responsavel?.nome ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cadastrado em</p>
          <p className="mt-0.5 font-medium">{formatDatetime(prospect.dataCriacao)}</p>
        </div>
        {prospect.observacoes && (
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Observações</p>
            <p className="mt-0.5">{prospect.observacoes}</p>
          </div>
        )}
        {prospect.motivoPerda && (
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Motivo da perda</p>
            <p className="mt-0.5 text-gym-danger">{prospect.motivoPerda}</p>
          </div>
        )}
      </div>

      {/* Status change */}
      {prospect.status !== "CONVERTIDO" && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Evoluir status
          </p>
          <div className="flex items-center gap-2">
            <Select value={prospect.status} onValueChange={(v) => onStatusChange(v as StatusProspect)}>
              <SelectTrigger className="w-52 border-border bg-secondary text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {STATUS_COLUMNS.filter((s) => selectableStatuses.includes(s.key)).map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {nextStatus && (
              <Button size="sm" onClick={onAdvance}>
                Avançar → {STATUS_COLUMNS.find((s) => s.key === nextStatus)?.label}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status timeline */}
      {(prospect.statusLog ?? []).length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de evolução
          </p>
          <div className="space-y-1">
            {[...(prospect.statusLog ?? [])].reverse().map((log, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-gym-accent shrink-0" />
                <StatusBadge status={log.status} />
                <span className="text-muted-foreground">{formatDatetime(log.data)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
