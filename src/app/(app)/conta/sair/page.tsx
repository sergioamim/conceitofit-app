"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SairPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Sair</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Encerrar sessão atual
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Esta é uma simulação. Clique para voltar ao dashboard.
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => router.push("/dashboard")}>Sair</Button>
        </div>
      </div>
    </div>
  );
}
