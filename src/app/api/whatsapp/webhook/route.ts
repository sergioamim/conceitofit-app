import { NextRequest, NextResponse } from "next/server";
import { whatsAppWebhookPayloadSchema } from "@/lib/forms/whatsapp-schemas";

/**
 * POST /api/whatsapp/webhook
 *
 * Recebe callbacks de status do provider de WhatsApp (Evolution API, WhatsApp Business, etc.).
 * Em produção, este endpoint repassa para o backend Java via proxy.
 * Aqui fazemos validação básica do payload antes de encaminhar.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = whatsAppWebhookPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const backendUrl = process.env.BACKEND_PROXY_TARGET;
    if (!backendUrl) {
      return NextResponse.json(
        { error: "Backend não configurado" },
        { status: 503 },
      );
    }

    // Forward to Java backend
    const backendResponse = await fetch(`${backendUrl}/api/v1/whatsapp/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => "");
      return NextResponse.json(
        { error: "Falha ao processar webhook no backend", detail: errorText },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao processar webhook" },
      { status: 500 },
    );
  }
}

/** GET — health check para verificação do provider */
export function GET() {
  return NextResponse.json({ status: "ok", service: "whatsapp-webhook" });
}
