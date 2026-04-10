/**
 * Utilitário de notificação sonora para novas mensagens no inbox de
 * atendimento (Task #517). Usa Web Audio API com beep suave (880Hz → 440Hz)
 * sem dependência de arquivos externos.
 *
 * Hydration safety: guardado por `typeof window === "undefined"` para nunca
 * rodar em SSR. AudioContext exige interação prévia do usuário com a página
 * (gesture policy), portanto o primeiro beep pode silenciosamente falhar
 * antes do primeiro clique.
 */

type AudioContextConstructor = typeof AudioContext;

interface GlobalWithAudio {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
  window?: unknown;
}

function getAudioContextCtor(): AudioContextConstructor | undefined {
  // Ordem: globalThis (jsdom/happy-dom/vitest), depois window (browser real).
  // Guard de SSR: se não há globalThis.window nem globalThis.document, desiste.
  const g = globalThis as unknown as GlobalWithAudio;
  if (g.AudioContext) return g.AudioContext;
  if (g.webkitAudioContext) return g.webkitAudioContext;
  if (typeof window !== "undefined") {
    const w = window as unknown as GlobalWithAudio;
    return w.AudioContext ?? w.webkitAudioContext;
  }
  return undefined;
}

/**
 * Toca um beep curto (~300ms) para sinalizar chegada de nova mensagem.
 * Falha silenciosamente se AudioContext não estiver disponível ou se o
 * usuário ainda não interagiu com a página.
 */
export function playNewMessageSound(): void {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return;

  try {
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);

    // Fecha o contexto após o fim do som para liberar o recurso.
    osc.onended = () => {
      void ctx.close().catch(() => {
        /* ignora */
      });
    };
  } catch {
    // Silently fail se AudioContext não estiver disponível (SSR, políticas
    // de autoplay, navegadores sem suporte).
  }
}
