# Task ID: 517

**Title:** Utilitário de notificação sonora para novas mensagens

**Status:** pending

**Dependencies:** None

**Priority:** low

**Description:** Criar `src/lib/utils/notification-sound.ts` com `playNewMessageSound()` usando Web Audio API (beep curto, sem arquivos externos).

**Details:**

Criar `src/lib/utils/notification-sound.ts`:

```ts
export function playNewMessageSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
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
  } catch {
    // Silently fail if audio not available
  }
}
```

- Beep suave de 300ms (880Hz → 440Hz).
- Só tocar se usuário interagiu com a página (AudioContext requer gesture).
- Integrar no handler SSE de `nova_mensagem`: se a conversa não está selecionada, tocar som.
- Opção de desativar som nas preferências do usuário (futuro).

**Hydration safety:** Verificar `typeof window === "undefined"` antes de criar AudioContext. NÃO chamar durante SSR.

**Test Strategy:**

Teste unitário mock: verificar que função não lança erro. Teste manual: abrir inbox, receber mensagem em conversa não selecionada → verificar beep.
