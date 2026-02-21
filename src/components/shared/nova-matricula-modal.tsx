 "use client";

import { useEffect, useState } from "react";
import {
  criarMatricula,
  listAlunos,
  listConvenios,
  listFormasPagamento,
  listPlanos,
} from "@/lib/mock/services";
import type { Aluno, Plano, TipoFormaPagamento, Convenio } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function NovaMatriculaModal({
  open,
  onClose,
  onDone,
  prefillClienteId,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  prefillClienteId?: string;
}) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formas, setFormas] = useState<{ id: string; nome: string; tipo: TipoFormaPagamento }[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [alunoId, setAlunoId] = useState("");
  const [planoId, setPlanoId] = useState("");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [formaPagamento, setFormaPagamento] = useState<TipoFormaPagamento | "">("");
  const [desconto, setDesconto] = useState("");
  const [motivoDesconto, setMotivoDesconto] = useState("");
  const [renovacao, setRenovacao] = useState(false);
  const [convenioId, setConvenioId] = useState<string>("");
  const [pagamentoPendente, setPagamentoPendente] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    Promise.all([listAlunos(), listPlanos(), listFormasPagamento(), listConvenios({ apenasAtivos: true })]).then(
      ([als, pls, fps, cvs]) => {
        setAlunos(als);
        setPlanos(pls);
        setFormas(fps);
        setConvenios(cvs);
        if (prefillClienteId) {
          setAlunoId(prefillClienteId);
        }
      }
    );
  }, [open, prefillClienteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConvenioId("");
  }, [planoId]);

  function reset() {
    setAlunoId("");
    setPlanoId("");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setFormaPagamento("");
    setDesconto("");
    setMotivoDesconto("");
    setRenovacao(false);
    setConvenioId("");
    setPagamentoPendente(false);
    setError("");
  }

  async function handleSave() {
    if (!alunoId || !planoId || !dataInicio || !formaPagamento) return;
    const plano = planos.find((p) => p.id === planoId);
    if (!plano) return;
    if (pagamentoPendente) {
      const ok = confirm("Confirmar venda com pagamento pendente?");
      if (!ok) return;
    }
    setLoading(true);
    setError("");
    try {
      await criarMatricula({
        alunoId,
        planoId,
        dataInicio,
        valorPago: plano.valor,
        valorMatricula: plano.valorMatricula,
        desconto: parseFloat(desconto) || 0,
        motivoDesconto: motivoDesconto || undefined,
        formaPagamento: formaPagamento as TipoFormaPagamento,
        renovacaoAutomatica: renovacao,
        convenioId: convenioId || undefined,
        dataPagamento: pagamentoPendente ? undefined : new Date().toISOString().split("T")[0],
      });
      setLoading(false);
      reset();
      onDone();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar matrícula.";
      setError(message);
      setLoading(false);
    }
  }

  const selectedPlano = planos.find((p) => p.id === planoId);
  const conveniosPlano = selectedPlano
    ? convenios.filter((c) => (c.planoIds ?? []).includes(selectedPlano.id))
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Nova Matrícula
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cliente *
            </label>
            {prefillClienteId ? (
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm">
                {alunos.find((a) => a.id === alunoId)?.nome ?? "Cliente selecionado"}
              </div>
            ) : (
              <Select value={alunoId} onValueChange={setAlunoId}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {alunos.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plano *
            </label>
            <Select value={planoId} onValueChange={setPlanoId}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {planos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Data de início *
              </label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Forma de pagamento *
              </label>
              <Select
                value={formaPagamento}
                onValueChange={(v) => setFormaPagamento(v as TipoFormaPagamento)}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {formas.map((fp) => (
                    <SelectItem key={fp.id} value={fp.tipo}>
                      {fp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Desconto (R$)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Motivo do desconto
              </label>
              <Input
                value={motivoDesconto}
                onChange={(e) => setMotivoDesconto(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          {selectedPlano && conveniosPlano.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Convênio (opcional)
              </label>
              <Select value={convenioId} onValueChange={setConvenioId}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Sem convênio" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">Sem convênio</SelectItem>
                  {conveniosPlano.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.descontoPercentual}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={renovacao}
              onChange={(e) => setRenovacao(e.target.checked)}
            />
            <span className="text-muted-foreground">Renovação automática</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pagamentoPendente}
              onChange={(e) => setPagamentoPendente(e.target.checked)}
            />
            <span className="text-muted-foreground">Pagamento pendente</span>
          </div>
          {selectedPlano && (
            <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
              <p className="text-muted-foreground">
                Plano: <span className="font-semibold text-foreground">{selectedPlano.nome}</span>
              </p>
              <p className="text-muted-foreground">
                Valor: <span className="font-bold text-gym-accent">{formatBRL(selectedPlano.valor)}</span>
              </p>
            </div>
          )}
          {error && (
            <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!alunoId || !planoId || !formaPagamento || loading}>
            {loading ? "Salvando..." : "Criar matrícula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
