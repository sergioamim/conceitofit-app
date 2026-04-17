"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  type FromSourceResponse,
  fromSourceApi,
  type UltimoLoteResponse,
} from "@/lib/api/importacao-evo";
import { formatDateTime } from "../date-time-format";

interface ReutilizarLoteCardProps {
  tenantId?: string;
  ultimoLote: UltimoLoteResponse | null;
  carregandoLote: boolean;
  erroLote?: string | null;
  embedded?: boolean;
  title?: string;
  description?: string;
  onReutilizado: (input: {
    novoJob: FromSourceResponse;
    loteOrigem: UltimoLoteResponse;
    tenantId?: string;
  }) => void;
}

export function ReutilizarLoteCard({
  tenantId,
  ultimoLote,
  carregandoLote,
  erroLote = null,
  embedded = false,
  title = "Reutilizar lote anterior",
  description = "Com a unidade selecionada, verifica o último lote reaproveitável sem novo upload de ZIP.",
  onReutilizado,
}: ReutilizarLoteCardProps) {
  const { toast } = useToast();
  const [reutilizando, setReutilizando] = useState(false);

  const handleReutilizar = useCallback(async () => {
    if (!ultimoLote || !tenantId) return;

    setReutilizando(true);
    try {
      const novo = await fromSourceApi({
        sourceJobId: ultimoLote.jobId,
        tenantId: ultimoLote.tenantId ?? tenantId,
      });
      onReutilizado({
        novoJob: novo,
        loteOrigem: ultimoLote,
        tenantId: ultimoLote.tenantId ?? tenantId,
      });
      toast({
        title: "Lote reutilizado",
        description: `Novo job criado a partir de ${ultimoLote.apelido || ultimoLote.jobId}.`,
      });
    } catch (error) {
      const descricao =
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível reutilizar o último lote.";
      toast({
        title: "Erro ao reutilizar lote",
        description: descricao,
        variant: "destructive",
      });
    } finally {
      setReutilizando(false);
    }
  }, [onReutilizado, tenantId, toast, ultimoLote]);

  const content = (
    <div className="space-y-3">
      {!tenantId ? (
        <p className="text-xs text-muted-foreground">
          Selecione uma unidade para verificar a disponibilidade de lote anterior.
        </p>
      ) : carregandoLote ? (
        <p className="text-xs text-muted-foreground">Verificando lotes anteriores...</p>
      ) : erroLote ? (
        <p className="text-xs text-gym-danger">{erroLote}</p>
      ) : !ultimoLote ? (
        <div className="rounded-md border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          Nenhum lote anterior encontrado para esta unidade. Faça um novo upload.
        </div>
      ) : (
        <div className="rounded-md border border-gym-accent/40 bg-background/80 px-3 py-2">
          <p className="text-sm font-medium">{ultimoLote.apelido || ultimoLote.jobId}</p>
          <p className="text-xs text-muted-foreground">
            Criado em {formatDateTime(ultimoLote.criadoEm) ?? ultimoLote.criadoEm} · Status: {ultimoLote.status} ·{" "}
            {ultimoLote.arquivosSelecionados?.length ?? 0}{" "}
            {(ultimoLote.arquivosSelecionados?.length ?? 0) === 1
              ? "arquivo selecionado"
              : "arquivos selecionados"}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            void handleReutilizar();
          }}
          disabled={!ultimoLote || !tenantId || reutilizando}
        >
          {reutilizando ? "Criando novo job..." : "Reutilizar esses arquivos"}
        </Button>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-background p-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Card className="border-gym-accent/40 bg-gym-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">{content}</CardContent>
    </Card>
  );
}
