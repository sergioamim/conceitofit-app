"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Proxy page: rende a jornada /adesao/cadastro existente usando o tenantRef
 * do subdomínio da storefront. Evita duplicar a lógica do form.
 *
 * O middleware do storefront injeta x-tenant-id no header; aqui pegamos
 * ?tenant=... e ?plan=... da query string (vindos do redirect de /plano/[slug]
 * ou dos CTAs da página de unidade).
 */

function CadastroRedirect() {
  const searchParams = useSearchParams();
  const tenant = searchParams.get("tenant") ?? "";
  const plan = searchParams.get("plan") ?? "";

  // Redirect browser to the canonical /adesao/cadastro with params
  if (typeof window !== "undefined") {
    const query = new URLSearchParams();
    if (tenant) query.set("tenant", tenant);
    if (plan) query.set("plan", plan);
    window.location.replace(`/adesao/cadastro?${query.toString()}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Redirecionando para matricula...
    </div>
  );
}

export default function StorefrontCadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <CadastroRedirect />
    </Suspense>
  );
}
