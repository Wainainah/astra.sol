"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2, AlertTriangle } from "lucide-react";

interface SlippageSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const PRESETS = [0.5, 1, 2];
const HIGH_SLIPPAGE_THRESHOLD = 5;
const MAX_SLIPPAGE = 50;

export function SlippageSelector({ value, onChange }: SlippageSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [isHighSlippage, setIsHighSlippage] = useState(false);

  // Load saved slippage from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("astra-slippage-v7");
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 0 && parsed <= MAX_SLIPPAGE) {
        onChange(parsed);
        setIsHighSlippage(parsed > HIGH_SLIPPAGE_THRESHOLD);
        if (!PRESETS.includes(parsed)) {
          setIsCustom(true);
          setCustomValue(parsed.toString());
        }
      }
    }
    // Only run on mount - onChange is stable from parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetClick = (preset: number) => {
    setIsCustom(false);
    onChange(preset);
    setIsHighSlippage(preset > HIGH_SLIPPAGE_THRESHOLD);
    localStorage.setItem("astra-slippage-v7", preset.toString());
  };

  const handleCustomChange = (val: string) => {
    setCustomValue(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0 && parsed <= MAX_SLIPPAGE) {
      onChange(parsed);
      setIsHighSlippage(parsed > HIGH_SLIPPAGE_THRESHOLD);
      localStorage.setItem("astra-slippage-v7", parsed.toString());
    }
  };

  const displayValue = isCustom ? customValue : value.toString();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Slippage</Label>
        {isHighSlippage && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 gap-1 font-mono ${
              isHighSlippage 
                ? "text-amber-500 hover:text-amber-600" 
                : ""
            }`}
            aria-label={`Slippage tolerance: ${value}%. Click to change.`}
          >
            {value}%
            <Settings2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-64" align="end">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Slippage Tolerance</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Max price movement before transaction reverts
              </p>
            </div>
            
            {/* Preset Buttons */}
            <div className="flex gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={
                    value === preset && !isCustom ? "default" : "outline"
                  }
                  size="sm"
                  className="flex-1 font-mono"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset}%
                </Button>
              ))}
            </div>
            
            {/* Custom Input */}
            <div className="flex items-center gap-2">
              <Button
                variant={isCustom ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCustom(true)}
              >
                Custom
              </Button>
              {isCustom && (
                <div className="flex items-center gap-1 flex-1">
                  <label htmlFor="custom-slippage-input" className="sr-only">
                    Custom slippage percentage
                  </label>
                  <Input
                    id="custom-slippage-input"
                    type="number"
                    value={customValue}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    className="h-8 font-mono"
                    placeholder="0.0"
                    step="0.1"
                    min="0.1"
                    max={MAX_SLIPPAGE}
                    aria-describedby="slippage-unit"
                  />
                  <span
                    id="slippage-unit"
                    className="text-sm text-muted-foreground"
                  >
                    %
                  </span>
                </div>
              )}
            </div>
            
            {/* High Slippage Warning */}
            {isHighSlippage && (
              <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600">
                  High slippage increases risk of unfavorable prices. 
                  Use with caution.
                </p>
              </div>
            )}
            
            {/* Info Text */}
            <p className="text-xs text-muted-foreground">
              Your transaction will revert if the price changes more than {value}% 
              during execution.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
