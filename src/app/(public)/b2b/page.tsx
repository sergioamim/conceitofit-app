import type { Metadata } from "next";
import Link from "next/link";
import { LeadB2bForm } from "./lead-form";
import { MobileNav } from "./mobile-nav";
import { AnimateOnScroll } from "./animate-on-scroll";
import { AnimatedCounter } from "./animated-counter";
import { WhatsAppButton } from "./whatsapp-button";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Shield,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Conceito Fit — Sistema de Gestão para Academias | ERP Completo",
  description:
    "Plataforma completa para gestão de academias: financeiro, matrículas, CRM, treinos, controle de acesso e muito mais. Usado por 500+ academias. Agende uma demonstração.",
  keywords: [
    "sistema academia",
    "gestão academia",
    "software academia",
    "ERP academia",
    "controle financeiro academia",
    "CRM academia",
    "controle acesso academia",
    "matrícula online",
    "sistema para academia",
    "gestão de alunos",
  ],
  openGraph: {
    title: "Conceito Fit — Sistema de Gestão para Academias",
    description:
      "Plataforma completa para gestão de academias. Financeiro, CRM, treinos, controle de acesso e mais. Usado por 500+ academias.",
    type: "website",
    locale: "pt_BR",
    siteName: "Conceito Fit",
    url: "https://conceito.fit/b2b",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conceito Fit — Sistema de Gestão para Academias",
    description:
      "Plataforma completa para gestão de academias. Agende uma demonstração gratuita.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/b2b" },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PAIN_POINTS = [
  {
    icon: CreditCard,
    title: "Inadimplência fora de controle",
    description:
      "Cobranças manuais, planilhas desatualizadas e falta de visibilidade sobre quem pagou e quem não pagou.",
  },
  {
    icon: Users,
    title: "Perda de alunos sem entender por quê",
    description:
      "Sem CRM, sem follow-up. Prospects esfriam e alunos cancelam sem que ninguém perceba a tempo.",
  },
  {
    icon: BarChart3,
    title: "Decisões no escuro",
    description:
      "Sem dashboards, sem indicadores. Você sabe que algo está errado mas não consegue medir o quê.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Crie sua conta",
    description: "Cadastro em 2 minutos. Sem cartão de crédito, sem burocracia.",
  },
  {
    step: "02",
    title: "Configure sua academia",
    description:
      "Importe seus alunos, configure planos, financeiro e controle de acesso.",
  },
  {
    step: "03",
    title: "Gerencie com dados",
    description:
      "Dashboard em tempo real, CRM ativo e cobranças automáticas. Tudo no piloto.",
  },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Dashboard em tempo real",
    description:
      "KPIs, receita, inadimplência, churn e crescimento num único painel. Visão por unidade ou rede.",
  },
  {
    icon: CreditCard,
    title: "Financeiro completo",
    description:
      "Cobranças recorrentes, conciliação bancária, DRE, contas a pagar e receber. Tudo integrado.",
  },
  {
    icon: MessageSquare,
    title: "CRM e funil de vendas",
    description:
      "Kanban de prospects, tarefas comerciais, playbooks de cadência e campanhas automatizadas.",
  },
  {
    icon: Dumbbell,
    title: "Treinos personalizados",
    description:
      "Biblioteca de exercícios, montagem de fichas, atribuição individual ou em lote para alunos.",
  },
  {
    icon: CalendarCheck,
    title: "Grade de aulas e reservas",
    description:
      "Grade semanal configurável, reservas online, check-in e controle de lotação por aula.",
  },
  {
    icon: Shield,
    title: "Controle de acesso (catraca)",
    description:
      "Integração com catracas, reconhecimento facial, log de acessos e bloqueio automático.",
  },
  {
    icon: Smartphone,
    title: "App do aluno (white-label)",
    description:
      "Página pública com sua marca, planos, unidades e jornada de adesão online integrada.",
  },
  {
    icon: Zap,
    title: "Multi-unidade e rede",
    description:
      "Gerencie várias unidades de um único lugar. BI consolidado, permissões por unidade, tema por academia.",
  },
];

const PERSONAS = [
  {
    icon: Dumbbell,
    title: "Studios e boxes",
    subtitle: "Até 150 alunos",
    items: [
      "Grade de aulas e reservas",
      "Cobranças recorrentes",
      "Check-in do aluno",
      "Ficha de treino",
    ],
  },
  {
    icon: Users,
    title: "Academias tradicionais",
    subtitle: "150 a 1.000 alunos",
    items: [
      "CRM e funil de vendas",
      "Controle de acesso (catraca)",
      "Financeiro completo com DRE",
      "Dashboard de indicadores",
    ],
  },
  {
    icon: Globe,
    title: "Redes e franquias",
    subtitle: "Múltiplas unidades",
    items: [
      "BI consolidado multi-unidade",
      "Permissões por unidade",
      "Tema e marca por filial",
      "Relatórios comparativos",
    ],
  },
];

const COMPARISON = [
  { label: "Controle financeiro", before: "Planilha / caderno", after: "Automatizado com DRE" },
  { label: "Cobranças", before: "Boletos manuais", after: "Recorrência automática" },
  { label: "CRM / Follow-up", before: "Nenhum", after: "Kanban + cadência" },
  { label: "Indicadores", before: "Sensação / achismo", after: "Dashboard em tempo real" },
  { label: "Controle de acesso", before: "Caderno na portaria", after: "Catraca + biometria" },
  { label: "Treinos", before: "Ficha de papel", after: "Digital, individual, em lote" },
];

const TESTIMONIALS = [
  {
    name: "Ricardo M.",
    role: "Dono — Academia Power Gym",
    quote:
      "Reduzi a inadimplência em 40% nos primeiros 3 meses. O dashboard me mostra exatamente onde agir.",
    stars: 5,
    initials: "RM",
  },
  {
    name: "Fernanda L.",
    role: "Gestora — Studio Forma & Saúde",
    quote:
      "O CRM mudou nosso jogo. Antes perdíamos prospects por falta de follow-up, agora convertemos muito mais.",
    stars: 5,
    initials: "FL",
  },
  {
    name: "Carlos A.",
    role: "Diretor — Rede FitLife (4 unidades)",
    quote:
      "Gerenciar 4 unidades ficou simples. Vejo tudo consolidado e cada gerente tem acesso só ao que precisa.",
    stars: 5,
    initials: "CA",
  },
];

const PLANS = [
  {
    name: "Starter",
    description: "Para studios e academias pequenas",
    price: "197",
    highlight: false,
    features: [
      "Até 150 alunos",
      "Financeiro básico",
      "Grade de aulas",
      "Ficha de treino",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Profissional",
    description: "Para academias em crescimento",
    price: "397",
    highlight: true,
    features: [
      "Até 800 alunos",
      "Financeiro completo + DRE",
      "CRM e funil de vendas",
      "Controle de acesso",
      "App do aluno (white-label)",
      "Suporte prioritário",
    ],
  },
  {
    name: "Rede",
    description: "Para múltiplas unidades",
    price: "697",
    highlight: false,
    features: [
      "Alunos ilimitados",
      "Multi-unidade",
      "BI consolidado",
      "API aberta",
      "Gerente de conta dedicado",
      "Onboarding completo",
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. O Conceito Fit é 100% web, funciona no navegador do computador ou celular. Não precisa de app nem instalação.",
  },
  {
    q: "Consigo migrar os dados do meu sistema atual?",
    a: "Sim. Temos ferramenta de importação para os principais sistemas do mercado (EVO, etc.). Nossa equipe ajuda na migração.",
  },
  {
    q: "Funciona para academia pequena?",
    a: "Sim. O sistema se adapta desde studios com 50 alunos até redes com milhares. Você usa só o que precisa.",
  },
  {
    q: "Como funciona o controle de acesso?",
    a: "Integramos com catracas e terminais. O aluno passa e o sistema registra automaticamente. Funciona com biometria ou reconhecimento facial.",
  },
  {
    q: "Tem contrato de fidelidade?",
    a: "Não. Planos mensais sem multa por cancelamento. Acreditamos que você fica porque gosta, não porque está preso.",
  },
  {
    q: "É seguro? Meus dados estão protegidos?",
    a: "Sim. Infraestrutura em nuvem (Google Cloud), criptografia em trânsito e em repouso, conformidade LGPD e audit log completo.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function B2BLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gym-accent">
              <Dumbbell className="h-4 w-4 text-background" />
            </div>
            <span className="font-display text-lg font-bold">conceito.fit</span>
          </div>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#funcionalidades" className="text-muted-foreground transition-colors hover:text-foreground">
              Funcionalidades
            </a>
            <a href="#precos" className="text-muted-foreground transition-colors hover:text-foreground">
              Preços
            </a>
            <a href="#depoimentos" className="text-muted-foreground transition-colors hover:text-foreground">
              Depoimentos
            </a>
            <a href="#faq" className="text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </a>
            <a
              href="#contato"
              className="inline-flex h-9 items-center rounded-lg bg-gym-accent px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Agendar demo
            </a>
          </nav>

          <MobileNav />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,var(--gym-accent)/0.12,transparent)]" />
        <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-gym-accent/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-10 h-60 w-60 rounded-full bg-gym-teal/5 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left — Copy */}
            <div className="text-center lg:text-left">
              <p className="mb-4 inline-block rounded-full border border-gym-accent/30 bg-gym-accent/10 px-4 py-1 text-xs font-medium tracking-wide text-gym-accent">
                #1 em gestão de academias
              </p>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Sua academia no{" "}
                <span className="text-gym-accent">próximo nível</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl lg:mx-0">
                Financeiro, CRM, treinos, controle de acesso, grade de aulas e
                site da sua academia — tudo num único sistema. Para quem quer
                crescer com dados, não com planilhas.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <a
                  href="#contato"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-gym-accent px-8 text-base font-bold text-background transition-opacity hover:opacity-90"
                >
                  Agendar demonstração
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/b2b/demo"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-8 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Experimentar grátis
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Sem cartão de crédito &middot; Sem contrato &middot; Comece em 2 minutos
              </p>
            </div>

            {/* Right — Dashboard Mockup */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-gym-accent/5">
                {/* Title bar */}
                <div className="flex items-center gap-2 border-b border-border/40 bg-secondary/50 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-gym-danger/60" />
                  <div className="h-3 w-3 rounded-full bg-gym-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-gym-teal/60" />
                  <span className="ml-2 text-xs text-muted-foreground">conceito.fit/dashboard</span>
                </div>
                {/* Mock dashboard content */}
                <div className="p-5">
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <p className="text-xs text-muted-foreground">Alunos ativos</p>
                      <p className="font-display text-xl font-bold text-gym-teal">847</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <p className="text-xs text-muted-foreground">Receita mensal</p>
                      <p className="font-display text-xl font-bold text-gym-accent">R$ 84k</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <p className="text-xs text-muted-foreground">Inadimplência</p>
                      <p className="font-display text-xl font-bold text-gym-danger">3,2%</p>
                    </div>
                  </div>
                  {/* Chart placeholder */}
                  <div className="flex h-32 items-end gap-1.5 rounded-lg bg-secondary/40 p-3">
                    {[40, 55, 45, 65, 50, 75, 60, 80, 70, 90, 85, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gym-accent/70"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Jan</span>
                    <span>Fev</span>
                    <span>Mar</span>
                    <span>Abr</span>
                    <span>Mai</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Ago</span>
                    <span>Set</span>
                    <span>Out</span>
                    <span>Nov</span>
                    <span>Dez</span>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-lg sm:-left-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gym-teal/10">
                    <TrendingUp className="h-4 w-4 text-gym-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Crescimento</p>
                    <p className="font-display text-sm font-bold text-gym-teal">+23% este mês</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos / Social Proof Bar ─────────────────────────────────── */}
      <section className="border-y border-border/40 bg-secondary/20 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium text-muted-foreground">
            Mais de <span className="font-bold text-foreground">500 academias</span> já
            transformaram sua gestão com o Conceito Fit
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-8 opacity-40">
            {["Power Gym", "Studio Forma", "FitLife", "Iron Works", "BodyTech", "CrossBox"].map(
              (name) => (
                <span key={name} className="font-display text-sm font-semibold tracking-wide text-foreground">
                  {name}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── Dores ────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AnimateOnScroll className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Você se identifica?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Problemas que donos de academia enfrentam todos os dias — e que a
              gente resolve.
            </p>
          </AnimateOnScroll>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {PAIN_POINTS.map((item, i) => (
              <AnimateOnScroll key={item.title} delay={i * 120}>
                <div className="h-full rounded-2xl border border-border/60 bg-card p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gym-danger/10">
                    <item.icon className="h-5 w-5 text-gym-danger" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como Funciona ────────────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-secondary/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AnimateOnScroll className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Comece em 3 passos
            </h2>
            <p className="mt-3 text-muted-foreground">
              Do cadastro ao controle total — sem complicação.
            </p>
          </AnimateOnScroll>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <AnimateOnScroll key={item.step} delay={i * 150}>
                <div className="relative text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gym-accent/10">
                    <span className="font-display text-2xl font-bold text-gym-accent">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <ChevronRight className="absolute -right-4 top-8 hidden h-5 w-5 text-muted-foreground/30 sm:block" />
                  )}
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ──────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AnimateOnScroll className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Tudo que sua academia precisa
            </h2>
            <p className="mt-3 text-muted-foreground">
              Uma plataforma, zero gambiarras. Do financeiro ao treino.
            </p>
          </AnimateOnScroll>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((item, i) => (
              <AnimateOnScroll key={item.title} delay={i * 80}>
                <div className="group h-full rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-gym-accent/40">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gym-accent/10 transition-colors group-hover:bg-gym-accent/20">
                    <item.icon className="h-5 w-5 text-gym-accent" />
                  </div>
                  <h3 className="mb-2 font-display text-base font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para Quem É ──────────────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-secondary/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AnimateOnScroll className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Para todo tipo de academia
            </h2>
            <p className="mt-3 text-muted-foreground">
              Do studio de bairro à rede com dezenas de filiais.
            </p>
          </AnimateOnScroll>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {PERSONAS.map((persona, i) => (
              <AnimateOnScroll key={persona.title} delay={i * 120}>
                <div className="h-full rounded-2xl border border-border/60 bg-card p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gym-accent/10">
                    <persona.icon className="h-5 w-5 text-gym-accent" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{persona.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{persona.subtitle}</p>
                  <ul className="space-y-2">
                    {persona.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gym-teal" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Antes vs Depois ──────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <AnimateOnScroll className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Antes vs. Depois
            </h2>
            <p className="mt-3 text-muted-foreground">
              Veja o que muda quando você sai da planilha e entra no Conceito Fit.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={200}>
            <div className="mt-12 overflow-hidden rounded-2xl border border-border/60">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/50">
                    <th className="px-4 py-3 font-display font-semibold sm:px-6">&nbsp;</th>
                    <th className="px-4 py-3 font-display font-semibold text-gym-danger sm:px-6">
                      Sem sistema
                    </th>
                    <th className="px-4 py-3 font-display font-semibold text-gym-teal sm:px-6">
                      Com Conceito Fit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {COMPARISON.map((row) => (
                    <tr key={row.label} className="bg-card">
                      <td className="px-4 py-3 font-medium sm:px-6">{row.label}</td>
                      <td className="px-4 py-3 text-muted-foreground sm:px-6">{row.before}</td>
                      <td className="px-4 py-3 text-gym-teal sm:px-6">{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Métricas de Impacto ──────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-secondary/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 text-center sm:grid-cols-4">
            <div>
              <p className="font-display text-4xl font-bold text-gym-accent">
                <AnimatedCounter target={500} suffix="+" />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Academias ativas</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold text-gym-teal">
                <AnimatedCounter target={120} suffix="k+" />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Alunos gerenciados</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold text-foreground">
                <AnimatedCounter prefix="R$ " target={50} suffix="M+" />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Processados por mês</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold text-gym-accent">
                <AnimatedCounter target={99} suffix=",9%" />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Uptime garantido</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Depoimentos ──────────────────────────────────────────────── */}
      <section id="depoimentos" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AnimateOnScroll className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Quem usa, recomenda
            </h2>
            <p className="mt-3 text-muted-foreground">
              Donos e gestores que transformaram a operação com o Conceito Fit.
            </p>
          </AnimateOnScroll>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <AnimateOnScroll key={t.name} delay={i * 120}>
                <div className="h-full rounded-2xl border border-border/60 bg-card p-6">
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 fill-gym-accent text-gym-accent"
                      />
                    ))}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gym-accent/10 font-display text-sm font-bold text-gym-accent">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ───────────────────────────────────────────────────── */}
      <section id="precos" className="border-t border-border/40 bg-secondary/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AnimateOnScroll className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Planos transparentes
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sem surpresas. Sem taxa de adesão. Cancele quando quiser.
            </p>
          </AnimateOnScroll>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {PLANS.map((plan, i) => (
              <AnimateOnScroll key={plan.name} delay={i * 120}>
                <div
                  className={`relative h-full rounded-2xl border p-6 ${
                    plan.highlight
                      ? "border-gym-accent/60 bg-card shadow-lg shadow-gym-accent/5"
                      : "border-border/60 bg-card"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gym-accent px-4 py-1 text-xs font-bold text-background">
                      Mais popular
                    </div>
                  )}
                  <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gym-teal" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contato"
                    className={`mt-6 flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 ${
                      plan.highlight
                        ? "bg-gym-accent text-background"
                        : "border border-border bg-secondary text-foreground"
                    }`}
                  >
                    Começar agora
                  </a>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <AnimateOnScroll className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Perguntas frequentes
            </h2>
          </AnimateOnScroll>
          <div className="mt-12 divide-y divide-border/60">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / Contato ────────────────────────────────────────────── */}
      <section
        id="contato"
        className="border-t border-border/40 bg-secondary/30 py-20"
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <AnimateOnScroll className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Pronto para transformar sua academia?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Agende uma demonstração gratuita com nosso time. Sem compromisso,
              sem pressão.
            </p>
          </AnimateOnScroll>
          <div id="contato-form">
            <LeadB2bForm />
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/b2b/demo"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Ou experimente grátis com uma conta demo &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-card/50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gym-accent">
                  <Dumbbell className="h-4 w-4 text-background" />
                </div>
                <span className="font-display text-lg font-bold">conceito.fit</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                Plataforma completa para gestão de academias, studios e redes.
                Feita por quem entende o mercado fitness.
              </p>
              {/* Trust badges */}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> LGPD
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> SSL/TLS
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> Google Cloud
                </span>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#funcionalidades" className="transition-colors hover:text-foreground">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#precos" className="transition-colors hover:text-foreground">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#depoimentos" className="transition-colors hover:text-foreground">
                    Depoimentos
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition-colors hover:text-foreground">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/termos" className="transition-colors hover:text-foreground">
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="transition-colors hover:text-foreground">
                    Política de privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/lgpd" className="transition-colors hover:text-foreground">
                    LGPD
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
            <p>&copy; 2025 Conceito Fit. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp Flutuante ───────────────────────────────────────── */}
      <WhatsAppButton />
    </div>
  );
}
