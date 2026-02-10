/**
 * Mock vault data for development
 */

export interface VaultInfo {
  launchAddress: string;
  vaultAddress: string;
  tokenName: string;
  ticker: string;
  lastPokeTimestamp: Date;
  pendingRewards: number;
  totalPoked: number;
  rewardsValueUsd: number;
  totalRewardsEarned: number;
  aprPercent: number;
  lpValue: number;
  solAmount: number;
  tokenAmount: number;
  creatorShare: number;
  protocolShare: number;
  autoCompounded: number;
  lastPokerAddress: string;
}

export function getMockVaults(userAddress: string): VaultInfo[] {
  // Return empty array in production, mock data in development
  if (process.env.NODE_ENV !== "development") return [];

  return [
    {
      launchAddress: "MockVault111111111111111111111111111111111",
      vaultAddress: "MockVaultAddr11111111111111111111111111111",
      tokenName: "Mock Token",
      ticker: "MOCK",
      lastPokeTimestamp: new Date(Date.now() - 86400000),
      pendingRewards: 0.05,
      totalPoked: 10,
      rewardsValueUsd: 150.0,
      totalRewardsEarned: 1.25,
      aprPercent: 24.5,
      lpValue: 2500,
      solAmount: 5.0,
      tokenAmount: 500000,
      creatorShare: 0.75,
      protocolShare: 0.125,
      autoCompounded: 0.3625,
      lastPokerAddress: "Poker111111111111111111111111111111111111111",
    },
  ];
}
