"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudOff, History, Save } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const subscribeHydration = () => () => undefined;

function useHydrated() {
  return useSyncExternalStore(subscribeHydration, () => true, () => false);
}

export function FormDraftIndicator({
  lastModified,
  className
}: {
  lastModified: Date | null;
  className?: string;
}) {
  const hydrated = useHydrated();
  const [, setRefreshTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setRefreshTick((current) => current + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!hydrated || !lastModified) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className || ""}`}>
      <Save className="size-3.5" />
      <span>Rascunho atualizado {formatDistanceToNow(lastModified, { locale: ptBR, addSuffix: true })}</span>
    </div>
  );
}

export function RestoreDraftModal({
  hasDraft,
  onRestore,
  onDiscard,
}: {
  hasDraft: boolean;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  const hydrated = useHydrated();

  if (!hydrated) return null;

  return (
    <Dialog open={hasDraft} onOpenChange={(open) => {
        if (!open) onDiscard();
    }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gym-accent/15 mb-4">
            <History className="size-6 text-gym-accent" />
          </div>
          <DialogTitle className="text-center text-lg">Retomar preenchimento?</DialogTitle>
          <DialogDescription className="text-center">
            Identificamos que você não concluiu um formulário recentemente. Deseja recuperar os dados digitados ou começar de novo?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onDiscard}>
            <CloudOff className="mr-2 size-4" /> Descartar
          </Button>
          <Button className="w-full sm:w-auto" onClick={onRestore}>
            <History className="mr-2 size-4" /> Restaurar dados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
