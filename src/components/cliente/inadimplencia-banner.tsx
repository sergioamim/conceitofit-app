"use client";

import { memo } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useInadimplenciaCliente } from "@/lib/query/use-portal-aluno";
import { formatBRL } from "@/lib/formatters";

function InadimplenciaBannerComponent() {
  const { tenantId, tenantResolved } = useTenantContext();
  const { data } = useInadimplenciaCliente({ tenantId, tenantResolved });

  if (!data?.inadimplente) return null;

  return (
    <div className="mx-auto w-full max-w-lg px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-gym-danger/30 bg-gym-danger/[0.06] p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gym-danger/15 text-gym-danger">
          <AlertTriangle className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gym-danger">
            Voce possui pendencias financeiras
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.contasVencidas} {data.contasVencidas === 1 ? "conta vencida" : "contas vencidas"}
            {" "}totalizando{" "}
            <span className="font-bold text-gym-danger">{formatBRL(data.valorTotal)}</span>
            {data.diasAtraso > 0 && (
              <> com {data.diasAtraso} {data.diasAtraso === 1 ? "dia" : "dias"} de atraso</>
            )}
          </p>
        </div>
        <Link
          href="/meus-pagamentos"
          className="shrink-0 rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gym-danger transition-colors hover:bg-gym-danger/20"
        >
          Pagar
        </Link>
      </div>
    </div>
  );
}

export const InadimplenciaBanner = memo(InadimplenciaBannerComponent);
