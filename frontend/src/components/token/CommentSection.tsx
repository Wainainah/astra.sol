"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CommentInput } from "@/components/token/CommentInput"
import { CommentCard } from "@/components/token/CommentCard"
import { getComments, isCommentsEnabled, Comment } from "@/services/comments"
import { useWallet } from "@solana/wallet-adapter-react"
import { MessageSquare, AlertCircle } from "lucide-react"

interface CommentSectionProps {
  tokenAddress: string
  creatorAddress?: string
}

export function CommentSection({
  tokenAddress,
  creatorAddress,
}: CommentSectionProps) {
  const { publicKey } = useWallet()
  const address = publicKey?.toBase58()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadComments = useCallback(
    async (cursor?: string) => {
      if (!isCommentsEnabled()) {
        setError("Comments not configured")
        setIsLoading(false)
        return
      }

      try {
        const result = await getComments(tokenAddress, cursor)

        if (cursor) {
          setComments((prev) => [...prev, ...result.comments])
        } else {
          setComments(result.comments)
        }

        setHasMore(result.hasMore)
        setError(null)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load comments"
        )
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [tokenAddress]
  )

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleLoadMore = () => {
    if (comments.length > 0 && hasMore) {
      setIsLoadingMore(true)
      const lastComment = comments[comments.length - 1]
      loadComments(lastComment.id)
    }
  }

  const handleCommentPosted = (newComment: Comment) => {
    setComments((prev) => [newComment, ...prev])
  }

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  if (!isCommentsEnabled()) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Comments are not available</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <CommentInput
        tokenAddress={tokenAddress}
        onCommentPosted={handleCommentPosted}
      />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && comments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No comments yet</p>
          <p className="text-xs">Be the first to comment!</p>
        </div>
      )}

      {/* Comments List */}
      {!isLoading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isOwner={address === comment.userAddress}
              isCreator={creatorAddress === comment.userAddress}
              onDelete={handleCommentDeleted}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  )
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-lg border">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}
