"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Info,
  Loader2,
  Sprout,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useSolPrice } from "@/hooks/useSolPrice";
// USD-BASED SEED CONFIGURATION
// ⚠️ All monetary values are in USD and converted to SOL at runtime using live price
// This ensures consistent minimum ($40 USD) regardless of SOL price volatility

import {
  MIN_SEED_USD, // $40 USD minimum (DO NOT CHANGE TO SOL)
  MAX_SEED_USD, // $20,000 USD maximum (NEW)
  RECOMMENDED_SEED_MIN_USD, // $10 USD recommended minimum
  RECOMMENDED_SEED_MAX_USD, // $500 USD recommended maximum
  DEFAULT_SOL_PRICE_USD, // $200 USD fallback price
  VESTING_DAYS,
  TOP1_MAX_BPS,
  formatUSD,
  usdToSol,
  calculateMaxSeedSol,
} from "@/lib/constants";

interface SeedStepProps {
  tokenName: string;
  tokenTicker: string;
  onBack: () => void;
  onConfirm: (seedAmount: string) => void;
  isPending: boolean;
}

// Calculate daily vesting percentage from 42 days
const DAILY_VEST_PERCENT = (100 / VESTING_DAYS).toFixed(1);

export function SeedStep({
  tokenName,
  tokenTicker,
  onBack,
  onConfirm,
  isPending,
}: SeedStepProps) {
  const { price: solPrice, isLoading: priceLoading } = useSolPrice();

  // Use live price or fallback (fallback updated hourly via GitHub Actions)
  const effectiveSolPrice = solPrice || DEFAULT_SOL_PRICE_USD;

  // USD → SOL conversion (DYNAMIC - never hardcode SOL values)
  // User always pays USD amount worth of SOL, SOL quantity varies with price
  const minSeedSol = MIN_SEED_USD / effectiveSolPrice; // $40 USD worth
  const maxSeedSol = calculateMaxSeedSol(effectiveSolPrice); // $20,000 USD worth (capped at 100 SOL)
  const recommendedMinSol = RECOMMENDED_SEED_MIN_USD / effectiveSolPrice; // $10 USD
  const recommendedMaxSol = RECOMMENDED_SEED_MAX_USD / effectiveSolPrice; // $500 USD

  // Default to recommended minimum
  const [seedAmount, setSeedAmount] = useState(recommendedMinSol);
  const [useCustom, setUseCustom] = useState(false);
  const [customValue, setCustomValue] = useState(recommendedMinSol.toFixed(3));

  const usdValue = Math.round(seedAmount * effectiveSolPrice);
  const isValidSeed = seedAmount >= minSeedSol;
  const isRecommended =
    usdValue >= RECOMMENDED_SEED_MIN_USD &&
    usdValue <= RECOMMENDED_SEED_MAX_USD;

  const handleConfirm = () => {
    if (!isValidSeed) return;
    onConfirm(seedAmount.toString());
  };

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setSeedAmount(num);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Seed Your Token</h3>
        <p className="text-sm text-muted-foreground">
          Set your initial SOL seed for{" "}
          <span className="font-medium">${tokenTicker}</span>
        </p>
      </div>

      {/* Seed Amount Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base">Creator Seed</CardTitle>
          </div>
          <CardDescription>
            Your initial investment into the bonding curve
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Amount Display */}
          <div className="text-center py-2">
            <p className="text-3xl font-bold font-mono">
              {seedAmount.toFixed(2)} SOL
            </p>
            <p className="text-sm text-muted-foreground">
              ≈ ${usdValue.toLocaleString()}
            </p>
          </div>

          {/* Quick Amount Presets - USD-Based */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Min", usd: MIN_SEED_USD }, // $40 USD minimum
              { label: "Starter", usd: 100 }, // $100 USD
              { label: "Growth", usd: 500 }, // $500 USD
              { label: "Pro", usd: 2000 }, // $2,000 USD
              { label: "Whale", usd: 10000 }, // $10,000 USD
              { label: "Max", usd: MAX_SEED_USD }, // $20,000 USD
            ].map(({ label, usd }) => {
              const solAmount = usd / effectiveSolPrice;
              const isSelected = Math.abs(usdValue - usd) < 5;
              return (
                <Button
                  key={label}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSeedAmount(solAmount);
                    setCustomValue(solAmount.toFixed(3));
                  }}
                  className="h-14 w-full px-0"
                >
                  <span className="font-mono text-sm">${usd}</span>
                </Button>
              );
            })}
          </div>

          {/* Slider or Custom Input */}
          {!useCustom ? (
            <div className="px-2">
              <label htmlFor="seed-slider" className="sr-only">
                Seed amount in SOL
              </label>
              <Slider
                id="seed-slider"
                value={[seedAmount]}
                onValueChange={([val]) => {
                  setSeedAmount(val);
                  setCustomValue(val.toFixed(3));
                }}
                min={minSeedSol} // $40 USD minimum (dynamic)
                max={maxSeedSol} // $20,000 USD max (capped at 100 SOL)
                step={0.001}
                className="w-full"
                aria-label={`Seed amount: ${seedAmount.toFixed(3)} SOL (${formatUSD(seedAmount * effectiveSolPrice)})`}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  Min: ${MIN_SEED_USD} USD (~{minSeedSol.toFixed(2)} SOL)
                </span>
                <span>Max: ${MAX_SEED_USD.toLocaleString()} USD</span>
              </div>
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className="text-xs text-primary hover:underline mt-2 block mx-auto"
              >
                Enter custom amount →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor="custom-seed-input" className="sr-only">
                  Custom seed amount in SOL
                </label>
                <Input
                  id="custom-seed-input"
                  type="number"
                  value={customValue}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  min={minSeedSol}
                  step={0.001}
                  className="font-mono"
                  placeholder={minSeedSol.toFixed(3)}
                  aria-describedby="seed-unit"
                />
                <span id="seed-unit" className="text-sm font-medium">
                  SOL
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseCustom(false);
                  setSeedAmount(
                    Math.min(
                      Math.max(seedAmount, minSeedSol),
                      recommendedMaxSol * 2,
                    ),
                  );
                }}
                className="text-xs text-primary hover:underline"
              >
                ← Use slider
              </button>
            </div>
          )}

          {/* Recommended range indicator */}
          {isRecommended && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>
                Recommended range (${MIN_SEED_USD}-$
                {RECOMMENDED_SEED_MAX_USD})
              </span>
            </div>
          )}

          {/* Vesting Info - V7: Simplified */}
          <Alert className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Seed vests over {VESTING_DAYS} days</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your seed is locked until graduation, then unlocks linearly over {VESTING_DAYS} days.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Why vesting?
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Vesting prevents creator dumps. Your tokens unlock gradually
                      after graduation, aligning incentives with long-term success.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </AlertDescription>
          </Alert>

          {/* Large seed warning */}
          {usdValue > RECOMMENDED_SEED_MAX_USD && (
            <Alert
              variant="default"
              className="border-yellow-500/50 bg-yellow-500/10"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Large seed:</span> Your share of
                supply will affect graduation gates (top holder must be &lt;
                {TOP1_MAX_BPS / 100}%). More community buy-in needed to dilute
                your position.
              </AlertDescription>
            </Alert>
          )}

          {/* Min seed error */}
          {seedAmount < minSeedSol && (
            <p className="text-sm text-destructive text-center">
              Minimum seed is ${MIN_SEED_USD} USD (≈{minSeedSol.toFixed(2)} SOL
              at current price)
            </p>
          )}

          {/* Max seed error */}
          {seedAmount > maxSeedSol && (
            <p className="text-sm text-destructive text-center">
              Maximum seed is ${MAX_SEED_USD.toLocaleString()} USD (limited by
              100 SOL on-chain maximum)
            </p>
          )}

          {/* SOL price indicator */}
          <p className="text-xs text-center text-muted-foreground">
            {priceLoading
              ? "Loading SOL price..."
              : `SOL ≈ $${effectiveSolPrice.toFixed(0)}`}
          </p>
        </CardContent>
      </Card>

      {/* Token Summary */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground mb-1">Creating:</p>
        <p className="font-semibold">{tokenName}</p>
        <p className="text-sm text-muted-foreground">${tokenTicker}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isPending}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleConfirm}
          disabled={isPending || !isValidSeed}
          className="flex-1"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Token"
          )}
        </Button>
      </div>
    </div>
  );
}
