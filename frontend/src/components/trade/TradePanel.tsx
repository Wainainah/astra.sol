"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuyForm } from "./BuyForm";
import { SellForm } from "./SellForm";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/ui/wallet-button";
import { Token, Position, TokenStatus } from "@/lib/api-types";
import { TrendingUp, TrendingDown, Shield, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TradePanelProps {
  token: Token;
  position: Position | null;
  onTradeSuccess?: () => void;
}

export function TradePanel({ token, position, onTradeSuccess }: TradePanelProps) {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState("buy");

  const isGraduated = token.status === "graduated";
  const isRefunding = token.status === "refunding";
  const isActive = token.status === "active";

  // Graduated token state - show DEX link
  if (isGraduated) {
    return (
      <Card className="border-2 border-success/30 overflow-hidden">
        <CardHeader className="bg-success/5 border-b border-success/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <div>
                <h3 className="font-bold text-success">Graduated</h3>
                <p className="text-xs text-muted-foreground">
                  Trading on Jupiter DEX
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-success/30 text-success">
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                This token has graduated and is now trading on Jupiter DEX
              </p>
              {token.graduatedToken && (
                <Button asChild variant="outline" className="gap-2">
                  <Link
                    href={`https://jup.ag/swap/SOL-${token.graduatedToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Trade on Jupiter
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            
            {position && position.shares > 0 && (
              <div className="p-3 bg-primary/5 rounded border border-primary/20">
                <p className="text-sm">
                  You have <strong>{position.shares.toLocaleString()}</strong> shares 
                  to claim as tokens
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Refunding state
  if (isRefunding) {
    return (
      <Card className="border-2 border-destructive/30 overflow-hidden">
        <CardHeader className="bg-destructive/5 border-b border-destructive/20 p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <div>
              <h3 className="font-bold text-destructive">Refund Mode</h3>
              <p className="text-xs text-muted-foreground">
                Token failed to graduate
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              This token did not meet graduation requirements. 
              Refunds are available for all participants.
            </p>
            
            {position && position.solBasis > 0 && !position.hasClaimedRefund && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm mb-2">
                  Your refund: <strong>{(position.solBasis / 1e9).toFixed(4)} SOL</strong>
                </p>
                <Button variant="destructive" className="w-full">
                  Claim Refund
                </Button>
              </div>
            )}
            
            {position?.hasClaimedRefund && (
              <Badge variant="outline" className="text-muted-foreground">
                Refund Already Claimed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active bonding curve trading
  return (
    <Card className="border-2 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <CardHeader className="p-0 border-b">
          <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted p-1 h-14">
            <TabsTrigger
              value="buy"
              className="rounded-sm data-[state=active]:bg-success data-[state=active]:text-success-foreground font-bold data-[state=active]:shadow-sm transition-all flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Buy
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="rounded-sm data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground font-bold data-[state=active]:shadow-sm transition-all flex items-center gap-2"
            >
              <TrendingDown className="h-4 w-4" />
              Sell
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        
        <CardContent className="pt-6">
          {!connected ? (
            <div className="text-center py-8 space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your wallet to trade {token.name}
                </p>
                <div className="flex justify-center">
                  <WalletButton />
                </div>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="buy" className="mt-0">
                <BuyForm 
                  token={token} 
                  userShares={position?.shares ?? 0}
                  onSuccess={onTradeSuccess}
                />
              </TabsContent>
              
              <TabsContent value="sell" className="mt-0">
                <SellForm 
                  token={token} 
                  position={position}
                  onSuccess={onTradeSuccess}
                />
              </TabsContent>
            </>
          )}
        </CardContent>
      </Tabs>
      
      {/* Token Info Footer */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/30">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Active
            </span>
            <span>
              {(token.graduationProgress ?? 0).toFixed(1)}% to graduation
            </span>
          </div>
          <span className="font-mono">
            {token.holders} holders
          </span>
        </div>
      </div>
    </Card>
  );
}
