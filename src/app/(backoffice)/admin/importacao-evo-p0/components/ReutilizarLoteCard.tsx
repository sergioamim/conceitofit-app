"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  fromSourceApi,
  getUltimoLoteApi,
  type UltimoLoteResponse,
} from "@/lib/api/importacao-evo";
import { formatDateTime } from "../date-time-format";

interface ReutilizarLoteCardProps {
  tenantId: string;
  onReutilizado: (novoJobId: string) => void;
  onSubirNovo: () => void;
}

export function ReutilizarLoteCard({
  tenantId,
  onReutilizado,
  onSubirNovo,
}: ReutilizarLoteCardProps) {
  const { toast } = useToast();
  const [ultimoLote, setUltimoLote] = useState<UltimoLoteResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [reutilizando, setReutilizando] = useState(false);

  useEffect(() => {
    let ativo = true;
    if (!tenantId) {
      setUltimoLote(null);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    void getUltimoLoteApi({ tenantId })
      .then((resposta) => {
        if (!ativo) return;
        setUltimoLote(resposta);
      })
      .catch(() => {
        if (!ativo) return;
        setUltimoLote(null);
      })
      .finally(() => {
        if (!ativo) return;
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tenantId]);

  const handleReutilizar = useCallback(async () => {
    if (!ultimoLote) return;
    setReutilizando(true);
    try {
      const novo = await fromSourceApi({
        sourceJobId: ultimoLote.jobId,
        tenantId: ultimoLote.tenantId ?? tenantId,
      });
      onReutilizado(novo.jobId);
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
  }, [ultimoLote, onReutilizado, toast]);

  if (carregando) return null;
  if (!ultimoLote) return null;

  const totalSelecionados = ultimoLote.arquivosSelecionados?.length ?? 0;
  const criadoEmLabel = formatDateTime(ultimoLote.criadoEm) ?? ultimoLote.criadoEm;

  return (
    <Card className="border-gym-accent/40 bg-gym-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Último lote: {ultimoLote.apelido || ultimoLote.jobId}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Criado em {criadoEmLabel} · Status: {ultimoLote.status} · {totalSelecionados}{" "}
          {totalSelecionados === 1 ? "arquivo selecionado" : "arquivos selecionados"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pt-0">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            void handleReutilizar();
          }}
          disabled={reutilizando}
        >
          {reutilizando ? "Criando novo job..." : "Reutilizar esses arquivos"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onSubirNovo}
          disabled={reutilizando}
        >
          Subir novo ZIP
        </Button>
      </CardContent>
    </Card>
  );
}
