/**
 * TypeScript declarations for Jupiter Plugin
 * @see https://station.jup.ag/docs/ultra/plugin-integration
 */

import { PublicKey } from "@solana/web3.js";

interface JupiterFormProps {
    initialInputMint?: string;
    initialOutputMint?: string;
    fixedInputMint?: boolean;
    fixedOutputMint?: boolean;
    initialAmount?: string;
    fixedAmount?: boolean;
}

interface JupiterPassthroughWallet {
    publicKey: PublicKey | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signTransaction?: (transaction: any) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signAllTransactions?: (transactions: any[]) => Promise<any[]>;
}

interface JupiterInitOptions {
    displayMode: "integrated" | "widget" | "modal";
    integratedTargetId?: string;
    enableWalletPassthrough?: boolean;
    formProps?: JupiterFormProps;
    passthroughWallet?: JupiterPassthroughWallet;
}

interface JupiterInstance {
    init: (options: JupiterInitOptions) => void;
    close?: () => void;
    resume?: () => void;
}

declare global {
    interface Window {
        Jupiter: JupiterInstance;
    }
}

export { };
