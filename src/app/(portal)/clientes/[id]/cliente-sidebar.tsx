"use client";

import { useState, useEffect } from "react";
import type { Aluno } from "@/lib/types";
import { formatCpf, formatDate } from "@/lib/shared/formatters";
import { Mail, Copy, Check, MessageCircle } from "lucide-react";

interface ClienteSidebarProps {
  aluno: Aluno;
  onEdit: () => void;
  onWhatsApp?: () => void;
}

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function calcAge(dataNascimento: string | null | undefined): number | null {
  if (!dataNascimento) return null;
  const [year, month, day] = dataNascimento.split("-").map(Number);
  if (!year || !month || !day) return null;
  const birth = new Date(year, month - 1, day);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function calcDaysActive(dataCadastro: string): number {
  const cadastro = new Date(dataCadastro);
  const now = new Date();
  return Math.floor((now.getTime() - cadastro.getTime()) / (1000 * 60 * 60 * 24));
}

export function ClienteSidebar({ aluno, onEdit, onWhatsApp }: ClienteSidebarProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [daysActive, setDaysActive] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [obsExpanded, setObsExpanded] = useState(false);

  useEffect(() => {
    setDaysActive(calcDaysActive(aluno.dataCadastro));
    setAge(calcAge(aluno.dataNascimento));
  }, [aluno.dataCadastro, aluno.dataNascimento]);

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // silently fail
    }
  }

  const digits = phoneDigits(aluno.telefone);
  const whatsAppUrl = `https://wa.me/55${digits}`;
  const obs = aluno.observacoesMedicas ?? "";
  const obsLong = obs.length > 120;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Sobre</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-gym-accent hover:underline"
        >
          Editar
        </button>
      </div>

      {/* Data rows */}
      <div className="space-y-3">
        {/* Nome */}
        <Row label="Nome" value={aluno.nome} />

        {/* E-mail */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">E-mail</span>
            <a
              href={`mailto:${aluno.email}`}
              className="block truncate text-sm text-foreground hover:text-gym-accent"
              title={aluno.email}
            >
              {aluno.email}
            </a>
          </div>
          <a
            href={`mailto:${aluno.email}`}
            className="mt-4 shrink-0 text-muted-foreground hover:text-gym-accent"
            aria-label="Enviar e-mail"
          >
            <Mail className="h-4 w-4" />
          </a>
        </div>

        {/* Celular */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">Celular</span>
            <span className="block text-sm text-foreground">{aluno.telefone}</span>
          </div>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (onWhatsApp) {
                e.preventDefault();
                onWhatsApp();
              }
            }}
            className="mt-4 shrink-0 text-muted-foreground hover:text-green-500"
            aria-label="Abrir WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>

        {/* Telefone secundário */}
        {aluno.telefoneSec && (
          <Row label="Telefone sec." value={aluno.telefoneSec} />
        )}

        {/* CPF */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">CPF</span>
            <span className="block text-sm text-foreground">{formatCpf(aluno.cpf)}</span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(aluno.cpf, "cpf")}
            className="mt-4 shrink-0 text-muted-foreground hover:text-gym-accent"
            aria-label="Copiar CPF"
          >
            {copiedField === "cpf" ? (
              <Check className="h-4 w-4 text-gym-accent" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        {copiedField === "cpf" && (
          <span className="block text-xs text-gym-accent">Copiado!</span>
        )}

        {/* Data de nascimento */}
        <Row
          label="Data de nascimento"
          value={
            age !== null
              ? `${formatDate(aluno.dataNascimento)} (${age} anos)`
              : formatDate(aluno.dataNascimento)
          }
        />

        {/* RG */}
        {aluno.rg && <Row label="RG" value={aluno.rg} />}

        {/* Observações */}
        {obs && (
          <div>
            <span className="block text-xs text-muted-foreground">Observações</span>
            <p className="text-sm text-foreground">
              {obsLong && !obsExpanded ? `${obs.slice(0, 120)}...` : obs}
            </p>
            {obsLong && (
              <button
                type="button"
                onClick={() => setObsExpanded((prev) => !prev)}
                className="mt-1 text-xs font-medium text-gym-accent hover:underline"
              >
                {obsExpanded ? "Ver menos" : "Ver mais"}
              </button>
            )}
          </div>
        )}

        {/* Ativo há X dias */}
        {daysActive !== null && aluno.status === "ATIVO" && (
          <div className="mt-2 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              Cliente ativo há{" "}
              <span className="font-medium text-foreground">{daysActive} dias</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className="block text-sm text-foreground">{value}</span>
    </div>
  );
}
