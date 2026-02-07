"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SlippageSelector } from "./SlippageSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Loader2, 
  AlertTriangle, 
  TrendingDown, 
  Wallet, 
  ArrowRight,
  XCircle,
  Info
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSell } from "@/hooks/useSell";
import { useSolPrice } from "@/hooks/useSolPrice";
import { getSellQuote, getPositionValue } from "@/lib/curve";
import { Token, Position } from "@/lib/api-types";
import { Card } from "@/components/ui/card";

interface SellFormProps {
  token: Token;
  position: Position | null;
  onSuccess?: () => void;
}

export function SellForm({ token, position, onSuccess }: SellFormProps) {
  const [sharesToSell, setSharesToSell] = useState("");
  const [slippage, setSlippage] = useState(1);

  const { connected } = useWallet();
  const { toUsd, price: solPriceUsd } = useSolPrice();
  const { sell, isPending } = useSell({ launchAddress: token.address });

  const userShares = position?.shares ?? 0;
  const userBasis = position?.solBasis ?? 0;

  const sharesValue = parseFloat(sharesToSell) || 0;
  const percentage = userShares > 0 ? (sharesValue / userShares) * 100 : 0;

  // V7: Calculate sell quote with "leaving behind" warning
  const quote = useMemo(() => {
    if (sharesValue <= 0 || userShares === 0) return null;
    
    return getSellQuote(
      Math.floor(sharesValue),
      userShares,
      userBasis,
      token.totalShares,
      solPriceUsd
    );
  }, [sharesValue, userShares, userBasis, token.totalShares, solPriceUsd]);

  // Calculate current position value on curve
  const currentPositionValue = useMemo(() => {
    if (userShares === 0) return 0;
    return getPositionValue(userShares, token.totalShares);
  }, [userShares, token.totalShares]);

  const currentPositionValueUsd = toUsd(currentPositionValue / 1e9);
  const currentPositionValueSol = currentPositionValue / 1e9;

  const handleSell = async () => {
    if (sharesValue <= 0 || sharesValue > userShares) return;
    await sell(Math.floor(sharesValue).toString());
    setSharesToSell("");
    onSuccess?.();
  };

  const handleSliderChange = (value: number[]) => {
    const percent = value[0];
    const shares = Math.floor((percent / 100) * userShares);
    setSharesToSell(shares.toString());
  };

  const handleMaxClick = () => {
    setSharesToSell(userShares.toString());
  };

  const isDisabled = 
    isPending || 
    sharesValue <= 0 || 
    sharesValue > userShares || 
    !connected;

  const getButtonText = () => {
    if (isPending) return "Processing...";
    if (!connected) return "Connect Wallet";
    if (userShares === 0) return "No Shares to Sell";
    return "Sell Shares";
  };

  // No position state
  if (userShares === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center border-dashed border-2">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg mb-1">No Position</h3>
          <p className="text-sm text-muted-foreground">
            You don&apos;t own any shares of {token.name} yet.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Position Summary Card */}
      <Card className="p-4 bg-muted/30 border-border/50">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Position</p>
            <p className="font-mono font-bold text-lg">{userShares.toLocaleString()} shares</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Value</p>
            <p className="font-mono font-bold text-lg text-success">
              {currentPositionValueSol.toFixed(4)} SOL
            </p>
            <p className="text-xs text-muted-foreground">
              ≈ ${currentPositionValueUsd.toFixed(2)}
            </p>
          </div>
        </div>
        
        {position && (
          <div className="flex justify-between text-xs border-t border-border/30 pt-2">
            <span className="text-muted-foreground">
              Invested: {(position.solBasis / 1e9).toFixed(4)} SOL
            </span>
            <span className="text-muted-foreground">
              Ownership: {((position.shares / token.totalShares) * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </Card>

      {/* Shares Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="shares-amount" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Shares to Sell
          </Label>
          <button
            type="button"
            onClick={handleMaxClick}
            className="text-xs text-primary hover:underline font-medium bg-primary/10 px-2 py-0.5 rounded transition-colors"
          >
            MAX
          </button>
        </div>
        <div className="relative">
          <Input
            id="shares-amount"
            type="number"
            placeholder="0"
            value={sharesToSell}
            onChange={(e) => setSharesToSell(e.target.value)}
            className="font-mono text-xl h-14 pr-20 bg-background/50 border-border/50 focus:border-destructive"
            max={userShares}
            min="0"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
            shares
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2 px-1">
        <Slider
          value={[Math.min(percentage, 100)]}
          onValueChange={handleSliderChange}
          max={100}
          step={1}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Slippage */}
      <SlippageSelector value={slippage} onChange={setSlippage} />

      {/* Sell Quote - THE KEY V7 UX */}
      {quote && (
        <div className="space-y-3">
          {/* Refund Amount - Small */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Refund Amount</span>
              <div className="text-right">
                <span className="font-mono text-sm">
                  {(quote.refundAmount / 1e9).toFixed(4)} SOL
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  (${quote.refundAmountUsd.toFixed(2)})
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Proportional refund based on your original investment
            </p>
          </div>

          {/* CRITICAL WARNING: Leaving Behind - BIG AND RED */}
          {quote.leavingBehind > 0 && (
            <Card className="p-4 bg-destructive/10 border-destructive/30 border-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-destructive text-lg mb-1">
                    You&apos;re Leaving Money on the Table!
                  </h4>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-destructive">
                      ${quote.leavingBehindUsd.toFixed(2)}
                    </span>
                    <span className="text-sm text-destructive/70">
                      ({(quote.leavingBehind / 1e9).toFixed(4)} SOL)
                    </span>
                  </div>

                  <p className="text-sm text-destructive/80 mb-3">
                    These are unrealized gains you&apos;ll lose by selling now.
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded">
                    <ArrowRight className="h-3 w-3" />
                    <span>
                      Hold until graduation to capture full value of 
                      <strong className="text-success"> ${currentPositionValueUsd.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ROI Indicator */}
          {position?.roiPercent !== undefined && position.roiPercent > 0 && (
            <div className="flex justify-between items-center p-2 bg-success/5 rounded border border-success/20">
              <span className="text-xs text-success flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Your position is up {position.roiPercent.toFixed(0)}%
              </span>
              <span className="text-[10px] text-muted-foreground">
                Selling = missing the upside
              </span>
            </div>
          )}
        </div>
      )}

      {/* Explanation Alert */}
      <Alert className="bg-amber-500/5 border-amber-500/20">
        <Info className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-xs leading-relaxed">
          <strong className="text-amber-600">Important:</strong> Selling gives you a 
          proportional refund of your original investment, not the current market value. 
          Your gains only materialize at graduation. 
          <span className="block mt-1 text-muted-foreground">
            Sell = full refund but no gains. Hold = capture full value at graduation.
          </span>
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Button
        className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground h-14 text-lg font-bold shadow-lg shadow-destructive/20 transition-all"
        onClick={handleSell}
        disabled={isDisabled}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <XCircle className="h-5 w-5 mr-2" />
        )}
        {getButtonText()}
      </Button>

      {/* Additional Warning for Large Sells */}
      {quote && quote.leavingBehindUsd > 100 && (
        <p className="text-center text-xs text-destructive/70">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          You&apos;re about to leave ${quote.leavingBehindUsd.toFixed(0)}+ in gains behind. 
          Consider holding longer.
        </p>
      )}
    </div>
  );
}
