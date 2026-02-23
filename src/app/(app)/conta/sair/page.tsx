"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authLogout } from "@/lib/mock/services";

export default function SairPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleLogout() {
    setSaving(true);
    try {
      await authLogout();
      router.replace("/login");
    } finally {
      setSaving(false);
    }
  }

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
          Encerra a sessão atual e retorna para a tela de login.
        </p>
        <div className="mt-4 flex justify-end">
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={saving}
          >
            {saving ? "Saindo..." : "Confirmar saída"}
          </Button>
        </div>
      </div>
    </div>
  );
}
