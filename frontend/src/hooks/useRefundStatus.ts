import { useMemo } from "react";

/**
 * Hook to track automatic refund status for failed launches (ADR-002)
 * 
 * Refunds are now automatic - users don't need to claim.
 * This hook tracks the status for display purposes.
 */
export function useRefundStatus({
    launchAddress,
    isGraduated,
    refundMode,
    hasClaimedRefund,
    lockedBasis = 0,
    unlockedBasis = 0,
}: {
    launchAddress: string | undefined;
    isGraduated: boolean;
    refundMode: boolean;
    hasClaimedRefund: boolean;
    lockedBasis?: number;
    unlockedBasis?: number;
}) {
    const status = useMemo(() => {
        if (!launchAddress) return 'loading';
        if (isGraduated) return 'graduated';
        if (!refundMode) return 'active'; // Launch still active
        if (hasClaimedRefund) return 'completed';
        return 'processing'; // Refund mode active, awaiting automatic processing
    }, [launchAddress, isGraduated, refundMode, hasClaimedRefund]);

    const expectedAmount = useMemo(() => {
        return lockedBasis + unlockedBasis;
    }, [lockedBasis, unlockedBasis]);

    const statusMessage = useMemo(() => {
        switch (status) {
            case 'loading':
                return 'Loading...';
            case 'graduated':
                return 'Launch graduated successfully!';
            case 'active':
                return 'Launch is still active';
            case 'processing':
                return 'Refund being processed automatically...';
            case 'completed':
                return 'Refund sent to your wallet!';
            default:
                return '';
        }
    }, [status]);

    return {
        status,
        statusMessage,
        expectedAmount,
        isRefundPending: status === 'processing',
        isRefundComplete: status === 'completed',
        canShowRefundInfo: status === 'processing' || status === 'completed',
    };
}
