import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  accentIcon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "muted" | "cyber"
  className?: string
}

export function EmptyState({
  icon: Icon,
  accentIcon: AccentIcon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6",
        variant === "cyber" && "cyber-card",
        className
      )}
    >
      <div className="relative mb-4">
        <Icon className="h-12 w-12 text-muted-foreground/50" />
        {AccentIcon && (
          <AccentIcon className="absolute -bottom-1 -right-1 h-5 w-5 text-primary" />
        )}
      </div>
      <h3 className={cn(
        "text-lg font-semibold",
        variant === "cyber" && "font-mono"
      )}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
