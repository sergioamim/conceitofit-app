"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Activity,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Ruler,
  Scale,
  TrendingUp,
  Upload,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useClienteOperationalContext } from "@/lib/query/use-portal-aluno";
import {
  useAvaliacoesAluno,
  type AvaliacaoFisica,
} from "@/lib/query/use-avaliacoes-aluno";
import { formatDateBR } from "@/lib/formatters";
import {
  uploadAvaliacaoFotoApi,
  type AvaliacaoFoto,
} from "@/lib/api/app-cliente";

export default function MinhasAvaliacoesPage() {
  const { tenantId, userId, tenantResolved } = useTenantContext();

  const { data: context } = useClienteOperationalContext({
    id: userId,
    tenantId,
    enabled: tenantResolved && !!userId,
  });

  const alunoId = context?.aluno?.id;

  const { data: avaliacoes = [], isLoading } = useAvaliacoesAluno({
    tenantId,
    alunoId,
    enabled: !!alunoId,
  });

  // Sort by date DESC
  const sorted = useMemo(
    () => [...avaliacoes].sort((a, b) => b.data.localeCompare(a.data)),
    [avaliacoes],
  );

  // Evolution chart data (last 10)
  const chartData = useMemo(() => {
    const recent = [...avaliacoes]
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(-10);
    return recent;
  }, [avaliacoes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 pb-20">
      <div>
        <h1 className="font-display text-2xl font-bold">Minhas Avaliações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe sua evolução física ao longo do tempo.
        </p>
      </div>

      {/* Mini evolution chart */}
      {chartData.length >= 2 && (
        <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Evolução</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat
              label="Peso"
              current={chartData[chartData.length - 1].peso}
              previous={chartData[chartData.length - 2].peso}
              unit="kg"
            />
            <MiniStat
              label="% Gordura"
              current={chartData[chartData.length - 1].percentualGordura}
              previous={chartData[chartData.length - 2].percentualGordura}
              unit="%"
            />
            <MiniStat
              label="IMC"
              current={chartData[chartData.length - 1].imc}
              previous={chartData[chartData.length - 2].imc}
              unit=""
            />
          </div>

          {/* Simple bar chart for weight evolution */}
          <div className="flex items-end gap-1 h-16 mt-2">
            {chartData.map((av, i) => {
              const maxPeso = Math.max(...chartData.map((a) => a.peso ?? 0));
              const minPeso = Math.min(...chartData.filter((a) => a.peso).map((a) => a.peso!));
              const range = maxPeso - minPeso || 1;
              const height = av.peso
                ? 20 + ((av.peso - minPeso) / range) * 80
                : 20;
              return (
                <div
                  key={av.id}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all",
                      i === chartData.length - 1
                        ? "bg-primary"
                        : "bg-primary/30",
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[8px] text-muted-foreground">
                    {formatDateBR(av.data).slice(0, 5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Avaliações list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Scale className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma avaliação física registrada ainda.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Fale com seu professor para agendar sua próxima avaliação.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((avaliacao) => (
            <AvaliacaoCard key={avaliacao.id} avaliacao={avaliacao} tenantId={tenantId} />
          ))}
        </div>
      )}
    </div>
  );
}

function AvaliacaoCard({
  avaliacao,
  tenantId,
}: {
  avaliacao: AvaliacaoFisica;
  tenantId: string | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<AvaliacaoFoto[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !tenantId) return;

      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      try {
        const foto = await uploadAvaliacaoFotoApi({
          tenantId,
          file,
          tipo: "evolucao",
          avaliacaoId: avaliacao.id,
        });
        setUploadedPhotos((prev) => [...prev, foto]);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Erro ao enviar foto.",
        );
      } finally {
        setUploading(false);
        // Reset input para permitir re-upload do mesmo arquivo
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [tenantId, avaliacao.id],
  );

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <button
        type="button"
        className="flex items-center gap-4 w-full p-4 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{formatDateBR(avaliacao.data)}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            {avaliacao.profissionalNome} · {avaliacao.tipo}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {avaliacao.peso && (
            <span className="text-xs font-bold text-foreground">
              {avaliacao.peso}kg
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/40 p-4 space-y-4">
          {/* Medidas principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {avaliacao.peso != null && (
              <MedidaItem icon={Scale} label="Peso" value={`${avaliacao.peso} kg`} />
            )}
            {avaliacao.altura != null && (
              <MedidaItem icon={Ruler} label="Altura" value={`${avaliacao.altura} cm`} />
            )}
            {avaliacao.imc != null && (
              <MedidaItem icon={Activity} label="IMC" value={avaliacao.imc.toFixed(1)} />
            )}
            {avaliacao.percentualGordura != null && (
              <MedidaItem
                icon={TrendingUp}
                label="% Gordura"
                value={`${avaliacao.percentualGordura.toFixed(1)}%`}
              />
            )}
          </div>

          {/* Circunferências */}
          {avaliacao.circunferencias && avaliacao.circunferencias.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Circunferências
              </p>
              <div className="grid grid-cols-2 gap-2">
                {avaliacao.circunferencias.map((c) => (
                  <div
                    key={c.nome}
                    className="flex justify-between items-center rounded-lg bg-muted/20 px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground">{c.nome}</span>
                    <span className="text-xs font-bold">
                      {c.valor} {c.unidade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fotos */}
          {avaliacao.fotos && avaliacao.fotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Fotos
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {avaliacao.fotos.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="h-24 w-20 rounded-lg object-cover border border-border/40"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Fotos enviadas (upload) */}
          {uploadedPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Fotos enviadas
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {uploadedPhotos.map((foto) => (
                  <a
                    key={foto.id}
                    href={foto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.url}
                      alt={`Foto ${foto.tipo}`}
                      className="h-24 w-20 rounded-lg object-cover border border-gym-teal/40"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Upload de foto */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-xl border-border/60 gap-2"
              disabled={uploading || !tenantId}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : uploadSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-gym-teal" />
                  Foto enviada!
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Enviar foto
                </>
              )}
            </Button>
            {uploadError && (
              <p className="text-[11px] text-gym-danger text-center">
                {uploadError}
              </p>
            )}
          </div>

          {/* Observações */}
          {avaliacao.observacoes && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Observações
              </p>
              <p className="text-xs text-muted-foreground">{avaliacao.observacoes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MedidaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/20 p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  current,
  previous,
  unit,
}: {
  label: string;
  current?: number;
  previous?: number;
  unit: string;
}) {
  if (current == null) return null;

  const diff = previous != null ? current - previous : null;
  const isDown = diff != null && diff < 0;
  const isUp = diff != null && diff > 0;

  return (
    <div className="text-center">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-bold">
        {current.toFixed(1)}
        <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
      </p>
      {diff != null && diff !== 0 && (
        <p
          className={cn(
            "text-[10px] font-medium",
            isDown ? "text-gym-teal" : isUp ? "text-gym-danger" : "text-muted-foreground",
          )}
        >
          {isUp ? "+" : ""}
          {diff.toFixed(1)}
          {unit}
        </p>
      )}
    </div>
  );
}
