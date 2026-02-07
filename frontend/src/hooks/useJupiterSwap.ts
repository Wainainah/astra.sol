/**
 * React hook for Jupiter Ultra API swaps
 * Provides programmatic control over swap execution
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { toast } from 'sonner';
import {
    getSwapOrder,
    executeSwapOrder,
    SOL_MINT,
    solToLamports,
    lamportsToSol,
} from '@/lib/jupiter';

export type SwapStatus = 'idle' | 'quoting' | 'signing' | 'executing' | 'success' | 'error';

interface UseJupiterSwapProps {
    tokenMint: string;
}

interface SwapResult {
    signature?: string;
    inAmount?: string;
    outAmount?: string;
}

export function useJupiterSwap({ tokenMint }: UseJupiterSwapProps) {
    const { publicKey, signTransaction } = useWallet();
    const [status, setStatus] = useState<SwapStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    /**
     * Buy tokens with SOL
     * @param solAmount - Amount of SOL to spend (as string, e.g., "0.1")
     */
    const buy = useCallback(async (solAmount: string): Promise<SwapResult | null> => {
        if (!publicKey || !signTransaction) {
            toast.error('Wallet not connected');
            return null;
        }

        try {
            setStatus('quoting');
            setError(null);

            const amount = solToLamports(parseFloat(solAmount));

            // Get order from Jupiter
            const order = await getSwapOrder({
                inputMint: SOL_MINT,
                outputMint: tokenMint,
                amount,
                taker: publicKey.toString(),
            });

            if (order.error) {
                throw new Error(order.error);
            }

            // Deserialize and sign transaction
            setStatus('signing');
            const txBuffer = Buffer.from(order.transaction, 'base64');
            const tx = VersionedTransaction.deserialize(txBuffer);
            const signed = await signTransaction(tx);
            const signedBase64 = Buffer.from(signed.serialize()).toString('base64');

            // Execute swap
            setStatus('executing');
            const result = await executeSwapOrder(signedBase64, order.requestId);

            if (result.status === 'Success') {
                setStatus('success');
                toast.success('Swap successful!', {
                    description: `Received ~${lamportsToSol(order.outAmount).toFixed(4)} tokens`,
                    action: result.signature ? {
                        label: 'View',
                        onClick: () => window.open(`https://solscan.io/tx/${result.signature}`, '_blank'),
                    } : undefined,
                });
                return {
                    signature: result.signature,
                    inAmount: order.inAmount,
                    outAmount: order.outAmount,
                };
            } else {
                throw new Error(result.error || result.transactionError || 'Swap failed');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Jupiter buy failed:', err);
            setStatus('error');
            setError(message);
            toast.error('Swap failed', { description: message });
            return null;
        }
    }, [publicKey, signTransaction, tokenMint]);

    /**
     * Sell tokens for SOL
     * @param tokenAmount - Amount of tokens to sell (in smallest unit as string)
     */
    const sell = useCallback(async (tokenAmount: string): Promise<SwapResult | null> => {
        if (!publicKey || !signTransaction) {
            toast.error('Wallet not connected');
            return null;
        }

        try {
            setStatus('quoting');
            setError(null);

            // Get order from Jupiter
            const order = await getSwapOrder({
                inputMint: tokenMint,
                outputMint: SOL_MINT,
                amount: tokenAmount,
                taker: publicKey.toString(),
            });

            if (order.error) {
                throw new Error(order.error);
            }

            // Deserialize and sign transaction
            setStatus('signing');
            const txBuffer = Buffer.from(order.transaction, 'base64');
            const tx = VersionedTransaction.deserialize(txBuffer);
            const signed = await signTransaction(tx);
            const signedBase64 = Buffer.from(signed.serialize()).toString('base64');

            // Execute swap
            setStatus('executing');
            const result = await executeSwapOrder(signedBase64, order.requestId);

            if (result.status === 'Success') {
                setStatus('success');
                toast.success('Swap successful!', {
                    description: `Received ~${lamportsToSol(order.outAmount).toFixed(4)} SOL`,
                    action: result.signature ? {
                        label: 'View',
                        onClick: () => window.open(`https://solscan.io/tx/${result.signature}`, '_blank'),
                    } : undefined,
                });
                return {
                    signature: result.signature,
                    inAmount: order.inAmount,
                    outAmount: order.outAmount,
                };
            } else {
                throw new Error(result.error || result.transactionError || 'Swap failed');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Jupiter sell failed:', err);
            setStatus('error');
            setError(message);
            toast.error('Swap failed', { description: message });
            return null;
        }
    }, [publicKey, signTransaction, tokenMint]);

    const reset = useCallback(() => {
        setStatus('idle');
        setError(null);
    }, []);

    return {
        buy,
        sell,
        status,
        error,
        reset,
        isPending: status !== 'idle' && status !== 'success' && status !== 'error',
    };
}
