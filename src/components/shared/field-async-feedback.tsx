import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOTION_CLASSNAMES } from "@/lib/ui-motion";

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
        "mt-1 flex items-center gap-1.5 text-xs",
        MOTION_CLASSNAMES.fieldFeedback,
        status === "loading" && "text-muted-foreground",
        status === "success" && "text-gym-teal",
        status === "error" && "text-destructive",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status === "loading" && <Loader2 className="size-3.5 motion-safe:animate-spin" />}
      {status === "success" && <CheckCircle2 className="size-3.5" />}
      {status === "error" && <AlertCircle className="size-3.5" />}
      
      {message && <span>{message}</span>}
    </div>
  );
}
