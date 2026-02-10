/**
 * useAnchorProgram Hook - Stub
 * 
 * TODO: Implement actual Anchor program connection
 */

import { useMemo } from "react";

interface UseAnchorProgramResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any;
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
