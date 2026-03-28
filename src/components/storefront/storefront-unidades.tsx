import type { Tenant } from "@/lib/types";

export function StorefrontUnidades({ unidades }: { unidades: Tenant[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {unidades.map((unidade) => (
        <div
          key={unidade.id}
          className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
        >
          <h3 className="font-display text-lg font-bold">{unidade.nome}</h3>

          {unidade.endereco && (
            <p className="mt-2 text-sm text-muted-foreground">
              {[
                unidade.endereco.logradouro,
                unidade.endereco.numero ? `nº ${unidade.endereco.numero}` : null,
                unidade.endereco.bairro,
              ]
                .filter(Boolean)
                .join(", ")}
              {unidade.endereco.cidade && (
                <>
                  <br />
                  {unidade.endereco.cidade}
                  {unidade.endereco.estado ? ` – ${unidade.endereco.estado}` : ""}
                </>
              )}
            </p>
          )}

          {unidade.telefone && (
            <p className="mt-2 text-sm text-muted-foreground">{unidade.telefone}</p>
          )}

          <div className="mt-4">
            <a
              href={`/adesao/cadastro?tenantId=${unidade.id}`}
              className="inline-flex rounded-lg bg-gym-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-gym-accent/90"
            >
              Matricular-se
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
