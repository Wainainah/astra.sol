"use client";

/**
 * Create Token Page - Astra Protocol V7
 * 
 * Features:
 * - Form: Name, Symbol, Image, Description
 * - Seed amount (USD presets $40-$20K)
 * - Submit to create_launch
 * - Success redirect to token page
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import {
  Rocket,
  Upload,
  ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Info,
  DollarSign,
  Sparkles,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MIN_SEED_USD, MAX_SEED_USD } from "@/lib/constants";
import { useSolPrice } from "@/hooks/useSolPrice";

// Seed amount presets
const SEED_PRESETS = [10, 50, 100, 500, 1000, 5000, 10000, 20000];

// Form validation
interface FormErrors {
  name?: string;
  symbol?: string;
  description?: string;
  seedAmount?: string;
  image?: string;
}

export default function CreateTokenPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { toSol, price: solPriceUsd } = useSolPrice();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [seedAmount, setSeedAmount] = useState<number | null>(null);
  const [customSeedAmount, setCustomSeedAmount] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.length > 32) {
      newErrors.name = "Name must be 32 characters or less";
    }

    if (!symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    } else if (!/^[A-Za-z0-9]+$/.test(symbol)) {
      newErrors.symbol = "Symbol can only contain letters and numbers";
    } else if (symbol.length < 2 || symbol.length > 10) {
      newErrors.symbol = "Symbol must be 2-10 characters";
    }

    if (description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
    }

    const finalSeedAmount = seedAmount || parseFloat(customSeedAmount);
    if (!finalSeedAmount || finalSeedAmount < MIN_SEED_USD) {
      newErrors.seedAmount = `Minimum seed amount is $${MIN_SEED_USD}`;
    } else if (finalSeedAmount > MAX_SEED_USD) {
      newErrors.seedAmount = `Maximum seed amount is $${MAX_SEED_USD.toLocaleString()}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be under 5MB" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "File must be an image" }));
      return;
    }

    setImageFile(file);
    setErrors((prev) => ({ ...prev, image: undefined }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      }

      // Calculate seed amount in SOL
      const seedUsd = seedAmount || parseFloat(customSeedAmount);
      const seedSol = toSol(seedUsd);

      // Create token
      const response = await fetch("/api/tokens/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          description: description.trim(),
          image: imageUrl,
          seedAmount: seedSol,
          creator: publicKey.toBase58(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create token");
      }

      const data = await response.json();

      // Redirect to token page
      router.push(`/token/${data.address}`);
    } catch (error) {
      console.error("Error creating token:", error);
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : "Failed to create token",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate SOL equivalent
  const seedUsd = seedAmount || parseFloat(customSeedAmount) || 0;
  const seedSol = toSol(seedUsd);

  // Progress calculation
  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Not connected state
  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Launch Token</h1>
          <p className="text-slate-500 mt-1">
            Create your own token with a fair bonding curve
          </p>
        </div>

        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center mb-6">
              <Rocket className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-slate-500 text-center max-w-md">
              Connect your Solana wallet to create a new token launch
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">Launch Token</h1>
        <p className="text-slate-500">
          Create a new token with fair economics and transparent bonding curve
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Step {currentStep} of {totalSteps}</span>
          <span className="text-cyan-400">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Token Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Token Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Cyber Pepe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "bg-slate-900/50 border-slate-800",
                    errors.name && "border-red-500"
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-400">{errors.name}</p>
                )}
                <p className="text-xs text-slate-500">
                  Choose a memorable name for your token (2-32 characters)
                </p>
              </div>

              {/* Symbol */}
              <div className="space-y-2">
                <Label htmlFor="symbol">
                  Symbol <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="symbol"
                  placeholder="e.g., CPEPE"
                  value={symbol}
                  onChange={(e) =>
                    setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  }
                  className={cn(
                    "bg-slate-900/50 border-slate-800 font-mono",
                    errors.symbol && "border-red-500"
                  )}
                  maxLength={10}
                />
                {errors.symbol && (
                  <p className="text-sm text-red-400">{errors.symbol}</p>
                )}
                <p className="text-xs text-slate-500">
                  Ticker symbol, like BTC or SOL (2-10 characters)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your token..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-900/50 border-slate-800 min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-slate-500">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Token Image</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors",
                    "flex flex-col items-center gap-3",
                    imagePreview
                      ? "border-cyan-500/50 bg-cyan-500/5"
                      : "border-slate-700 hover:border-slate-600 bg-slate-900/30"
                  )}
                >
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-300 font-medium">
                          Click to upload image
                        </p>
                        <p className="text-sm text-slate-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {errors.image && (
                  <p className="text-sm text-red-400">{errors.image}</p>
                )}
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  if (name && symbol) {
                    setCurrentStep(2);
                  } else {
                    validateForm();
                  }
                }}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Seed Amount */}
        {currentStep === 2 && (
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Seed Investment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info Alert */}
              <Alert className="bg-cyan-500/5 border-cyan-500/20">
                <Info className="w-4 h-4 text-cyan-400" />
                <AlertDescription className="text-sm text-slate-300">
                  As the creator, you&apos;ll receive shares proportional to your seed
                  investment. This demonstrates commitment and kickstarts the bonding
                  curve.
                </AlertDescription>
              </Alert>

              {/* Seed Amount Presets */}
              <div className="space-y-3">
                <Label>Quick Select (USD)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {SEED_PRESETS.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={seedAmount === amount ? "default" : "outline"}
                      className={cn(
                        "h-14 flex flex-col items-center justify-center",
                        seedAmount === amount
                          ? "bg-cyan-600 border-cyan-500"
                          : "border-slate-700 hover:border-slate-600"
                      )}
                      onClick={() => {
                        setSeedAmount(amount);
                        setCustomSeedAmount("");
                      }}
                    >
                      <span className="font-bold">${amount.toLocaleString()}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label htmlFor="custom-seed">Or Enter Custom Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="custom-seed"
                    type="number"
                    placeholder={`${MIN_SEED_USD} - ${MAX_SEED_USD.toLocaleString()}`}
                    value={customSeedAmount}
                    onChange={(e) => {
                      setCustomSeedAmount(e.target.value);
                      setSeedAmount(null);
                    }}
                    className={cn(
                      "pl-10 bg-slate-900/50 border-slate-800",
                      errors.seedAmount && "border-red-500"
                    )}
                  />
                </div>
                {errors.seedAmount ? (
                  <p className="text-sm text-red-400">{errors.seedAmount}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Range: ${MIN_SEED_USD} - ${MAX_SEED_USD.toLocaleString()} USD
                  </p>
                )}
              </div>

              {/* SOL Equivalent */}
              {seedUsd > 0 && solPriceUsd > 0 && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">You will invest</span>
                    <div className="text-right">
                      <p className="text-xl font-bold font-mono text-cyan-400">
                        {seedSol.toFixed(4)} SOL
                      </p>
                      <p className="text-sm text-slate-500">
                        @ ${solPriceUsd.toFixed(2)}/SOL
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-slate-700"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    if (seedUsd >= MIN_SEED_USD && seedUsd <= MAX_SEED_USD) {
                      setCurrentStep(3);
                    } else {
                      validateForm();
                    }
                  }}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Review & Launch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="space-y-4 p-4 bg-slate-900/30 rounded-lg border border-slate-800">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt={name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{name}</h3>
                    <p className="text-lg text-slate-500 font-mono">${symbol}</p>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Seed Investment</span>
                    <span className="font-mono text-slate-200">
                      ${seedUsd.toLocaleString()} ({seedSol.toFixed(4)} SOL)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bonding Curve</span>
                    <span className="text-slate-200">Standard V7 Curve</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Graduation Target</span>
                    <span className="text-slate-200">$42,000 Market Cap</span>
                  </div>
                </div>

                {description && (
                  <>
                    <Separator className="bg-slate-800" />
                    <p className="text-sm text-slate-400 line-clamp-3">{description}</p>
                  </>
                )}
              </div>

              {/* Terms */}
              <Alert className="bg-amber-500/5 border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <AlertDescription className="text-sm text-slate-300">
                  By launching this token, you agree that:
                  <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                    <li>You are the creator and responsible for this token</li>
                    <li>Tokens cannot be deleted once created</li>
                    <li>Creator fees are 0.5% of all trades</li>
                    <li>Graduation requires $42K market cap, 100+ holders, and &lt;10% concentration</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-slate-700"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Launch Token
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <h4 className="font-semibold text-slate-200">Fair Launch</h4>
            </div>
            <p className="text-sm text-slate-500">
              Everyone buys into the same bonding curve with transparent pricing
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <h4 className="font-semibold text-slate-200">Graduation</h4>
            </div>
            <p className="text-sm text-slate-500">
              At $42K market cap, tokens graduate to Raydium AMM automatically
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="font-semibold text-slate-200">No Rug</h4>
            </div>
            <p className="text-sm text-slate-500">
              All liquidity is locked in the bonding curve until graduation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
