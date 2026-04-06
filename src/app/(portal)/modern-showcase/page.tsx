"use client";

import { useState } from "react";
import { 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Mock Data ---
const MOCK_CLIENTES = [
  { id: "1", nome: "Alexandre Silva", status: "Ativo", plano: "Platinum Plus", ultimaVisita: "Hoje", total: "R$ 450,00", foto: "AS" },
  { id: "2", nome: "Beatriz Oliveira", status: "Pendente", plano: "Mensal Fit", ultimaVisita: "Ontem", total: "R$ 120,00", foto: "BO" },
  { id: "3", nome: "Carlos Eduardo", status: "Atrasado", plano: "Anual Black", ultimaVisita: "3 dias atrás", total: "R$ 1.200,00", foto: "CE" },
  { id: "4", nome: "Daniela Costa", status: "Ativo", plano: "Semestral Gold", ultimaVisita: "Hoje", total: "R$ 850,00", foto: "DC" },
  { id: "5", nome: "Eduardo Santos", status: "Inativo", plano: "Mensal Fit", ultimaVisita: "1 mês atrás", total: "R$ 0,00", foto: "ES" },
];

const STATUS_CONFIG = {
  Ativo: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  Pendente: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  Atrasado: { color: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: AlertCircle },
  Inativo: { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: Clock },
};

// --- Components ---

function MetricCardV2({ label, value, trend, icon: Icon, tone }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon size={20} />
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                <TrendingUp size={12} />
                {trend}
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1 font-display">{value}</h3>
          </div>
        </CardContent>
        <div className={`h-1 w-full bg-primary/20`}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "70%" }}
            className={`h-full bg-primary`}
          />
        </div>
      </Card>
    </motion.div>
  );
}

export default function ModernShowcase() {
  const [activeTab, setActiveTab] = useState("clientes");

  return (
    <div className="py-12 px-8 max-w-6xl mx-auto space-y-12">
      {/* Header section with modern greeting */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Badge variant="outline" className="mb-2 border-primary/30 text-primary bg-primary/5 px-3 py-1">
              Design V2 Preview
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight font-display sm:text-5xl">
              Showcase <span className="text-primary">Moderno</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mt-2">
              Uma proposta visual focada em profundidade, micro-interações e usabilidade premium para o ecossistema Conceito Fit.
            </p>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-3"
        >
          <Button variant="outline" size="lg" className="rounded-xl border-border/60">
            Exportar Relatório
          </Button>
          <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="mr-2 size-5" />
            Nova Ação
          </Button>
        </motion.div>
      </section>

      {/* Metrics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCardV2 label="Total de Clientes" value="1,284" trend="+12.5%" icon={Users} />
        <MetricCardV2 label="Receita Mensal" value="R$ 42.500" trend="+8.2%" icon={CreditCard} />
        <MetricCardV2 label="Novas Matrículas" value="48" trend="+24%" icon={ArrowUpRight} />
        <MetricCardV2 label="Taxa de Retenção" value="94.2%" trend="+1.2%" icon={CheckCircle2} />
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Data Table & Filters */}
        <Card className="lg:col-span-8 border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-display">Gestão de Clientes</CardTitle>
                <CardDescription>Visualize e gerencie sua base de alunos</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." className="pl-9 h-9 w-64 rounded-lg bg-background/50 border-border/60" />
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
                  <Filter size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
                  <TableHead className="py-4 pl-6 text-[11px] font-bold uppercase tracking-wider">Cliente</TableHead>
                  <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider">Plano</TableHead>
                  <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider">Visita</TableHead>
                  <TableHead className="py-4 pr-6 text-[11px] font-bold uppercase tracking-wider text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {MOCK_CLIENTES.map((cliente, i) => (
                    <motion.tr
                      key={cliente.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group border-b border-border/30 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary group-hover:scale-110 transition-transform">
                            {cliente.foto}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{cliente.nome}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">ID #{cliente.id}9283</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="bg-muted/50 text-foreground/80 font-medium">
                          {cliente.plano}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        {(() => {
                          const conf = STATUS_CONFIG[cliente.status as keyof typeof STATUS_CONFIG];
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${conf.color}`}>
                              <conf.icon size={12} />
                              {cliente.status}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">
                        {cliente.ultimaVisita}
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal size={16} />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            <div className="p-4 bg-muted/10 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <p>Mostrando 5 de 1,284 clientes</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled className="h-8 rounded-lg">Anterior</Button>
                <Button variant="outline" size="sm" className="h-8 rounded-lg border-border/60">Próxima</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Quick Stats & Forms */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg font-display">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtro por Unidade</label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full bg-background/50 border-border/60 rounded-xl h-11">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Unidades</SelectItem>
                    <SelectItem value="centro">Unidade Centro</SelectItem>
                    <SelectItem value="norte">Unidade Norte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button variant="secondary" className="w-full justify-start h-12 rounded-xl group">
                  <div className="size-8 rounded-lg bg-background flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Mail size={16} />
                  </div>
                  Enviar E-mail em Massa
                </Button>
                <Button variant="secondary" className="w-full justify-start h-12 rounded-xl group">
                  <div className="size-8 rounded-lg bg-background flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Phone size={16} />
                  </div>
                  Campanha WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Dica de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Identificamos uma queda de <span className="font-bold text-foreground">15%</span> na frequência de alunos do período da manhã. Sugerimos uma campanha de reengajamento focada em treinos rápidos.
              </p>
              <Button variant="link" className="p-0 h-auto mt-3 text-primary text-xs font-bold uppercase tracking-wider">
                Ver Análise Completa
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
