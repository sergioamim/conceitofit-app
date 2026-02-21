"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { listAlunos, listPlanos, listFormasPagamento, criarAlunoComMatricula, criarAluno } from "@/lib/mock/services";
import type { CriarAlunoComMatriculaResponse } from "@/lib/mock/services";
import { StatusBadge } from "@/components/shared/status-badge";
import { HoverPopover } from "@/components/shared/hover-popover";
import { MaskedInput } from "@/components/shared/masked-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, maskCPF, maskPhone } from "@/lib/utils";
import type { Aluno, StatusAluno, Plano, FormaPagamento, Sexo, TipoFormaPagamento } from "@/lib/types";

const STATUS_FILTERS: { value: StatusAluno | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ATIVO", label: "Ativos" },
  { value: "SUSPENSO", label: "Suspensos" },
  { value: "INATIVO", label: "Inativos" },
  { value: "CANCELADO", label: "Cancelados" },
];

const SEXO_LABEL: Record<string, string> = { M: "Masculino", F: "Feminino", OUTRO: "Outro" };
const TIPO_PLANO_LABEL: Record<string, string> = { MENSAL: "Mensal", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral", ANUAL: "Anual", AVULSO: "Avulso" };

const AVATAR_COLORS = ["#c8f135", "#3de8a0", "#38bdf8", "#f472b6", "#fb923c", "#a78bfa"];

function getInitials(nome: string) {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function avatarColor(nome: string) {
  let hash = 0;
  for (const c of nome) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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

function NovoClienteWizard({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [fps, setFps] = useState<FormaPagamento[]>([]);
  const [result, setResult] = useState<CriarAlunoComMatriculaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dados, setDados] = useState<DadosPessoais>({
    nome: "",
    email: "",
    telefone: "",
    telefoneSec: "",
    cpf: "",
    rg: "",
    dataNascimento: "",
    sexo: "",
    enderecoCep: "",
    enderecoLogradouro: "",
    enderecoNumero: "",
    enderecoComplemento: "",
    enderecoBairro: "",
    enderecoCidade: "",
    enderecoEstado: "",
    emergenciaNome: "",
    emergenciaTelefone: "",
    emergenciaParentesco: "",
    observacoesMedicas: "",
    foto: "",
  });
  const [planoId, setPlanoId] = useState("");
  const [pagamento, setPagamento] = useState<PagamentoForm>({ dataInicio: new Date().toISOString().split("T")[0], formaPagamento: "", desconto: "" });

  useEffect(() => {
    if (open) {
      Promise.all([listPlanos(), listFormasPagamento()]).then(([pl, fp]) => { setPlanos(pl); setFps(fp); });
    }
  }, [open]);

  function reset() {
    setStep(1); setResult(null); setError(null);
    setDados({
      nome: "",
      email: "",
      telefone: "",
      telefoneSec: "",
      cpf: "",
      rg: "",
      dataNascimento: "",
      sexo: "",
      enderecoCep: "",
      enderecoLogradouro: "",
      enderecoNumero: "",
      enderecoComplemento: "",
      enderecoBairro: "",
      enderecoCidade: "",
      enderecoEstado: "",
      emergenciaNome: "",
      emergenciaTelefone: "",
      emergenciaParentesco: "",
      observacoesMedicas: "",
      foto: "",
    });
    setPlanoId(""); setPagamento({ dataInicio: new Date().toISOString().split("T")[0], formaPagamento: "", desconto: "" });
  }

  function handleClose() { reset(); onClose(); }

  const canNext = () => {
    if (step === 1) return dados.nome && dados.email && dados.telefone && dados.cpf && dados.dataNascimento && dados.sexo;
    if (step === 2) return !!planoId;
    if (step === 3) return pagamento.dataInicio && pagamento.formaPagamento;
    return false;
  };

  async function handleFinish() {
    setLoading(true); setError(null);
    try {
      const res = await criarAlunoComMatricula({
        nome: dados.nome, email: dados.email, telefone: dados.telefone,
        telefoneSec: dados.telefoneSec || undefined,
        cpf: dados.cpf, rg: dados.rg || undefined,
        dataNascimento: dados.dataNascimento, sexo: dados.sexo as Sexo,
        endereco: {
          cep: dados.enderecoCep || undefined,
          logradouro: dados.enderecoLogradouro || undefined,
          numero: dados.enderecoNumero || undefined,
          complemento: dados.enderecoComplemento || undefined,
          bairro: dados.enderecoBairro || undefined,
          cidade: dados.enderecoCidade || undefined,
          estado: dados.enderecoEstado || undefined,
        },
        contatoEmergencia:
          dados.emergenciaNome && dados.emergenciaTelefone
            ? {
                nome: dados.emergenciaNome,
                telefone: dados.emergenciaTelefone,
                parentesco: dados.emergenciaParentesco || undefined,
              }
            : undefined,
        observacoesMedicas: dados.observacoesMedicas || undefined,
        foto: dados.foto || undefined,
        planoId, dataInicio: pagamento.dataInicio,
        formaPagamento: pagamento.formaPagamento as TipoFormaPagamento,
        desconto: parseFloat(pagamento.desconto) || undefined,
      });
      setResult(res);
      setStep(4);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinishOnlyClient() {
    setLoading(true); setError(null);
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
        endereco: {
          cep: dados.enderecoCep || undefined,
          logradouro: dados.enderecoLogradouro || undefined,
          numero: dados.enderecoNumero || undefined,
          complemento: dados.enderecoComplemento || undefined,
          bairro: dados.enderecoBairro || undefined,
          cidade: dados.enderecoCidade || undefined,
          estado: dados.enderecoEstado || undefined,
        },
        contatoEmergencia:
          dados.emergenciaNome && dados.emergenciaTelefone
            ? {
                nome: dados.emergenciaNome,
                telefone: dados.emergenciaTelefone,
                parentesco: dados.emergenciaParentesco || undefined,
              }
            : undefined,
        observacoesMedicas: dados.observacoesMedicas || undefined,
        foto: dados.foto || undefined,
      });
      onDone();
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  const selectedPlano = planos.find((p) => p.id === planoId);
  const LABELS = ["Dados pessoais", "Plano", "Pagamento"];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {step < 4 ? "Novo cliente com matrícula" : "Cadastro concluído"}
          </DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        {step < 4 && (
          <div className="flex items-center gap-2 pb-1">
            {[1, 2, 3].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <StepDot step={s} current={step} />
                <span className={cn("text-xs", step === s ? "font-semibold text-foreground" : "text-muted-foreground")}>{LABELS[i]}</span>
                {s < 3 && <div className="mx-1 h-px w-6 bg-border" />}
              </div>
            ))}
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {step === 1 && <Step1Dados data={dados} onChange={setDados} />}
          {step === 2 && <Step2Plano planos={planos} selected={planoId} onSelect={setPlanoId} />}
          {step === 3 && <Step3Pagamento plano={selectedPlano} fps={fps} data={pagamento} onChange={setPagamento} />}
          {step === 4 && result && <StepSucesso result={result} plano={selectedPlano} onClose={handleClose} />}
        </div>

        {error && (
          <p className="rounded border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-xs text-gym-danger">{error}</p>
        )}

        {step < 4 && (
          <div className="flex justify-between pt-1">
            <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : handleClose()} className="gap-1.5">
              <ArrowLeft className="size-3.5" />
              {step === 1 ? "Cancelar" : "Voltar"}
            </Button>
            {step === 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleFinishOnlyClient}
                  disabled={!canNext() || loading}
                  className="gap-1.5 border-border"
                >
                  {loading ? "Salvando..." : "Finalizar cliente"}
                </Button>
                <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-1.5">
                  Venda <ArrowRight className="size-3.5" />
                </Button>
              </div>
            )}
            {step > 1 && step < 3 && (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-1.5">
                Próximo <ArrowRight className="size-3.5" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleFinish} disabled={!canNext() || loading} className="gap-1.5">
                {loading ? "Salvando..." : "Cadastrar"} <Check className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [filtro, setFiltro] = useState<StatusAluno | "TODOS">("TODOS");
  const [busca, setBusca] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  async function load() {
    listAlunos().then(setAlunos);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    function handleUpdate() {
      load();
    }
    function handleStorage() {
      load();
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const buscaDigits = busca.replace(/\D/g, "");

  const filtered = alunos.filter((a) => {
    const matchStatus = filtro === "TODOS" || a.status === filtro;
    const matchBusca = !busca
      || a.nome.toLowerCase().includes(busca.toLowerCase())
      || a.email.toLowerCase().includes(busca.toLowerCase())
      || (buscaDigits && a.cpf.replace(/\D/g, "").includes(buscaDigits))
      || (buscaDigits && a.telefone.replace(/\D/g, "").includes(buscaDigits));
    return matchStatus && matchBusca;
  });

  const metrics = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7);
    const novos = alunos.filter((a) => a.dataCadastro.startsWith(ym)).length;
    const renovados = 0;
    const naoRenovados = 0;
    const evadidos = alunos.filter(
      (a) =>
        (a.status === "CANCELADO" || a.status === "INATIVO") &&
        a.dataCadastro.startsWith(ym)
    ).length;
    return { novos, renovados, naoRenovados, evadidos };
  }, [alunos]);

  return (
    <div className="space-y-6">
      <NovoClienteWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onDone={load} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {alunos.length} clientes cadastrados · cadastro direto já cria matrícula e pagamento
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="size-4" />
          Novo cliente
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Novos clientes</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{metrics.novos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Clientes renovados</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">{metrics.renovados}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contratos não renovados</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">{metrics.naoRenovados}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Evasão</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">{metrics.evadidos}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button key={s.value} onClick={() => setFiltro(s.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === s.value
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, telefone ou e-mail..."
            value={busca}
            onChange={(e) => {
              const raw = e.target.value;
              const hasLetters = /[a-zA-Z@]/.test(raw);
              if (hasLetters) {
                setBusca(raw);
                return;
              }
              const digits = raw.replace(/\D/g, "");
              if (digits.length >= 11) {
                setBusca(maskCPF(raw));
              } else {
                setBusca(maskPhone(raw));
              }
            }}
            className="w-72 bg-secondary border-border pl-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              {["Cliente", "CPF", "Telefone", "Nascimento", "Sexo", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</td></tr>
            )}
            {filtered.map((a) => {
              const color = avatarColor(a.nome);
              return (
                <tr
                  key={a.id}
                  className="cursor-pointer transition-colors hover:bg-secondary/40"
                  onClick={() => router.push(`/clientes/${a.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: color + "33", color }}>
                        {getInitials(a.nome)}
                      </div>
                      <div>
                        <Link
                          href={`/clientes/${a.id}`}
                          className="text-sm font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {a.nome}
                        </Link>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{a.cpf}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{a.telefone}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(a.dataNascimento)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{SEXO_LABEL[a.sexo] ?? a.sexo}</td>
                  <td className="px-4 py-3">
                    {a.status === "SUSPENSO" && a.suspensao ? (
                      <HoverPopover
                        content={
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Suspensão
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {a.suspensao.motivo}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {a.suspensao.inicio || a.suspensao.fim
                                ? `${a.suspensao.inicio ? formatDate(a.suspensao.inicio) : "Imediato"} → ${a.suspensao.fim ? formatDate(a.suspensao.fim) : "Indeterminado"}`
                                : "Prazo indeterminado"}
                            </p>
                          </div>
                        }
                      >
                        <StatusBadge status={a.status} />
                      </HoverPopover>
                    ) : (
                      <StatusBadge status={a.status} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
