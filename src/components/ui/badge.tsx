import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium",
        variant === "default" && "border-transparent bg-zinc-900 text-white",
        variant === "secondary" && "border-transparent bg-zinc-100 text-zinc-900",
        variant === "outline" && "text-zinc-900",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
