"use client";

import { useEffect, useState } from "react";
import type { Atividade, AtividadeGrade, DiaSemana, Funcionario, Sala } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverPopover } from "@/components/shared/hover-popover";

const DIA_LABEL: Record<DiaSemana, string> = {
  SEG: "Seg",
  TER: "Ter",
  QUA: "Qua",
  QUI: "Qui",
  SEX: "Sex",
  SAB: "Sáb",
  DOM: "Dom",
};

export interface AtividadeGradeForm {
  atividadeId: string;
  diasSemana: DiaSemana[];
  definicaoHorario: "PREVIAMENTE" | "SOB_DEMANDA";
  horaInicio: string;
  horaFim: string;
  capacidade: string;
  checkinLiberadoMinutosAntes: string;
  duracaoMinutos: string;
  codigo: string;
  grupoAtividades: string;
  publico: string;
  dificuldade: "" | "1" | "2" | "3" | "4" | "5";
  descricaoAgenda: string;
  acessoClientes: "TODOS_CLIENTES" | "APENAS_COM_CONTRATO_OU_SERVICO";
  permiteReserva: boolean;
  limitarVagasAgregadores: boolean;
  exibirWellhub: boolean;
  permitirSaidaAntesInicio: boolean;
  permitirEscolherNumeroVaga: boolean;
  exibirNoAppCliente: boolean;
  exibirNoAutoatendimento: boolean;
  exibirNoWodTv: boolean;
  finalizarAtividadeAutomaticamente: boolean;
  desabilitarListaEspera: boolean;
  salaId: string;
  funcionarioId: string;
}

export function AtividadeGradeModal({
  open,
  onClose,
  onSave,
  atividades,
  salas,
  funcionarios,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AtividadeGradeForm, id?: string) => void;
  atividades: Atividade[];
  salas: Sala[];
  funcionarios: Funcionario[];
  initial?: AtividadeGrade | null;
}) {
  const [form, setForm] = useState<AtividadeGradeForm>({
    atividadeId: "",
    diasSemana: ["SEG"],
    definicaoHorario: "PREVIAMENTE",
    horaInicio: "",
    horaFim: "",
    capacidade: "20",
    checkinLiberadoMinutosAntes: "60",
    duracaoMinutos: "60",
    codigo: "",
    grupoAtividades: "",
    publico: "",
    dificuldade: "",
    descricaoAgenda: "",
    acessoClientes: "TODOS_CLIENTES",
    permiteReserva: true,
    limitarVagasAgregadores: false,
    exibirWellhub: false,
    permitirSaidaAntesInicio: false,
    permitirEscolherNumeroVaga: false,
    exibirNoAppCliente: true,
    exibirNoAutoatendimento: false,
    exibirNoWodTv: false,
    finalizarAtividadeAutomaticamente: true,
    desabilitarListaEspera: false,
    salaId: "",
    funcionarioId: "",
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        atividadeId: initial.atividadeId,
        diasSemana: initial.diasSemana,
        definicaoHorario: initial.definicaoHorario,
        horaInicio: initial.horaInicio,
        horaFim: initial.horaFim,
        capacidade: String(initial.capacidade),
        checkinLiberadoMinutosAntes: String(initial.checkinLiberadoMinutosAntes),
        duracaoMinutos: String(initial.duracaoMinutos),
        codigo: initial.codigo ?? "",
        grupoAtividades: initial.grupoAtividades ?? "",
        publico: initial.publico ?? "",
        dificuldade: initial.dificuldade ? String(initial.dificuldade) as AtividadeGradeForm["dificuldade"] : "",
        descricaoAgenda: initial.descricaoAgenda ?? "",
        acessoClientes: initial.acessoClientes,
        permiteReserva: initial.permiteReserva,
        limitarVagasAgregadores: initial.limitarVagasAgregadores,
        exibirWellhub: initial.exibirWellhub,
        permitirSaidaAntesInicio: initial.permitirSaidaAntesInicio,
        permitirEscolherNumeroVaga: initial.permitirEscolherNumeroVaga,
        exibirNoAppCliente: initial.exibirNoAppCliente,
        exibirNoAutoatendimento: initial.exibirNoAutoatendimento,
        exibirNoWodTv: initial.exibirNoWodTv,
        finalizarAtividadeAutomaticamente: initial.finalizarAtividadeAutomaticamente,
        desabilitarListaEspera: initial.desabilitarListaEspera,
        salaId: initial.salaId ?? "",
        funcionarioId: initial.funcionarioId ?? "",
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      atividadeId: atividades[0]?.id ?? "",
      diasSemana: ["SEG"],
      definicaoHorario: "PREVIAMENTE",
      horaInicio: "",
      horaFim: "",
      capacidade: "20",
      checkinLiberadoMinutosAntes: "60",
      duracaoMinutos: "60",
      codigo: "",
      grupoAtividades: "",
      publico: "",
      dificuldade: "",
      descricaoAgenda: "",
      acessoClientes: "TODOS_CLIENTES",
      permiteReserva: true,
      limitarVagasAgregadores: false,
      exibirWellhub: false,
      permitirSaidaAntesInicio: false,
      permitirEscolherNumeroVaga: false,
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: false,
      exibirNoWodTv: false,
      finalizarAtividadeAutomaticamente: true,
      desabilitarListaEspera: false,
      salaId: salas.find((s) => s.ativo)?.id ?? "",
      funcionarioId: "",
    }));
  }, [initial, open, atividades, salas]);

  function set<K extends keyof AtividadeGradeForm>(key: K, value: AtividadeGradeForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDia(dia: DiaSemana) {
    setForm((prev) => {
      const has = prev.diasSemana.includes(dia);
      if (has && prev.diasSemana.length === 1) return prev;
      return {
        ...prev,
        diasSemana: has
          ? prev.diasSemana.filter((d) => d !== dia)
          : [...prev.diasSemana, dia],
      };
    });
  }

  function handleSave() {
    const needsTime = form.definicaoHorario === "PREVIAMENTE";
    if (!form.atividadeId || form.diasSemana.length === 0 || !form.capacidade || !form.duracaoMinutos || !form.checkinLiberadoMinutosAntes) return;
    if (needsTime && (!form.horaInicio || !form.horaFim)) return;
    onSave(form, initial?.id);
  }

  const funcionariosInstrutores = funcionarios.filter(
    (f) => f.ativo && f.podeMinistrarAulas
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar Atividade - Grade" : "Nova Atividade - Grade"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <section className="rounded-lg border border-border bg-secondary/20 p-4">
            <h3 className="text-sm font-semibold">Como são definidos os horários desta atividade?</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <input
                  type="radio"
                  checked={form.definicaoHorario === "PREVIAMENTE"}
                  onChange={() => set("definicaoHorario", "PREVIAMENTE")}
                />
                Previamente
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <input
                  type="radio"
                  checked={form.definicaoHorario === "SOB_DEMANDA"}
                  onChange={() => set("definicaoHorario", "SOB_DEMANDA")}
                />
                Sob demanda
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-secondary/20 p-4">
            <h3 className="text-sm font-semibold">Configurações da atividade</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Atividade *</label>
                <Select
                  value={form.atividadeId}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      atividadeId: v,
                      funcionarioId: funcionarios.some((f) => f.id === prev.funcionarioId && f.podeMinistrarAulas)
                        ? prev.funcionarioId
                        : "",
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {atividades.filter((a) => a.ativo).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Grupo de atividades</label>
                <Input value={form.grupoAtividades} onChange={(e) => set("grupoAtividades", e.target.value)} className="bg-secondary border-border" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dias da semana *</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(DIA_LABEL).map((key) => {
                    const dia = key as DiaSemana;
                    const active = form.diasSemana.includes(dia);
                    return (
                      <button
                        type="button"
                        key={dia}
                        onClick={() => toggleDia(dia)}
                        className={`rounded-md border px-2 py-1 text-xs ${active ? "border-gym-accent bg-gym-accent/10 text-gym-accent" : "border-border text-muted-foreground"}`}
                      >
                        {DIA_LABEL[dia]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Público</label>
                <Input value={form.publico} onChange={(e) => set("publico", e.target.value)} className="bg-secondary border-border" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capacidade padrão *</label>
                <Input type="number" min={1} value={form.capacidade} onChange={(e) => set("capacidade", e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duração (min) *</label>
                <Input type="number" min={1} value={form.duracaoMinutos} onChange={(e) => set("duracaoMinutos", e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Janela do check-in (min antes)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.checkinLiberadoMinutosAntes}
                  onChange={(e) => set("checkinLiberadoMinutosAntes", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Código</label>
                <Input value={form.codigo} onChange={(e) => set("codigo", e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dificuldade (1-5)</label>
                <Select
                  value={form.dificuldade || "NONE"}
                  onValueChange={(v) => set("dificuldade", v === "NONE" ? "" : (v as AtividadeGradeForm["dificuldade"]))}
                >
                  <SelectTrigger className="w-full bg-secondary border-border"><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="NONE">Não definido</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-secondary/20 p-4">
            <h3 className="text-sm font-semibold">Agenda e participação</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hora início {form.definicaoHorario === "PREVIAMENTE" ? "*" : ""}</label>
                <Input type="time" value={form.horaInicio} onChange={(e) => set("horaInicio", e.target.value)} className="bg-secondary border-border" disabled={form.definicaoHorario !== "PREVIAMENTE"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hora fim {form.definicaoHorario === "PREVIAMENTE" ? "*" : ""}</label>
                <Input type="time" value={form.horaFim} onChange={(e) => set("horaFim", e.target.value)} className="bg-secondary border-border" disabled={form.definicaoHorario !== "PREVIAMENTE"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sala</label>
                <Select value={form.salaId || "NONE"} onValueChange={(v) => set("salaId", v === "NONE" ? "" : v)}>
                  <SelectTrigger className="w-full bg-secondary border-border"><SelectValue placeholder="Selecione a sala" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="NONE">Não definir sala</SelectItem>
                    {salas.filter((s) => s.ativo).map((sala) => (
                      <SelectItem key={sala.id} value={sala.id}>
                        {sala.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Funcionário (instrutor)</label>
                <Select value={form.funcionarioId || "NONE"} onValueChange={(v) => set("funcionarioId", v === "NONE" ? "" : v)}>
                  <SelectTrigger className="w-full bg-secondary border-border"><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="NONE">Não definir funcionário</SelectItem>
                    {funcionariosInstrutores.map((funcionario) => (
                      <SelectItem key={funcionario.id} value={funcionario.id}>
                        {funcionario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {funcionariosInstrutores.length === 0 && (
                  <p className="text-[11px] text-gym-warning">
                    Nenhum funcionário ativo está habilitado para ministrar aulas.
                  </p>
                )}
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição (agenda online)</label>
                <textarea
                  value={form.descricaoAgenda}
                  onChange={(e) => set("descricaoAgenda", e.target.value.slice(0, 1000))}
                  className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                />
                <p className="text-right text-[11px] text-muted-foreground">{form.descricaoAgenda.length} / 1000</p>
              </div>

              <div className="col-span-2 rounded-md border border-border bg-card p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quais clientes poderão participar desta aula?</p>
                <div className="mt-2 space-y-1.5 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.acessoClientes === "TODOS_CLIENTES"}
                      onChange={() => set("acessoClientes", "TODOS_CLIENTES")}
                    />
                    Todos os clientes (atividade livre)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.acessoClientes === "APENAS_COM_CONTRATO_OU_SERVICO"}
                      onChange={() => set("acessoClientes", "APENAS_COM_CONTRATO_OU_SERVICO")}
                    />
                    Apenas clientes com contrato/serviço relacionado
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.permiteReserva} onChange={(e) => set("permiteReserva", e.target.checked)} />
                Permite que o cliente reserve
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.limitarVagasAgregadores} onChange={(e) => set("limitarVagasAgregadores", e.target.checked)} />
                Limitar vagas para agregadores
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.exibirWellhub} onChange={(e) => set("exibirWellhub", e.target.checked)} />
                Exibir no app Wellhub
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-secondary/20 p-4">
            <h3 className="text-sm font-semibold">Outros</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.permitirSaidaAntesInicio} onChange={(e) => set("permitirSaidaAntesInicio", e.target.checked)} />Permitir saída antes do início</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.permitirEscolherNumeroVaga} onChange={(e) => set("permitirEscolherNumeroVaga", e.target.checked)} />Permitir escolher número da vaga</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.exibirNoAppCliente} onChange={(e) => set("exibirNoAppCliente", e.target.checked)} />Exibir no aplicativo do cliente</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.exibirNoAutoatendimento} onChange={(e) => set("exibirNoAutoatendimento", e.target.checked)} />Exibir no autoatendimento/site</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.exibirNoWodTv} onChange={(e) => set("exibirNoWodTv", e.target.checked)} />Exibir no WOD TV</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.finalizarAtividadeAutomaticamente} onChange={(e) => set("finalizarAtividadeAutomaticamente", e.target.checked)} />Finalizar atividade automaticamente</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.desabilitarListaEspera} onChange={(e) => set("desabilitarListaEspera", e.target.checked)} />Desabilitar lista de espera</label>
              <HoverPopover content="Configurações avançadas impactam agenda do cliente e reservas. Revise antes de publicar.">
                <span className="inline-flex size-5 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">?</span>
              </HoverPopover>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button onClick={handleSave}>{initial ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
