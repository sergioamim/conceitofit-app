"use client";

import { useMemo, useState } from "react";
import { 
  Dumbbell, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Play, 
  History, 
  Target,
  Trophy,
  ArrowRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useMeusTreinos, useRegistrarExecucaoTreino } from "@/lib/query/use-portal-aluno";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Treino, TreinoItem } from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

export function MeusTreinosClient() {
  const { tenantId, userId, tenantResolved } = useTenantContext();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [selectedTreinoId, setSelectedTreinoId] = useState<string | null>(null);

  const { 
    data: treinos = [], 
    isLoading: loading,
    isError 
  } = useMeusTreinos({
    tenantId,
    tenantResolved,
    userId
  });

  const registrarExecucao = useRegistrarExecucaoTreino();

  const activeTreino = useMemo(() => {
    if (selectedTreinoId) {
      return treinos.find(t => t.id === selectedTreinoId) || treinos[0];
    }
    return treinos[0];
  }, [treinos, selectedTreinoId]);

  const handleConcluir = (treino: Treino) => {
    if (!tenantId) return;
    
    confirm(`Confirmar conclusão do treino ${treino.nome}?`, async () => {
      await registrarExecucao.mutateAsync({
        tenantId,
        id: treino.id,
        status: "CONCLUIDA"
      });
    });
  };

  if (loading) {
    return (
      <div className="space-y-8 py-6">
        <div className="space-y-2">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-primary/10" />
          <div className="h-5 w-72 animate-pulse rounded-lg bg-primary/10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-3xl bg-muted/20 border border-border/40" />
      </div>
    );
  }

  if (treinos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
          <Dumbbell className="size-10" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold tracking-tight">Nenhum treino ativo</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Você ainda não possui treinos atribuídos. Fale com seu professor para montar sua ficha.
          </p>
        </div>
      </div>
    );
  }

  const adherence = activeTreino?.aderenciaPercentual ?? 0;

  return (
    <div className="space-y-8 py-6">
      {ConfirmDialog}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Dumbbell className="size-5 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">Ficha de Treino</Badge>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Meus Treinos</h1>
          <p className="mt-1 text-muted-foreground font-medium">Acesse sua ficha e acompanhe seu progresso.</p>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl border border-border/40 p-5 flex items-center justify-between shadow-lg shadow-black/5"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Aderência</p>
            <p className="text-2xl font-display font-extrabold text-primary">{adherence}%</p>
          </div>
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Trophy size={24} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl border border-border/40 p-5 flex items-center justify-between shadow-lg shadow-black/5"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Total Treinos</p>
            <p className="text-2xl font-display font-extrabold">{activeTreino?.execucoesConcluidas ?? 0}</p>
          </div>
          <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            <History size={24} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl border border-border/40 p-5 flex items-center justify-between shadow-lg shadow-black/5"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Válido até</p>
            <p className="text-xl font-display font-bold">{activeTreino?.dataFim ? formatDate(activeTreino.dataFim) : "---"}</p>
          </div>
          <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            <Target size={24} />
          </div>
        </motion.div>
      </div>

      {/* Treino Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {treinos.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTreinoId(t.id)}
            className={cn(
              "whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all border",
              activeTreino?.id === t.id 
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            Treino {t.divisao || t.nome}
          </button>
        ))}
      </div>

      {/* Workout Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTreino?.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          <Card className="rounded-3xl border border-border/40 overflow-hidden glass-card shadow-2xl shadow-black/5">
            <CardHeader className="bg-muted/10 border-b border-border/40 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
                    {activeTreino?.nome || `Treino ${activeTreino?.divisao}`}
                  </CardTitle>
                  <CardDescription className="font-medium">
                    {activeTreino?.objetivo || "Objetivo não informado"} · Prof. {activeTreino?.funcionarioNome || "Academia"}
                  </CardDescription>
                </div>
                <Button 
                  size="lg" 
                  className="rounded-2xl font-bold px-8 shadow-lg shadow-primary/20"
                  onClick={() => handleConcluir(activeTreino!)}
                  disabled={registrarExecucao.isPending}
                >
                  <CheckCircle2 className="mr-2 size-5" />
                  Concluir Treino
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/20">
                {activeTreino?.itens?.map((item, i) => (
                  <ExerciseRow key={item.id} item={item} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>

          {activeTreino?.observacoes && (
            <div className="rounded-2xl border border-border/40 p-5 flex items-start gap-4 bg-primary/5 border-l-4 border-l-primary">
              <Info className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Dicas do Professor</p>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{activeTreino.observacoes}"
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ExerciseRow({ item, index }: { item: TreinoItem; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-5 flex items-start gap-4 hover:bg-primary/[0.02] transition-colors"
    >
      <div className="size-10 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-1">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
              {item.exercicioNome}
            </h4>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">{item.grupoMuscularNome}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-muted/50 text-foreground font-bold text-[10px] uppercase tracking-tighter">
              {item.series} séries
            </Badge>
            {item.repeticoes && (
              <Badge variant="secondary" className="bg-muted/50 text-foreground font-bold text-[10px] uppercase tracking-tighter">
                {item.repeticoes} reps
              </Badge>
            )}
            {item.carga && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] uppercase tracking-tighter">
                {item.carga}kg
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium">
          {item.intervaloSegundos && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-primary/60" />
              Intervalo: {item.intervaloSegundos}s
            </span>
          )}
          {item.observacao && (
            <span className="flex items-center gap-1.5 italic">
              <ArrowRight size={14} className="text-primary/60" />
              Obs: {item.observacao}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
