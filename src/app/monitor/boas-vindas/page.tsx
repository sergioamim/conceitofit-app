import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function MonitorBoasVindasPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const params = await searchParams;
  const tenantId = params?.tenantId?.trim();
  const targetPath = tenantId ? `/monitor/boas-vindas/${tenantId}` : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1218] via-[#0e0f11] to-[#102a24] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center">
        <Card className="w-full border-border/80 bg-card/75 backdrop-blur">
          <CardContent className="space-y-4 px-6 py-7 md:px-8 md:py-8">
            <Badge variant="outline" className="border-gym-teal/40 bg-gym-teal/10 text-gym-teal">
              Monitor de boas-vindas
            </Badge>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Defina o tenantId na URL para iniciar
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Use o formato <code>/monitor/boas-vindas/&lt;tenantId&gt;</code> para abrir a tela dedicada da unidade no monitor da recepcao.
            </p>

            {tenantId ? (
              <p className="text-sm text-muted-foreground">
                Detectado via query: <code>tenantId={tenantId}</code>. Abra{" "}
                <Link
                  href={targetPath}
                  className="font-semibold text-gym-accent underline-offset-4 hover:underline"
                >
                  {targetPath}
                </Link>
                .
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Exemplo: <code>/monitor/boas-vindas/550e8400-e29b-41d4-a716-446655440001</code>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
