"use client";

import type { Prospect, StatusProspect } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_LABELS: { value: StatusProspect; label: string }[] = [
  { value: "NOVO", label: "Novo" },
  { value: "EM_CONTATO", label: "Em contato" },
  { value: "AGENDOU_VISITA", label: "Agendou visita" },
  { value: "VISITOU", label: "Visitou" },
  { value: "CONVERTIDO", label: "Convertido" },
  { value: "PERDIDO", label: "Perdido" },
];

export function ProspectTimelineModal({
  prospect,
  onClose,
}: {
  prospect: Prospect | null;
  onClose: () => void;
}) {
  if (!prospect) return null;
  return (
    <Dialog open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Timeline · {prospect.nome}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {(prospect.statusLog ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sem interações registradas.
            </p>
          )}
          {(prospect.statusLog ?? [])
            .slice()
            .sort((a, b) => (a.data > b.data ? -1 : 1))
            .map((log, i) => (
              <div key={`${log.status}-${i}`} className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2 text-sm">
                <span>{STATUS_LABELS.find((s) => s.value === log.status)?.label ?? log.status}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.data).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
