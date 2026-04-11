"use client";

import { Suspense } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Users, 
  CreditCard, 
  TrendingUp,
  Mail,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { NovoClienteWizard } from "@/components/shared/novo-cliente-wizard";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useClientesWorkspace } from "../../clientes/components/use-clientes-workspace";
import { ClientesFilterBar } from "../../clientes/components/clientes-filter-bar";
import { ClienteResumoDialog } from "../../clientes/components/cliente-resumo-dialog";

function MetricCardV2({ label, value, icon: Icon, tone, description }: any) {
  const tones = {
    accent: "text-gym-accent bg-gym-accent/10 border-gym-accent/20",
    teal: "text-gym-teal bg-gym-teal/10 border-gym-teal/20",
    warning: "text-gym-warning bg-gym-warning/10 border-gym-warning/20",
    danger: "text-gym-danger bg-gym-danger/10 border-gym-danger/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1"
    >
      {/* Hover jitter fix: removido whileHover y:-4 — subir o card tirava
          o cursor da área, disparando loop hover↔unhover visível como piscar. */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-md overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-shadow">
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div className={cn("p-2 rounded-lg border", tones[tone as keyof typeof tones] || tones.accent)}>
              <Icon size={18} />
            </div>
            {description && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter border-border/50">
                {description}
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</p>
            <h3 className="text-2xl font-bold tracking-tight mt-1 font-display">{value}</h3>
          </div>
        </CardContent>
        <div className="h-1 w-full bg-muted/20">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "65%" }}
            className={cn("h-full", tone === 'danger' ? 'bg-gym-danger' : tone === 'teal' ? 'bg-gym-teal' : 'bg-primary')} 
          />
        </div>
      </Card>
    </motion.div>
  );
}

function ClientesV2PageContent() {
  const ws = useClientesWorkspace();

  return (
    <div className="space-y-8 pb-10">
      {ws.ConfirmDialog}
      
      {ws.wizard.isOpen ? (
        <NovoClienteWizard
          open
          onClose={ws.wizard.close}
          onDone={async (created, opts) => {
            await ws.load();
            if (!created) return;
            if (opts?.openSale) {
              ws.router.push(`/vendas/nova?clienteId=${encodeURIComponent(created.id)}&prefill=1`);
              return;
            }
            ws.router.push(`/clientes/${encodeURIComponent(created.id)}`);
          }}
        />
      ) : null}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Clientes <span className="text-primary text-lg ml-2 font-medium bg-primary/10 px-3 py-1 rounded-full border border-primary/20">V2</span>
          </h1>
          <p className="mt-2 text-muted-foreground flex items-center gap-2">
            <Users size={14} />
            {ws.statusTotals.TODOS} alunos ativos no sistema
          </p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 border-border/60 hover:bg-muted/50">
            Exportar
          </Button>
          <Button onClick={ws.wizard.open} className="rounded-xl h-11 shadow-lg shadow-primary/20 font-semibold px-6">
            <Plus className="size-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardV2 label="Novos Clientes" value={ws.metrics.novos} icon={UserPlus} tone="accent" description="Este mês" />
        <MetricCardV2 label="Renovados" value={ws.metrics.renovados} icon={TrendingUp} tone="teal" description="Sucesso" />
        <MetricCardV2 label="Pendentes" value={ws.metrics.naoRenovados} icon={CreditCard} tone="warning" description="Atenção" />
        <MetricCardV2 label="Evasão" value={ws.metrics.evadidos} icon={Plus} tone="danger" description="Crítico" />
      </div>

      {/* Main Container */}
      <Card className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/5">
        <div className="p-6 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                value={ws.buscaInput}
                onChange={(e) => ws.setBuscaInput(e.target.value)}
                placeholder="Buscar por nome, CPF ou telefone..." 
                className="pl-9 h-11 rounded-xl bg-background/50 border-border/60 focus:ring-primary/20" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-11 rounded-xl border-border/60">
              <Filter className="size-4 mr-2" />
              Filtros Avançados
            </Button>
            <Select value={ws.sortBy} onValueChange={(v: any) => ws.setSortBy(v)}>
              <SelectTrigger className="h-11 rounded-xl border-border/60 w-44 bg-background/50">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cadastro">Data de Cadastro</SelectItem>
                <SelectItem value="nome">Ordem Alfabética</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Modern Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-muted/40 hover:bg-muted/40">
                <TableHead className="py-4 pl-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Identificação</TableHead>
                <TableHead className="py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Contato</TableHead>
                <TableHead className="py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Estado Atual</TableHead>
                <TableHead className="py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="py-4 pr-6 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ws.loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-8"><div className="h-8 w-full animate-pulse bg-muted rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : ws.filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Users size={48} className="mb-4" />
                      <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                      <p className="text-sm">Tente ajustar seus filtros de busca</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {ws.filtered.map((aluno, i) => (
                    <motion.tr
                      key={aluno.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        ws.setClienteResumo(aluno);
                        ws.resumoDialog.open();
                      }}
                      className="group border-b border-border/20 hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <TableCell className="py-5 pl-6">
                        <div className="flex items-center gap-4">
                          <div className="size-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary group-hover:scale-110 transition-transform">
                            {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-base tracking-tight">{aluno.nome}</p>
                            <p className="text-xs text-muted-foreground font-mono">{aluno.cpf}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-foreground/80">
                            <Phone size={12} className="text-muted-foreground" />
                            {aluno.telefone}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Mail size={12} />
                            {aluno.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{aluno.estadoAtual?.descricaoContratoAtual || "Sem plano ativo"}</p>
                          {aluno.estadoAtual?.dataFimContratoAtual && (
                            <p className="text-[11px] text-muted-foreground">Até {aluno.estadoAtual.dataFimContratoAtual}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <StatusBadge status={aluno.status} />
                      </TableCell>
                      <TableCell className="py-5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" aria-label="Ver detalhes do aluno" className="size-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                            <ArrowRight size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modern Pagination Footer */}
        <div className="p-4 border-t border-border/40 bg-muted/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-medium">
            Exibindo <span className="text-foreground">{ws.filtered.length}</span> de <span className="text-foreground">{ws.totalClientes}</span> clientes registrados
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-9 border-border/60"
              disabled={ws.page === 0}
              onClick={() => ws.setParams({ page: Math.max(0, ws.page - 1) })}
            >
              <ChevronLeft size={16} className="mr-1" />
              Anterior
            </Button>
            <div className="flex items-center gap-1 mx-2">
              <span className="size-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                {ws.page + 1}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-9 border-border/60"
              disabled={!ws.hasNextPage}
              onClick={() => ws.setParams({ page: ws.page + 1 })}
            >
              Próxima
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      <ClienteResumoDialog
        isOpen={ws.resumoDialog.isOpen}
        onOpenChange={ws.resumoDialog.onOpenChange}
        clienteResumo={ws.clienteResumo}
        clienteResumoPlano={ws.clienteResumoPlano}
        clienteResumoBaseHref={ws.clienteResumoBaseHref}
        liberandoSuspensao={ws.liberandoSuspensao}
        onLiberarSuspensao={ws.handleLiberarSuspensao}
        onVerPerfil={ws.handleVerPerfil}
        onClose={ws.resumoDialog.close}
      />
    </div>
  );
}

export function ClientesV2Client() {
  return (
    <Suspense fallback={<TableSkeleton columns={[{ label: "C" }]} rowCount={10} />}>
      <ClientesV2PageContent />
    </Suspense>
  );
}
