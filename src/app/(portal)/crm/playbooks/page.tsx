"use client";

import dynamic from "next/dynamic";

// Task 484: code splitting — lazy load heavy playbooks content (806 LOC)
const PlaybooksContent = dynamic(
  () => import("./playbooks-content"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Carregando playbooks...
      </div>
    ),
  },
);

export default function CrmPlaybooksPage() {
  return <PlaybooksContent />;
}
