"use client";

import { useCallback, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClienteThumbnail } from "@/components/shared/cliente-thumbnail";
import { searchAlunosApi, mesclarClientesApi } from "@/lib/api/alunos";
import { formatCpf } from "@/lib/shared/formatters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ArrowRight, Check, Loader2, Search, Users } from "lucide-react";
import type { Aluno } from "@/lib/types";

type Step = "search" | "preview" | "done";

interface ClienteMesclarDialogProps {
  open: boolean;
  onClose: () => void;
  aluno: Aluno;
  tenantId: string;
  onMerged: () => void;
}

export function ClienteMesclarDialog({ open, onClose, aluno, tenantId, onMerged }: ClienteMesclarDialogProps) {
  const [step, setStep] = useState<Step>("search");
  const [busca, setBusca] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Aluno[]>([]);
  const [selected, setSelected] = useState<Aluno | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState("");
  const [mergeResult, setMergeResult] = useState<{ pagamentosMigrados: number; vinculosMigrados: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setStep("search");
    setBusca("");
    setResults([]);
    setSelected(null);
    setJustificativa("");
    setMerging(false);
    setError("");
    setMergeResult(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSearch = useCallback(async (query: string) => {
    setBusca(query);
    setError("");
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchAlunosApi({ tenantId, search: query.trim(), size: 10 });
        setResults(data.filter((a) => a.id !== aluno.id));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [tenantId, aluno.id]);

  const handleSelectOrigin = useCallback((origin: Aluno) => {
    setSelected(origin);
    setStep("preview");
    setError("");
  }, []);

  const handleMerge = useCallback(async () => {
    if (!selected || !justificativa.trim()) {
      setError("Justificativa obrigatoria.");
      return;
    }
    setMerging(true);
    setError("");
    try {
      const result = await mesclarClientesApi({
        tenantId,
        clienteDestinoId: aluno.id,
        clienteOrigemId: selected.id,
        justificativa: justificativa.trim(),
      });
      setMergeResult({ pagamentosMigrados: result.pagamentosMigrados, vinculosMigrados: result.vinculosMigrados });
      setStep("done");
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setMerging(false);
    }
  }, [selected, justificativa, tenantId, aluno.id]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
            <Users className="size-5" />
            Mesclar clientes
          </DialogTitle>
          <DialogDescription>
            {step === "search" && "Busque o cliente duplicado que sera absorvido por este."}
            {step === "preview" && "Confirme a mesclagem. O cliente origem sera marcado como excluido."}
            {step === "done" && "Mesclagem concluida com sucesso."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Search */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => void handleSearch(e.target.value)}
                  placeholder="Buscar por nome, CPF ou email..."
                  className="pl-10"
                  autoFocus
                />
              </div>
              {searching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {results.length === 0 && busca.trim().length >= 2 && !searching && (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
              )}
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectOrigin(r)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-left transition hover:bg-secondary/60"
                >
                  <ClienteThumbnail nome={r.nome} foto={r.foto} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.cpf ? formatCpf(r.cpf) : "Sem CPF"} — {r.email ?? "Sem email"}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.status === "ATIVO" ? "bg-gym-teal/15 text-gym-teal" : "bg-secondary text-muted-foreground"
                  }`}>
                    {r.status}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              O cliente selecionado (origem) tera seus dados absorvidos por <strong>{aluno.nome}</strong> (destino).
            </p>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && selected && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
              {/* Origem */}
              <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/5 p-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gym-danger">Origem (sera excluido)</p>
                <div className="flex items-center gap-2">
                  <ClienteThumbnail nome={selected.nome} foto={selected.foto} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{selected.nome}</p>
                    <p className="text-xs text-muted-foreground">{selected.cpf ? formatCpf(selected.cpf) : "Sem CPF"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="size-5 text-muted-foreground" />
              </div>

              {/* Destino */}
              <div className="rounded-xl border border-gym-teal/30 bg-gym-teal/5 p-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gym-teal">Destino (mantido)</p>
                <div className="flex items-center gap-2">
                  <ClienteThumbnail nome={aluno.nome} foto={aluno.foto} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{aluno.nome}</p>
                    <p className="text-xs text-muted-foreground">{aluno.cpf ? formatCpf(aluno.cpf) : "Sem CPF"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-3 text-xs text-muted-foreground space-y-1">
              <p>O que sera migrado do cliente origem para o destino:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Pagamentos e historico financeiro</li>
                <li>Vinculos de importacao</li>
                <li>Presencas e acessos</li>
                <li>Templates biometricos</li>
              </ul>
              <p className="mt-2 font-semibold text-gym-danger">O cliente origem sera marcado como excluido. Esta acao nao pode ser desfeita.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Justificativa
              </label>
              <Textarea
                value={justificativa}
                onChange={(e) => { setJustificativa(e.target.value); setError(""); }}
                placeholder="Explique o motivo da mesclagem (ex: cadastro duplicado na importacao EVO)"
                rows={3}
                maxLength={500}
                className="border-border bg-secondary"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-gym-danger/40 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setStep("search"); setSelected(null); }} disabled={merging}>
                Voltar
              </Button>
              <Button
                onClick={() => void handleMerge()}
                disabled={merging || !justificativa.trim()}
                className="bg-gym-danger hover:bg-gym-danger/90 text-white"
              >
                {merging ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Mesclando...</>
                ) : (
                  "Confirmar mesclagem"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-gym-teal/15">
                <Check className="size-6 text-gym-teal" />
              </div>
              <p className="text-sm font-semibold text-foreground">Clientes mesclados com sucesso</p>
              {mergeResult && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{mergeResult.pagamentosMigrados} pagamento(s) migrado(s)</span>
                  <span>{mergeResult.vinculosMigrados} vinculo(s) migrado(s)</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => { handleClose(); onMerged(); }}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
