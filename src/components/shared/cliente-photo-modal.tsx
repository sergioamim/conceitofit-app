"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateAlunoService } from "@/lib/comercial/runtime";
import type { Aluno } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export function ClientePhotoModal({
  open,
  onClose,
  aluno,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  aluno: Aluno;
  onSaved?: () => Promise<void> | void;
}) {
  const [preview, setPreview] = useState(aluno.foto ?? "");
  const [hasCaptured, setHasCaptured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [saveError, setSaveError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Este dispositivo não suporta acesso à câmera.");
      return;
    }
    setCameraError("");
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setCameraError("Não foi possível acessar a câmera.");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    setPreview(aluno.foto ?? "");
    setHasCaptured(false);
    setSaving(false);
    setCameraError("");
    setSaveError("");
    void startCamera();
    return () => {
      stopCamera();
    };
  }, [open, aluno.foto, startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
    setHasCaptured(true);
    stopCamera();
  };

  const handleRetake = () => {
    setHasCaptured(false);
    setCameraError("");
    void startCamera();
  };

  const handleRemove = () => {
    setPreview("");
    setHasCaptured(true);
    stopCamera();
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateAlunoService({
        tenantId: aluno.tenantId,
        id: aluno.id,
        data: { foto: preview || undefined },
      });
      onClose();
      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      setSaveError(normalizeErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const canSave = hasCaptured || Boolean(preview) !== Boolean(aluno.foto);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border w-[96vw] max-w-4xl p-0">
        <DialogHeader>
          <DialogTitle className="px-6 pt-6 font-display text-lg">
            Trocar foto do cliente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {hasCaptured ? "Pré-visualização da captura" : "Use a câmera para tirar uma nova foto"}
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-black/70">
            {hasCaptured ? (
              <div className="flex h-[60vh] w-full items-center justify-center">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt={`${aluno.nome} preview`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Foto removida. Salve para confirmar.</span>
                )}
              </div>
            ) : cameraError ? (
              <div className="flex h-[60vh] items-center justify-center p-4 text-sm text-gym-danger">
                {cameraError}
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-[60vh] w-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {hasCaptured ? (
              <>
                <Button variant="outline" onClick={handleRetake} disabled={saving}>
                  Tirar outra foto
                </Button>
                <Button variant="outline" onClick={onClose} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving || !canSave}>
                  {saving ? "Salvando..." : "Salvar foto"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button variant="outline" onClick={handleRemove} disabled={!preview}>
                  Remover foto atual
                </Button>
                <Button onClick={handleCapture} disabled={!!cameraError}>
                  Capturar foto
                </Button>
              </>
            )}
          </div>
          {saveError ? <p className="text-sm text-gym-danger">{saveError}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
