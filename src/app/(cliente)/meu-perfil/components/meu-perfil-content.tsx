"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  Bell,
  ChevronRight,
  CircleUser,
  CreditCard,
  KeyRound,
  Mail,
  MapPin,
  Calendar,
  Phone,
  ShieldCheck,
  UserCog,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AvatarUpload } from "@/components/cliente/avatar-upload";
import { formatDate } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useClienteOperationalContext } from "@/lib/query/use-portal-aluno";

export function MeuPerfilContent() {
  const { tenantId, userId, displayName, tenantResolved, networkName } = useTenantContext();
  const queryClient = useQueryClient();

  const { data: context, isLoading } = useClienteOperationalContext({
    id: userId,
    tenantId,
    enabled: tenantResolved && !!userId,
  });

  const aluno = context?.aluno;
  const documentoPrincipal = aluno?.cpf
    ? { label: "CPF", value: aluno.cpf }
    : aluno?.passaporte
      ? { label: "Passaporte", value: aluno.passaporte }
      : { label: "CPF / Passaporte", value: "---" };
  const responsavelResumo = aluno?.responsavel
    ? [aluno.responsavel.nome, aluno.responsavel.parentesco].filter(Boolean).join(" • ")
    : null;
  const responsavelContato = aluno?.responsavel
    ? aluno.responsavel.cpf || aluno.responsavel.telefone || aluno.responsavel.email || null
    : null;

  const handleAvatarSuccess = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-8 py-6 pb-20 flex items-center justify-center min-h-[300px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="size-32 rounded-full bg-gradient-to-br from-primary to-primary/60 p-1 shadow-2xl shadow-primary/20"
        >
          <div className="size-full rounded-full bg-background flex items-center justify-center overflow-hidden border-4 border-background">
            <CircleUser className="size-20 text-muted-foreground/40" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 pb-20">
      {/* Header / Avatar Section */}
      <section className="flex flex-col items-center gap-6">
        {tenantId && aluno ? (
          <AvatarUpload
            currentPhoto={aluno.foto}
            alunoId={aluno.id}
            tenantId={tenantId}
            displayName={displayName ?? undefined}
            onSuccess={handleAvatarSuccess}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="size-32 rounded-full bg-gradient-to-br from-primary to-primary/60 p-1 shadow-2xl shadow-primary/20"
          >
            <div className="size-full rounded-full bg-background flex items-center justify-center overflow-hidden border-4 border-background">
              <CircleUser className="size-20 text-muted-foreground/40" />
            </div>
          </motion.div>
        )}

        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{displayName}</h1>
          <p className="text-muted-foreground font-medium flex items-center justify-center gap-2">
            ID #{aluno?.id?.slice(0, 8).toUpperCase() || "---"} &middot; {networkName}
          </p>
          <div className="pt-2 flex justify-center">
            <StatusBadge status={aluno?.status || "INATIVO"} />
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="rounded-3xl border border-border/40 glass-card shadow-xl shadow-black/5 overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/40 p-5">
            <CardTitle className="text-base font-display font-bold flex items-center gap-2">
              <CircleUser size={18} className="text-primary" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/10">
              <ProfileItem icon={Mail} label="E-mail" value={aluno?.email || "---"} />
              <ProfileItem icon={Phone} label="Telefone" value={aluno?.telefone || "---"} />
              <ProfileItem icon={Calendar} label="Nascimento" value={aluno?.dataNascimento ? formatDate(aluno.dataNascimento) : "---"} />
              <ProfileItem icon={ShieldCheck} label={documentoPrincipal.label} value={documentoPrincipal.value} />
              {responsavelResumo ? <ProfileItem icon={UserCog} label="Responsável" value={responsavelResumo} /> : null}
              {responsavelContato ? <ProfileItem icon={Phone} label="Contato do Responsável" value={responsavelContato} /> : null}
              <ProfileItem icon={MapPin} label="Endere&ccedil;o" value={aluno?.endereco?.cidade ? `${aluno.endereco.cidade} / ${aluno.endereco.estado}` : "N&atilde;o informado"} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/40 glass-card shadow-xl shadow-black/5 overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/40 p-5">
            <CardTitle className="text-base font-display font-bold flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              Assinatura e Planos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Plano Atual</p>
                <p className="font-bold">{aluno?.estadoAtual?.descricaoContratoAtual || "Sem plano ativo"}</p>
              </div>
              <Button variant="link" className="text-primary font-bold h-auto p-0">Ver Detalhes</Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Vigente desde {aluno?.estadoAtual?.dataInicioContratoAtual ? formatDate(aluno.estadoAtual.dataInicioContratoAtual) : "---"}
            </p>
          </CardContent>
        </Card>

        {/* Configura&ccedil;&otilde;es */}
        <section className="space-y-3">
          <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Configura&ccedil;&otilde;es</h3>
          <div className="grid gap-2">
            <SettingLink href="/meu-perfil/editar" icon={UserCog} label="Editar Perfil" description="Alterar dados pessoais e endere&ccedil;o" />
            <SettingLink href="/meu-perfil/senha" icon={KeyRound} label="Trocar Senha" description="Alterar senha de acesso" />
            <SettingLink href="/meu-perfil/notificacoes" icon={Bell} label="Notifica&ccedil;&otilde;es" description="Alertas de treino e pagamentos" />
          </div>
        </section>
      </div>

      <div className="pt-4">
        <Button variant="ghost" className="w-full h-12 rounded-2xl text-gym-danger hover:bg-gym-danger/5 font-bold gap-2">
          <LogOut size={18} />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="size-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

function SettingLink({ href, icon: Icon, label, description }: { href: string; icon: React.ComponentType<{ size?: number }>; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-3xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-all text-left group"
    >
      <div className="size-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold tracking-tight">{label}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{description}</p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}
