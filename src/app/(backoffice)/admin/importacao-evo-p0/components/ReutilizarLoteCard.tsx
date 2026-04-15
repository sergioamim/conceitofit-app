"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  fromSourceApi,
  getUltimoLoteApi,
  type UltimoLoteResponse,
} from "@/lib/api/importacao-evo";
import {
  getTenantsTreeApi,
  type TenantsTreeResponse,
} from "@/lib/api/sandbox";
import { formatDateTime } from "../date-time-format";

interface ReutilizarLoteCardProps {
  tenantId?: string;
  onReutilizado: (novoJobId: string) => void;
  onSubirNovo: () => void;
}

export function ReutilizarLoteCard({
  tenantId,
  onReutilizado,
  onSubirNovo,
}: ReutilizarLoteCardProps) {
  const { toast } = useToast();
  const [tree, setTree] = useState<TenantsTreeResponse | null>(null);
  const [carregandoTree, setCarregandoTree] = useState(false);
  const [redeSelecionada, setRedeSelecionada] = useState<string | undefined>(undefined);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | undefined>(tenantId);
  const [ultimoLote, setUltimoLote] = useState<UltimoLoteResponse | null>(null);
  const [carregandoLote, setCarregandoLote] = useState(false);
  const [reutilizando, setReutilizando] = useState(false);
  const [erroLote, setErroLote] = useState<string | null>(null);

  // Quando o pai informa um tenantId via prop (ex: já há mapeamento), usa direto.
  useEffect(() => {
    if (tenantId) {
      setUnidadeSelecionada(tenantId);
    }
  }, [tenantId]);

  // Carrega árvore Rede→Unidade na montagem
  useEffect(() => {
    let ativo = true;
    setCarregandoTree(true);
    getTenantsTreeApi()
      .then((data) => {
        if (!ativo) return;
        setTree(data);
        // Se já temos unidade selecionada, descobre a rede correspondente
        if (unidadeSelecionada) {
          const rede = data.redes.find((r) =>
            r.unidades.some((u) => u.id === unidadeSelecionada),
          );
          if (rede) setRedeSelecionada(rede.redeId);
        }
      })
      .catch(() => {
        if (!ativo) return;
        setTree({ redes: [] });
      })
      .finally(() => {
        if (!ativo) return;
        setCarregandoTree(false);
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quando unidade muda, busca o último lote
  useEffect(() => {
    if (!unidadeSelecionada) {
      setUltimoLote(null);
      setErroLote(null);
      return;
    }
    let ativo = true;
    setCarregandoLote(true);
    setErroLote(null);
    void getUltimoLoteApi({ tenantId: unidadeSelecionada })
      .then((resposta) => {
        if (!ativo) return;
        setUltimoLote(resposta);
      })
      .catch(() => {
        if (!ativo) return;
        setUltimoLote(null);
        setErroLote("Não foi possível consultar lotes anteriores desta unidade.");
      })
      .finally(() => {
        if (!ativo) return;
        setCarregandoLote(false);
      });
    return () => {
      ativo = false;
    };
  }, [unidadeSelecionada]);

  const redes = tree?.redes ?? [];
  const unidadesDaRede = useMemo(() => {
    if (!redeSelecionada) return [];
    return redes.find((r) => r.redeId === redeSelecionada)?.unidades ?? [];
  }, [redeSelecionada, redes]);

  const handleReutilizar = useCallback(async () => {
    if (!ultimoLote) return;
    setReutilizando(true);
    try {
      const novo = await fromSourceApi({
        sourceJobId: ultimoLote.jobId,
        tenantId: ultimoLote.tenantId ?? unidadeSelecionada,
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
  }, [ultimoLote, unidadeSelecionada, onReutilizado, toast]);

  return (
    <Card className="border-gym-accent/40 bg-gym-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Reutilizar lote anterior</CardTitle>
        <p className="text-xs text-muted-foreground">
          Selecione a Rede e a Unidade para verificar se há um upload anterior reaproveitável (sem novo upload de ZIP).
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="reutilizar-rede" className="text-xs">
              Rede
            </Label>
            <Select
              value={redeSelecionada ?? ""}
              onValueChange={(value) => {
                setRedeSelecionada(value || undefined);
                setUnidadeSelecionada(undefined);
              }}
              disabled={carregandoTree || redes.length === 0}
            >
              <SelectTrigger className="mt-1 h-9 w-full" id="reutilizar-rede">
                <SelectValue
                  placeholder={
                    carregandoTree
                      ? "Carregando..."
                      : redes.length === 0
                        ? "Nenhuma rede disponível"
                        : "Selecione a rede"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {redes.map((rede) => (
                  <SelectItem key={rede.redeId} value={rede.redeId}>
                    {rede.redeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reutilizar-unidade" className="text-xs">
              Unidade
            </Label>
            <Select
              value={unidadeSelecionada ?? ""}
              onValueChange={(value) => setUnidadeSelecionada(value || undefined)}
              disabled={!redeSelecionada || unidadesDaRede.length === 0}
            >
              <SelectTrigger className="mt-1 h-9 w-full" id="reutilizar-unidade">
                <SelectValue
                  placeholder={
                    !redeSelecionada
                      ? "Escolha uma rede primeiro"
                      : unidadesDaRede.length === 0
                        ? "Nenhuma unidade ativa"
                        : "Selecione a unidade"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {unidadesDaRede.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                    {unidade.matriz && " (matriz)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!unidadeSelecionada ? (
          <p className="text-xs text-muted-foreground">
            Selecione uma unidade para verificar a disponibilidade de lote anterior.
          </p>
        ) : carregandoLote ? (
          <p className="text-xs text-muted-foreground">Verificando lotes anteriores...</p>
        ) : erroLote ? (
          <p className="text-xs text-gym-danger">{erroLote}</p>
        ) : !ultimoLote ? (
          <div className="rounded-md border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            Nenhum lote anterior encontrado para esta unidade. Faça um novo upload abaixo.
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
            disabled={!ultimoLote || reutilizando}
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
        </div>
      </CardContent>
    </Card>
  );
}
