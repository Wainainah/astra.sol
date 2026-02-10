/**
 * API client functions for fetching data from the backend
 */

import type { Token, Position, UserPositionsResponse } from "@/lib/api-types";

export async function getTokens(params: { limit?: number } = {}): Promise<{ tokens: Token[] }> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetch(`/api/tokens?${searchParams.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch tokens");
  return response.json();
}

export async function getCreatedTokens(creatorAddress: string): Promise<{ tokens: Token[] }> {
  const response = await fetch(`/api/tokens?creator=${creatorAddress}`);
  if (!response.ok) throw new Error("Failed to fetch created tokens");
  return response.json();
}

export async function getUserPositions(userAddress: string): Promise<UserPositionsResponse> {
  const response = await fetch(`/api/users/${userAddress}/positions`);
  if (!response.ok) throw new Error("Failed to fetch user positions");
  return response.json();
}

export async function getTokensByAddresses(addresses: string[]): Promise<{ tokens: Token[] }> {
  if (addresses.length === 0) return { tokens: [] };
  const response = await fetch(`/api/tokens?addresses=${addresses.join(",")}`);
  if (!response.ok) throw new Error("Failed to fetch tokens by addresses");
  return response.json();
}
