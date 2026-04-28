"use client";

/**
 * AtribuirTreinoModal — modal de 3 passos para atribuir template (Wave J.3).
 *
 * Design fonte: project/progresso.jsx → AtribuirModal. Fluxo:
 *  1. Escolher aluno (search + lista de cards selecionáveis)
 *  2. Escolher template (lista de templates publicados)
 *  3. Confirmar → navega pra /treinos/{templateId}?assign=1&alunoId=...
 *     reusando o assignment dialog existente na page do template
 *     (que já cuida de datas, frequência, conflitos, etc).
 *
 * Decisão pragmática: design fonte tem datas/duração/frequência num 3º
 * passo, mas o projeto já tem essa lógica completa no AssignmentDialog
 * V2. Em vez de duplicar, o modal entrega aluno+template selecionados
 * e o fluxo legado completa o assignment.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useClientes } from "@/lib/query/use-clientes";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { Aluno } from "@/lib/shared/types/aluno";
import type { TreinoTemplateResumo } from "@/lib/tenant/treinos/workspace";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";

export interface AtribuirTreinoModalProps {
  open: boolean;
  onClose: () => void;
  /** Templates pré-carregados (vem da page de atribuídos ou lista). */
  templates: TreinoTemplateResumo[];
}

export function AtribuirTreinoModal({
  open,
  onClose,
  templates,
}: AtribuirTreinoModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <ModalBody open={open} onClose={onClose} templates={templates} />
    </Dialog>
  );
}

/**
 * Conteúdo interno. O `open` é encaminhado pra que useClientes só
 * dispare quando o modal está visível (enabled flag).
 */
function ModalBody({
  open,
  onClose,
  templates,
}: AtribuirTreinoModalProps) {
  const router = useRouter();
  const { tenantId, tenantResolved } = useTenantContext();
  const [alunoSearch, setAlunoSearch] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [templateSelecionadoId, setTemplateSelecionadoId] = useState<
    string | null
  >(null);

  const { data: alunosPage, isLoading: loadingAlunos } = useClientes({
    tenantId,
    tenantResolved: tenantResolved && open,
    status: "ATIVO",
    search: alunoSearch.trim() || undefined,
    size: 8,
  });
  const alunos = alunosPage?.items ?? [];

  const templatesAtivos = useMemo(
    () =>
      templates.filter(
        (t) =>
          (t.status === undefined || t.status === "PUBLICADO") &&
          !t.precisaRevisao,
      ),
    [templates],
  );

  const handleClose = () => {
    setAlunoSearch("");
    setAlunoSelecionado(null);
    setTemplateSelecionadoId(null);
    onClose();
  };

  const handleAtribuir = () => {
    if (!alunoSelecionado || !templateSelecionadoId) return;
    const params = new URLSearchParams({
      assign: "1",
      alunoId: alunoSelecionado.id,
      alunoNome: alunoSelecionado.nome,
    });
    router.push(`/treinos/${templateSelecionadoId}?${params.toString()}`);
    handleClose();
  };

  return (
    <DialogContent className="max-h-[90vh] max-w-[860px] overflow-hidden p-0">
      <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
          <UserPlus className="size-5 text-gym-accent" />
          Atribuir treino a um aluno
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Escolha o aluno e o template; configurações de período e
            frequência aparecem no próximo passo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] grid-cols-1 gap-6 overflow-y-auto px-6 py-4 md:grid-cols-2">
          {/* Passo 1 — Aluno */}
          <section>
            <StepLabel n={1} active>
              Escolha o aluno
            </StepLabel>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={alunoSearch}
                onChange={(e) => setAlunoSearch(e.target.value)}
                placeholder="Buscar aluno por nome..."
                className="h-9 pl-9"
                aria-label="Buscar aluno"
              />
            </div>
            <div className="mt-3 max-h-[320px] space-y-1.5 overflow-y-auto">
              {loadingAlunos ? (
                <p className="p-3 text-xs text-muted-foreground">
                  Carregando alunos...
                </p>
              ) : alunos.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  {alunoSearch
                    ? "Nenhum aluno encontrado."
                    : "Digite pra buscar."}
                </p>
              ) : (
                alunos.map((a) => {
                  const sel = alunoSelecionado?.id === a.id;
                  const cor = grupoColorByName(a.nome);
                  const inicial = (a.nome.trim().charAt(0) || "?").toUpperCase();
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAlunoSelecionado(a)}
                      aria-pressed={sel}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors",
                        sel
                          ? "border-gym-accent bg-gym-accent/[0.08]"
                          : "border-border hover:bg-secondary/40",
                      )}
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black"
                        style={{ background: cor }}
                        aria-hidden
                      >
                        {inicial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">
                          {a.nome}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {a.email}
                        </div>
                      </div>
                      {sel ? (
                        <Check className="size-4 shrink-0 text-gym-accent" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Passo 2 — Template */}
          <section>
            <StepLabel n={2} active={Boolean(alunoSelecionado)}>
              Escolha o template
            </StepLabel>
            <div className="mt-2 max-h-[380px] space-y-1.5 overflow-y-auto">
              {templatesAtivos.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Nenhum template publicado disponível.
                </p>
              ) : (
                templatesAtivos.map((t) => {
                  const sel = templateSelecionadoId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateSelecionadoId(t.id)}
                      disabled={!alunoSelecionado}
                      aria-pressed={sel}
                      className={cn(
                        "block w-full rounded-md border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        sel
                          ? "border-gym-accent bg-gym-accent/[0.08]"
                          : "border-border hover:bg-secondary/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium">
                            {t.nome}
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {[
                              t.perfilIndicacao,
                              t.frequenciaSemanal
                                ? `${t.frequenciaSemanal}x/sem`
                                : null,
                              t.totalSemanas ? `${t.totalSemanas}sem` : null,
                              t.totalAtribuicoes
                                ? `${t.totalAtribuicoes} alunos`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Template"}
                          </div>
                        </div>
                        {sel ? (
                          <Check className="size-4 shrink-0 text-gym-accent" />
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {!alunoSelecionado ? (
              <p className="mt-2 text-[11px] italic text-muted-foreground/70">
                Escolha um aluno primeiro.
              </p>
            ) : null}
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-card/40 px-6 py-4">
          <p className="text-[11px] text-muted-foreground">
            Próximo passo: período · frequência · conflitos.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              <X className="mr-1 size-3.5" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAtribuir}
              disabled={!alunoSelecionado || !templateSelecionadoId}
            >
              <UserPlus className="mr-1 size-3.5" />
              Continuar
            </Button>
          </div>
        </div>
    </DialogContent>
  );
}

function StepLabel({
  n,
  active,
  children,
}: {
  n: number;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full border text-[10px] font-bold",
          active
            ? "border-gym-accent bg-gym-accent text-black"
            : "border-border bg-secondary text-muted-foreground",
        )}
      >
        {n}
      </span>
      <span className={cn(active ? "text-foreground" : "text-muted-foreground")}>
        {children}
      </span>
    </h3>
  );
}
