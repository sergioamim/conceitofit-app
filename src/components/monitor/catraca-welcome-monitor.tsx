"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CakeSlice, Clock3, ShieldCheck, Sparkles, WifiOff } from "lucide-react";
import { listarAcessosCatracaDashboardApi, type CatracaAcesso } from "@/lib/api/catraca";
import { getAlunoApi } from "@/lib/api/alunos";
import { listUnidadesApi } from "@/lib/api/contexto-unidades";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";
import { formatDateBR, formatDateTime } from "@/lib/formatters";
import { ClienteThumbnail } from "@/components/shared/cliente-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const POLL_INTERVAL_MS = 2500;
const SHOW_EVENT_MS = 8500;
const SHOW_BIRTHDAY_EVENT_MS = 12000;
const INITIAL_RECENT_WINDOW_MS = 30000;
const MAX_QUEUE = 30;
const MAX_SEEN = 5000;

type MonitorConnection = "connecting" | "online" | "offline";

type AlunoExtra = {
  nome?: string;
  foto?: string;
  dataNascimento?: string;
  dataVencimentoPlano?: string;
};

type WelcomeEvent = {
  id: string;
  nome: string;
  foto?: string;
  memberId?: string;
  planoVenceEm?: string;
  aniversarioHoje: boolean;
  acessoEmLabel: string;
  gateLabel: string;
};

function toRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function toStringByKeys(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function toStringByKeysInRecord(input: unknown, keys: string[]): string | undefined {
  const record = toRecord(input);
  if (!record) return undefined;
  return toStringByKeys(record, keys);
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsedOnlyDate = new Date(`${trimmed}T12:00:00`);
    return Number.isNaN(parsedOnlyDate.getTime()) ? null : parsedOnlyDate;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    const parsedBrDate = new Date(`${year}-${month}-${day}T12:00:00`);
    return Number.isNaN(parsedBrDate.getTime()) ? null : parsedBrDate;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTimeMonitor(value?: string): string {
  if (!value) return "agora";
  const parsed = parseDate(value);
  if (!parsed) return "agora";
  return formatDateTime(parsed.toISOString());
}


function isLiberadoStatus(status?: string): boolean {
  const normalized = status?.trim().toUpperCase() ?? "";
  if (!normalized) return false;
  if (/(BLOQUEADO|NEGADO|DENIED|RECUSADO|ERRO|FAIL)/.test(normalized)) return false;
  return /(LIBERADO|PERMITIDO|ALLOW|ALLOWED|SUCESSO|SUCCESS|OK)/.test(normalized);
}

function extractOccurredAt(input: CatracaAcesso): string | undefined {
  return input.occurredAt ?? input.createdAt;
}

function toTimestamp(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isBirthday(dataNascimento?: string): boolean {
  const parsed = parseDate(dataNascimento);
  if (!parsed) return false;
  const now = new Date();
  return parsed.getDate() === now.getDate() && parsed.getMonth() === now.getMonth();
}

function formatPlanExpiryLabel(value?: string): string {
  if (!value) return "Vencimento do plano nao informado";
  const parsed = parseDate(value);
  if (!parsed) return `Plano vence em ${value}`;

  const today = new Date();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diffDays = Math.round((target.getTime() - current.getTime()) / 86400000);

  if (diffDays < 0) return `Plano vencido desde ${formatDateBR(target)}`;
  if (diffDays === 0) return "Plano vence hoje";
  if (diffDays === 1) return `Plano vence amanha (${formatDateBR(target)})`;
  return `Plano vence em ${diffDays} dias (${formatDateBR(target)})`;
}

function resolvePlanExpiryFromAcesso(acesso: CatracaAcesso): string | undefined {
  const metadata = toRecord(acesso.raw?.metadata);
  return (
    toStringByKeys(acesso.raw, [
      "planExpiresAt",
      "planExpiryDate",
      "dataVencimentoPlano",
      "vencimentoPlano",
      "membershipEndDate",
      "contractEndDate",
      "contratoVencimento",
      "expiryDate",
    ]) ??
    toStringByKeysInRecord(metadata, [
      "planExpiresAt",
      "planExpiryDate",
      "dataVencimentoPlano",
      "vencimentoPlano",
      "membershipEndDate",
      "contractEndDate",
      "contratoVencimento",
      "expiryDate",
    ])
  );
}

function resolveBirthDateFromAcesso(acesso: CatracaAcesso): string | undefined {
  const metadata = toRecord(acesso.raw?.metadata);
  return (
    toStringByKeys(acesso.raw, ["dataNascimento", "birthDate", "birthday", "dtNascimento"]) ??
    toStringByKeysInRecord(metadata, ["dataNascimento", "birthDate", "birthday", "dtNascimento"])
  );
}

function resolveGate(acesso: CatracaAcesso): string {
  const metadata = toRecord(acesso.raw?.metadata);
  const gate =
    acesso.gate ??
    toStringByKeys(acesso.raw, ["gateName", "catraca", "deviceName", "equipamento"]) ??
    toStringByKeysInRecord(metadata, ["gateName", "catraca", "deviceName", "equipamento"]);
  return gate || "Catraca principal";
}

function resolveNome(acesso: CatracaAcesso): string | undefined {
  const metadata = toRecord(acesso.raw?.metadata);
  return (
    acesso.memberNome ??
    toStringByKeys(acesso.raw, ["memberName", "alunoNome", "clienteNome", "nome"]) ??
    toStringByKeysInRecord(metadata, ["memberName", "alunoNome", "clienteNome", "nome"])
  );
}

function resolveFoto(acesso: CatracaAcesso): string | undefined {
  const metadata = toRecord(acesso.raw?.metadata);
  return (
    acesso.memberFoto ??
    toStringByKeys(acesso.raw, ["memberFoto", "memberPhoto", "fotoUrl", "avatarUrl", "photoUrl", "foto"]) ??
    toStringByKeysInRecord(metadata, ["memberFoto", "memberPhoto", "fotoUrl", "avatarUrl", "photoUrl", "foto"])
  );
}

async function loadAlunoExtra(input: { tenantId: string; memberId: string }): Promise<AlunoExtra | null> {
  if (!input.memberId.trim()) return null;
  const aluno = await getAlunoApi({
    tenantId: input.tenantId,
    id: input.memberId,
  });

  return {
    nome: aluno.nome,
    foto: aluno.foto,
    dataNascimento: aluno.dataNascimento,
  };
}

async function buildEventFromAcesso(input: {
  acesso: CatracaAcesso;
  tenantId: string;
  alunoCache: Map<string, AlunoExtra | null>;
  alunoInFlight: Map<string, Promise<AlunoExtra | null>>;
}): Promise<WelcomeEvent> {
  const { acesso, tenantId, alunoCache, alunoInFlight } = input;
  const memberId = acesso.memberId?.trim() || undefined;
  const basePlanExpiry = resolvePlanExpiryFromAcesso(acesso);
  const baseBirthDate = resolveBirthDateFromAcesso(acesso);
  let nome = resolveNome(acesso);
  let foto = resolveFoto(acesso);
  let dataNascimento = baseBirthDate;
  let planoVencimento = basePlanExpiry;

  if (memberId) {
    const cached = alunoCache.get(memberId);
    if (cached) {
      nome = nome ?? cached.nome;
      foto = foto ?? cached.foto;
      dataNascimento = dataNascimento ?? cached.dataNascimento;
      planoVencimento = planoVencimento ?? cached.dataVencimentoPlano;
    } else {
      let inFlight = alunoInFlight.get(memberId);
      if (!inFlight) {
        inFlight = loadAlunoExtra({ tenantId, memberId })
          .then((result) => {
            alunoCache.set(memberId, result);
            return result;
          })
          .catch(() => {
            alunoCache.set(memberId, null);
            return null;
          })
          .finally(() => {
            alunoInFlight.delete(memberId);
          });
        alunoInFlight.set(memberId, inFlight);
      }
      const loaded = await inFlight;
      if (loaded) {
        nome = nome ?? loaded.nome;
        foto = foto ?? loaded.foto;
        dataNascimento = dataNascimento ?? loaded.dataNascimento;
        planoVencimento = planoVencimento ?? loaded.dataVencimentoPlano;
      }
    }
  }

  const occurredAt = extractOccurredAt(acesso);
  return {
    id: acesso.id,
    nome: nome || "Cliente",
    foto,
    memberId,
    planoVenceEm: formatPlanExpiryLabel(planoVencimento),
    aniversarioHoje: isBirthday(dataNascimento),
    acessoEmLabel: formatDateTimeMonitor(occurredAt),
    gateLabel: resolveGate(acesso),
  };
}

export function CatracaWelcomeMonitor({ tenantId }: { tenantId: string }) {
  const [tenantLabel, setTenantLabel] = useState(tenantId);

  const [connection, setConnection] = useState<MonitorConnection>("connecting");
  const [error, setError] = useState("");
  const [lastPollAt, setLastPollAt] = useState<string>("");
  const [queueSize, setQueueSize] = useState(0);
  const [activeEvent, setActiveEvent] = useState<WelcomeEvent | null>(null);

  const queueRef = useRef<WelcomeEvent[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const seenOrderRef = useRef<string[]>([]);
  const initialSyncRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const timerRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);
  const alunoCacheRef = useRef<Map<string, AlunoExtra | null>>(new Map());
  const alunoInFlightRef = useRef<Map<string, Promise<AlunoExtra | null>>>(new Map());

  useEffect(() => {
    let active = true;
    setTenantLabel(tenantId);
    async function resolveTenantLabel() {
      try {
        const unidades = await listUnidadesApi();
        const match = unidades.find((item) => item.id === tenantId);
        if (active && match?.nome) {
          setTenantLabel(match.nome);
        }
      } catch {
        if (active) {
          setTenantLabel(tenantId);
        }
      }
    }
    void resolveTenantLabel();
    return () => {
      active = false;
    };
  }, [tenantId]);

  const markAsSeen = useCallback((id: string) => {
    if (!id.trim() || seenIdsRef.current.has(id)) return;
    seenIdsRef.current.add(id);
    seenOrderRef.current.push(id);
    if (seenOrderRef.current.length <= MAX_SEEN) return;
    const removable = seenOrderRef.current.splice(0, seenOrderRef.current.length - MAX_SEEN);
    for (const staleId of removable) {
      seenIdsRef.current.delete(staleId);
    }
  }, []);

  const enqueue = useCallback((event: WelcomeEvent) => {
    queueRef.current.push(event);
    if (queueRef.current.length > MAX_QUEUE) {
      queueRef.current.splice(0, queueRef.current.length - MAX_QUEUE);
    }
    setQueueSize(queueRef.current.length);
  }, []);

  const consumeQueueIfIdle = useCallback(() => {
    setActiveEvent((current) => {
      if (current) return current;
      const next = queueRef.current.shift() ?? null;
      setQueueSize(queueRef.current.length);
      return next;
    });
  }, []);

  const poll = useCallback(async () => {
    if (pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await listarAcessosCatracaDashboardApi({
        tenantId,
        page: 0,
        size: 40,
        startDate: today,
        endDate: today,
      });

      const sortedItems = [...response.items].sort(
        (first, second) =>
          toTimestamp(extractOccurredAt(first)) - toTimestamp(extractOccurredAt(second))
      );

      if (!initialSyncRef.current) {
        initialSyncRef.current = true;
        const now = Date.now();
        const recentLiberados = sortedItems.filter((item) => {
          markAsSeen(item.id);
          if (!isLiberadoStatus(item.status)) return false;
          const occurredAt = toTimestamp(extractOccurredAt(item));
          return occurredAt > 0 && now - occurredAt <= INITIAL_RECENT_WINDOW_MS;
        });
        if (recentLiberados.length > 0) {
          const initialEvents = await Promise.all(
            recentLiberados.map((item) =>
              buildEventFromAcesso({
                acesso: item,
                tenantId,
                alunoCache: alunoCacheRef.current,
                alunoInFlight: alunoInFlightRef.current,
              }).catch(() => null)
            )
          );
          for (const event of initialEvents) {
            if (!event) continue;
            enqueue(event);
          }
        }
      } else {
        const freshLiberados = sortedItems.filter((item) => {
          if (!isLiberadoStatus(item.status)) return false;
          if (seenIdsRef.current.has(item.id)) return false;
          return true;
        });
        if (freshLiberados.length > 0) {
          const newEvents = await Promise.all(
            freshLiberados.map((item) =>
              buildEventFromAcesso({
                acesso: item,
                tenantId,
                alunoCache: alunoCacheRef.current,
                alunoInFlight: alunoInFlightRef.current,
              }).catch(() => null)
            )
          );
          for (const event of newEvents) {
            if (!event) continue;
            markAsSeen(event.id);
            enqueue(event);
          }
        }
      }

      setConnection("online");
      setError("");
      const nowLabel = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setLastPollAt(nowLabel);
      consumeQueueIfIdle();
    } catch (pollError) {
      setConnection("offline");
      setError(normalizeErrorMessage(pollError));
    } finally {
      pollInFlightRef.current = false;
    }
  }, [consumeQueueIfIdle, enqueue, markAsSeen, tenantId]);

  useEffect(() => {
    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
    };
  }, [poll]);

  useEffect(() => {
    if (activeEvent) return;
    consumeQueueIfIdle();
  }, [activeEvent, consumeQueueIfIdle]);

  useEffect(() => {
    if (!activeEvent) return;
    const ttl = activeEvent.aniversarioHoje ? SHOW_BIRTHDAY_EVENT_MS : SHOW_EVENT_MS;
    timerRef.current = window.setTimeout(() => {
      setActiveEvent(null);
    }, ttl);
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeEvent]);

  const showBirthdayTheme = Boolean(activeEvent?.aniversarioHoje);

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden px-4 py-4 md:px-8 md:py-6",
        showBirthdayTheme
          ? "bg-gradient-to-br from-[#2b2415] via-[#121419] to-[#123628]"
          : "bg-gradient-to-br from-[#0f1218] via-[#0e0f11] to-[#102a24]"
      )}
    >
      <div className="pointer-events-none absolute -left-36 top-6 h-72 w-72 rounded-full bg-gym-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-2 h-96 w-96 rounded-full bg-gym-teal/10 blur-3xl" />
      {showBirthdayTheme ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gym-warning/10 blur-3xl" />
      ) : null}

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1600px] flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 backdrop-blur md:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Monitor de recepcao
            </p>
            <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">
              Boas-vindas na catraca
            </h1>
            <p className="truncate text-sm text-muted-foreground">Unidade: {tenantLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className={cn(
                "border px-3 py-1 text-xs",
                connection === "online"
                  ? "border-gym-teal/50 bg-gym-teal/15 text-gym-teal"
                  : connection === "offline"
                    ? "border-gym-danger/50 bg-gym-danger/10 text-gym-danger"
                    : "border-border bg-secondary text-muted-foreground"
              )}
            >
              {connection === "online" ? "Conectado" : connection === "offline" ? "Sem conexao" : "Conectando"}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-xs">
              Fila: {queueSize}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs text-muted-foreground">
              Ultima consulta: {lastPollAt || "--:--:--"}
            </Badge>
          </div>
        </header>

        {!activeEvent ? (
          <Card className="flex-1 border-border/70 bg-card/60 backdrop-blur">
            <CardContent className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
              {connection === "offline" ? (
                <WifiOff className="mb-4 size-14 text-gym-danger" />
              ) : (
                <ShieldCheck className="mb-4 size-14 text-gym-teal" />
              )}
              <p className="font-display text-3xl font-bold md:text-4xl">
                Aguardando proximo acesso liberado
              </p>
              <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
                Assim que a catraca confirmar um cliente liberado, esta tela exibe a mensagem de boas-vindas com foto, status de aniversario e vencimento do plano.
              </p>
              {error ? (
                <p className="mt-4 rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-2 text-sm text-gym-danger">
                  {error}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card
            className={cn(
              "flex-1 border-border/70 bg-card/75 backdrop-blur",
              activeEvent.aniversarioHoje ? "border-gym-warning/45" : "border-gym-teal/35"
            )}
          >
            <CardContent className="flex h-full flex-col justify-center px-6 py-7 md:px-10 md:py-10">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="mx-auto flex flex-col items-center gap-3">
                  <ClienteThumbnail
                    nome={activeEvent.nome}
                    foto={activeEvent.foto}
                    size={250}
                    className={cn(
                      "border-4 shadow-2xl",
                      activeEvent.aniversarioHoje ? "border-gym-warning/60" : "border-gym-teal/40"
                    )}
                  />
                  <Badge variant="outline" className="px-4 py-1 text-sm text-muted-foreground">
                    ID: {activeEvent.memberId || "nao informado"}
                  </Badge>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-gym-accent text-[#111318] px-3 py-1 text-sm font-semibold">
                      Acesso liberado
                    </Badge>
                    {activeEvent.aniversarioHoje ? (
                      <Badge className="bg-gym-warning text-[#151515] px-3 py-1 text-sm font-semibold">
                        <CakeSlice className="size-3.5" />
                        Aniversariante do dia
                      </Badge>
                    ) : null}
                  </div>

                  <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl xl:text-6xl">
                    Bem-vindo(a), {activeEvent.nome}!
                  </h2>

                  {activeEvent.aniversarioHoje ? (
                    <div className="mt-4 rounded-2xl border border-gym-warning/35 bg-gym-warning/12 p-4">
                      <p className="flex items-center gap-2 font-display text-2xl font-bold text-gym-warning md:text-3xl">
                        <Sparkles className="size-6" />
                        Feliz aniversario!
                      </p>
                      <p className="mt-1 text-sm text-foreground/85 md:text-base">
                        Toda a equipe da academia deseja um excelente novo ciclo para voce.
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 md:text-base">
                    <div className="rounded-xl border border-border/80 bg-secondary/35 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Vencimento do plano</p>
                      <p className="mt-1 font-semibold text-foreground">{activeEvent.planoVenceEm}</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-secondary/35 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Horario do acesso</p>
                      <p className="mt-1 font-semibold text-foreground">{activeEvent.acessoEmLabel}</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-secondary/35 p-3 md:col-span-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Catraca</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-foreground">
                        <Clock3 className="size-4 text-gym-teal" />
                        {activeEvent.gateLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
