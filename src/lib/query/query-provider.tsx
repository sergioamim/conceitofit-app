"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "./query-client";

export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  const showQueryDevtools =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEBUG_QUERY_DEVTOOLS === "true";

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
