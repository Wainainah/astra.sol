import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox, RefreshCw, ShoppingCart } from "lucide-react";

interface EmptyHoldingsStateProps {
  onRefresh?: () => void;
}

export function EmptyHoldingsState({ onRefresh }: EmptyHoldingsStateProps) {
  return (
    <Card className="cyber-card">
      <CardContent className="p-0">
        <EmptyState
          icon={Inbox}
          accentIcon={ShoppingCart}
          title="NO_HOLDINGS"
          description="You don't have any positions in this token yet. Start trading to see your holdings here."
          variant="muted"
          action={
            onRefresh ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="font-mono gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            ) : undefined
          }
        />
      </CardContent>
    </Card>
  );
}
