/**
 * Comments Service
 *
 * Handles CRUD operations for token comments using Appwrite.
 * Note: Database uses 'train_address' field name for backward compatibility.
 */

import { Query, ID } from "appwrite"
import { databases, DATABASE_ID, COMMENTS_COLLECTION_ID } from "@/lib/appwrite"

// Note: Database field names use snake_case and 'train_address' for historical reasons
// This interface matches the Appwrite document structure
interface CommentDocument {
  $id: string
  $createdAt: string
  $updatedAt: string
  train_address: string // DB field name (kept for compatibility)
  user_address: string
  content: string
  is_deleted: boolean
}

// Frontend-facing interface
export interface Comment {
  id: string
  createdAt: string
  updatedAt: string
  launchAddress: string // Frontend field name
  userAddress: string
  content: string
  isDeleted: boolean
}

export interface CreateCommentInput {
  launchAddress: string // Frontend field name
  userAddress: string
  content: string
}

const MAX_COMMENT_LENGTH = 280
const COMMENTS_PER_PAGE = 25

// Convert DB document to frontend format
function documentToComment(doc: CommentDocument): Comment {
  return {
    id: doc.$id,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
    launchAddress: doc.train_address,
    userAddress: doc.user_address,
    content: doc.content,
    isDeleted: doc.is_deleted,
  }
}

/**
 * Sanitize user input to prevent XSS
 * Strips HTML tags and normalizes whitespace.
 *
 * Note: React already escapes text in JSX, but this provides defense-in-depth
 * in case content is used elsewhere (e.g., in title attributes, other clients).
 */
function sanitizeContent(content: string): string {
  return (
    content
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove potential script injection patterns
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      // Normalize whitespace (collapse multiple spaces/newlines)
      .replace(/\s+/g, " ")
      .trim()
  )
}

/**
 * Get comments for a token
 */
export async function getComments(
  launchAddress: string,
  cursor?: string
): Promise<{ comments: Comment[]; hasMore: boolean }> {
  // Use mock data if Appwrite not configured
  const useMock =
    !process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
    !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

  if (useMock) {
    // Dynamic import to avoid bundling issues
    const { getMockComments } = await import("@/data/mockComments")
    // Convert launchAddress to the expected format for mock
    return getMockComments(launchAddress, cursor)
  }

  try {
    const queries = [
      Query.equal("train_address", launchAddress), // DB field name
      Query.equal("is_deleted", false),
      Query.orderDesc("$createdAt"),
      Query.limit(COMMENTS_PER_PAGE + 1),
    ]

    if (cursor) {
      queries.push(Query.cursorAfter(cursor))
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      queries
    )

    const hasMore = response.documents.length > COMMENTS_PER_PAGE
    const comments = response.documents
      .slice(0, COMMENTS_PER_PAGE)
      .map((doc) => documentToComment(doc as unknown as CommentDocument))

    return { comments, hasMore }
  } catch (error) {
    console.error("Failed to fetch comments:", error)
    // Fallback to mock data on error
    const { getMockComments } = await import("@/data/mockComments")
    return getMockComments(launchAddress, cursor)
  }
}

/**
 * Post a new comment
 */
export async function postComment(input: CreateCommentInput): Promise<Comment> {
  const sanitizedContent = sanitizeContent(input.content)

  if (!sanitizedContent) {
    throw new Error("Comment cannot be empty")
  }

  if (sanitizedContent.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`)
  }

  if (!input.launchAddress || !input.userAddress) {
    throw new Error("Missing required fields")
  }

  try {
    const document = await databases.createDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      ID.unique(),
      {
        train_address: input.launchAddress, // Map to DB field name
        user_address: input.userAddress,
        content: sanitizedContent,
        is_deleted: false,
      }
    )

    return documentToComment(document as unknown as CommentDocument)
  } catch (error) {
    console.error("Failed to post comment:", error)

    if (error instanceof Error) {
      if (error.message.includes("Rate limit")) {
        throw new Error("Too many comments. Please wait a moment.")
      }
      if (error.message.includes("Unauthorized")) {
        throw new Error("Please connect your wallet to comment")
      }
    }

    throw new Error("Failed to post comment. Please try again.")
  }
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(
  commentId: string,
  userAddress: string
): Promise<void> {
  try {
    const document = (await databases.getDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      commentId
    )) as unknown as CommentDocument

    if (document.user_address !== userAddress) {
      throw new Error("You can only delete your own comments")
    }

    await databases.updateDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      commentId,
      { is_deleted: true }
    )
  } catch (error) {
    console.error("Failed to delete comment:", error)

    if (error instanceof Error && error.message.includes("own comments")) {
      throw error
    }

    throw new Error("Failed to delete comment. Please try again.")
  }
}

/**
 * Get comment count for a token
 */
export async function getCommentCount(launchAddress: string): Promise<number> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      [
        Query.equal("train_address", launchAddress), // DB field name
        Query.equal("is_deleted", false),
        Query.limit(1),
      ]
    )

    return response.total
  } catch (error) {
    console.error("Failed to get comment count:", error)
    return 0
  }
}

/**
 * Check if comments are available
 */
export function isCommentsEnabled(): boolean {
  // Comments work in mock mode too
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    return true
  }
  return !!(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  )
}
