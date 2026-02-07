/**
 * Mock Comments Data
 *
 * Realistic crypto community comments for demo/development.
 * These simulate what users would post on different tokens.
 */

import type { Comment } from "@/services/comments"

// Solana addresses from mock.ts
const TOKEN_ADDRESSES = {
  MOON: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  FUEL: "B6vLkzDMYgz2wYsF6Ddr4grpmEXn7P9HJhYz3G3nM7bE",
  DEGEN: "CvS1E8qMhVuAZ9h9pKCc5t2uMfNLX7qgJWey9dFYePkG",
  CHAD: "DpR8N5qL7mwm9k4vt3FHzX3WrCy6Q8xKg5v2jYBz7HkT",
  ASTRA: "EtQ3FkG8nLv5zR2wM6xKy9TcVb7J4hN3pXqZ8mF2sY5A",
  FAIL: "FuT4GkL9nMv6zS3wP7xNy8RcWb8K5hQ4pYqA9nG3tZ6B",
  HANDS: "GvW5HkM1nPv7zT4wQ8xRy9ScXc9L6hR5pZrB1nH4uA7C",
  APE: "HwX6JkN2pQv8zU5wR9xSy1TdYd2M7hS6qArC2nJ5vB8D",
}

// Mock wallet addresses
const MOCK_USERS = [
  "Fg6PaFpoGXkYsidMpWxTWqkpTGhTWfvE6QJaqKKPHNfA",
  "3QmCm9Abrpo8VFPdn5Ph5YUgkM2NumsUqZKL2Ez1zpPt",
  "5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCNA9X4x8",
  "7bYE3WgkhMmC4UdW49P6Jkz6v3LX6Cz4V4xZ5RbZ9H2F",
  "9hF3kYmW5tN2vCxZ6Q8pJrLz4V7xK3M5Y2bN8wH6D9aE",
  "2mK7xLz9N4vQ3wF6pY8jR5hT2cB7nM9kX3zV6sD4gE1A",
  "4nL8yMz2V5wQ7xF9pK3jR6hT8sB2cN1kX5zV9sD7gE3A",
  "6pN9zLy3W6xQ8vF1pM4jS7kU9tC3dP2nY6wX1sE8hF4B",
  "8qP1zMy4X7yR9wG2qN5kT8lV1uD4eQ3pZ7xY2tF9jG5C",
  "AhR2zNy5Y8zS1wH3rP6lU9mW2vE5fR4qA8yZ3uG1kH6D",
]

// Comment templates by type
const HYPE_COMMENTS = [
  "LFG 🚀🚀🚀",
  "This is the one! Loading up my bags",
  "Finally a fair launch that makes sense",
  "Diamond hands only 💎🙌",
  "The bonding curve mechanics are genius",
  "Aping in, this tech is solid",
  "So bullish on this project",
  "This is going to moon after graduation",
  "Best entry I've seen in weeks",
  "The team is cooking 🔥",
  "Just boarded the launch, LFG! 🚀",
  "This is what crypto should be",
  "Accumulating on every dip",
  "The graduation gates are so close!",
  "Who else is max bidding?",
  "No rug possible, love the mechanics",
  "Locked and loaded 🎯",
  "This community is amazing",
  "WAGMI frens",
  "Sat gang checking in 🌙",
]

const QUESTION_COMMENTS = [
  "When do you think we graduate?",
  "What's the token utility after graduation?",
  "Is the smart contract audited?",
  "How does the 92/8 split work exactly?",
  "What's the target SOL amount?",
  "Can someone explain the vesting schedule?",
  "How much are whales holding?",
  "Is there a telegram or discord?",
  "What happens if we don't hit the gates?",
  "How long until creator can claim?",
  "What DEX will we list on?",
  "Is there a max buy limit?",
  "How does the refund work?",
  "What's the token supply?",
  "Are there any partnerships announced?",
]

const SKEPTICAL_COMMENTS = [
  "Needs more holders before I ape",
  "Top holder percentage is a bit high",
  "Let's see if this can maintain momentum",
  "Careful of the concentration risk",
  "Waiting for more volume",
  "I'll wait for a pullback",
  "DYOR everyone, don't ape blindly",
  "The chart looks a bit toppy",
  "Be careful with new launches",
  "Taking some profits, still bullish long term",
]

const DISCUSSION_COMMENTS = [
  "The 24hr volume is looking strong",
  "Just crossed 100 holders, major milestone!",
  "Looking at the locked SOL trend - bullish",
  "The graduation gates are well designed",
  "Holder distribution is getting healthier",
  "Really like how the protocol handles fees",
  "Comparing to pump.fun mechanics - this is better",
  "The vesting prevents dump at graduation",
  "Great tokenomics for long term holders",
  "Community driven from day 1",
]

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function randomUser(): string {
  return MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]
}

function randomComment(
  type: "hype" | "question" | "skeptical" | "discussion"
): string {
  const pool = {
    hype: HYPE_COMMENTS,
    question: QUESTION_COMMENTS,
    skeptical: SKEPTICAL_COMMENTS,
    discussion: DISCUSSION_COMMENTS,
  }
  const comments = pool[type]
  return comments[Math.floor(Math.random() * comments.length)]
}

function generateCommentsForToken(
  launchAddress: string,
  count: number
): Comment[] {
  const comments: Comment[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    // Distribute comment types: 50% hype, 20% question, 15% discussion, 15% skeptical
    const rand = Math.random()
    let type: "hype" | "question" | "skeptical" | "discussion"
    if (rand < 0.5) type = "hype"
    else if (rand < 0.7) type = "question"
    else if (rand < 0.85) type = "discussion"
    else type = "skeptical"

    // Spread comments over the last 48 hours
    const hoursAgo = Math.random() * 48
    const timestamp = new Date(now - hoursAgo * 60 * 60 * 1000)

    comments.push({
      id: generateId(),
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
      launchAddress: launchAddress,
      userAddress: randomUser(),
      content: randomComment(type),
      isDeleted: false,
    })
  }

  // Sort by newest first
  return comments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

// Pre-generate comments for each token
export const mockComments: Record<string, Comment[]> = {
  [TOKEN_ADDRESSES.MOON]: generateCommentsForToken(TOKEN_ADDRESSES.MOON, 25),
  [TOKEN_ADDRESSES.FUEL]: generateCommentsForToken(TOKEN_ADDRESSES.FUEL, 35),
  [TOKEN_ADDRESSES.DEGEN]: generateCommentsForToken(TOKEN_ADDRESSES.DEGEN, 18),
  [TOKEN_ADDRESSES.CHAD]: generateCommentsForToken(TOKEN_ADDRESSES.CHAD, 22),
  [TOKEN_ADDRESSES.ASTRA]: generateCommentsForToken(TOKEN_ADDRESSES.ASTRA, 45),
  [TOKEN_ADDRESSES.FAIL]: generateCommentsForToken(TOKEN_ADDRESSES.FAIL, 12),
  [TOKEN_ADDRESSES.HANDS]: generateCommentsForToken(TOKEN_ADDRESSES.HANDS, 28),
  [TOKEN_ADDRESSES.APE]: generateCommentsForToken(TOKEN_ADDRESSES.APE, 15),
}

/**
 * Get mock comments for a token with pagination
 */
export function getMockComments(
  launchAddress: string,
  cursor?: string
): { comments: Comment[]; hasMore: boolean } {
  const allComments = mockComments[launchAddress] || []
  const pageSize = 25

  let startIndex = 0
  if (cursor) {
    const cursorIndex = allComments.findIndex((c) => c.id === cursor)
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1
    }
  }

  const comments = allComments.slice(startIndex, startIndex + pageSize)
  const hasMore = startIndex + pageSize < allComments.length

  return { comments, hasMore }
}

/**
 * Get comment count for a token
 */
export function getMockCommentCount(launchAddress: string): number {
  return mockComments[launchAddress]?.length || 0
}
