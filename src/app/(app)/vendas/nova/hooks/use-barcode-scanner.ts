"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseBarcodeScanner {
  scannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
  scannerError: string;
  setScannerError: (error: string) => void;
  manualCode: string;
  setManualCode: (code: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useBarcodeScanner(onDetect: (code: string) => boolean): UseBarcodeScanner {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const clearResources = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!scannerOpen) {
      clearResources();
      return;
    }

    let cancelled = false;
    async function startScanner() {
      setScannerError("");
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setScannerError("Câmera não disponível neste dispositivo/navegador.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const Detector = (window as any).BarcodeDetector;
        if (!Detector) {
          setScannerError("Leitura automática não suportada. Use o campo de código manual.");
          return;
        }

        const detector = new Detector({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"],
        });

        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length === 0) return;
            const codeValue = codes[0]?.rawValue ?? "";
            if (onDetect(codeValue)) {
              setScannerOpen(false);
            } else {
              setScannerError(`Código ${codeValue} não encontrado nos produtos.`);
            }
          } catch {
            setScannerError("Não foi possível ler o código. Tente novamente.");
          }
        }, 600);
      } catch {
        setScannerError("Não foi possível acessar a câmera.");
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      clearResources();
    };
  }, [onDetect, scannerOpen, clearResources]);

  return {
    scannerOpen,
    setScannerOpen,
    scannerError,
    setScannerError,
    manualCode,
    setManualCode,
    videoRef,
  };
}
