"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getBusinessTodayIso } from "@/lib/business-date";
import {
  createAlunoComMatriculaService,
  createAlunoService,
} from "@/lib/tenant/comercial/runtime";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { Aluno, Sexo, TipoFormaPagamento } from "@/lib/types";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";

import {
  clienteWizardSchema,
  type ClienteWizardForm,
  type CriarAlunoComMatriculaResponse,
  normalizeDraftEmail,
} from "./wizard-types";

interface CreateOnlyOptions {
  openSale?: boolean;
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

export function useClienteWizardState(callbacks: {
  onClose: () => void;
  onDone?: (created?: Aluno, opts?: CreateOnlyOptions) => void | Promise<void>;
}) {
  const { tenantId } = useTenantContext();
  const [step, setStep] = useState(1);
  const [showComplementary, setShowComplementary] = useState(false);
  const [result, setResult] = useState<CriarAlunoComMatriculaResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const commercial = useCommercialFlow({ tenantId });
  const { planos, formasPagamento: formas, clearCart, dryRun } = commercial;

  const form = useForm<ClienteWizardForm>({
    resolver: zodResolver(clienteWizardSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES,
  });

  const draft = useFormDraft({ key: "novo_cliente_wizard", form });
  const { formState: { isDirty, isValid }, trigger, getValues, reset } = form;

  function fullReset() {
    setStep(1);
    setShowComplementary(false);
    reset();
    setResult(null);
    clearCart();
  }

  async function handleNext() {
    if (step === 1) {
      const ok = await trigger(["nome", "telefone", "cpf", "email"]);
      if (!ok) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      const pId = getValues("selectedPlano");
      if (!pId) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!tenantId) return;
      const ok = await trigger(["pagamento.formaPagamento", "pagamento.dataInicio"]);
      if (!ok) return;

      const vals = getValues();
      const plano = planos.find((p) => p.id === vals.selectedPlano);
      if (!plano || !vals.pagamento.formaPagamento || !dryRun) return;

      setLoading(true);
      try {
        const resp = await createAlunoComMatriculaService({
          tenantId,
          data: {
            ...buildAlunoPayload(vals),
            planoId: dryRun?.planoContexto.planoId || (vals.selectedPlano as string),
            dataInicio: dryRun?.planoContexto.dataInicio || (vals.pagamento.dataInicio as string),
            formaPagamento: vals.pagamento.formaPagamento as TipoFormaPagamento,
            desconto: dryRun?.descontoTotal ?? (parseFloat(vals.pagamento.desconto || "0") || 0),
          },
        });
        setResult(resp);
        setStep(4);
        draft.clearDraft();
        if (callbacks.onDone) {
          void callbacks.onDone(resp.aluno);
        }
      } finally {
        setLoading(false);
      }
    }
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
    step, setStep,
    showComplementary, setShowComplementary,
    result,
    loading,
    form,
    draft,
    isDirty, isValid,
    planos, formas, commercial,
    fullReset,
    handleNext,
    handleCreateOnly,
  };
}
