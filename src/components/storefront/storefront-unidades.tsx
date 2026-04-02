import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import type { Tenant } from "@/lib/types";

export function StorefrontUnidades({ unidades, academiaSlug }: { unidades: Tenant[]; academiaSlug?: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {unidades.map((unidade) => (
        <Link
          key={unidade.id}
          href={academiaSlug ? `/storefront/${academiaSlug}/unidades/${unidade.id}` : `/storefront/unidade/${unidade.id}`}
          className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:border-gym-accent/40"
        >
          <h3 className="font-display text-lg font-bold group-hover:text-gym-accent transition-colors">
            {unidade.nome}
          </h3>

          {unidade.endereco && (
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gym-accent" />
              <span>
                {[
                  unidade.endereco.logradouro,
                  unidade.endereco.numero ? `n ${unidade.endereco.numero}` : null,
                  unidade.endereco.bairro,
                ]
                  .filter(Boolean)
                  .join(", ")}
                {unidade.endereco.cidade && (
                  <>
                    <br />
                    {unidade.endereco.cidade}
                    {unidade.endereco.estado ? ` - ${unidade.endereco.estado}` : ""}
                  </>
                )}
              </span>
            </p>
          )}

          {unidade.telefone && (
            <p className="mt-2 text-sm text-muted-foreground">{unidade.telefone}</p>
          )}

          <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-gym-accent">
            Ver planos e detalhes
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </div>
  );
}
