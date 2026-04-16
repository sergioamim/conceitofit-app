"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api/http";

export type ColunaInfo = {
  nome: string;
  mapeada: boolean;
  atributoDestino: string | null;
  descricao: string;
  exemplo: string | null;
};

export type MapeamentoArquivo = {
  nomeArquivo: string;
  entidade: string;
  colunas: ColunaInfo[];
};

export type PacoteArquivoDisponivel = {
  chave: string;
  rotulo: string;
  dominio?: string | null;
};

type ColunasMapeadasModalProps = {
  arquivoSelecionado?: string | null;
  arquivosDisponiveis?: PacoteArquivoDisponivel[];
};

export function ColunasMapeadasModal({ arquivoSelecionado, arquivosDisponiveis }: ColunasMapeadasModalProps) {
  const [mapeamentos, setMapeamentos] = useState<MapeamentoArquivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [arquivoAtivo, setArquivoAtivo] = useState<string | null>(null);

  useEffect(() => {
    if (open && mapeamentos.length === 0) {
      carregarMapeamentos();
    }
  }, [open]);

  useEffect(() => {
    if (arquivoSelecionado) {
      setArquivoAtivo(arquivoSelecionado);
    }
  }, [arquivoSelecionado]);

  async function carregarMapeamentos() {
    setLoading(true);
    try {
      const data = await apiRequest<MapeamentoArquivo[]>({
        path: "/api/v1/admin/integracoes/importacao-terceiros/evo/mapeamento-colunas",
        method: "GET",
      });
      setMapeamentos(data);
    } catch (error) {
      console.error("Erro ao carregar mapeamentos:", error);
    } finally {
      setLoading(false);
    }
  }

  const mapeamentoAtual = mapeamentos.find(
    (m) => m.nomeArquivo === arquivoAtivo
  );

  const colunasMapeadas = mapeamentoAtual?.colunas.filter((c) => c.mapeada) ?? [];
  const colunasIgnoradas = mapeamentoAtual?.colunas.filter((c) => !c.mapeada) ?? [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Ver mapeamento de colunas
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mapeamento de Colunas EVO
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Visualize quais colunas de cada arquivo CSV são processadas e quais são ignoradas durante a importação.
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Seletor de arquivo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Arquivo</label>
            <div className="flex flex-wrap gap-2">
              {mapeamentos.map((m) => (
                <button
                  key={m.nomeArquivo}
                  type="button"
                  onClick={() => setArquivoAtivo(m.nomeArquivo)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    arquivoAtivo === m.nomeArquivo
                      ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {m.nomeArquivo}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando mapeamentos...</span>
            </div>
          ) : mapeamentoAtual ? (
            <Tabs defaultValue="mapeadas" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mapeadas" className="gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Mapeadas ({colunasMapeadas.length})
                </TabsTrigger>
                <TabsTrigger value="ignoradas" className="gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Ignoradas ({colunasIgnoradas.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mapeadas" className="mt-4 space-y-3">
                {colunasMapeadas.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma coluna mapeada para este arquivo.
                  </p>
                ) : (
                  colunasMapeadas.map((coluna) => (
                    <div
                      key={coluna.nome}
                      className="rounded-lg border border-green-200 bg-green-50/50 p-3 dark:border-green-800 dark:bg-green-950/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                              {coluna.nome}
                            </code>
                            <Badge variant="secondary" className="text-[10px]">
                              Mapeado
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {coluna.descricao}
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="ignoradas" className="mt-4 space-y-3">
                {colunasIgnoradas.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Todas as colunas deste arquivo são mapeadas!
                  </p>
                ) : (
                  colunasIgnoradas.map((coluna) => (
                    <div
                      key={coluna.nome}
                      className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900 dark:text-red-300">
                              {coluna.nome}
                            </code>
                            <Badge variant="outline" className="text-[10px] text-red-600 dark:text-red-400">
                              Ignorado
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {coluna.descricao}
                          </p>
                        </div>
                        <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                Selecione um arquivo para visualizar o mapeamento de colunas.
              </p>
              {arquivosDisponiveis && arquivosDisponiveis.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Arquivos disponíveis no pacote:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {arquivosDisponiveis.map((arquivo) => (
                      <button
                        key={arquivo.chave}
                        type="button"
                        onClick={() => setArquivoAtivo(arquivo.chave)}
                        className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted hover:border-gym-accent/50 transition-colors"
                      >
                        {arquivo.rotulo || arquivo.chave}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
