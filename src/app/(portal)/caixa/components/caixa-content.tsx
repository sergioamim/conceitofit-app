"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, LogOut, Minus, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getCaixaAtivo } from "@/lib/api/caixa";
import type {
  CaixaResponse,
  MovimentoResumoResponse,
  SaldoParcialResponse,
} from "@/lib/api/caixa.types";

import { AbrirCaixaForm } from "./abrir-caixa-form";
import { DiaAnteriorBanner } from "./dia-anterior-banner";
import { FecharCaixaModal } from "./fechar-caixa-modal";
import { MovimentosTable, type MovimentoRow } from "./movimentos-table";
import { SaldoParcialCard } from "./saldo-parcial-card";
import { SangriaModal } from "./sangria-modal";

const POLL_INTERVAL_MS = 30_000;

export type CaixaAtivo = {
  caixa: CaixaResponse;
  saldo: SaldoParcialResponse;
  /** Movimentos do caixa em aberto, mais recente primeiro. */
  movimentos: MovimentoResumoResponse[];
};

interface CaixaContentProps {
  initial: CaixaAtivo | null;
}

/**
 * Extrai `YYYY-MM-DD` de um ISO-8601 sem converter para Date (evita TZ shifts).
 * Compatível com `LocalDateTime` do Java ("2026-04-14T09:30:00").
 */
function isoToLocalDate(iso: string): string | null {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function isCaixaDiaAnterior(
  caixa: CaixaResponse | undefined | null,
  hojeIso: string | null,
): boolean {
  if (!caixa) return false;
  if (!hojeIso) return false;
  const aberturaData = isoToLocalDate(caixa.abertoEm);
  if (!aberturaData) return false;
  return aberturaData < hojeIso;
}

/**
 * Client wrapper da tela "Meu Caixa".
 *
 * Centraliza estado, refetch manual, polling (30s após mount) e controla
 * a abertura dos dois modais (sangria e fechamento). O hook usa `useEffect`
 * para evitar `new Date()` no render inicial e respeitar as rules de
 * hydration safety do projeto.
 */
export function CaixaContent({ initial }: CaixaContentProps) {
  const { toast } = useToast();
  const [ativo, setAtivo] = useState<CaixaAtivo | null>(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [sangriaOpen, setSangriaOpen] = useState(false);
  const [fecharOpen, setFecharOpen] = useState(false);
  const [hojeIso, setHojeIso] = useState<string | null>(null);

  // Movimentos vem direto do GET /api/caixas/ativo (mesmo payload do caixa),
  // assim a tela inteira se mantem em UMA unica chamada. Filtro NAO eh por dia:
  // exibe TODOS os movimentos do caixa em aberto (que perdura entre dias enquanto
  // nao for fechado).
  const movimentos: MovimentoRow[] = useMemo(
    () =>
      (ativo?.movimentos ?? []).map((m) => ({
        id: m.id,
        tipo: m.tipo,
        valor: m.valor,
        formaPagamento: m.formaPagamento,
        dataMovimento: m.dataMovimento,
      })),
    [ativo?.movimentos],
  );

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Data "hoje" resolvida SOMENTE após mount para não violar hydration safety.
  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const next = `${yyyy}-${mm}-${dd}`;
    setHojeIso(next);
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      const next = await getCaixaAtivo();
      if (!mounted.current) return;
      setAtivo(next);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Não foi possível atualizar o caixa",
        description:
          err instanceof Error ? err.message : "Tente novamente em instantes.",
      });
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [toast]);

  // Refetch ao mount: o SSR (page.tsx) tenta getCaixaAtivo() mas pode
  // falhar silenciosamente quando o cookie de auth não está disponível
  // no servidor — entrega initial=null mesmo quando há caixa aberto. O
  // refetch após hidratação garante que o cliente busque com a sessão
  // correta e exiba o caixa real.
  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling a cada 30s.
  useEffect(() => {
    const interval = window.setInterval(() => {
      void refetch();
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
    };
  }, [refetch]);

  const diaAnterior = useMemo(
    () => isCaixaDiaAnterior(ativo?.caixa, hojeIso),
    [ativo?.caixa, hojeIso],
  );

  const handleAbrirSuccess = useCallback(
    (novo: CaixaAtivo) => {
      setAtivo(novo);
      toast({
        title: "Caixa aberto",
        description: `Operando com valor de abertura ${novo.caixa.valorAbertura.toLocaleString(
          "pt-BR",
          { style: "currency", currency: "BRL" },
        )}.`,
      });
    },
    [toast],
  );

  const handleSangriaSuccess = useCallback(() => {
    setSangriaOpen(false);
    toast({
      title: "Sangria registrada",
      description: "O saldo parcial será recalculado no próximo refresh.",
    });
    void refetch();
  }, [refetch, toast]);

  const handleFecharSuccess = useCallback(() => {
    setFecharOpen(false);
    setAtivo(null);
    toast({
      title: "Caixa fechado",
      description: "Você já pode abrir um novo caixa quando quiser.",
    });
  }, [toast]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Estado: sem caixa aberto
  if (!ativo) {
    return (
      <div className="space-y-6 pb-10" data-testid="caixa-sem-caixa">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Meu Caixa
          </h1>
          <p className="text-sm text-muted-foreground">
            Abra seu caixa para começar a registrar vendas e recebimentos.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <AbrirCaixaForm
            onSuccess={handleAbrirSuccess}
            onCaixaJaAberto={() => {
              void refetch();
            }}
          />
        </div>
      </div>
    );
  }

  // Estado: com caixa (dia atual ou dia anterior)
  return (
    <div className="space-y-6 pb-10" data-testid="caixa-com-caixa">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Meu Caixa
          </h1>
          <p className="text-sm text-muted-foreground">
            Caixa operacional do dia. Saldo atualiza automaticamente a cada 30s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 size-4" />
            )}
            Atualizar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSangriaOpen(true)}
          >
            <Minus className="mr-2 size-4" />
            Sangria
          </Button>
          <Button type="button" onClick={() => setFecharOpen(true)}>
            <LogOut className="mr-2 size-4" />
            Fechar caixa
          </Button>
        </div>
      </div>

      {diaAnterior ? (
        <DiaAnteriorBanner
          abertoEm={ativo.caixa.abertoEm}
          onFechar={() => setFecharOpen(true)}
        />
      ) : null}

      <SaldoParcialCard saldo={ativo.saldo} caixa={ativo.caixa} />

      <MovimentosTable items={movimentos} />

      <SangriaModal
        open={sangriaOpen}
        onOpenChange={setSangriaOpen}
        caixaId={ativo.caixa.id}
        onSuccess={handleSangriaSuccess}
      />

      <FecharCaixaModal
        open={fecharOpen}
        onOpenChange={setFecharOpen}
        caixaId={ativo.caixa.id}
        saldoAtual={ativo.saldo}
        onSuccess={handleFecharSuccess}
      />
    </div>
  );
}
