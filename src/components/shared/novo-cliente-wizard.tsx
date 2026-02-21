"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { listPlanos, listFormasPagamento, criarAlunoComMatricula, criarAluno } from "@/lib/mock/services";
import type { CriarAlunoComMatriculaResponse } from "@/lib/mock/services";
import type { Plano, FormaPagamento, Sexo, TipoFormaPagamento } from "@/lib/types";
import { MaskedInput } from "@/components/shared/masked-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SEXO_LABEL: Record<string, string> = { M: "Masculino", F: "Feminino", OUTRO: "Outro" };
const TIPO_PLANO_LABEL: Record<string, string> = { MENSAL: "Mensal", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral", ANUAL: "Anual", AVULSO: "Avulso" };

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Step indicator ────────────────────────────────────────────────────────

function StepDot({ step, current }: { step: number; current: number }) {
  const done = step < current;
  const active = step === current;
  return (
    <div className={cn(
      "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all",
      done ? "bg-gym-teal text-background" : active ? "bg-gym-accent text-background" : "bg-secondary text-muted-foreground"
    )}>
      {done ? <Check className="size-3.5" /> : step}
    </div>
  );
}

// ─── Step 1: Dados pessoais ────────────────────────────────────────────────

interface DadosPessoais {
  nome: string; email: string; telefone: string;
  telefoneSec: string;
  cpf: string; rg: string; dataNascimento: string; sexo: Sexo | "";
  enderecoCep: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoEstado: string;
  emergenciaNome: string;
  emergenciaTelefone: string;
  emergenciaParentesco: string;
  observacoesMedicas: string;
  foto: string;
}

function Step1Dados({ data, onChange }: { data: DadosPessoais; onChange: (d: DadosPessoais) => void }) {
  function set(key: keyof DadosPessoais) {
    return (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, [key]: e.target.value });
  }
  useEffect(() => {
    const cep = data.enderecoCep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then((res) => {
        if (res.erro) return;
        onChange({
          ...data,
          enderecoLogradouro: res.logradouro ?? data.enderecoLogradouro,
          enderecoBairro: res.bairro ?? data.enderecoBairro,
          enderecoCidade: res.localidade ?? data.enderecoCidade,
          enderecoEstado: res.uf ?? data.enderecoEstado,
        });
      })
      .catch(() => undefined);
  }, [data.enderecoCep]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome completo *</label>
          <Input placeholder="João da Silva" value={data.nome} onChange={set("nome")} className="bg-secondary border-border" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail *</label>
          <Input type="email" placeholder="joao@email.com" value={data.email} onChange={set("email")} className="bg-secondary border-border" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone *</label>
          <MaskedInput mask="phone" placeholder="(11) 99999-0000" value={data.telefone} onChange={(v) => onChange({ ...data, telefone: v })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone secundário</label>
          <MaskedInput mask="phone" placeholder="(11) 90000-0000" value={data.telefoneSec} onChange={(v) => onChange({ ...data, telefoneSec: v })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF *</label>
          <MaskedInput mask="cpf" placeholder="000.000.000-00" value={data.cpf} onChange={(v) => onChange({ ...data, cpf: v })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">RG</label>
          <Input placeholder="00.000.000-0" value={data.rg} onChange={set("rg")} className="bg-secondary border-border" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data de nascimento *</label>
          <Input type="date" value={data.dataNascimento} onChange={set("dataNascimento")} className="bg-secondary border-border" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sexo *</label>
          <Select value={data.sexo} onValueChange={(v) => onChange({ ...data, sexo: v as Sexo })}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
              <SelectItem value="OUTRO">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <p className="text-sm font-semibold text-muted-foreground">Endereço (opcional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CEP</label>
            <MaskedInput mask="cep" placeholder="00000-000" value={data.enderecoCep} onChange={(v) => onChange({ ...data, enderecoCep: v })} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Logradouro</label>
            <Input placeholder="Rua, Avenida..." value={data.enderecoLogradouro} onChange={set("enderecoLogradouro")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Número</label>
            <Input placeholder="123" value={data.enderecoNumero} onChange={set("enderecoNumero")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Complemento</label>
            <Input placeholder="Apto, bloco..." value={data.enderecoComplemento} onChange={set("enderecoComplemento")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bairro</label>
            <Input placeholder="Centro" value={data.enderecoBairro} onChange={set("enderecoBairro")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cidade</label>
            <Input placeholder="São Paulo" value={data.enderecoCidade} onChange={set("enderecoCidade")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</label>
            <Input placeholder="SP" value={data.enderecoEstado} onChange={set("enderecoEstado")} className="bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <p className="text-sm font-semibold text-muted-foreground">Contato de emergência (opcional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
            <Input placeholder="Nome do contato" value={data.emergenciaNome} onChange={set("emergenciaNome")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
            <MaskedInput mask="phone" placeholder="(11) 90000-0000" value={data.emergenciaTelefone} onChange={(v) => onChange({ ...data, emergenciaTelefone: v })} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parentesco</label>
            <Input placeholder="Ex: irmão" value={data.emergenciaParentesco} onChange={set("emergenciaParentesco")} className="bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <p className="text-sm font-semibold text-muted-foreground">Saúde e foto (opcional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações médicas</label>
            <Input placeholder="Alergias, restrições..." value={data.observacoesMedicas} onChange={set("observacoesMedicas")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Foto</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  onChange({ ...data, foto: String(reader.result) });
                };
                reader.readAsDataURL(file);
              }}
              className="bg-secondary border-border"
            />
            {data.foto && (
              <img src={data.foto} alt="Foto do cliente" className="mt-2 h-16 w-16 rounded-md object-cover" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Plano ─────────────────────────────────────────────────────────

function Step2Plano({ planos, selected, onSelect }: { planos: Plano[]; selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Escolha o plano</p>
      <div className="grid grid-cols-2 gap-3">
        {planos.map((p) => (
          <button key={p.id} onClick={() => onSelect(p.id)}
            className={cn("relative rounded-xl border p-4 text-left transition-all",
              selected === p.id ? "border-gym-accent bg-gym-accent/5" : "border-border bg-secondary/40 hover:border-border/80"
            )}
          >
            {p.destaque && (
              <span className="absolute -top-2.5 left-3 rounded-full bg-gym-accent px-2 py-0.5 text-[10px] font-bold uppercase text-background">Popular</span>
            )}
            <div className="font-display font-bold">{p.nome}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{TIPO_PLANO_LABEL[p.tipo]} · {p.duracaoDias} dias</div>
            <div className="mt-2 font-display text-xl font-extrabold text-gym-accent">{formatBRL(p.valor)}</div>
            {p.valorMatricula > 0 && <div className="text-xs text-muted-foreground">+ {formatBRL(p.valorMatricula)} matrícula</div>}
            {p.beneficios?.slice(0, 2).map((b) => (
              <div key={b} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="size-3 text-gym-teal" />{b}
              </div>
            ))}
            {selected === p.id && <CheckCircle2 className="absolute right-3 top-3 size-4 text-gym-accent" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Pagamento ─────────────────────────────────────────────────────

interface PagamentoForm { dataInicio: string; formaPagamento: TipoFormaPagamento | ""; desconto: string; }

function Step3Pagamento({ plano, fps, data, onChange }: {
  plano?: Plano; fps: FormaPagamento[];
  data: PagamentoForm; onChange: (d: PagamentoForm) => void;
}) {
  const desconto = parseFloat(data.desconto) || 0;
  return (
    <div className="space-y-4">
      {plano && (
        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
          <p className="text-muted-foreground">Plano: <span className="font-semibold text-foreground">{plano.nome}</span></p>
          <p className="text-muted-foreground">Valor: <span className="font-bold text-gym-accent">{formatBRL(plano.valor)}</span></p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data de início *</label>
          <Input type="date" value={data.dataInicio} onChange={(e) => onChange({ ...data, dataInicio: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento *</label>
          <Select value={data.formaPagamento} onValueChange={(v) => onChange({ ...data, formaPagamento: v as TipoFormaPagamento })}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {fps.map((fp) => <SelectItem key={fp.id} value={fp.tipo}>{fp.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Desconto (R$)</label>
          <Input type="number" min={0} placeholder="0,00" value={data.desconto} onChange={(e) => onChange({ ...data, desconto: e.target.value })} className="bg-secondary border-border" />
        </div>
      </div>
      {plano && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Valor do plano</span><span>{formatBRL(plano.valor)}</span></div>
          {desconto > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="text-gym-teal">- {formatBRL(desconto)}</span></div>}
          <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
            <span>Total</span>
            <span className="font-display text-base font-bold text-gym-accent">{formatBRL(plano.valor - desconto)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Success ───────────────────────────────────────────────────────────────

function StepSucesso({ result, plano, onClose }: { result: CriarAlunoComMatriculaResponse; plano?: Plano; onClose: () => void }) {
  return (
    <div className="space-y-5 text-center py-2">
      <div className="flex justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-gym-teal/15">
          <CheckCircle2 className="size-7 text-gym-teal" />
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">Cadastro realizado!</h3>
        <p className="mt-1 text-sm text-muted-foreground">{result.aluno.nome} está ativo com {plano?.nome}.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-left text-sm">
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cliente</p>
          <p className="mt-1 font-semibold">{result.aluno.nome}</p>
          <p className="text-xs text-muted-foreground">{result.aluno.cpf}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Matrícula</p>
          <p className="mt-1 font-semibold">{plano?.nome}</p>
          <p className="text-xs text-muted-foreground">{formatDate(result.matricula.dataInicio)} → {formatDate(result.matricula.dataFim)}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pagamento</p>
          <p className="mt-1 font-display font-bold text-gym-accent">{formatBRL(result.pagamento.valorFinal)}</p>
          <p className="text-xs text-gym-warning">Pendente</p>
        </div>
      </div>
      <Button onClick={onClose} className="w-full">Fechar</Button>
    </div>
  );
}

// ─── Wizard modal ──────────────────────────────────────────────────────────

export function NovoClienteWizard({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [selectedPlano, setSelectedPlano] = useState("");
  const [dados, setDados] = useState<DadosPessoais>({
    nome: "", email: "", telefone: "", telefoneSec: "", cpf: "", rg: "",
    dataNascimento: "", sexo: "",
    enderecoCep: "", enderecoLogradouro: "", enderecoNumero: "", enderecoComplemento: "",
    enderecoBairro: "", enderecoCidade: "", enderecoEstado: "",
    emergenciaNome: "", emergenciaTelefone: "", emergenciaParentesco: "",
    observacoesMedicas: "", foto: "",
  });
  const [pagamento, setPagamento] = useState<{ dataInicio: string; formaPagamento: TipoFormaPagamento | ""; desconto: string }>({
    dataInicio: new Date().toISOString().split("T")[0],
    formaPagamento: "",
    desconto: "",
  });
  const [result, setResult] = useState<CriarAlunoComMatriculaResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([listPlanos(), listFormasPagamento()]).then(([pls, fps]) => {
      setPlanos(pls);
      setFormas(fps);
    });
  }, [open]);

  function reset() {
    setStep(1);
    setSelectedPlano("");
    setDados({
      nome: "", email: "", telefone: "", telefoneSec: "", cpf: "", rg: "",
      dataNascimento: "", sexo: "",
      enderecoCep: "", enderecoLogradouro: "", enderecoNumero: "", enderecoComplemento: "",
      enderecoBairro: "", enderecoCidade: "", enderecoEstado: "",
      emergenciaNome: "", emergenciaTelefone: "", emergenciaParentesco: "",
      observacoesMedicas: "", foto: "",
    });
    setPagamento({
      dataInicio: new Date().toISOString().split("T")[0],
      formaPagamento: "",
      desconto: "",
    });
    setResult(null);
  }

  async function handleNext() {
    if (step === 1) {
      if (!dados.nome || !dados.email || !dados.telefone || !dados.cpf || !dados.dataNascimento || !dados.sexo) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!selectedPlano) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!pagamento.formaPagamento) return;
      const plano = planos.find((p) => p.id === selectedPlano);
      if (!plano) return;
      setLoading(true);
      try {
        const resp = await criarAlunoComMatricula({
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone,
          telefoneSec: dados.telefoneSec || undefined,
          cpf: dados.cpf,
          rg: dados.rg || undefined,
          dataNascimento: dados.dataNascimento,
          sexo: dados.sexo as Sexo,
          endereco: dados.enderecoCep ? {
            cep: dados.enderecoCep,
            logradouro: dados.enderecoLogradouro,
            numero: dados.enderecoNumero,
            complemento: dados.enderecoComplemento,
            bairro: dados.enderecoBairro,
            cidade: dados.enderecoCidade,
            estado: dados.enderecoEstado,
          } : undefined,
          contatoEmergencia: dados.emergenciaNome ? {
            nome: dados.emergenciaNome,
            telefone: dados.emergenciaTelefone,
            parentesco: dados.emergenciaParentesco,
          } : undefined,
          observacoesMedicas: dados.observacoesMedicas || undefined,
          foto: dados.foto || undefined,
          planoId: selectedPlano,
          dataInicio: pagamento.dataInicio,
          formaPagamento: pagamento.formaPagamento as TipoFormaPagamento,
          desconto: parseFloat(pagamento.desconto) || 0,
        });
        setResult(resp);
        setStep(4);
        onDone();
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleCreateOnly() {
    if (!dados.nome || !dados.email || !dados.telefone || !dados.cpf || !dados.dataNascimento || !dados.sexo) return;
    setLoading(true);
    try {
      await criarAluno({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        telefoneSec: dados.telefoneSec || undefined,
        cpf: dados.cpf,
        rg: dados.rg || undefined,
        dataNascimento: dados.dataNascimento,
        sexo: dados.sexo as Sexo,
        endereco: dados.enderecoCep ? {
          cep: dados.enderecoCep,
          logradouro: dados.enderecoLogradouro,
          numero: dados.enderecoNumero,
          complemento: dados.enderecoComplemento,
          bairro: dados.enderecoBairro,
          cidade: dados.enderecoCidade,
          estado: dados.enderecoEstado,
        } : undefined,
        contatoEmergencia: dados.emergenciaNome ? {
          nome: dados.emergenciaNome,
          telefone: dados.emergenciaTelefone,
          parentesco: dados.emergenciaParentesco,
        } : undefined,
        observacoesMedicas: dados.observacoesMedicas || undefined,
        foto: dados.foto || undefined,
      });
      onDone();
      onClose();
      reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {
      onClose();
      reset();
    }}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Novo cliente
          </DialogTitle>
        </DialogHeader>

        {step <= 3 && (
          <div className="flex items-center gap-2 text-sm">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <StepDot step={s} current={step} />
                {s < 3 && <div className="h-px w-6 bg-border" />}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          {step === 1 && <Step1Dados data={dados} onChange={setDados} />}
          {step === 2 && <Step2Plano planos={planos} selected={selectedPlano} onSelect={setSelectedPlano} />}
          {step === 3 && <Step3Pagamento plano={planos.find((p) => p.id === selectedPlano)} fps={formas} data={pagamento} onChange={setPagamento} />}
          {step === 4 && result && <StepSucesso result={result} plano={planos.find((p) => p.id === selectedPlano)} onClose={() => { onClose(); reset(); }} />}
        </div>

        {step <= 3 && (
          <div className="mt-5 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => (step === 1 ? onClose() : setStep((s) => s - 1))}
              className="border-border"
            >
              <ArrowLeft className="size-3.5" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              {step === 1 && (
                <>
                  <Button variant="outline" onClick={handleCreateOnly} className="border-border">
                    Finalizar
                  </Button>
                  <Button onClick={handleNext}>
                    Venda <ArrowRight className="size-3.5" />
                  </Button>
                </>
              )}
              {step > 1 && (
                <Button onClick={handleNext} disabled={loading}>
                  {loading ? "Salvando..." : "Próximo"} <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
