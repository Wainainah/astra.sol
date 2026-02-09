/**
 * useAnchorProgram Hook - Stub
 * 
 * TODO: Implement actual Anchor program connection
 */

import { useMemo } from "react";

interface UseAnchorProgramResult {
  program: null;
  isLoading: boolean;
  error: Error | null;
}

export function useAnchorProgram(programId?: string): UseAnchorProgramResult {
  return useMemo(
    () => ({
      program: null,
      isLoading: false,
      error: null,
    }),
    [programId]
  );
}
