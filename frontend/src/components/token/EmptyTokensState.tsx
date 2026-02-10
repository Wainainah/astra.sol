import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Rocket, Plus, Sparkles, Trophy, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface EmptyTokensStateProps {
  status?: "active" | "graduated" | "refunding";
}

export function EmptyTokensState({ status = "active" }: EmptyTokensStateProps) {
  const configs = {
    active: {
      title: "NO ACTIVE LAUNCHES",
      description:
        "There are no active token launches at the moment. Be the first to create one!",
      icon: Rocket,
      accentIcon: Sparkles,
      variant: "default" as const,
    },
    graduated: {
      title: "NO GRADUATED TOKENS",
      description: "No tokens have graduated yet. Check back soon!",
      icon: Trophy,
      accentIcon: undefined,
      variant: "muted" as const,
    },
    refunding: {
      title: "NO REFUNDING TOKENS",
      description: "No tokens are in refund mode. This is good news!",
      icon: AlertTriangle,
      accentIcon: undefined,
      variant: "muted" as const,
    },
  };

  const config = configs[status];

  return (
    <Card className="cyber-card">
      <CardContent className="p-0">
        <EmptyState
          icon={config.icon}
          accentIcon={config.accentIcon}
          title={config.title}
          description={config.description}
          variant={config.variant}
          action={
            status === "active" ? (
              <Link href="/create">
                <Button className="font-mono gap-2">
                  <Plus className="h-4 w-4" />
                  Create Token
                </Button>
              </Link>
            ) : undefined
          }
        />
      </CardContent>
    </Card>
  );
}
