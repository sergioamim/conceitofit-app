import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Smartphone,
  Star,
  Users,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Conceito Fit - Sistema de Gestao para Academias",
  description:
    "Plataforma completa para gestao de academias: financeiro, matrículas, CRM, treinos, controle de acesso e muito mais. Agende uma demonstracao.",
  openGraph: {
    title: "Conceito Fit - Sistema de Gestao para Academias",
    description:
      "Plataforma completa para gestao de academias. Financeiro, CRM, treinos, controle de acesso e mais.",
    type: "website",
    locale: "pt_BR",
    siteName: "Conceito Fit",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conceito Fit - Sistema de Gestao para Academias",
    description:
      "Plataforma completa para gestao de academias. Agende uma demonstracao.",
  },
};

// ---------------------------------------------------------------------------
// Data (static – zero JS shipped to client)
// ---------------------------------------------------------------------------

const PAIN_POINTS = [
  {
    icon: CreditCard,
    title: "Inadimplencia fora de controle",
    description:
      "Cobranças manuais, planilhas desatualizadas e falta de visibilidade sobre quem pagou e quem nao pagou.",
  },
  {
    icon: Users,
    title: "Perda de alunos sem entender por que",
    description:
      "Sem CRM, sem follow-up. Prospects esfriam e alunos cancelam sem que ninguem perceba a tempo.",
  },
  {
    icon: BarChart3,
    title: "Decisoes no escuro",
    description:
      "Sem dashboards, sem indicadores. Voce sabe que algo esta errado mas nao consegue medir o que.",
  },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Dashboard em tempo real",
    description:
      "KPIs, receita, inadimplencia, churn e crescimento num unico painel. Visao por unidade ou rede.",
  },
  {
    icon: CreditCard,
    title: "Financeiro completo",
    description:
      "Cobranças recorrentes, conciliacao bancaria, DRE, contas a pagar e receber. Tudo integrado.",
  },
  {
    icon: MessageSquare,
    title: "CRM e funil de vendas",
    description:
      "Kanban de prospects, tarefas comerciais, playbooks de cadencia e campanhas automatizadas.",
  },
  {
    icon: Dumbbell,
    title: "Treinos personalizados",
    description:
      "Biblioteca de exercícios, montagem de fichas, atribuicao individual ou em lote para alunos.",
  },
  {
    icon: CalendarCheck,
    title: "Grade de aulas e reservas",
    description:
      "Grade semanal configuravel, reservas online, check-in e controle de lotacao por aula.",
  },
  {
    icon: Shield,
    title: "Controle de acesso (catraca)",
    description:
      "Integracao com catracas, reconhecimento facial, log de acessos e bloqueio automatico.",
  },
  {
    icon: Smartphone,
    title: "Site da academia (white-label)",
    description:
      "Pagina publica com sua marca, planos, unidades e jornada de adesao online integrada.",
  },
  {
    icon: Zap,
    title: "Multi-unidade e rede",
    description:
      "Gerencie varias unidades de um unico lugar. BI consolidado, permissoes por unidade, tema por academia.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ricardo M.",
    role: "Dono - Academia Power Gym",
    quote:
      "Reduzi a inadimplencia em 40% nos primeiros 3 meses. O dashboard me mostra exatamente onde agir.",
    stars: 5,
  },
  {
    name: "Fernanda L.",
    role: "Gestora - Studio Forma & Saude",
    quote:
      "O CRM mudou nosso jogo. Antes perdiamos prospects por falta de follow-up, agora convertemos muito mais.",
    stars: 5,
  },
  {
    name: "Carlos A.",
    role: "Diretor - Rede FitLife (4 unidades)",
    quote:
      "Gerenciar 4 unidades ficou simples. Vejo tudo consolidado e cada gerente tem acesso so ao que precisa.",
    stars: 5,
  },
];

const FAQ_ITEMS = [
  {
    q: "Preciso instalar alguma coisa?",
    a: "Nao. O Conceito Fit e 100% web, funciona no navegador do computador ou celular. Nao precisa de app nem instalacao.",
  },
  {
    q: "Consigo migrar os dados do meu sistema atual?",
    a: "Sim. Temos ferramenta de importacao para os principais sistemas do mercado (EVO, etc.). Nossa equipe ajuda na migracao.",
  },
  {
    q: "Funciona para academia pequena?",
    a: "Sim. O sistema se adapta desde studios com 50 alunos ate redes com milhares. Voce usa so o que precisa.",
  },
  {
    q: "Como funciona o controle de acesso?",
    a: "Integramos com catracas e terminais. O aluno passa e o sistema registra automaticamente. Funciona com biometria ou reconhecimento facial.",
  },
  {
    q: "Tem contrato de fidelidade?",
    a: "Nao. Planos mensais sem multa por cancelamento. Acreditamos que voce fica porque gosta, nao porque esta preso.",
  },
  {
    q: "E seguro? Meus dados estao protegidos?",
    a: "Sim. Infraestrutura em nuvem (Google Cloud), criptografia em transito e em repouso, conformidade LGPD e audit log completo.",
  },
];

// ---------------------------------------------------------------------------
// Page (100% Server Component)
// ---------------------------------------------------------------------------

export default function B2BLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
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
          {/* Mobile CTA */}
          <a
            href="#contato"
            className="inline-flex h-9 items-center rounded-lg bg-gym-accent px-4 text-sm font-semibold text-background md:hidden"
          >
            Agendar demo
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,var(--gym-accent)/0.12,transparent)]" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="mb-4 inline-block rounded-full border border-gym-accent/30 bg-gym-accent/10 px-4 py-1 text-xs font-medium tracking-wide text-gym-accent">
            Plataforma completa para academias
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Gestao de academia{" "}
            <span className="text-gym-accent">sem complicacao</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Financeiro, CRM, treinos, controle de acesso, grade de aulas e site
            da sua academia — tudo num unico sistema. Para quem quer crescer com
            dados, nao com planilhas.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#contato"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gym-accent px-8 text-base font-bold text-background transition-opacity hover:opacity-90"
            >
              Agendar uma demonstracao
              <ChevronRight className="h-4 w-4" />
            </a>
            <Link
              href="/b2b/demo"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-8 text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Experimentar gratis
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sem cartao de credito. Sem contrato. Comece em 2 minutos.
          </p>
        </div>
      </section>

      {/* ── Dores ── */}
      <section className="border-t border-border/40 bg-secondary/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Voce se identifica?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Problemas que donos de academia enfrentam todos os dias — e que a
              gente resolve.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {PAIN_POINTS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/60 bg-card p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gym-danger/10">
                  <item.icon className="h-5 w-5 text-gym-danger" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section id="funcionalidades" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Tudo que sua academia precisa
            </h2>
            <p className="mt-3 text-muted-foreground">
              Uma plataforma, zero gambiarras. Do financeiro ao treino.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-gym-accent/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gym-accent/10 transition-colors group-hover:bg-gym-accent/20">
                  <item.icon className="h-5 w-5 text-gym-accent" />
                </div>
                <h3 className="mb-2 font-display text-base font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof / Depoimentos ── */}
      <section
        id="depoimentos"
        className="border-t border-border/40 bg-secondary/30 py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Quem usa, recomenda
            </h2>
            <p className="mt-3 text-muted-foreground">
              Donos e gestores que transformaram a operacao com o Conceito Fit.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border/60 bg-card p-6"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-gym-accent text-gym-accent"
                    />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            Perguntas frequentes
          </h2>
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

      {/* ── CTA / Contato ── */}
      <section
        id="contato"
        className="border-t border-border/40 bg-secondary/30 py-20"
      >
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Pronto para transformar sua academia?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Agende uma demonstracao gratuita com nosso time. Sem compromisso, sem
            pressao.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#contato-form"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gym-accent px-8 text-base font-bold text-background transition-opacity hover:opacity-90"
            >
              Agendar uma demonstracao
              <ChevronRight className="h-4 w-4" />
            </a>
            <Link
              href="/b2b/demo"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-8 text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Experimentar gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gym-accent">
                <Dumbbell className="h-3 w-3 text-background" />
              </div>
              <span className="font-display font-semibold text-foreground">
                conceito.fit
              </span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="transition-colors hover:text-foreground">
                Termos de uso
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Politica de privacidade
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                LGPD
              </a>
            </div>
            <p>&copy; {new Date().getFullYear()} Conceito Fit. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
