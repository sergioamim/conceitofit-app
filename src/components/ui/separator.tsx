import * as React from "react";

import { cn } from "@/lib/utils";

function Separator({
  className,
  ...props
}: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      data-slot="separator"
      className={cn(
        "border-border shrink-0 border-0 border-b border-dashed bg-transparent",
        className
      )}
      {...props}
    />
  );
}

export { Separator };

