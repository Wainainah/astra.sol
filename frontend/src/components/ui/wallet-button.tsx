"use client";

/**
 * WalletButton - Connect Wallet Button
 * 
 * Styled button that triggers the Solana wallet modal
 */

import { Button } from "@/components/ui/button";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function WalletButton({
  className,
  size = "default",
  variant = "default",
}: WalletButtonProps) {
  const { setVisible } = useWalletModal();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setVisible(true)}
      className={cn(
        "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500",
        "text-white font-medium",
        className
      )}
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
