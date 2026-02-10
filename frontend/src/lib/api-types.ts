/**
 * Astra Protocol V7 - API Types
 *
 * V7 CHANGES:
 * - Removed locked/unlocked split
 * - Simplified Position and Token interfaces
 * - Added position value tracking (paper gains)
 * - Market cap based graduation tracking
 */

// ============================================================================
// ENUMS & BASE TYPES
// ============================================================================

export type TokenStatus = "active" | "graduated" | "refunding";

export type TransactionType = "buy" | "sell" | "claim" | "refund" | "create";

// ============================================================================
// TOKEN/LAUNCH TYPES
// ============================================================================

/**
 * V7: Simplified launch data - no locked/unlocked split
 */
export interface Launch {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  // V7: Simplified supply tracking
  totalShares: number;
  totalSol: number;
  marketCapUsd: number;
  // V7: Graduation gate tracking
  graduationGateHolders: number;
  graduationGateConcentration: number; // Basis points
  holders: number;
  topHolderPct: number;
  status: TokenStatus;
  createdAt: string;
  ageHours: number;
  graduatedToken?: string;
  vault?: string;
  uri?: string;
}

/**
 * V7: User-facing token representation
 */
export interface Token {
  address: string;
  name: string;
  ticker: string;
  creator: string;
  // V7: Simplified
  totalShares: number;
  totalSol: number;
  marketCapUsd: number;
  // V7: Graduation progress (0-100%)
  graduationProgress: number;
  graduationTarget: number; // Always 42000
  holders: number;
  topHolderPct?: number;
  status: TokenStatus;
  createdAt: string;
  ageHours: number;
  graduatedToken?: string;
  vault?: string;
  image?: string;
}

// ============================================================================
// POSITION TYPES
// ============================================================================

/**
 * V7: Simplified position - no locked/unlocked split
 */
export interface Position {
  launchAddress: string;
  userAddress: string;
  // V7: Simplified share tracking
  shares: number; // All shares (unlocked)
  solBasis: number; // Original investment
  // V7: Only for creator vesting
  lockedShares: number;
  // V7: Position value tracking (paper gains)
  positionValue?: number; // Current market value
  positionValueUsd?: number;
  invested?: number; // Original investment
  investedUsd?: number;
  unrealizedGain?: number; // Paper gains
  unrealizedGainUsd?: number;
  roiPercent?: number; // Return percentage
  ownershipPercent?: number; // % of total supply
  hasClaimedTokens: boolean;
  hasClaimedRefund: boolean;
  firstBuyAt: string | null;
  lastUpdatedAt: string | null;
  token?: Token;
}

// ============================================================================
// V7: POSITION VALUE TYPE
// ============================================================================

/**
 * V7: Real-time position value calculation
 */
export interface PositionValue {
  shares: number;
  sharePrice: number; // Current price per share in SOL
  sharePriceUsd: number;
  positionValue: number; // What position is worth now (SOL)
  positionValueUsd: number;
  invested: number; // Original investment (SOL)
  investedUsd: number;
  unrealizedGain: number; // Paper gains (SOL)
  unrealizedGainUsd: number;
  roiPercent: number;
  ownershipPercent: number;
  // V7: Graduation estimates
  estimatedTokensAtGraduation: number;
  estimatedValueAtGraduation: number;
  estimatedValueAtGraduationUsd: number;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface Transaction {
  signature: string;
  type: TransactionType;
  launchAddress: string;
  userAddress: string;
  solAmount?: number | null;
  sharesAmount?: number | null;
  marketCapUsdAtTx?: number; // V7: Market cap snapshot
  timestamp: string;
  slot: number;
  tokenName?: string;
  tokenSymbol?: string;
  tokenImage?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  address: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  totalTokens: number;
  activePositions: number;
  totalTransactions: number;
}

// ============================================================================
// STATS TYPES
// ============================================================================

export interface Stats {
  totalTokens: number;
  totalUsers: number;
  totalVolumeSol: number;
  graduatedTokens: number;
}

// ============================================================================
// V7: GRADUATION GATES
// ============================================================================

export interface GraduationGates {
  marketCapUsd: number; // Current market cap
  marketCapTarget: number; // 42000
  holders: number;
  holdersTarget: number; // 100
  concentration: number; // Top holder % (basis points)
  concentrationTarget: number; // 1000 (10%)
  canGraduate: boolean;
  blockingReasons: string[];
}

// ============================================================================
// COMMENT TYPES
// ============================================================================

export interface Comment {
  id: string;
  createdAt: string;
  updatedAt: string;
  launchAddress: string;
  userAddress: string;
  content: string;
  isDeleted: boolean;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface TokenListResponse {
  tokens: Token[];
  total: number;
  hasMore: boolean;
}

export interface TokenDetailResponse extends Token {
  totalShares: number;
  totalSol: number;
  creatorSeedShares: number;
  uri: string;
  image?: string;
  // V7: Graduation gates
  graduationGates: GraduationGates;
}

export interface HoldersResponse {
  holders: Position[];
  total: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface UserPositionsResponse {
  positions: Position[];
  total: number;
}

// ============================================================================
// V7: PORTFOLIO TYPES
// ============================================================================

export interface PortfolioHolding {
  launchAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string | null;
  shares: number; // V7: Simplified
  solBasis: number;
  // V7: Position value
  positionValueSol: number;
  positionValueUsd: number;
  unrealizedPnlSol: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPercent: number;
  ownershipPercent: number;
  hasClaimedTokens: boolean;
  hasClaimedRefund: boolean;
  firstBuyAt: string | null;
  lastUpdatedAt: string | null;
  graduated: boolean;
  refundMode: boolean;
  // V7: Graduation estimate
  estimatedTokensAtGraduation: number;
}

export interface PortfolioResponse {
  summary: {
    totalValueSol: number;
    totalValueUsd: number;
    totalCostBasisSol: number;
    totalCostBasisUsd: number;
    totalUnrealizedPnlSol: number;
    totalUnrealizedPnlUsd: number;
    totalUnrealizedPnlPercent: number;
    realizedPnlSol: number;
    totalPositions: number;
    activePositions: number;
    totalTrades: {
      buys: number;
      sells: number;
    };
  };
  holdings: PortfolioHolding[];
}

// ============================================================================
// V7: CURVE/PRICE TYPES
// ============================================================================

export interface CurveQuote {
  solAmount: number;
  sharesOut: number;
  pricePerShare: number;
  pricePerShareUsd: number;
  marketCapAfter: number;
  graduationProgressAfter: number;
}

export interface SellQuote {
  sharesToSell: number;
  refundAmount: number;
  leavingBehind: number;
  leavingBehindUsd: number;
  warning: string;
}

export interface CommentsResponse {
  comments: Comment[];
  hasMore: boolean;
}

// ============================================================================
// V7: TOKEN PRICE TYPE
// ============================================================================

export interface TokenPrice {
  address: string;
  sharePrice: number;
  sharePriceUsd: number;
  marketCapUsd: number;
  graduationTarget: number;
  graduationProgress: number;
  holders: number;
  topHolderPercent: number;
  totalShares: number;
  totalSol: number;
  status: TokenStatus;
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface TokenQueryParams {
  status?: TokenStatus;
  sort?: "newest" | "oldest" | "most_funded" | "closest_to_graduation";
  limit?: number;
  offset?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
