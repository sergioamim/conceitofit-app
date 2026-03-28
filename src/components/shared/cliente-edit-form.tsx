"use client";

import { useEffect, useState } from "react";
import { updateAlunoService } from "@/lib/comercial/runtime";
import type { Aluno } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

interface EditForm {
  nome: string;
  email: string;
  telefone: string;
  telefoneSec: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  sexo: Aluno["sexo"] | "";
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
}

function buildForm(aluno: Aluno): EditForm {
  return {
    nome: aluno.nome,
    email: aluno.email,
    telefone: aluno.telefone,
    telefoneSec: aluno.telefoneSec ?? "",
    cpf: aluno.cpf,
    rg: aluno.rg ?? "",
    dataNascimento: aluno.dataNascimento,
    sexo: aluno.sexo,
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
  const [form, setForm] = useState<EditForm>(() => buildForm(aluno));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setForm(buildForm(aluno));
    setError("");
  }, [aluno]);

  useEffect(() => {
    const cep = form.enderecoCep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.erro) return;
        setForm((prev) => ({
          ...prev,
          enderecoLogradouro: data.logradouro ?? prev.enderecoLogradouro,
          enderecoBairro: data.bairro ?? prev.enderecoBairro,
          enderecoCidade: data.localidade ?? prev.enderecoCidade,
          enderecoEstado: data.uf ?? prev.enderecoEstado,
        }));
      })
      .catch(() => undefined);
  }, [form.enderecoCep]);

  const handleSave = async () => {
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
                telefone: form.emergenciaTelefone,
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
  };

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-bold">Editar cliente</h2>
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Dados pessoais</h3>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-nome" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input id="edit-nome" value={form.nome} onChange={(e) => setField("nome", e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail *</label>
              <Input id="edit-email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-telefone" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone *</label>
              <PhoneInput id="edit-telefone" value={form.telefone} onChange={(v) => setField("telefone", v)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-telefoneSec" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone secundário</label>
              <PhoneInput id="edit-telefoneSec" value={form.telefoneSec} onChange={(v) => setField("telefoneSec", v)} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="edit-cpf" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF *</label>
              <MaskedInput id="edit-cpf" mask="cpf" value={form.cpf} onChange={(v) => setField("cpf", v)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-rg" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">RG</label>
              <Input id="edit-rg" value={form.rg} onChange={(e) => setField("rg", e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-dataNascimento" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data de nascimento</label>
              <Input id="edit-dataNascimento" type="date" value={form.dataNascimento} onChange={(e) => setField("dataNascimento", e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-sexo" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sexo</label>
            <select
              id="edit-sexo"
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
              value={form.sexo}
              onChange={(e) => setField("sexo", e.target.value as Aluno["sexo"] | "")}
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
            <MaskedInput id="edit-cep" mask="cep" value={form.enderecoCep} onChange={(v) => setField("enderecoCep", v)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-logradouro" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Logradouro</label>
            <Input id="edit-logradouro" value={form.enderecoLogradouro} onChange={(e) => setField("enderecoLogradouro", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-numero" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Número</label>
            <Input id="edit-numero" value={form.enderecoNumero} onChange={(e) => setField("enderecoNumero", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-complemento" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Complemento</label>
            <Input id="edit-complemento" value={form.enderecoComplemento} onChange={(e) => setField("enderecoComplemento", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-bairro" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bairro</label>
            <Input id="edit-bairro" value={form.enderecoBairro} onChange={(e) => setField("enderecoBairro", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-cidade" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cidade</label>
            <Input id="edit-cidade" value={form.enderecoCidade} onChange={(e) => setField("enderecoCidade", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-estado" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</label>
            <Input id="edit-estado" value={form.enderecoEstado} onChange={(e) => setField("enderecoEstado", e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Contato de emergência</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="edit-emergencia-nome" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
            <Input id="edit-emergencia-nome" value={form.emergenciaNome} onChange={(e) => setField("emergenciaNome", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-emergencia-telefone" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
            <PhoneInput id="edit-emergencia-telefone" value={form.emergenciaTelefone} onChange={(v) => setField("emergenciaTelefone", v)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-emergencia-parentesco" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parentesco</label>
            <Input id="edit-emergencia-parentesco" value={form.emergenciaParentesco} onChange={(e) => setField("emergenciaParentesco", e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" className="border-border" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
      {error ? <p role="alert" aria-live="assertive" className="text-sm text-gym-danger">{error}</p> : null}
    </div>
  );
}
