"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { searchAlunosApi } from "@/lib/api/alunos";
import { updateAlunoService } from "@/lib/tenant/comercial/runtime";
import { fetchCep } from "@/lib/shared/cep-lookup";
import type { Aluno } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { requiredTrimmedString, optionalTrimmedString } from "@/lib/forms/zod-helpers";
import { requiredPastDateString, requiredPersonalName } from "@/lib/forms/personal-identity-schemas";

const cpfMaskSchema = z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido").or(z.literal(""));

const clienteFormSchema = z.object({
  nome: requiredPersonalName("Informe o nome.", "Informe um nome válido."),
  email: requiredTrimmedString("Informe o e-mail.").email("E-mail inválido."),
  telefone: requiredTrimmedString("Informe o telefone."),
  telefoneSec: optionalTrimmedString(),
  cpf: cpfMaskSchema,
  estrangeiro: z.boolean().default(false),
  passaporte: optionalTrimmedString(),
  rg: optionalTrimmedString(),
  dataNascimento: requiredPastDateString("Informe a data de nascimento."),
  sexo: requiredTrimmedString("Selecione o sexo."),
  enderecoCep: optionalTrimmedString(),
  enderecoLogradouro: optionalTrimmedString(),
  enderecoNumero: optionalTrimmedString(),
  enderecoComplemento: optionalTrimmedString(),
  enderecoBairro: optionalTrimmedString(),
  enderecoCidade: optionalTrimmedString(),
  enderecoEstado: optionalTrimmedString(),
  emergenciaNome: optionalTrimmedString(),
  emergenciaTelefone: optionalTrimmedString(),
  emergenciaParentesco: optionalTrimmedString(),
  temResponsavel: z.boolean().default(false),
  responsavelClienteId: optionalTrimmedString(),
  responsavelNome: optionalTrimmedString(),
  responsavelCpf: cpfMaskSchema.optional(),
  responsavelEmail: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  responsavelTelefone: optionalTrimmedString(),
  responsavelParentesco: optionalTrimmedString(),
  observacoesMedicas: optionalTrimmedString(),
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

type ClienteFormValues = z.infer<typeof clienteFormSchema>;

function buildForm(aluno: Aluno): ClienteFormValues {
  return {
    nome: aluno.nome,
    email: aluno.email,
    telefone: aluno.telefone,
    telefoneSec: aluno.telefoneSec ?? "",
    cpf: aluno.cpf ?? "",
    estrangeiro: Boolean(aluno.passaporte),
    passaporte: aluno.passaporte ?? "",
    rg: aluno.rg ?? "",
    dataNascimento: aluno.dataNascimento,
    sexo: aluno.sexo || "",
    enderecoCep: aluno.endereco?.cep ?? "",
    enderecoLogradouro: aluno.endereco?.logradouro ?? "",
    enderecoNumero: aluno.endereco?.numero ?? "",
    enderecoComplemento: aluno.endereco?.complemento ?? "",
    enderecoBairro: aluno.endereco?.bairro ?? "",
    enderecoCidade: aluno.endereco?.cidade ?? "",
    enderecoEstado: aluno.endereco?.estado ?? "",
    emergenciaNome: aluno.contatoEmergencia?.nome ?? "",
    emergenciaTelefone: aluno.contatoEmergencia?.telefone ?? "",
    emergenciaParentesco: aluno.contatoEmergencia?.parentesco ?? "",
    temResponsavel: Boolean(aluno.responsavel),
    responsavelClienteId: aluno.responsavel?.clienteId ?? "",
    responsavelNome: aluno.responsavel?.nome ?? "",
    responsavelCpf: aluno.responsavel?.cpf ?? "",
    responsavelEmail: aluno.responsavel?.email ?? "",
    responsavelTelefone: aluno.responsavel?.telefone ?? "",
    responsavelParentesco: aluno.responsavel?.parentesco ?? "",
    observacoesMedicas: aluno.observacoesMedicas ?? "",
  };
}

export function ClienteEditForm({
  aluno,
  onCancel,
  onSaved,
}: {
  aluno: Aluno;
  onCancel: () => void;
  onSaved?: () => Promise<void> | void;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError: setFieldError,
    formState: { errors, isValid },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    mode: "onChange",
    defaultValues: buildForm(aluno),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responsavelHint, setResponsavelHint] = useState("");

  useEffect(() => {
    reset(buildForm(aluno));
    setError("");
  }, [aluno, reset]);

  const watchedEstrangeiro = watch("estrangeiro");
  const watchedTemResponsavel = watch("temResponsavel");
  const enderecoCep = watch("enderecoCep");
  const responsavelCpf = watch("responsavelCpf");

  useEffect(() => {
    fetchCep(enderecoCep ?? "").then((data) => {
      if (!data) return;
      if (data.logradouro) setValue("enderecoLogradouro", data.logradouro);
      if (data.bairro) setValue("enderecoBairro", data.bairro);
      if (data.localidade) setValue("enderecoCidade", data.localidade);
      if (data.uf) setValue("enderecoEstado", data.uf);
    });
  }, [enderecoCep, setValue]);

  useEffect(() => {
    if (!watchedTemResponsavel || !responsavelCpf || responsavelCpf.includes("_")) {
      setValue("responsavelClienteId", "");
      setResponsavelHint("");
      return;
    }
    const cpfDigits = responsavelCpf.replace(/\D/g, "");
    const handler = setTimeout(async () => {
      try {
        const results = await searchAlunosApi({
          tenantId: aluno.tenantId,
          search: cpfDigits,
          page: 0,
          size: 5,
        });
        const linked = results.find((item) => item.id !== aluno.id && (item.cpf || "").replace(/\D/g, "") === cpfDigits);
        if (linked) {
          setValue("responsavelClienteId", linked.id);
          setResponsavelHint(`Responsável já cadastrado: ${linked.nome}. O vínculo será feito entre clientes.`);
          return;
        }
        setValue("responsavelClienteId", "");
        setResponsavelHint("Responsável externo. O vínculo será criado com os dados informados.");
      } catch {
        setResponsavelHint("");
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [watchedTemResponsavel, responsavelCpf, aluno.tenantId, setValue]);

  const onFormSubmit = async (form: ClienteFormValues) => {
    setLoading(true);
    setError("");
    try {
      await updateAlunoService({
        tenantId: aluno.tenantId,
        id: aluno.id,
        data: {
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          telefoneSec: form.telefoneSec || undefined,
          cpf: form.cpf || undefined,
          estrangeiro: form.estrangeiro,
          possuiResponsavel: form.temResponsavel,
          passaporte: form.passaporte || undefined,
          rg: form.rg || undefined,
          dataNascimento: form.dataNascimento,
          sexo: (form.sexo as Aluno["sexo"]) || undefined,
          endereco: {
            cep: form.enderecoCep || undefined,
            logradouro: form.enderecoLogradouro || undefined,
            numero: form.enderecoNumero || undefined,
            complemento: form.enderecoComplemento || undefined,
            bairro: form.enderecoBairro || undefined,
            cidade: form.enderecoCidade || undefined,
            estado: form.enderecoEstado || undefined,
          },
          contatoEmergencia: form.emergenciaNome
            ? {
                nome: form.emergenciaNome,
                telefone: form.emergenciaTelefone ?? "",
                parentesco: form.emergenciaParentesco || undefined,
              }
            : undefined,
          responsavel: form.temResponsavel
            ? {
                clienteId: form.responsavelClienteId || undefined,
                nome: form.responsavelNome || "",
                cpf: form.responsavelCpf || undefined,
                email: form.responsavelEmail || undefined,
                telefone: form.responsavelTelefone || undefined,
                parentesco: form.responsavelParentesco || undefined,
              }
            : undefined,
          observacoesMedicas: form.observacoesMedicas || undefined,
        },
      });
      if (onSaved) {
        await onSaved();
      }
    } catch (saveError) {
      const { appliedFields } = applyApiFieldErrors(saveError, setFieldError);
      setError(buildFormApiErrorMessage(saveError, {
        appliedFields,
        fallbackMessage: "Revise os campos destacados e tente novamente.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <h2 className="text-lg font-bold">Editar cliente</h2>
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Dados pessoais</h3>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-nome" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome <span className="text-gym-danger">*</span>
              </label>
              <Input
                id="edit-nome"
                {...register("nome")}
                aria-invalid={errors.nome ? "true" : "false"}
                className="bg-secondary border-border"
              />
              {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                E-mail <span className="text-gym-danger">*</span>
              </label>
              <Input
                id="edit-email"
                type="email"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                className="bg-secondary border-border"
              />
              {errors.email ? <p className="text-xs text-gym-danger">{errors.email.message}</p> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-telefone" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Telefone <span className="text-gym-danger">*</span>
              </label>
              <Controller
                control={control}
                name="telefone"
                render={({ field }) => (
                  <PhoneInput
                    id="edit-telefone"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={errors.telefone ? "true" : "false"}
                    className="bg-secondary border-border"
                  />
                )}
              />
              {errors.telefone ? <p className="text-xs text-gym-danger">{errors.telefone.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-telefoneSec" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone secundário</label>
              <Controller
                control={control}
                name="telefoneSec"
                render={({ field }) => (
                  <PhoneInput id="edit-telefoneSec" value={field.value ?? ""} onChange={field.onChange} className="bg-secondary border-border" />
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-cpf" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                CPF {watchedEstrangeiro || watchedTemResponsavel ? "" : <span className="text-gym-danger">*</span>}
              </label>
              <Controller
                control={control}
                name="cpf"
                render={({ field }) => (
                  <MaskedInput
                    id="edit-cpf"
                    mask="cpf"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={errors.cpf ? "true" : "false"}
                    className="bg-secondary border-border"
                  />
                )}
              />
              {errors.cpf ? <p className="text-xs text-gym-danger">{errors.cpf.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente estrangeiro</label>
              <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-secondary px-3 text-sm">
                <input type="checkbox" {...register("estrangeiro")} />
                Marcar como estrangeiro
              </label>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-passaporte" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Passaporte</label>
              <Input id="edit-passaporte" {...register("passaporte")} className="bg-secondary border-border" />
              {errors.passaporte ? <p className="text-xs text-gym-danger">{errors.passaporte.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-rg" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">RG</label>
              <Input id="edit-rg" {...register("rg")} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-dataNascimento" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Data de nascimento <span className="text-gym-danger">*</span>
              </label>
              <Input
                id="edit-dataNascimento"
                type="date"
                {...register("dataNascimento")}
                aria-invalid={errors.dataNascimento ? "true" : "false"}
                className="bg-secondary border-border"
              />
              {errors.dataNascimento ? <p className="text-xs text-gym-danger">{errors.dataNascimento.message}</p> : null}
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-sexo" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sexo <span className="text-gym-danger">*</span>
            </label>
            <select
              id="edit-sexo"
              aria-invalid={errors.sexo ? "true" : "false"}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
              {...register("sexo")}
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="OUTRO">Outro</option>
            </select>
            {errors.sexo ? <p className="text-xs text-gym-danger">{errors.sexo.message}</p> : null}
          </div>
          <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" {...register("temResponsavel")} />
              Possui responsável
            </label>
            {watchedTemResponsavel ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <input type="hidden" {...register("responsavelClienteId")} />
                <div className="space-y-1.5">
                  <label htmlFor="edit-responsavel-nome" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome do responsável</label>
                  <Input id="edit-responsavel-nome" {...register("responsavelNome")} className="bg-secondary border-border" />
                  {errors.responsavelNome ? <p className="text-xs text-gym-danger">{errors.responsavelNome.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edit-responsavel-cpf" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF do responsável</label>
                  <Controller
                    control={control}
                    name="responsavelCpf"
                    render={({ field }) => (
                      <MaskedInput
                        id="edit-responsavel-cpf"
                        mask="cpf"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        className="bg-secondary border-border"
                      />
                    )}
                  />
                  {errors.responsavelCpf ? <p className="text-xs text-gym-danger">{errors.responsavelCpf.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edit-responsavel-telefone" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone do responsável</label>
                  <Controller
                    control={control}
                    name="responsavelTelefone"
                    render={({ field }) => (
                      <PhoneInput id="edit-responsavel-telefone" value={field.value ?? ""} onChange={field.onChange} className="bg-secondary border-border" />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edit-responsavel-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail do responsável</label>
                  <Input id="edit-responsavel-email" type="email" {...register("responsavelEmail")} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edit-responsavel-parentesco" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parentesco</label>
                  <Input id="edit-responsavel-parentesco" {...register("responsavelParentesco")} className="bg-secondary border-border" />
                </div>
                {responsavelHint ? <p className="col-span-2 text-xs text-muted-foreground">{responsavelHint}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Endereço</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="edit-cep" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CEP</label>
            <Controller
              control={control}
              name="enderecoCep"
              render={({ field }) => (
                <MaskedInput id="edit-cep" mask="cep" value={field.value ?? ""} onChange={field.onChange} className="bg-secondary border-border" />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-logradouro" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Logradouro</label>
            <Input id="edit-logradouro" {...register("enderecoLogradouro")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-numero" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Número</label>
            <Input id="edit-numero" {...register("enderecoNumero")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-complemento" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Complemento</label>
            <Input id="edit-complemento" {...register("enderecoComplemento")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-bairro" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bairro</label>
            <Input id="edit-bairro" {...register("enderecoBairro")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-cidade" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cidade</label>
            <Input id="edit-cidade" {...register("enderecoCidade")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-estado" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</label>
            <Input id="edit-estado" {...register("enderecoEstado")} className="bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Contato de emergência</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="edit-emergencia-nome" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
            <Input id="edit-emergencia-nome" {...register("emergenciaNome")} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-emergencia-telefone" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
            <Controller
              control={control}
              name="emergenciaTelefone"
              render={({ field }) => (
                <PhoneInput id="edit-emergencia-telefone" value={field.value ?? ""} onChange={field.onChange} className="bg-secondary border-border" />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-emergencia-parentesco" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parentesco</label>
            <Input id="edit-emergencia-parentesco" {...register("emergenciaParentesco")} className="bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" className="border-border" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !isValid}>
          {loading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
      {error ? <p role="alert" aria-live="assertive" className="text-sm text-gym-danger">{error}</p> : null}
    </form>
  );
}
