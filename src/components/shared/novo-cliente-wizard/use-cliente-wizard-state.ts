"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { getBusinessTodayIso } from "@/lib/business-date";
import { createAlunoService } from "@/lib/tenant/comercial/runtime";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { Aluno, Sexo } from "@/lib/types";
import { useFormDraft } from "@/hooks/use-form-draft";

import {
  clienteWizardSchema,
  type ClienteWizardForm,
  normalizeDraftEmail,
} from "./wizard-types";

/**
 * Opções emitidas pelo wizard ao chamar `onDone`. Após VUN-5.1 o wizard tem
 * 3 CTAs e cada uma indica o destino pretendido para o caller:
 *
 * - `openSale: true`        → caller redireciona para `/vendas/nova?clienteId=…`
 * - `linkAggregator: true`  → caller abre o `<VincularAgregadorModal />`
 * - sem flags               → "Salvar" (volta para listagem)
 */
export interface CreateOnlyOptions {
  openSale?: boolean;
  linkAggregator?: boolean;
}

const DEFAULT_VALUES: ClienteWizardForm = {
  nome: "", email: "", telefone: "", telefoneSec: "", cpf: "", rg: "",
  dataNascimento: "", sexo: "",
  enderecoCep: "", enderecoLogradouro: "", enderecoNumero: "", enderecoComplemento: "",
  enderecoBairro: "", enderecoCidade: "", enderecoEstado: "",
  emergenciaNome: "", emergenciaTelefone: "", emergenciaParentesco: "",
  observacoesMedicas: "", foto: "",
  selectedPlano: "",
  pagamento: {
    dataInicio: getBusinessTodayIso(),
    formaPagamento: "",
    desconto: "",
    diaCobranca: "",
    cupomCodigo: "",
    convenioId: "",
    cartaoNumero: "",
    cartaoValidade: "",
    cartaoCvv: "",
    cartaoCpfTitular: "",
  },
};

function buildAlunoPayload(vals: ClienteWizardForm) {
  return {
    nome: vals.nome,
    email: normalizeDraftEmail(vals.nome, vals.cpf, vals.email),
    telefone: vals.telefone,
    telefoneSec: vals.telefoneSec,
    cpf: vals.cpf,
    rg: vals.rg,
    dataNascimento: vals.dataNascimento || "2000-01-01",
    sexo: (vals.sexo || "OUTRO") as Sexo,
    endereco: vals.enderecoCep ? {
      cep: vals.enderecoCep,
      logradouro: vals.enderecoLogradouro,
      numero: vals.enderecoNumero,
      complemento: vals.enderecoComplemento,
      bairro: vals.enderecoBairro,
      cidade: vals.enderecoCidade,
      estado: vals.enderecoEstado,
    } : undefined,
    contatoEmergencia: vals.emergenciaNome ? {
      nome: vals.emergenciaNome,
      telefone: vals.emergenciaTelefone || "",
      parentesco: vals.emergenciaParentesco,
    } : undefined,
    observacoesMedicas: vals.observacoesMedicas,
    foto: vals.foto,
  };
}

/**
 * State hook do wizard "Novo cliente".
 *
 * VUN-5.1: o wizard agora **termina no Step 1** (dados do cliente). Os
 * passos plano/pagamento/sucesso foram removidos do fluxo — substituídos
 * pelos 3 CTAs:
 *  - Salvar             → cria prospect e fecha
 *  - Vender             → cria prospect + abre cockpit `/vendas/nova`
 *  - Vincular agregador → cria prospect + abre modal VincularAgregador
 *
 * Toda a navegação pós-criação fica a cargo do `onDone(created, opts)`.
 */
export function useClienteWizardState(callbacks: {
  onClose: () => void;
  onDone?: (created?: Aluno, opts?: CreateOnlyOptions) => void | Promise<void>;
}) {
  const { tenantId } = useTenantContext();
  const [showComplementary, setShowComplementary] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ClienteWizardForm>({
    resolver: zodResolver(clienteWizardSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const draft = useFormDraft({ key: "novo_cliente_wizard", form });
  const { formState: { isDirty, isValid }, trigger, getValues, reset } = form;

  function fullReset() {
    setShowComplementary(false);
    reset();
    draft.clearDraft();
  }

  async function handleCreateOnly(options?: CreateOnlyOptions) {
    if (!tenantId) return;
    const ok = await trigger(["nome", "telefone", "cpf", "email"]);
    if (!ok) return;

    setLoading(true);
    const vals = getValues();
    try {
      const created = await createAlunoService({
        tenantId,
        data: buildAlunoPayload(vals),
      });
      draft.clearDraft();
      if (callbacks.onDone) {
        await callbacks.onDone(created, options);
      }
      callbacks.onClose();
      fullReset();
    } catch {
      window.alert("Não foi possível criar o pré-cadastro. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return {
    showComplementary, setShowComplementary,
    loading,
    form,
    draft,
    isDirty, isValid,
    fullReset,
    handleCreateOnly,
  };
}
