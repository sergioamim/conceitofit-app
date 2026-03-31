"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Button } from "@/components/ui/button";
import { PlanoForm } from "@/components/planos/plano-form";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { getPlanoApi, updatePlanoApi } from "@/lib/api/comercial-catalogo";
import { listAtividadesApi } from "@/lib/api/administrativo";
import type { Atividade, Plano } from "@/lib/types";
import {
  buildPlanoPayload,
  getDefaultPlanoFormValues,
  planoToFormValues,
  type PlanoFormValues,
} from "@/lib/tenant/planos/form";

export default function EditarPlanoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tenantId, tenantResolved } = useTenantContext();
  const id = params?.id;

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id || !tenantId) return;
      setLoading(true);
      const [listaAtividades, planoAtual] = await Promise.all([
        listAtividadesApi({ tenantId, apenasAtivas: false }),
        getPlanoApi({ tenantId, id }),
      ]);
      setAtividades(listaAtividades);
      setPlano(planoAtual);
      setLoading(false);
    }
    if (!tenantResolved || !tenantId) return;
    void load();
  }, [id, tenantId, tenantResolved]);

  const initialValues = useMemo<PlanoFormValues>(
    () => (plano ? planoToFormValues(plano) : getDefaultPlanoFormValues()),
    [plano]
  );

  async function handleSubmit(values: PlanoFormValues) {
    if (!id || !tenantId || !plano) return;
    setSaving(true);
    await updatePlanoApi({
      tenantId,
      id,
      data: {
        ...buildPlanoPayload(values),
        ativo: plano.ativo,
      },
    });
    router.push("/planos");
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando plano...</div>;
  }

  if (!plano) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Plano não encontrado para esta unidade.</p>
        <div>
          <Button variant="outline" className="border-border" onClick={() => router.push("/planos")}>
            <ChevronLeft className="size-4" />
            Voltar para listagem
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Planos", href: "/planos" },
            { label: plano.nome, href: "/planos" },
            { label: "Editar" },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Editar plano</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste contrato, vigência, cobrança recorrente e benefícios do plano.
            </p>
          </div>
          <Button variant="outline" className="border-border" onClick={() => router.push("/planos")}>
            <ChevronLeft className="size-4" />
            Voltar para listagem
          </Button>
        </div>
      </div>

      <PlanoForm
        initial={initialValues}
        atividades={atividades}
        submitLabel={saving ? "Salvando..." : "Salvar alterações"}
        submitting={saving}
        onCancel={() => router.push("/planos")}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
