"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateAlunoService } from "@/lib/tenant/comercial/runtime";
import { fetchCep } from "@/lib/shared/cep-lookup";
import type { Aluno } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { clienteEditSchema, type ClienteEditFormValues } from "./cliente-edit-schema";

function buildDefaults(aluno: Aluno): ClienteEditFormValues {
  return {
    nome: aluno.nome,
    email: aluno.email,
    telefone: aluno.telefone,
    telefoneSec: aluno.telefoneSec ?? "",
    cpf: aluno.cpf,
    rg: aluno.rg ?? "",
    dataNascimento: aluno.dataNascimento,
    sexo: aluno.sexo ?? "",
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
  const { register, control, handleSubmit, reset, watch, setValue } = useForm<ClienteEditFormValues>({
    resolver: zodResolver(clienteEditSchema),
    defaultValues: buildDefaults(aluno),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    reset(buildDefaults(aluno));
    setError("");
  }, [aluno, reset]);

  const cepValue = watch("enderecoCep");

  useEffect(() => {
    fetchCep(cepValue).then((data) => {
      if (!data) return;
      if (data.logradouro) setValue("enderecoLogradouro", data.logradouro);
      if (data.bairro) setValue("enderecoBairro", data.bairro);
      if (data.localidade) setValue("enderecoCidade", data.localidade);
      if (data.uf) setValue("enderecoEstado", data.uf);
    });
  }, [cepValue, setValue]);

  async function onSubmit(form: ClienteEditFormValues) {
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
          cpf: form.cpf,
          rg: form.rg || undefined,
          dataNascimento: form.dataNascimento,
          sexo: form.sexo || undefined,
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
          observacoesMedicas: form.observacoesMedicas || undefined,
        },
      });
      if (onSaved) {
        await onSaved();
      }
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="font-display text-lg font-bold">Editar cliente</h2>
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Dados pessoais</h3>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-nome" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input id="edit-nome" {...register("nome")} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail *</label>
              <Input id="edit-email" type="email" {...register("email")} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-telefone" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone *</label>
              <Controller
                control={control}
                name="telefone"
                render={({ field }) => (
                  <PhoneInput id="edit-telefone" value={field.value} onChange={field.onChange} className="bg-secondary border-border" />
                )}
              />
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
              <label htmlFor="edit-cpf" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF *</label>
              <Controller
                control={control}
                name="cpf"
                render={({ field }) => (
                  <MaskedInput id="edit-cpf" mask="cpf" value={field.value} onChange={field.onChange} className="bg-secondary border-border" />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-rg" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">RG</label>
              <Input id="edit-rg" {...register("rg")} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-dataNascimento" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data de nascimento</label>
              <Input id="edit-dataNascimento" type="date" {...register("dataNascimento")} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-sexo" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sexo</label>
            <select
              id="edit-sexo"
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
              {...register("sexo")}
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="OUTRO">Outro</option>
            </select>
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
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
      {error ? <p role="alert" aria-live="assertive" className="text-sm text-gym-danger">{error}</p> : null}
    </form>
  );
}
