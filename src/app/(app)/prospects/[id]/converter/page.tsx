"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { getBusinessTodayIso } from "@/lib/business-date";
import {
  converterProspectApi,
  getProspectApi,
} from "@/lib/api/crm";
import { listPlanosApi } from "@/lib/api/comercial-catalogo";
import { listFormasPagamentoApi } from "@/lib/api/formas-pagamento";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  Prospect,
  Plano,
  FormaPagamento,
  Sexo,
  TipoFormaPagamento,
  ConverterProspectResponse,
} from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/formatters";
import { ListErrorState } from "@/components/shared/list-states";

const TIPO_PLANO_LABEL: Record<string, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  AVULSO: "Avulso",
};


// ─── Steps indicator ────────────────────────────────────────────────────────

function StepIndicator({
  step,
  current,
}: {
  step: number;
  current: number;
}) {
  const done = step < current;
  const active = step === current;
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all",
        done
          ? "bg-gym-teal text-background"
          : active
          ? "bg-gym-accent text-background"
          : "bg-secondary text-muted-foreground"
      )}
    >
      {done ? <Check className="size-4" /> : step}
    </div>
  );
}

// ─── Step 1: Dados pessoais ──────────────────────────────────────────────────

interface DadosPessoais {
  cpf: string;
  dataNascimento: string;
  sexo: Sexo | "";
  rg: string;
  emergenciaNome: string;
  emergenciaTelefone: string;
}

function Step1({
  prospect,
  data,
  onChange,
}: {
  prospect: Prospect;
  data: DadosPessoais;
  onChange: (d: DadosPessoais) => void;
}) {
  function set(key: keyof DadosPessoais) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...data, [key]: e.target.value });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-secondary/40 p-4">
        <p className="text-xs text-muted-foreground">Convertendo prospect</p>
        <p className="mt-0.5 text-lg font-bold">{prospect.nome}</p>
        <p className="text-sm text-muted-foreground">
          {prospect.telefone}
          {prospect.email ? ` · ${prospect.email}` : ""}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Dados pessoais
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              CPF *
            </label>
            <MaskedInput
              mask="cpf"
              placeholder="000.000.000-00"
              value={data.cpf}
              onChange={(v) => onChange({ ...data, cpf: v })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              RG
            </label>
            <Input
              placeholder="00.000.000-0"
              value={data.rg}
              onChange={set("rg")}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data de nascimento *
            </label>
            <Input
              type="date"
              value={data.dataNascimento}
              onChange={set("dataNascimento")}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sexo *
            </label>
            <Select
              value={data.sexo}
              onValueChange={(v) => onChange({ ...data, sexo: v as Sexo })}
            >
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
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Contato de emergência (opcional)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nome
            </label>
            <Input
              placeholder="Nome do contato"
              value={data.emergenciaNome}
              onChange={set("emergenciaNome")}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Telefone
            </label>
            <PhoneInput
              placeholder="(11) 99999-0000"
              value={data.emergenciaTelefone}
              onChange={(v) => onChange({ ...data, emergenciaTelefone: v })}
              className="bg-secondary border-border"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Selecionar plano ────────────────────────────────────────────────

function Step2({
  planos,
  selected,
  onSelect,
}: {
  planos: Plano[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">
        Escolha o plano
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {planos.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              "relative rounded-xl border p-5 text-left transition-all",
              selected === p.id
                ? "border-gym-accent bg-gym-accent/5"
                : "border-border bg-card hover:border-border/80 hover:bg-secondary/50"
            )}
          >
            {p.destaque && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-gym-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
                Popular
              </span>
            )}
            <div className="font-display text-lg font-bold">{p.nome}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {TIPO_PLANO_LABEL[p.tipo]} · {p.duracaoDias} dias
            </div>
            <div className="mt-3">
              <span className="font-display text-2xl font-extrabold text-gym-accent">
                {formatBRL(p.valor)}
              </span>
              <span className="text-xs text-muted-foreground"> / plano</span>
            </div>
            {p.valorMatricula > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                + {formatBRL(p.valorMatricula)} de matrícula
              </div>
            )}
            {p.beneficios && p.beneficios.length > 0 && (
              <ul className="mt-3 space-y-1">
                {p.beneficios.slice(0, 3).map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <Check className="size-3 text-gym-teal" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {selected === p.id && (
              <div className="absolute right-3 top-3">
                <CheckCircle2 className="size-5 text-gym-accent" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Pagamento ───────────────────────────────────────────────────────

interface PagamentoData {
  dataInicio: string;
  formaPagamento: TipoFormaPagamento | "";
  desconto: string;
  motivoDesconto: string;
}

function Step3({
  plano,
  formasPagamento,
  data,
  onChange,
}: {
  plano: Plano | undefined;
  formasPagamento: FormaPagamento[];
  data: PagamentoData;
  onChange: (d: PagamentoData) => void;
}) {
  const desconto = parseFloat(data.desconto) || 0;
  const valorFinal = (plano?.valor ?? 0) + (plano?.valorMatricula ?? 0) - desconto;

  return (
    <div className="space-y-5">
      {plano && (
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="text-xs text-muted-foreground">Plano selecionado</p>
          <p className="mt-0.5 text-lg font-bold">{plano.nome}</p>
          <p className="text-sm text-muted-foreground">
            {formatBRL(plano.valor)} · {plano.duracaoDias} dias
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Data de início *
          </label>
          <Input
            type="date"
            value={data.dataInicio}
            onChange={(e) => onChange({ ...data, dataInicio: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Forma de pagamento *
          </label>
          <Select
            value={data.formaPagamento}
            onValueChange={(v) =>
              onChange({ ...data, formaPagamento: v as TipoFormaPagamento })
            }
          >
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {formasPagamento.map((fp) => (
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
            placeholder="0,00"
            value={data.desconto}
            onChange={(e) => onChange({ ...data, desconto: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Motivo do desconto
          </label>
          <Input
            placeholder="Ex: cliente indicado"
            value={data.motivoDesconto}
            onChange={(e) =>
              onChange({ ...data, motivoDesconto: e.target.value })
            }
            className="bg-secondary border-border"
          />
        </div>
      </div>

      {plano && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor do plano</span>
            <span>{formatBRL(plano.valor)}</span>
          </div>
          {plano.valorMatricula > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de matrícula</span>
              <span>{formatBRL(plano.valorMatricula)}</span>
            </div>
          )}
          {desconto > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Desconto</span>
              <span className="text-gym-teal">- {formatBRL(desconto)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-semibold">Total</span>
            <span className="font-display text-lg font-bold text-gym-accent">
              {formatBRL(valorFinal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Sucesso ─────────────────────────────────────────────────────────

function Step4({
  result,
  plano,
  pagamentoData,
  desconto,
}: {
  result: ConverterProspectResponse;
  plano: Plano | undefined;
  pagamentoData: PagamentoData;
  desconto: number;
}) {
  const router = useRouter();
  const valorPlano = plano?.valor ?? 0;
  const valorMatricula = plano?.valorMatricula ?? 0;
  const total = valorPlano + valorMatricula - desconto;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-gym-teal/15">
            <CheckCircle2 className="size-8 text-gym-teal" />
          </div>
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold">Conversão realizada!</h3>
        <p className="mt-1 text-muted-foreground">
          {result.aluno.nome} agora é um cliente ativo.
        </p>
      </div>

      {/* Resumo do cliente */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</p>
        <p className="mt-1 text-lg font-bold">{result.aluno.nome}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>CPF: {result.aluno.cpf}</span>
          {result.aluno.email && <span>{result.aluno.email}</span>}
          {result.aluno.telefone && <span>{result.aluno.telefone}</span>}
        </div>
      </div>

      {/* Resumo do plano */}
      {plano && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plano contratado</p>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold">{plano.nome}</p>
              <p className="text-sm text-muted-foreground">
                {TIPO_PLANO_LABEL[plano.tipo]} · {plano.duracaoDias} dias
              </p>
            </div>
            <span className="rounded-full bg-gym-teal/15 px-2.5 py-0.5 text-xs font-semibold text-gym-teal">
              Ativo
            </span>
          </div>

          <div className="space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor do plano</span>
              <span>{formatBRL(valorPlano)}</span>
            </div>
            {valorMatricula > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de matrícula</span>
                <span>{formatBRL(valorMatricula)}</span>
              </div>
            )}
            {desconto > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-gym-teal">- {formatBRL(desconto)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span className="font-display text-lg text-gym-accent">{formatBRL(total)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Início: {formatDate(result.matricula.dataInicio)}</span>
            <span>Fim: {formatDate(result.matricula.dataFim)}</span>
            <span>Pagamento: {pagamentoData.formaPagamento}</span>
          </div>
        </div>
      )}

      {/* Pagamento pendente */}
      <div className="rounded-xl border border-gym-warning/30 bg-gym-warning/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pagamento</p>
            <p className="mt-1 font-display text-xl font-bold text-gym-accent">
              {formatBRL(result.pagamento.valorFinal)}
            </p>
            <p className="text-xs text-gym-warning font-semibold">Pendente — aguardando recebimento</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gym-warning/30 text-gym-warning hover:bg-gym-warning/10"
            onClick={() => router.push(`/pagamentos?clienteId=${result.aluno.id}`)}
          >
            Receber pagamento
          </Button>
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          variant="outline"
          className="border-border"
          onClick={() => router.push(`/clientes/${result.aluno.id}`)}
        >
          Ver perfil do cliente
        </Button>
        <Button
          variant="outline"
          className="border-border"
          onClick={() => router.push(`/pagamentos?clienteId=${result.aluno.id}`)}
        >
          Ver pagamentos
        </Button>
        <Button
          variant="outline"
          className="border-border"
          onClick={() => router.push("/prospects")}
        >
          Voltar aos prospects
        </Button>
        <Button onClick={() => router.push("/clientes")}>
          Ver todos os clientes
        </Button>
      </div>
    </div>
  );
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

export default function ConverterPage() {
  const params = useParams();
  const router = useRouter();
  const tenantContext = useTenantContext();
  const prospectId = params.id as string;

  const [step, setStep] = useState(1);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [result, setResult] = useState<ConverterProspectResponse | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const [dadosPessoais, setDadosPessoais] = useState<DadosPessoais>({
    cpf: "",
    dataNascimento: "",
    sexo: "",
    rg: "",
    emergenciaNome: "",
    emergenciaTelefone: "",
  });

  const [planoId, setPlanoId] = useState("");

  const [pagamentoData, setPagamentoData] = useState<PagamentoData>({
    dataInicio: getBusinessTodayIso(),
    formaPagamento: "",
    desconto: "",
    motivoDesconto: "",
  });

  useEffect(() => {
    if (prospect?.cpf) {
      setDadosPessoais((d) => ({ ...d, cpf: prospect.cpf! }));
    }
  }, [prospect]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBootstrapping(true);
      setError(null);
      try {
        const [prospectRow, planoRows, formasRows] = await Promise.all([
          getProspectApi({ tenantId, id: prospectId }),
          listPlanosApi({ tenantId, apenasAtivos: true }),
          listFormasPagamentoApi({ tenantId, apenasAtivas: true }),
        ]);
        if (cancelled) return;
        setProspect(prospectRow);
        setPlanos(planoRows);
        setFormasPagamento(formasRows);
      } catch (loadError) {
        if (cancelled) return;
        if (loadError instanceof Error && /404/.test(loadError.message)) {
          router.push("/prospects");
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Erro ao carregar conversão.");
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [prospectId, router, tenantId]);

  const selectedPlano = planos.find((p) => p.id === planoId);

  function canAdvance() {
    if (step === 1)
      return dadosPessoais.cpf && dadosPessoais.dataNascimento && dadosPessoais.sexo;
    if (step === 2) return !!planoId;
    if (step === 3)
      return pagamentoData.dataInicio && pagamentoData.formaPagamento;
    return false;
  }

  async function handleFinish() {
    if (!prospect || !planoId || !pagamentoData.formaPagamento || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await converterProspectApi({
        tenantId,
        data: {
          prospectId: prospect.id,
          cpf: dadosPessoais.cpf,
          dataNascimento: dadosPessoais.dataNascimento,
          sexo: dadosPessoais.sexo as "M" | "F" | "OUTRO",
          rg: dadosPessoais.rg || undefined,
          contatoEmergencia:
            dadosPessoais.emergenciaNome
              ? {
                  nome: dadosPessoais.emergenciaNome,
                  telefone: dadosPessoais.emergenciaTelefone,
                }
              : undefined,
          planoId,
          dataInicio: pagamentoData.dataInicio,
          formaPagamento: pagamentoData.formaPagamento as TipoFormaPagamento,
          desconto: parseFloat(pagamentoData.desconto) || undefined,
          motivoDesconto: pagamentoData.motivoDesconto || undefined,
        },
      });
      setResult(res);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao converter");
    } finally {
      setLoading(false);
    }
  }

  if (bootstrapping) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
        Carregando dados da conversão...
      </div>
    );
  }

  if (!prospect) return null;

  const STEP_LABELS = ["Dados pessoais", "Plano", "Pagamento", "Confirmação"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {step < 4 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
            className="shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Converter Prospect
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step < 4
              ? `Passo ${step} de 3 — ${STEP_LABELS[step - 1]}`
              : "Concluído"}
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      {step < 4 && (
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <StepIndicator step={s} current={step} />
              <span
                className={cn(
                  "text-sm",
                  step === s
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {STEP_LABELS[i]}
              </span>
              {s < 3 && (
                <div className="mx-2 h-px w-10 bg-border" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {step === 1 && (
          <Step1
            prospect={prospect}
            data={dadosPessoais}
            onChange={setDadosPessoais}
          />
        )}
        {step === 2 && (
          <Step2
            planos={planos}
            selected={planoId}
            onSelect={setPlanoId}
          />
        )}
        {step === 3 && (
          <Step3
            plano={selectedPlano}
            formasPagamento={formasPagamento}
            data={pagamentoData}
            onChange={setPagamentoData}
          />
        )}
        {step === 4 && result && (
          <Step4
            result={result}
            plano={selectedPlano}
            pagamentoData={pagamentoData}
            desconto={parseFloat(pagamentoData.desconto) || 0}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </p>
      )}

      {/* Footer nav */}
      {step < 4 && (
        <div className="flex justify-end gap-3">
          {step < 3 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
            >
              Próximo
              <ArrowRight className="size-4" />
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={handleFinish}
              disabled={!canAdvance() || loading}
            >
              {loading ? "Convertendo..." : "Finalizar conversão"}
              <Check className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
