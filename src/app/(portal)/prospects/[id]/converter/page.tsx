"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { z } from "zod";

import { getProspectApi, updateProspectStatusApi } from "@/lib/api/crm";
import { createAlunoApi, searchAlunosApi } from "@/lib/api/alunos";
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
import type { Prospect, Sexo } from "@/lib/types";
import { ListErrorState } from "@/components/shared/list-states";

/**
 * Converter Prospect → Cliente.
 *
 * Fluxo novo (2026-04-22): esta página NÃO cria mais matrícula/pagamento
 * inline. Ela apenas promove o Prospect a Aluno (`createAlunoApi`), marca
 * o Prospect como `CONVERTIDO` e redireciona o operador pro cockpit unificado
 * de Nova Venda (`/vendas/nova?clienteId={id}&prefill=1`), onde a venda
 * (plano/serviço/produto + pagamento) é fechada.
 *
 * Motivação: eliminar o fluxo paralelo legado que duplicava a UI de venda
 * dentro do wizard de conversão. Single source of truth = cockpit VUN.
 *
 * Pendente (PR futura): persistir `origemProspectId` em `Aluno` pra rastrear
 * conversão cross-entity. Hoje só marcamos o Prospect como CONVERTIDO.
 */

const cpfMaskSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido")
  .or(z.literal(""));

const converterSchema = z.object({
  nome: z.string().trim().min(2, "Nome obrigatório"),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .or(z.literal(""))
    .transform((v) => v || ""),
  telefone: z.string().trim().min(8, "Telefone obrigatório"),
  cpf: cpfMaskSchema,
  estrangeiro: z.boolean().default(false),
  passaporte: z.string().optional(),
  temResponsavel: z.boolean().default(false),
  responsavelClienteId: z.string().optional(),
  responsavelNome: z.string().optional(),
  responsavelCpf: cpfMaskSchema.optional(),
  responsavelEmail: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  responsavelTelefone: z.string().optional(),
  responsavelParentesco: z.string().optional(),
  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento obrigatória (AAAA-MM-DD)"),
  sexo: z.enum(["M", "F", "OUTRO", "NAO_INFORMADO"] as const),
  observacoesMedicas: z.string().optional().default(""),
}).superRefine((values, ctx) => {
  if (!values.estrangeiro && !values.temResponsavel && !values.cpf) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cpf"],
      message: "CPF é obrigatório quando não houver passaporte ou responsável.",
    });
  }
  if (values.estrangeiro && !values.passaporte?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["passaporte"],
      message: "Passaporte é obrigatório para estrangeiro.",
    });
  }
  if (values.temResponsavel) {
    if (!values.responsavelNome?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responsavelNome"],
        message: "Nome do responsável é obrigatório.",
      });
    }
    if (!values.responsavelCpf?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responsavelCpf"],
        message: "CPF do responsável é obrigatório.",
      });
    }
  }
});

type ConverterFormValues = z.infer<typeof converterSchema>;

function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

export default function ConverterProspectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeTenantId } = useTenantContext();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [responsavelHint, setResponsavelHint] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConverterFormValues>({
    resolver: zodResolver(converterSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      estrangeiro: false,
      passaporte: "",
      temResponsavel: false,
      responsavelClienteId: "",
      responsavelNome: "",
      responsavelCpf: "",
      responsavelEmail: "",
      responsavelTelefone: "",
      responsavelParentesco: "",
      dataNascimento: "",
      sexo: "NAO_INFORMADO",
      observacoesMedicas: "",
    },
  });

  // Carrega o prospect e prefilla o form com os dados existentes.
  useEffect(() => {
    if (!id || !activeTenantId) return;
    let cancelled = false;
    setLoading(true);
    getProspectApi({ tenantId: activeTenantId, id })
      .then((p) => {
        if (cancelled) return;
        setProspect(p);
        setValue("nome", p.nome ?? "");
        setValue("email", p.email ?? "");
        setValue("telefone", p.telefone ?? "");
        setValue("cpf", onlyDigits(p.cpf ?? ""));
        setValue("observacoesMedicas", p.observacoes ?? "");
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Falha ao carregar prospect");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, activeTenantId, setValue]);

  const estrangeiroValue = watch("estrangeiro");
  const temResponsavelValue = watch("temResponsavel");
  const responsavelCpfValue = watch("responsavelCpf");

  const onSubmit = async (values: ConverterFormValues) => {
    if (!activeTenantId || !prospect) return;
    setSubmitting(true);
    try {
      const cpfDigits = onlyDigits(values.cpf);
      const aluno = await createAlunoApi({
        tenantId: activeTenantId,
        data: {
          nome: values.nome.trim(),
          email: values.email.trim(),
          telefone: values.telefone.trim(),
          cpf: cpfDigits || undefined,
          passaporte: values.passaporte?.trim() || undefined,
          dataNascimento: values.dataNascimento,
          sexo: values.sexo as Sexo,
          responsavel: values.temResponsavel ? {
            clienteId: values.responsavelClienteId || undefined,
            nome: values.responsavelNome?.trim() || undefined,
            cpf: values.responsavelCpf ? onlyDigits(values.responsavelCpf) : undefined,
            email: values.responsavelEmail?.trim() || undefined,
            telefone: values.responsavelTelefone?.trim() || undefined,
            parentesco: values.responsavelParentesco?.trim() || undefined,
          } : undefined,
          observacoesMedicas: values.observacoesMedicas?.trim() || undefined,
        },
      });

      // Marca o Prospect como CONVERTIDO. Não-bloqueante pro redirect —
      // se a API falhar, o Aluno já foi criado, só logamos e seguimos.
      try {
        await updateProspectStatusApi({
          tenantId: activeTenantId,
          id: prospect.id,
          status: "CONVERTIDO",
        });
      } catch (err) {
        console.warn("Falha ao marcar prospect CONVERTIDO; cliente já criado", err);
      }

      router.push(`/vendas/nova?clienteId=${aluno.id}&prefill=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar cliente");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!temResponsavelValue || !activeTenantId || !responsavelCpfValue || responsavelCpfValue.includes("_")) {
      setValue("responsavelClienteId", "");
      setResponsavelHint("");
      return;
    }

    const cpfDigits = onlyDigits(responsavelCpfValue);
    const handler = setTimeout(async () => {
      try {
        const results = await searchAlunosApi({
          tenantId: activeTenantId,
          search: cpfDigits,
          page: 0,
          size: 5,
        });
        const linked = results.find((aluno) => onlyDigits(aluno.cpf || "") === cpfDigits);
        if (linked) {
          setValue("responsavelClienteId", linked.id, { shouldValidate: true });
          setResponsavelHint(`Responsável já cadastrado: ${linked.nome}. O vínculo será feito entre clientes.`);
          return;
        }
        setValue("responsavelClienteId", "", { shouldValidate: true });
        setResponsavelHint("Responsável externo. O vínculo será criado com os dados informados.");
      } catch {
        setResponsavelHint("");
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [temResponsavelValue, responsavelCpfValue, activeTenantId, setValue]);

  if (!activeTenantId) {
    return (
      <div className="p-6">
        <ListErrorState error="Nenhum tenant ativo selecionado." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Carregando prospect…</div>
    );
  }

  if (error && !prospect) {
    return (
      <div className="p-6">
        <ListErrorState error={error} />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="p-6">
        <ListErrorState error="Prospect não encontrado." />
      </div>
    );
  }

  const sexoValue = watch("sexo");

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-2"
        >
          <ArrowLeft className="mr-1 size-4" /> Voltar
        </Button>
        <div>
          <h1 className="text-xl font-bold">Converter Prospect em Cliente</h1>
          <p className="text-sm text-muted-foreground">
            Cria o cadastro do cliente e te leva direto pro cockpit de Nova Venda.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-border bg-secondary p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Prospect de origem
        </div>
        <div className="mt-1 text-sm">
          <span className="font-semibold">{prospect.nome}</span>
          {prospect.email ? (
            <span className="text-muted-foreground"> · {prospect.email}</span>
          ) : null}
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        data-testid="converter-prospect-form"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nome completo
            </label>
            <Input {...register("nome")} className="mt-1 bg-secondary" />
            {errors.nome ? (
              <p className="text-xs text-gym-danger" role="alert">
                {errors.nome.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              E-mail
            </label>
            <Input
              type="email"
              {...register("email")}
              className="mt-1 bg-secondary"
            />
            {errors.email ? (
              <p className="text-xs text-gym-danger" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Telefone
            </label>
            <PhoneInput
              value={watch("telefone")}
              onChange={(v) => setValue("telefone", v, { shouldValidate: true })}
              className="mt-1 bg-secondary"
            />
            {errors.telefone ? (
              <p className="text-xs text-gym-danger" role="alert">
                {errors.telefone.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              CPF
            </label>
            <MaskedInput
              mask="cpf"
              value={watch("cpf")}
              onChange={(v) => setValue("cpf", v, { shouldValidate: true })}
              className="mt-1 bg-secondary"
            />
            {errors.cpf ? (
              <p className="text-xs text-gym-danger" role="alert">
                {errors.cpf.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={estrangeiroValue}
              onChange={(event) => setValue("estrangeiro", event.target.checked, { shouldValidate: true })}
            />
            Cliente estrangeiro
          </div>

          {estrangeiroValue ? (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Passaporte
              </label>
              <Input {...register("passaporte")} className="mt-1 bg-secondary" />
              {errors.passaporte ? (
                <p className="text-xs text-gym-danger" role="alert">
                  {errors.passaporte.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data de nascimento
            </label>
            <Input
              type="date"
              {...register("dataNascimento")}
              className="mt-1 bg-secondary"
            />
            {errors.dataNascimento ? (
              <p className="text-xs text-gym-danger" role="alert">
                {errors.dataNascimento.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sexo
            </label>
            <Select
              value={sexoValue}
              onValueChange={(v) => setValue("sexo", v as Sexo, { shouldValidate: true })}
            >
              <SelectTrigger className="mt-1 bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
                <SelectItem value="NAO_INFORMADO">Não informado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={temResponsavelValue}
              onChange={(event) => setValue("temResponsavel", event.target.checked, { shouldValidate: true })}
            />
            Possui responsável
          </label>

          {temResponsavelValue ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input type="hidden" {...register("responsavelClienteId")} />

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome do responsável
                </label>
                <Input {...register("responsavelNome")} className="mt-1 bg-secondary" />
                {errors.responsavelNome ? (
                  <p className="text-xs text-gym-danger" role="alert">
                    {errors.responsavelNome.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CPF do responsável
                </label>
                <MaskedInput
                  mask="cpf"
                  value={watch("responsavelCpf") || ""}
                  onChange={(v) => setValue("responsavelCpf", v, { shouldValidate: true })}
                  className="mt-1 bg-secondary"
                />
                {errors.responsavelCpf ? (
                  <p className="text-xs text-gym-danger" role="alert">
                    {errors.responsavelCpf.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Telefone do responsável
                </label>
                <PhoneInput
                  value={watch("responsavelTelefone") || ""}
                  onChange={(v) => setValue("responsavelTelefone", v, { shouldValidate: true })}
                  className="mt-1 bg-secondary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  E-mail do responsável
                </label>
                <Input type="email" {...register("responsavelEmail")} className="mt-1 bg-secondary" />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Parentesco
                </label>
                <Input {...register("responsavelParentesco")} className="mt-1 bg-secondary" />
              </div>

              {responsavelHint ? (
                <div className="md:col-span-2 text-xs text-muted-foreground">{responsavelHint}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Observações médicas (opcional)
          </label>
          <Input
            {...register("observacoesMedicas")}
            className="mt-1 bg-secondary"
          />
        </div>

        {error ? (
          <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 p-3 text-sm text-gym-danger">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              "Criando cliente…"
            ) : (
              <>
                <CheckCircle2 className="mr-1 size-4" />
                Criar cliente e ir pra venda
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
