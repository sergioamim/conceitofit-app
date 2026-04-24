import type { Metadata } from "next";
import { NotificacoesContent } from "./notificacoes-content";

export const metadata: Metadata = {
  title: "Notificacoes",
  description: "Lista completa de notificacoes do portal operador.",
};

export default function NotificacoesPage() {
  return <NotificacoesContent />;
}
