"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useClienteOperationalContext } from "@/lib/query/use-portal-aluno";
import { updateAlunoApi } from "@/lib/api/alunos";
import { fetchCep } from "@/lib/shared/cep-lookup";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  editarPerfilSchema,
  type EditarPerfilFormValues,
} from "@/lib/forms/perfil-aluno-schemas";
import { useQueryClient } from "@tanstack/react-query";

export default function EditarPerfilPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenantId, userId, tenantResolved } = useTenantContext();
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const { data: context, isLoading } = useClienteOperationalContext({
    id: userId,
    tenantId,
    enabled: tenantResolved && !!userId,
  });

  const aluno = context?.aluno;

  const form = useForm<EditarPerfilFormValues>({
    resolver: zodResolver(editarPerfilSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      dataNascimento: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
    },
  });

  // Pre-fill form with current data
  useEffect(() => {
    if (!aluno) return;
    form.reset({
      nome: aluno.nome ?? "",
      email: aluno.email ?? "",
      telefone: aluno.telefone ?? "",
      dataNascimento: aluno.dataNascimento ?? "",
      cep: aluno.endereco?.cep ?? "",
      logradouro: aluno.endereco?.logradouro ?? "",
      numero: aluno.endereco?.numero ?? "",
      complemento: aluno.endereco?.complemento ?? "",
      bairro: aluno.endereco?.bairro ?? "",
      cidade: aluno.endereco?.cidade ?? "",
      estado: aluno.endereco?.estado ?? "",
    });
  }, [aluno, form]);

  // CEP auto-fill
  const handleCepBlur = useCallback(async () => {
    const cep = form.getValues("cep");
    if (!cep || cep.replace(/\D/g, "").length !== 8) return;

    setLoadingCep(true);
    const result = await fetchCep(cep);
    setLoadingCep(false);

    if (result) {
      form.setValue("logradouro", result.logradouro);
      form.setValue("bairro", result.bairro);
      form.setValue("cidade", result.localidade);
      form.setValue("estado", result.uf);
    }
  }, [form]);

  const handleSave = useCallback(
    async (values: EditarPerfilFormValues) => {
      if (!tenantId || !aluno) return;
      setSaving(true);
      try {
        await updateAlunoApi({
          tenantId,
          id: aluno.id,
          data: {
            nome: values.nome,
            email: values.email,
            telefone: values.telefone,
            dataNascimento: values.dataNascimento,
            endereco: {
              cep: values.cep,
              logradouro: values.logradouro,
              numero: values.numero,
              complemento: values.complemento,
              bairro: values.bairro,
              cidade: values.cidade,
              estado: values.estado,
            },
          },
        });
        await queryClient.invalidateQueries();
        toast({ title: "Perfil atualizado com sucesso!" });
        router.push("/meu-perfil");
      } catch (err) {
        toast({
          title: "Erro ao salvar",
          description: normalizeErrorMessage(err),
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [tenantId, aluno, queryClient, toast, router],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 pb-20">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Voltar para meu perfil"
          onClick={() => router.push("/meu-perfil")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-display text-xl font-bold">Editar Perfil</h1>
      </div>

      <form
        onSubmit={form.handleSubmit(handleSave)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" {...form.register("nome")} />
          {form.formState.errors.nome && (
            <p className="text-xs text-gym-danger">{form.formState.errors.nome.message}</p>
          )}
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-xs text-gym-danger">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" {...form.register("telefone")} placeholder="(11) 99999-9999" />
            {form.formState.errors.telefone && (
              <p className="text-xs text-gym-danger">{form.formState.errors.telefone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataNascimento">Data de nascimento</Label>
          <Input id="dataNascimento" type="date" {...form.register("dataNascimento")} />
          {form.formState.errors.dataNascimento && (
            <p className="text-xs text-gym-danger">{form.formState.errors.dataNascimento.message}</p>
          )}
        </div>

        {/* Endereço */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-bold">Endereço</Label>
          </div>

          <div className="grid gap-4 grid-cols-[1fr_100px]">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                {...form.register("cep")}
                onBlur={handleCepBlur}
                placeholder="00000-000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" {...form.register("numero")} />
            </div>
          </div>

          {loadingCep && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Buscando CEP...
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input id="logradouro" {...form.register("logradouro")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complemento">Complemento</Label>
            <Input id="complemento" {...form.register("complemento")} placeholder="Apto, bloco..." />
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" {...form.register("bairro")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...form.register("cidade")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">UF</Label>
              <Input id="estado" {...form.register("estado")} maxLength={2} />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-2xl font-bold"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </form>
    </div>
  );
}
