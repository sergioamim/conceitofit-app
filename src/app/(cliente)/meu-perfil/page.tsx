"use client";

import { 
  CircleUser, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  MapPin, 
  ChevronRight,
  Camera,
  CreditCard,
  Bell,
  LogOut
} from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useClienteOperationalContext } from "@/lib/query/use-portal-aluno";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/formatters";

export default function MeuPerfilPage() {
  const { tenantId, userId, displayName, tenantResolved, networkName } = useTenantContext();

  const { data: context, isLoading } = useClienteOperationalContext({
    id: userId,
    tenantId,
    enabled: tenantResolved && !!userId
  });

  const aluno = context?.aluno;

  return (
    <div className="space-y-8 py-6 pb-20">
      {/* Header / Avatar Section */}
      <section className="flex flex-col items-center gap-6">
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="size-32 rounded-full bg-gradient-to-br from-primary to-primary/60 p-1 shadow-2xl shadow-primary/20"
          >
            <div className="size-full rounded-full bg-background flex items-center justify-center overflow-hidden border-4 border-background">
              {aluno?.foto ? (
                <img src={aluno.foto} alt={displayName ?? ""} className="size-full object-cover" />
              ) : (
                <CircleUser className="size-20 text-muted-foreground/40" />
              )}
            </div>
          </motion.div>
          <button className="absolute bottom-0 right-0 size-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
            <Camera size={18} />
          </button>
        </div>

        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{displayName}</h1>
          <p className="text-muted-foreground font-medium flex items-center justify-center gap-2">
            ID #{aluno?.id.slice(0, 8).toUpperCase() || "---"} · {networkName}
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
              <ProfileItem icon={ShieldCheck} label="CPF" value={aluno?.cpf || "---"} />
              <ProfileItem icon={MapPin} label="Endereço" value={aluno?.endereco?.cidade ? `${aluno.endereco.cidade} / ${aluno.endereco.estado}` : "Não informado"} />
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

        {/* Quick Settings */}
        <section className="space-y-3">
          <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Configurações</h3>
          <div className="grid gap-2">
            <SettingButton icon={Bell} label="Notificações" description="Alertas de treino e pagamentos" />
            <SettingButton icon={ShieldCheck} label="Segurança" description="Alterar senha e acessos" />
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

function ProfileItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
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

function SettingButton({ icon: Icon, label, description }: { icon: any, label: string, description: string }) {
  return (
    <button className="flex items-center gap-4 p-4 rounded-3xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-all text-left group">
      <div className="size-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold tracking-tight">{label}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{description}</p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
    </button>
  );
}
