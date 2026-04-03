"use client";

import { ShieldAlert, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { endImpersonationApi } from "@/backoffice/api/admin-audit";
import {
  AUTH_SESSION_UPDATED_EVENT,
  IMPERSONATION_SESSION_UPDATED_EVENT,
  clearImpersonationSession,
  getImpersonationSession,
  restoreOriginalSessionFromImpersonation,
  type ImpersonationSessionState,
} from "@/lib/api/session";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export function ImpersonationBanner() {
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [ending, setEnding] = useState(false);
  const [snapshot, setSnapshot] = useState<ImpersonationSessionState | null>(null);

  useEffect(() => {
    function syncState() {
      setSnapshot(getImpersonationSession());
      setHydrated(true);
    }

    syncState();
    window.addEventListener(IMPERSONATION_SESSION_UPDATED_EVENT, syncState);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncState);
    window.addEventListener("storage", syncState);
    return () => {
      window.removeEventListener(IMPERSONATION_SESSION_UPDATED_EVENT, syncState);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncState);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  async function handleEndImpersonation() {
    const currentSnapshot = getImpersonationSession();
    if (!currentSnapshot) return;

    setEnding(true);
    const restored = restoreOriginalSessionFromImpersonation();

    try {
      await endImpersonationApi({
        auditContextId: currentSnapshot.auditContextId,
        targetUserId: currentSnapshot.targetUserId,
        targetUserName: currentSnapshot.targetUserName,
      });
      toast({
        title: "Impersonação encerrada",
        description: `Sessão original restaurada${restored?.actorDisplayName ? ` para ${restored.actorDisplayName}` : ""}.`,
      });
    } catch (error) {
      toast({
        title: "Sessão restaurada com ressalva",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      clearImpersonationSession();
      setEnding(false);
      window.location.assign(currentSnapshot.returnPath || `/admin/seguranca/usuarios/${currentSnapshot.targetUserId}`);
    }
  }

  if (!hydrated || !snapshot) {
    return null;
  }

  return (
    <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-3 text-amber-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full border border-amber-300/30 bg-amber-400/10 p-2">
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Você está operando como {snapshot.targetUserName}
            </p>
            <p className="text-sm text-amber-100/90">
              {snapshot.actorDisplayName ? `Sessão original: ${snapshot.actorDisplayName}. ` : ""}
              Encerrar retorna ao backoffice e registra o fechamento no audit log.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="border-amber-300/40 bg-transparent text-amber-50 hover:bg-amber-500/10 hover:text-amber-50"
          onClick={() => void handleEndImpersonation()}
          disabled={ending}
        >
          <Undo2 className="mr-2 size-4" />
          {ending ? "Encerrando..." : "Encerrar impersonação"}
        </Button>
      </div>
    </div>
  );
}
