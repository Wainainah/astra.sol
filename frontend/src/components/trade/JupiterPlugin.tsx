"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import "@/types/jupiter.d";

interface JupiterPluginProps {
    /** Input token mint address (defaults to SOL) */
    inputMint?: string;
    /** Output token mint address (the graduated token) */
    outputMint: string;
    /** Whether to fix the output mint (user can't change it) */
    fixedOutputMint?: boolean;
}

// Native SOL mint address
const SOL_MINT = "So11111111111111111111111111111111111111112";

export function JupiterPlugin({
    inputMint = SOL_MINT,
    outputMint,
    fixedOutputMint = true,
}: JupiterPluginProps) {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const initialized = useRef(false);

    useEffect(() => {
        // Wait for Jupiter to be loaded
        if (typeof window === "undefined" || !window.Jupiter) {
            console.warn("Jupiter Plugin not loaded yet");
            return;
        }

        // Prevent double initialization
        if (initialized.current) return;
        initialized.current = true;

        try {
            window.Jupiter.init({
                displayMode: "integrated",
                integratedTargetId: "jupiter-swap-widget",
                enableWalletPassthrough: true,
                formProps: {
                    initialInputMint: inputMint,
                    initialOutputMint: outputMint,
                    fixedOutputMint: fixedOutputMint,
                },
                // Pass wallet context for passthrough
                passthroughWallet: publicKey ? {
                    publicKey,
                    signTransaction,
                    signAllTransactions,
                } : undefined,
            });
        } catch (error) {
            console.error("Failed to initialize Jupiter Plugin:", error);
        }

        return () => {
            // Cleanup on unmount
            initialized.current = false;
            if (window.Jupiter?.close) {
                try {
                    window.Jupiter.close();
                } catch {
                    // Ignore cleanup errors
                }
            }
        };
    }, [publicKey, inputMint, outputMint, fixedOutputMint, signTransaction, signAllTransactions]);

    return (
        <div
            id="jupiter-swap-widget"
            className="w-full rounded-lg overflow-hidden"
            style={{ minHeight: 450 }}
        />
    );
}
