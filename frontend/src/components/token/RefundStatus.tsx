"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useRefundStatus } from "@/hooks/useRefundStatus";

interface RefundStatusProps {
    launchAddress: string;
    launchName: string;
    isGraduated: boolean;
    refundMode: boolean;
    hasClaimedRefund: boolean;
    lockedBasis?: number;
    unlockedBasis?: number;
}

/**
 * Displays automatic refund status for failed launches (ADR-002)
 * 
 * Refunds are now processed automatically by the protocol.
 * Users don't need to take any action.
 */
export function RefundStatus({
    launchAddress,
    launchName: _launchName,
    isGraduated,
    refundMode,
    hasClaimedRefund,
    lockedBasis = 0,
    unlockedBasis = 0,
}: RefundStatusProps) {
    const {
        status,
        statusMessage,
        expectedAmount,
        canShowRefundInfo,
    } = useRefundStatus({
        launchAddress,
        isGraduated,
        refundMode,
        hasClaimedRefund,
        lockedBasis,
        unlockedBasis,
    });

    // Don't show anything for active or graduated launches
    if (!canShowRefundInfo) {
        return null;
    }

    const formatSol = (lamports: number) => {
        return (lamports / 1e9).toFixed(4);
    };

    return (
        <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {status === 'processing' && (
                        <div className="p-2 rounded-full bg-amber-500/20">
                            <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                        </div>
                    )}
                    {status === 'completed' && (
                        <div className="p-2 rounded-full bg-green-500/20">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">
                                {status === 'processing' ? 'Refund In Progress' : 'Refund Complete'}
                            </h3>
                            <Badge
                                variant={status === 'completed' ? 'default' : 'secondary'}
                                className={status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}
                            >
                                {status === 'completed' ? 'Sent' : 'Processing'}
                            </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                            {statusMessage}
                        </p>

                        {expectedAmount > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="font-mono font-medium">
                                    {formatSol(expectedAmount)} SOL
                                </span>
                            </div>
                        )}

                        {status === 'processing' && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Your refund will be sent automatically. No action needed.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Simplified inline refund indicator for use in lists
 */
export function RefundBadge({
    refundMode,
    hasClaimedRefund,
}: {
    refundMode: boolean;
    hasClaimedRefund: boolean;
}) {
    if (!refundMode) return null;

    if (hasClaimedRefund) {
        return (
            <Badge variant="outline" className="text-green-500 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Refunded
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="text-amber-500 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Refund Pending
        </Badge>
    );
}
