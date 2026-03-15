"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicJourneyShell } from "@/components/public/public-journey-shell";
import {
  buildPublicJourneyHref,
  getPublicPlanQuote,
  validateSignupDraft,
  listPublicTenants,
  type PublicSignupDraft,
} from "@/lib/public/services";
import { usePublicJourney } from "@/lib/public/use-public-journey";
import type { Sexo, Tenant } from "@/lib/types";

const DEFAULT_SIGNUP: PublicSignupDraft = {
  nome: "",
  email: "",
  telefone: "",
  cpf: "",
  dataNascimento: "",
  sexo: "F",
  cidade: "",
  objetivo: "",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PublicJourneyFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Carregando jornada pública...
    </div>
  );
}

function CadastroPublicoPageContent() {
  const { context, loading, error, resolvedTenantRef, persistDraft, draft, planId } = usePublicJourney();
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);

  useEffect(() => {
    void listPublicTenants().then(setTenantOptions);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando jornada pública...
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-xl border-rose-500/40 bg-rose-500/10">
          <CardContent className="px-6 py-5 text-sm text-rose-100">
            {error || "Não foi possível carregar o cadastro público."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const formSeed = draft.signup ?? DEFAULT_SIGNUP;
  const initialPlanId = planId ?? draft.planId ?? context.planos[0]?.id ?? "";
  const formKey = [
    context.tenant.id,
    initialPlanId,
    formSeed.nome,
    formSeed.email,
    formSeed.cpf,
  ].join(":");

  return (
    <PublicJourneyShell
      context={context}
      tenants={tenantOptions.length > 0 ? tenantOptions : [context.tenant]}
      currentStep="CADASTRO"
      title="Complete o pré-cadastro"
      description="Dados mínimos para gerar cliente, venda, contrato e pendências com contexto do tenant."
      actions={
        <Button asChild variant="outline" className="border-border bg-transparent">
          <Link href={buildPublicJourneyHref("/adesao", { tenantRef: resolvedTenantRef, planId: initialPlanId })}>
            Voltar aos planos
          </Link>
        </Button>
      }
    >
      <CadastroPublicoForm
        key={formKey}
        context={context}
        initialForm={formSeed}
        initialPlanId={initialPlanId}
        resolvedTenantRef={resolvedTenantRef}
        persistDraft={persistDraft}
      />
    </PublicJourneyShell>
  );
}

function CadastroPublicoForm({
  context,
  initialForm,
  initialPlanId,
  resolvedTenantRef,
  persistDraft,
}: {
  context: NonNullable<ReturnType<typeof usePublicJourney>["context"]>;
  initialForm: PublicSignupDraft;
  initialPlanId: string;
  resolvedTenantRef: string;
  persistDraft: (patch: Partial<Parameters<ReturnType<typeof usePublicJourney>["persistDraft"]>[0]>) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PublicSignupDraft>(initialForm);
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const selectedPlan = context.planos.find((item) => item.id === selectedPlanId) ?? context.planos[0];
  const quote = selectedPlan ? getPublicPlanQuote(selectedPlan) : null;

  function update<K extends keyof PublicSignupDraft>(key: K, value: PublicSignupDraft[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSignupDraft(form);
    if (!selectedPlanId) {
      nextErrors.planId = "Selecione um plano para continuar.";
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedPlanId) return;

    persistDraft({
      tenantRef: resolvedTenantRef,
      planId: selectedPlanId,
      signup: form,
    });

    router.push(
      buildPublicJourneyHref("/adesao/checkout", {
        tenantRef: resolvedTenantRef,
        planId: selectedPlanId,
      })
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <Card className="border-border/70 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle>Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="signup-plan" className="text-sm font-medium">
                Plano escolhido
              </label>
              <select
                id="signup-plan"
                value={selectedPlanId}
                onChange={(event) => setSelectedPlanId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
              >
                {context.planos.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nome}
                  </option>
                ))}
              </select>
              {formErrors.planId ? <p className="text-xs text-rose-300">{formErrors.planId}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="signup-nome" className="text-sm font-medium">
                  Nome completo
                </label>
                <Input
                  id="signup-nome"
                  value={form.nome}
                  onChange={(event) => update("nome", event.target.value)}
                  className="border-border bg-secondary"
                />
                {formErrors.nome ? <p className="text-xs text-rose-300">{formErrors.nome}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  className="border-border bg-secondary"
                />
                {formErrors.email ? <p className="text-xs text-rose-300">{formErrors.email}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-telefone" className="text-sm font-medium">
                  Telefone
                </label>
                <Input
                  id="signup-telefone"
                  value={form.telefone}
                  onChange={(event) => update("telefone", event.target.value)}
                  className="border-border bg-secondary"
                />
                {formErrors.telefone ? <p className="text-xs text-rose-300">{formErrors.telefone}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-cpf" className="text-sm font-medium">
                  CPF
                </label>
                <Input
                  id="signup-cpf"
                  value={form.cpf}
                  onChange={(event) => update("cpf", event.target.value)}
                  className="border-border bg-secondary"
                />
                {formErrors.cpf ? <p className="text-xs text-rose-300">{formErrors.cpf}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-data" className="text-sm font-medium">
                  Data de nascimento
                </label>
                <Input
                  id="signup-data"
                  type="date"
                  value={form.dataNascimento}
                  onChange={(event) => update("dataNascimento", event.target.value)}
                  className="border-border bg-secondary"
                />
                {formErrors.dataNascimento ? <p className="text-xs text-rose-300">{formErrors.dataNascimento}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-sexo" className="text-sm font-medium">
                  Sexo
                </label>
                <select
                  id="signup-sexo"
                  value={form.sexo}
                  onChange={(event) => update("sexo", event.target.value as Sexo)}
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                >
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-cidade" className="text-sm font-medium">
                  Cidade
                </label>
                <Input
                  id="signup-cidade"
                  value={form.cidade ?? ""}
                  onChange={(event) => update("cidade", event.target.value)}
                  className="border-border bg-secondary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="signup-objetivo" className="text-sm font-medium">
                Objetivo / observações
              </label>
              <Textarea
                id="signup-objetivo"
                value={form.objetivo ?? ""}
                onChange={(event) => update("objetivo", event.target.value)}
                className="border-border bg-secondary"
                placeholder="Ex: foco em musculação e aulas de spinning no período da manhã"
              />
            </div>

            <Button type="submit" className="w-full">
              Ir para checkout
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle>Resumo do plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedPlan && quote ? (
            <>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{selectedPlan.tipo}</p>
                <h3 className="mt-2 font-display text-3xl font-bold">{selectedPlan.nome}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Contrato: {selectedPlan.contratoAssinatura.toLowerCase()} • Renovação automática {selectedPlan.permiteRenovacaoAutomatica ? "disponível" : "indisponível"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                <p className="text-sm font-medium text-muted-foreground">Total inicial</p>
                <p className="mt-2 font-display text-4xl font-bold text-gym-accent">{formatCurrency(quote.total)}</p>
              </div>
              <div className="space-y-3">
                {quote.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-secondary/20 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{item.descricao}</p>
                      {item.detalhes ? <p className="text-xs text-muted-foreground">{item.detalhes}</p> : null}
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.valor)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum plano selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CadastroPublicoPage() {
  return (
    <Suspense fallback={<PublicJourneyFallback />}>
      <CadastroPublicoPageContent />
    </Suspense>
  );
}
