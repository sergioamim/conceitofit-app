import { Suspense } from "react";

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
