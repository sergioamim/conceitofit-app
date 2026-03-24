"use client";

import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type FieldAsyncFeedbackStatus = "idle" | "loading" | "success" | "error";

export type FieldAsyncFeedbackProps = {
  status: FieldAsyncFeedbackStatus;
  message?: string;
  className?: string;
};

export function FieldAsyncFeedback({ status, message, className }: FieldAsyncFeedbackProps) {
  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "mt-1 flex items-center gap-1.5 text-xs animate-in fade-in slide-in-from-top-1",
        status === "loading" && "text-muted-foreground",
        status === "success" && "text-gym-teal",
        status === "error" && "text-destructive",
        className
      )}
      role="status"
    >
      {status === "loading" && <Loader2 className="size-3.5 animate-spin" />}
      {status === "success" && <CheckCircle2 className="size-3.5" />}
      {status === "error" && <AlertCircle className="size-3.5" />}
      
      {message && <span>{message}</span>}
    </div>
  );
}
