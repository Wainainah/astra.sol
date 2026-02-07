import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { MessageSquare, Sparkles } from "lucide-react"

interface EmptyCommentsStateProps {
  isCreator?: boolean
}

export function EmptyCommentsState({
  isCreator = false,
}: EmptyCommentsStateProps) {
  return (
    <Card className="cyber-card">
      <CardContent className="p-0">
        <EmptyState
          icon={MessageSquare}
          accentIcon={isCreator ? Sparkles : undefined}
          title="NO_COMMENTS"
          description={
            isCreator
              ? "Be the first to comment on your token! Engage with your community."
              : "No comments yet. Be the first to share your thoughts!"
          }
          variant="muted"
          className="py-8"
        />
      </CardContent>
    </Card>
  )
}
