import { useState } from "react";
import { toast } from "sonner";

/**
 * @deprecated Use useRefundStatus instead for automatic refund tracking (ADR-002)
 *
 * This hook was for user-initiated refunds. Refunds are now automatic.
 * Kept for backwards compatibility but will show info about automatic refunds.
 *
 * @see useRefundStatus - New hook for tracking automatic refund status
 */
export function useRefund({ launchAddress: _launchAddress }: { launchAddress: string | undefined }) {
    const [isPending] = useState(false);

    const refund = async () => {
        // Refunds are now automatic - no user action needed
        toast.info("Refunds are now automatic!", {
            description: "Your refund will be sent to your wallet automatically. No action needed."
        });
    };

    return {
        refund,
        isPending
    };
}
