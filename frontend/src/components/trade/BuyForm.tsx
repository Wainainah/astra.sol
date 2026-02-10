"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlippageSelector } from "./SlippageSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, Users, Target, Zap } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBuy } from "@/hooks/useBuy";
import { useSolPrice } from "@/hooks/useSolPrice";
import { getBuyQuote, getGraduationProgress } from "@/lib/curve";
import { BUY_PRESETS_USD, GRADUATION_MARKET_CAP_USD } from "@/lib/constants";
import { Token } from "@/lib/api-types";
import { Progress } from "@/components/ui/progress";

interface BuyFormProps {
  token: Token;
  userShares?: number;
  onSuccess?: () => void;
}

export function BuyForm({ token, userShares = 0, onSuccess }: BuyFormProps) {
  const [solAmount, setSolAmount] = useState("");
  const [slippage, setSlippage] = useState(1);

  const { connected } = useWallet();
  const { toUsd, toSol, price: solPriceUsd } = useSolPrice();
  const { buy, isPending } = useBuy({ launchAddress: token.address });

  const solValue = parseFloat(solAmount) || 0;
  const usdValue = toUsd(solValue);

  // V7: Calculate buy quote using curve math
  const quote = useMemo(() => {
    if (solValue <= 0) return null;
    
    return getBuyQuote(
      Math.floor(solValue * 1e9), // Convert SOL to lamports
      token.totalShares,
      userShares,
      solPriceUsd
    );
  }, [solValue, token.totalShares, userShares, solPriceUsd]);

  // Calculate graduation progress after purchase
  const graduationProgressAfter = quote?.graduationProgressAfter ?? token.graduationProgress;
  const progressDelta = graduationProgressAfter - token.graduationProgress;

  const handleBuy = async () => {
    if (solValue <= 0) return;
    await buy(token.address, solValue);
    setSolAmount("");
    onSuccess?.();
  };

  const handlePresetClick = (usdAmount: number) => {
    const solValue = toSol(usdAmount);
    setSolAmount(solValue.toFixed(4));
  };

  const isDisabled = isPending || solValue <= 0 || !connected;

  const getButtonText = () => {
    if (isPending) return "Processing...";
    if (!connected) return "Connect Wallet";
    return "Buy Shares";
  };

  return (
    <div className="space-y-4">
      {/* USD Preset Buttons */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Quick Amounts (USD)</Label>
        <div className="grid grid-cols-5 gap-2">
          {BUY_PRESETS_USD.map((usdAmount) => (
            <Button
              key={usdAmount}
              variant="outline"
              size="sm"
              className="w-full font-mono h-10 px-0 text-xs hover:bg-primary/10 hover:border-primary/50 transition-colors"
              onClick={() => handlePresetClick(usdAmount)}
            >
              ${usdAmount}
            </Button>
          ))}
        </div>
      </div>

      {/* SOL Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="sol-amount" className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Amount in SOL
          </Label>
          {solValue > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              ≈ ${usdValue.toFixed(2)} USD
            </span>
          )}
        </div>
        <div className="relative">
          <Input
            id="sol-amount"
            type="number"
            placeholder="0.0"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
            className="font-mono text-xl h-14 pr-16 bg-background/50 border-border/50 focus:border-primary"
            step="0.001"
            min="0"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
            SOL
          </div>
        </div>
      </div>

      {/* Slippage */}
      <SlippageSelector value={slippage} onChange={setSlippage} />

      {/* Buy Quote Preview */}
      {quote && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Estimated Shares
            </span>
            <span className="font-mono font-bold text-lg text-primary">
              {quote.sharesOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Ownership
            </span>
            <span className="font-mono font-bold">
              {quote.ownershipPercentAfter.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Market Cap After</span>
            <span className="font-mono">
              ${quote.marketCapAfterUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price per Share</span>
            <span className="font-mono text-xs">
              {quote.pricePerShareUsd < 0.01 
                ? `< $0.01` 
                : `$${quote.pricePerShareUsd.toFixed(4)}`}
            </span>
          </div>

          {/* Graduation Progress */}
          <div className="pt-2 border-t border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Graduation Progress
              </span>
              <span className="font-mono text-sm">
                {graduationProgressAfter.toFixed(1)}%
                {progressDelta > 0 && (
                  <span className="text-success text-xs ml-1">
                    (+{progressDelta.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <Progress 
              value={graduationProgressAfter} 
              className="h-2"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              Target: ${GRADUATION_MARKET_CAP_USD.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Info Alert */}
      <Alert className="bg-primary/5 border-primary/20">
        <AlertDescription className="text-xs leading-relaxed">
          <strong className="text-primary">How it works:</strong> Shares increase in value as 
          the curve rises. At graduation, your shares convert to tradable tokens. 
          Sell anytime for a proportional refund.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Button
        className="w-full bg-success hover:bg-success/90 text-success-foreground h-14 text-lg font-bold shadow-lg shadow-success/20 transition-all"
        onClick={handleBuy}
        disabled={isDisabled}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <TrendingUp className="h-5 w-5 mr-2" />
        )}
        {getButtonText()}
      </Button>
    </div>
  );
}
