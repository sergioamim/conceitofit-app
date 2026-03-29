import type { Dispatch, SetStateAction } from "react";
import type { ProspectAgendamento, StatusAgendamento, Funcionario } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STATUS_AG_LABEL, formatDate } from "./prospect-shared";

export type AgForm = {
  titulo: string;
  data: string;
  hora: string;
  funcionarioId: string;
  observacoes: string;
};

export function ProspectAgendaTab({
  agendamentos,
  agendaOpen,
  setAgendaOpen,
  agForm,
  setAgForm,
  savingAg,
  funcionarios,
  funcionariosMap,
  handleSaveAgendamento,
  handleAgStatus,
}: {
  agendamentos: ProspectAgendamento[];
  agendaOpen: boolean;
  setAgendaOpen: Dispatch<SetStateAction<boolean>>;
  agForm: AgForm;
  setAgForm: Dispatch<SetStateAction<AgForm>>;
  savingAg: boolean;
  funcionarios: Funcionario[];
  funcionariosMap: Map<string, Funcionario>;
  handleSaveAgendamento: () => void;
  handleAgStatus: (id: string, status: StatusAgendamento) => void;
}) {
  return (
    <div className="space-y-4 p-5">
      {/* New appointment form */}
      <div className="rounded-xl border border-border bg-secondary/30">
        <button
          onClick={() => setAgendaOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
        >
          <span>+ Agendar nova visita</span>
          <span className="text-muted-foreground">{agendaOpen ? "▲" : "▼"}</span>
        </button>

        {agendaOpen && (
          <div className="space-y-3 border-t border-border p-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Título
              </label>
              <Input
                value={agForm.titulo}
                onChange={(e) => setAgForm((f) => ({ ...f, titulo: e.target.value }))}
                className="border-border bg-secondary text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Data *
                </label>
                <Input
                  type="date"
                  value={agForm.data}
                  onChange={(e) => setAgForm((f) => ({ ...f, data: e.target.value }))}
                  className="border-border bg-secondary text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Hora *
                </label>
                <Input
                  type="time"
                  value={agForm.hora}
                  onChange={(e) => setAgForm((f) => ({ ...f, hora: e.target.value }))}
                  className="border-border bg-secondary text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Atendente *
              </label>
              <Select value={agForm.funcionarioId} onValueChange={(v) => setAgForm((f) => ({ ...f, funcionarioId: v }))}>
                <SelectTrigger className="w-full border-border bg-secondary text-sm">
                  <SelectValue placeholder="Selecione o atendente" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome} {f.cargo ? `· ${f.cargo}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </label>
              <Input
                placeholder="Ex: cliente quer ver sala de musculação"
                value={agForm.observacoes}
                onChange={(e) => setAgForm((f) => ({ ...f, observacoes: e.target.value }))}
                className="border-border bg-secondary text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAgendaOpen(false)} className="border-border">
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAgendamento}
                disabled={!agForm.data || !agForm.hora || !agForm.funcionarioId || savingAg}
              >
                Confirmar agendamento
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Appointments list */}
      {agendamentos.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma visita agendada</p>
      ) : (
        <div className="space-y-3">
          {agendamentos.map((ag) => {
            const func = funcionariosMap.get(ag.funcionarioId);
            return (
              <div key={ag.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{ag.titulo}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(ag.data)} às {ag.hora} · {func?.nome ?? "—"}
                      {func?.cargo ? ` (${func.cargo})` : ""}
                    </p>
                    {ag.observacoes && (
                      <p className="mt-1 text-xs text-muted-foreground">{ag.observacoes}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      ag.status === "AGENDADO" && "bg-gym-accent/15 text-gym-accent",
                      ag.status === "REALIZADO" && "bg-gym-teal/15 text-gym-teal",
                      ag.status === "CANCELADO" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {STATUS_AG_LABEL[ag.status]}
                  </span>
                </div>
                {ag.status === "AGENDADO" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleAgStatus(ag.id, "REALIZADO")}
                      className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-gym-teal/50 hover:text-gym-teal"
                    >
                      Marcar realizado
                    </button>
                    <button
                      onClick={() => handleAgStatus(ag.id, "CANCELADO")}
                      className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-gym-danger/50 hover:text-gym-danger"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
