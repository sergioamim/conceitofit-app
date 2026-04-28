"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateAlunoService } from "@/lib/tenant/comercial/runtime";
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
  const [cameraOpen, setCameraOpen] = useState(false);
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
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError") {
        setCameraError("Permissão da câmera negada. Clique no ícone de câmera na barra de endereço do navegador e permita o acesso.");
      } else if (name === "NotFoundError") {
        setCameraError("Nenhuma câmera encontrada neste dispositivo.");
      } else if (name === "NotReadableError") {
        setCameraError("Câmera em uso por outro aplicativo. Feche outros apps que usam a câmera e tente novamente.");
      } else {
        setCameraError(`Não foi possível acessar a câmera: ${name || String(err)}`);
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    setPreview(aluno.foto ?? "");
    setCameraOpen(!(aluno.foto ?? "").trim());
    setSaving(false);
    setCameraError("");
    setSaveError("");
    return () => {
      stopCamera();
    };
  }, [open, aluno.foto, stopCamera]);

  useEffect(() => {
    if (!open) return;
    if (!cameraOpen) {
      stopCamera();
      return;
    }
    void startCamera();
  }, [cameraOpen, open, startCamera, stopCamera]);

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
    stopCamera();
    setCameraOpen(false);
  };

  const handleOpenCamera = () => {
    setCameraError("");
    setSaveError("");
    setCameraOpen(true);
  };

  const handleRemove = () => {
    setPreview("");
    stopCamera();
    setCameraOpen(false);
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

  const canSave = preview !== (aluno.foto ?? "");
  const hasPreview = Boolean(preview);
  const cameraPrimaryLabel = hasPreview ? "Trocar foto" : "Tirar foto";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border w-[96vw] max-w-4xl p-0">
        <DialogHeader>
          <DialogTitle className="px-6 pt-6 text-lg">
            Foto do cliente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {cameraOpen
              ? "Use a câmera para tirar uma nova foto"
              : hasPreview
                ? "Clique em trocar foto para abrir a câmera"
                : "Cliente sem foto cadastrada"}
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-black/70">
            {cameraOpen ? (
              cameraError ? (
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
              )
            ) : (
              <div className="flex h-[60vh] w-full items-center justify-center">
                {hasPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt={`Foto de ${aluno.nome}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhuma foto cadastrada para este cliente.</span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {cameraOpen ? (
              <>
                <Button variant="outline" onClick={() => setCameraOpen(false)} disabled={saving}>
                  Voltar
                </Button>
                <Button onClick={handleCapture} disabled={!!cameraError}>
                  Capturar foto
                </Button>
              </>
            ) : (
              <>
                {hasPreview ? (
                  <Button variant="outline" onClick={handleRemove} disabled={saving}>
                    Remover foto
                  </Button>
                ) : null}
                <Button variant="outline" onClick={handleOpenCamera} disabled={saving}>
                  {cameraPrimaryLabel}
                </Button>
                <Button variant="outline" onClick={onClose} disabled={saving}>
                  Fechar
                </Button>
                <Button onClick={handleSave} disabled={saving || !canSave}>
                  {saving ? "Salvando..." : "Salvar foto"}
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
