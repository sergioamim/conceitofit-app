"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Button } from "@/components/ui/button";
import { PlanoForm } from "@/components/planos/plano-form";
import { useTenantContext } from "@/hooks/use-session-context";
import { createPlanoApi } from "@/lib/api/comercial-catalogo";
import { listAtividadesApi } from "@/lib/api/administrativo";
import type { Atividade } from "@/lib/types";
import { buildPlanoPayload, type PlanoFormValues } from "@/lib/planos/form";

export default function NovoPlanoPage() {
  const router = useRouter();
  const { tenantId, tenantResolved } = useTenantContext();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void listAtividadesApi({ tenantId, apenasAtivas: false }).then(setAtividades);
  }, [tenantId, tenantResolved]);

  async function handleSubmit(values: PlanoFormValues) {
    if (!tenantId) return;
    setSaving(true);
    await createPlanoApi({
      tenantId,
      data: buildPlanoPayload(values),
    });
    router.push("/planos");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumb items={[{ label: "Planos", href: "/planos" }, { label: "Novo plano" }]} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Novo plano</h1>
            <p className="mt-1 text-sm text-muted-foreground">Cadastre um plano completo com contrato, regras financeiras e benefícios.</p>
          </div>
          <Button variant="outline" className="border-border" onClick={() => router.push("/planos")}>
            <ChevronLeft className="size-4" />
            Voltar para listagem
          </Button>
        </div>
      </div>

      <PlanoForm
        atividades={atividades}
        submitLabel={!tenantResolved || !tenantId ? "Carregando contexto..." : saving ? "Criando..." : "Criar plano"}
        submitting={saving || !tenantResolved || !tenantId}
        onCancel={() => router.push("/planos")}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
