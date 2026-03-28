import type { Plano, Tenant } from "@/lib/types";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDuracao(dias: number): string {
  if (dias === 30 || dias === 31) return "/mês";
  if (dias === 90) return "/trimestre";
  if (dias === 180) return "/semestre";
  if (dias === 365 || dias === 360) return "/ano";
  return `/${dias} dias`;
}

export function StorefrontPlanos({
  planos,
  singleUnit,
}: {
  planos: Plano[];
  singleUnit: Tenant | null;
}) {
  const sorted = [...planos].sort((a, b) => {
    if (a.destaque && !b.destaque) return -1;
    if (!a.destaque && b.destaque) return 1;
    return (a.ordem ?? 999) - (b.ordem ?? 999);
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((plano) => (
        <div
          key={plano.id}
          className={`relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-lg ${
            plano.destaque
              ? "border-gym-accent/40 bg-gym-accent/5 shadow-md"
              : "border-border bg-card"
          }`}
        >
          {plano.destaque && (
            <span className="absolute -top-3 left-6 rounded-full bg-gym-accent px-3 py-1 text-xs font-bold text-background">
              Destaque
            </span>
          )}

          <h3 className="font-display text-lg font-bold">{plano.nome}</h3>
          {plano.descricao && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{plano.descricao}</p>
          )}

          <div className="mt-4">
            <span className="font-display text-3xl font-bold text-gym-accent">
              {formatBRL(plano.valor)}
            </span>
            <span className="text-sm text-muted-foreground">{formatDuracao(plano.duracaoDias)}</span>
          </div>

          {plano.valorMatricula > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              + {formatBRL(plano.valorMatricula)} de matrícula
            </p>
          )}

          {plano.beneficios && plano.beneficios.length > 0 && (
            <ul className="mt-4 flex-1 space-y-2">
              {plano.beneficios.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-gym-teal">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            {singleUnit ? (
              <a
                href={`/storefront/adesao/cadastro?tenant=${singleUnit.id}&plan=${plano.id}`}
                className="block rounded-lg bg-gym-accent px-4 py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-gym-accent/90"
              >
                Assinar agora
              </a>
            ) : (
              <a
                href="#unidades"
                className="block rounded-lg border border-border bg-secondary px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-secondary/80"
              >
                Escolher unidade
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
