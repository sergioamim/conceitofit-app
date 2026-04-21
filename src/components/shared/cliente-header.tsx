"use client";

import Image from "next/image";
import type { Aluno, Plano } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRightLeft,
  Camera,
  CreditCard,
  KeyRound,
  Lock,
  Merge,
  MessageCircle,
  MoreVertical,
  Pencil,
  ScanFace,
  Shield,
  ShieldOff,
  Sparkles,
  Trash2,
  Unlock,
  UserX,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { FotoAvisoBadge } from "@/components/shared/foto-aviso-badge";
import { cn } from "@/lib/utils";
import { getHaloRingClass, type HaloStatus } from "@/lib/domain/status-helpers";

export function ClienteHeader({
  aluno,
  planoAtivo,
  planoAtivoInfo,
  suspenso,
  onCartoes,
  onNovaVenda,
  onSuspender,
  onReativar,
  onLiberarAcesso,
  canDeleteCliente = false,
  onExcluir,
  sticky = true,
  showCartoesAction = true,
  onEdit,
  onChangeFoto,
  onCompletarCadastro,
  onMigrarUnidadeBase,
  onSyncFace,
  onBloquearAcesso,
  onDesbloquearAcesso,
  onMesclar,
  onExcluirDadosPessoais,
  onExcluirDadosSensiveis,
  acessoBloqueado = false,
  haloStatus,
  onAcoesClick,
  acoesCount,
}: {
  aluno: Aluno;
  planoAtivo?: { dataFim: string } | null;
  planoAtivoInfo?: Plano | null;
  suspenso: boolean;
  onCartoes: () => void;
  onNovaVenda: () => void;
  onSuspender: () => void;
  onReativar: () => void;
  onLiberarAcesso?: () => void;
  canDeleteCliente?: boolean;
  onExcluir?: () => void;
  sticky?: boolean;
  showCartoesAction?: boolean;
  onEdit?: () => void;
  onChangeFoto?: () => void;
  onCompletarCadastro?: () => void;
  onMigrarUnidadeBase?: () => void;
  onSyncFace?: () => void;
  onBloquearAcesso?: () => void;
  onDesbloquearAcesso?: () => void;
  onMesclar?: () => void;
  onExcluirDadosPessoais?: () => void;
  onExcluirDadosSensiveis?: () => void;
  acessoBloqueado?: boolean;
  haloStatus?: HaloStatus;
  onAcoesClick?: () => void;
  acoesCount?: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const whatsappUrl = aluno.telefone
    ? `https://wa.me/55${aluno.telefone.replace(/\D/g, "")}`
    : null;

  return (
    <div
      className={[
        "flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4",
        sticky ? "sticky top-4 z-30 backdrop-blur" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        {/* W1.2 — Foto grande (100px) + halo de status (Perfil v3 Wave 1) */}
        <div className="relative">
          <button
            type="button"
            className={cn(
              "relative block size-24 overflow-hidden rounded-full border-2 border-border bg-secondary shadow-inner transition hover:border-gym-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gym-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              haloStatus ? `ring-2 ring-offset-2 ring-offset-card ${getHaloRingClass(haloStatus)}` : ""
            )}
            onClick={onChangeFoto}
            disabled={!onChangeFoto}
            aria-label={onChangeFoto ? `Abrir foto de ${aluno.nome}` : undefined}
          >
            {aluno.foto ? (
              <Image src={aluno.foto} alt={aluno.nome} fill unoptimized className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-muted-foreground">
                Foto
              </div>
            )}
          </button>
          {onChangeFoto && (
            <Button
              variant="default"
              size="icon-sm"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-card bg-gym-accent p-0 text-background shadow-md hover:bg-gym-accent/90"
              onClick={onChangeFoto}
              aria-label="Trocar foto"
            >
              <Camera className="size-3.5" />
            </Button>
          )}
          {!aluno.foto ? (
            <FotoAvisoBadge
              motivo="Cliente sem foto cadastrada — solicite nova foto na recepcao"
              size="md"
              className="absolute -left-1 -top-1 border-2 border-card"
            />
          ) : null}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {aluno.nome}
            </h1>
            {/* Badge de contrato */}
            {planoAtivo ? (
              <Badge variant="secondary" className="bg-gym-teal/15 text-gym-teal border-gym-teal/30 text-[11px]">
                Contrato ativo
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-[11px]">
                Sem contrato
              </Badge>
            )}
          </div>
          {/* ID do cliente */}
          <p className="mt-0.5 text-xs text-muted-foreground font-mono">
            ID: {aluno.id.substring(0, 8)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              Status: <StatusBadge status={aluno.status} />
            </span>
            {planoAtivoInfo && planoAtivo && (
              <span>
                {planoAtivoInfo.nome} — vigente ate {formatDate(planoAtivo.dataFim)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        {/* W2.2 — Ações rápidas: WhatsApp */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-transparent text-emerald-400 transition hover:bg-emerald-500/10 hover:border-emerald-500/40"
            aria-label="Abrir WhatsApp"
          >
            <MessageCircle className="size-4" />
          </a>
        )}
        {/* Perfil v3 Wave 2 — Drawer de próximas ações */}
        {onAcoesClick && (
          <Button
            variant="outline"
            className={cn(
              "h-9 gap-2",
              (acoesCount ?? 0) > 0 ? "border-gym-accent/40 text-gym-accent hover:bg-gym-accent/10" : ""
            )}
            onClick={onAcoesClick}
            aria-label={`Abrir próximas ações${acoesCount ? ` (${acoesCount})` : ""}`}
          >
            <Sparkles className="size-4" />
            Ações
            {typeof acoesCount === "number" && acoesCount > 0 && (
              <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gym-accent px-1.5 py-0.5 text-[10px] font-bold text-background">
                {acoesCount}
              </span>
            )}
          </Button>
        )}
        {onLiberarAcesso && (
          <Button variant="outline" className="h-9 border-amber-500/40 text-amber-300" onClick={onLiberarAcesso}>
            <KeyRound className="mr-2 size-4" />
            Liberar acesso
          </Button>
        )}
        {!planoAtivo && (
          <Button onClick={onNovaVenda} className="h-9">
            Nova contratacao
          </Button>
        )}
        {showCartoesAction && (
          <Button variant="outline" className="h-9" onClick={onCartoes}>
            Cartoes
          </Button>
        )}
        {/* Menu 3 pontinhos — W2.1 expandido */}
        <div className="relative" ref={menuRef}>
          <Button variant="outline" className="h-9 px-2" onClick={() => setMenuOpen((v) => !v)}>
            <MoreVertical className="size-4" />
          </Button>
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-md border border-border bg-card p-1 shadow-lg">
              {/* Perfil v3 Wave 4 (AC4.6): Cartões sai do TabBar e entra aqui */}
              <MenuButton
                icon={CreditCard}
                label="Cartões"
                onClick={() => {
                  setMenuOpen(false);
                  onCartoes();
                }}
              />

              {/* Suspender / Reativar */}
              {suspenso ? (
                <MenuButton icon={Unlock} label="Reativar" onClick={() => { setMenuOpen(false); onReativar(); }} />
              ) : (
                <MenuButton icon={Lock} label="Suspender" onClick={() => { setMenuOpen(false); onSuspender(); }} />
              )}

              {/* Bloquear / Desbloquear acesso */}
              {acessoBloqueado && onDesbloquearAcesso ? (
                <MenuButton icon={ShieldOff} label="Desbloquear acesso" onClick={() => { setMenuOpen(false); onDesbloquearAcesso(); }} />
              ) : onBloquearAcesso ? (
                <MenuButton icon={Shield} label="Bloquear acesso" onClick={() => { setMenuOpen(false); onBloquearAcesso(); }} />
              ) : null}

              {/* Sincronizar face */}
              {onSyncFace ? (
                <MenuButton icon={ScanFace} label="Sincronizar face" onClick={() => { setMenuOpen(false); onSyncFace(); }} />
              ) : null}

              {/* Migrar unidade-base */}
              {onMigrarUnidadeBase ? (
                <MenuButton icon={ArrowRightLeft} label="Migrar unidade-base" onClick={() => { setMenuOpen(false); onMigrarUnidadeBase(); }} />
              ) : null}

              {/* Mesclar com outro cliente */}
              {onMesclar ? (
                <MenuButton icon={Merge} label="Mesclar com outro cliente" onClick={() => { setMenuOpen(false); onMesclar(); }} />
              ) : null}

              {/* Separador */}
              <div className="my-1 h-px bg-border" />

              {/* Excluir cliente */}
              {canDeleteCliente && onExcluir ? (
                <MenuButton icon={Trash2} label="Excluir cliente" danger onClick={() => { setMenuOpen(false); onExcluir(); }} />
              ) : null}

              {/* LGPD */}
              {onExcluirDadosPessoais ? (
                <MenuButton icon={UserX} label="Excluir dados pessoais" danger onClick={() => { setMenuOpen(false); onExcluirDadosPessoais(); }} />
              ) : null}
              {onExcluirDadosSensiveis ? (
                <MenuButton icon={Shield} label="Excluir dados sensiveis" danger onClick={() => { setMenuOpen(false); onExcluirDadosSensiveis(); }} />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
        danger
          ? "text-gym-danger hover:bg-gym-danger/10"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
