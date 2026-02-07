"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { TokenStatus } from "@/components/token/TokenCard";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        active:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        graduated:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        refunding:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      },
      variant: {
        default: "",
        outline: "bg-background",
      },
    },
    compoundVariants: [
      {
        status: "active",
        variant: "outline",
        class: "border-primary text-primary hover:bg-primary/10",
      },
      {
        status: "graduated",
        variant: "outline",
        class: "border-secondary text-secondary hover:bg-secondary/10",
      },
      {
        status: "refunding",
        variant: "outline",
        class: "border-destructive text-destructive hover:bg-destructive/10",
      },
    ],
    defaultVariants: {
      status: "active",
      variant: "default",
    },
  },
);

export interface StatusBadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: TokenStatus;
  showIcon?: boolean;
}

/**
 * StatusBadge - Standardized status indicator for tokens
 *
 * Maps token statuses to semantic colors:
 * - active: Primary color (orange)
 * - graduated: Secondary color (teal)
 * - refunding: Destructive color (red)
 *
 * @example
 * ```tsx
 * <StatusBadge status="active" />
 * <StatusBadge status="graduated" variant="outline" />
 * <StatusBadge status="refunding" showIcon />
 * ```
 */
function StatusBadge({
  className,
  status,
  variant,
  showIcon = false,
  children,
  ...props
}: StatusBadgeProps) {
  // Defensive: fallback to 'active' if status is undefined or invalid
  const safeStatus: TokenStatus = status || "active";

  const icons = {
    active: "●",
    graduated: "✓",
    refunding: "⚠",
  };

  return (
    <div
      className={cn(
        statusBadgeVariants({ status: safeStatus, variant }),
        className,
      )}
      {...props}
    >
      {showIcon && (
        <span className="mr-1" aria-hidden="true">
          {icons[safeStatus]}
        </span>
      )}
      {children || safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </div>
  );
}

export { StatusBadge, statusBadgeVariants };
