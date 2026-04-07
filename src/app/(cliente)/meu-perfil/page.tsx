"use client";

import { CircleUser } from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";

export default function MeuPerfilPage() {
  const { displayName, networkName } = useTenantContext();

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
        <CircleUser className="size-8 text-gym-accent" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Meu Perfil
      </h1>
      {displayName ? (
        <p className="text-sm font-medium text-foreground">{displayName}</p>
      ) : null}
      {networkName ? (
        <p className="text-xs text-muted-foreground">{networkName}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Seus dados pessoais e configurações aparecerão aqui.
      </p>
    </div>
  );
}
