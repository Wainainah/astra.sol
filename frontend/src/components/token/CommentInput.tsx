"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { postComment, Comment } from "@/services/comments"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Send } from "lucide-react"
import { toast } from "sonner"

interface CommentInputProps {
  tokenAddress: string
  onCommentPosted: (comment: Comment) => void
}

const MAX_LENGTH = 280

export function CommentInput({
  tokenAddress,
  onCommentPosted,
}: CommentInputProps) {
  const { publicKey, connected } = useWallet()
  const address = publicKey?.toBase58()
  const [content, setContent] = useState("")
  const [isPosting, setIsPosting] = useState(false)

  const charCount = content.length
  const isOverLimit = charCount > MAX_LENGTH
  const canPost = content.trim().length > 0 && !isOverLimit && !isPosting

  const handlePost = async () => {
    if (!address || !canPost) return

    setIsPosting(true)

    try {
      const comment = await postComment({
        launchAddress: tokenAddress,
        userAddress: address,
        content: content.trim(),
      })

      onCommentPosted(comment)
      setContent("")
      toast.success("Comment posted!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post")
    } finally {
      setIsPosting(false)
    }
  }

  if (!connected) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Connect wallet to comment
        </p>
        <WalletMultiButton />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPosting}
          className="min-h-[80px] pr-12 resize-none"
          maxLength={MAX_LENGTH + 50} // Allow typing but show error
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8"
          disabled={!canPost}
          onClick={handlePost}
          aria-label={isPosting ? "Posting comment..." : "Post comment"}
        >
          {isPosting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex justify-end">
        <span
          className={`text-xs ${
            isOverLimit
              ? "text-red-500"
              : charCount > MAX_LENGTH * 0.9
                ? "text-amber-500"
                : "text-muted-foreground"
          }`}
        >
          {charCount}/{MAX_LENGTH}
        </span>
      </div>
    </div>
  )
}
