"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { deleteComment, Comment } from "@/services/comments"
import { shortenAddress } from "@/lib/constants"
import { formatDistanceToNow } from "date-fns"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface CommentCardProps {
  comment: Comment
  isOwner: boolean
  isCreator: boolean
  onDelete: (commentId: string) => void
}

export function CommentCard({
  comment,
  isOwner,
  isCreator,
  onDelete,
}: CommentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  })

  const handleDelete = async () => {
    if (!isOwner) return

    setIsDeleting(true)

    try {
      await deleteComment(comment.id, comment.userAddress)
      onDelete(comment.id)
      toast.success("Comment deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
      setIsDeleting(false)
    }
  }

  return (
    <div className="group flex gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
      {/* Avatar */}
      <Avatar className="h-8 w-8 bg-muted flex items-center justify-center text-xs">
        <span>{comment.userAddress.slice(2, 4).toUpperCase()}</span>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm">
            {shortenAddress(comment.userAddress)}
          </span>
          {isCreator && (
            <Badge
              variant="secondary"
              className="text-xs bg-primary/10 text-primary"
            >
              Creator
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        <p className="text-sm mt-1 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>

      {/* Delete Button */}
      {isOwner && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:text-red-500"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={isDeleting ? "Deleting comment..." : "Delete comment"}
        >
          {isDeleting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
}
