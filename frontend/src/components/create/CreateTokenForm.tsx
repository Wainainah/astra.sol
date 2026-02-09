"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTokenSchema, type CreateTokenFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SeedStep } from "@/components/create/SeedStep";
import { PreflightChecks } from "@/components/create/PreflightChecks";
import { ImageUpload } from "@/components/create/ImageUpload";
import { FormProgress } from "@/components/create/FormProgress";
import { TokenCreatedModal } from "@/components/create/TokenCreatedModal";
import {
  useCreateToken,
  buildOptimisticTokenUrl,
  type CreateTokenResult,
} from "@/hooks/useCreateToken";
import {
  ArrowRight,
  Twitter,
  Globe,
  Send,
  Check,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = "form" | "seed";

const DRAFT_STORAGE_KEY = "astra_token_draft";



export function CreateTokenForm() {
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<CreateTokenFormData | null>(null);
  const [createdToken, setCreatedToken] = useState<CreateTokenResult | null>(
    null,
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  const { createToken, isPending } = useCreateToken();

  // Load saved draft from localStorage
  const loadDraft = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Don't load image from draft (can't serialize File objects)
        return {
          name: parsed.name || "",
          ticker: parsed.ticker || "",
          description: parsed.description || "",
          twitter: parsed.twitter || "",
          telegram: parsed.telegram || "",
          website: parsed.website || "",
          image: null,
        };
      }
    } catch (_e) {
      console.warn("Failed to load draft:", _e);
    }
    return null;
  }, []);

  const [hasDraft, setHasDraft] = useState(false);

  const form = useForm<CreateTokenFormData>({
    resolver: zodResolver(createTokenSchema),
    defaultValues: loadDraft() || {
      name: "",
      ticker: "",
      description: "",
      image: null,
      twitter: "",
      telegram: "",
      website: "",
    },
    mode: "onChange", // Validate on change for real-time feedback
  });

  // Watch form values for progress tracking
  const watchedValues = useWatch({ control: form.control });

  // Check if there's a saved draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.name || draft.ticker || draft.description)) {
      setHasDraft(true);
    }
  }, [loadDraft]);

  // Auto-save draft to localStorage (debounced via effect)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't save if form is empty
    const { name, ticker, description, twitter, telegram, website } =
      watchedValues;
    if (!name && !ticker && !description && !twitter && !telegram && !website) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            name,
            ticker,
            description,
            twitter,
            telegram,
            website,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch (_e) {
        console.warn("Failed to save draft:", _e);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [watchedValues]);

  // Clear draft after successful creation
  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
    }
  }, []);

  // Clear draft button handler
  const handleClearDraft = () => {
    form.reset({
      name: "",
      ticker: "",
      description: "",
      image: null,
      twitter: "",
      telegram: "",
      website: "",
    });
    clearDraft();
    toast.success("Draft cleared");
  };

  // Calculate field validation status for progress display
  const fieldStatus = useMemo(() => {
    const { name, ticker, description, image, twitter, telegram, website } =
      watchedValues;

    // Simple validation checks (matching schema rules)
    const isNameValid =
      typeof name === "string" && name.length >= 3 && name.length <= 32;
    const isTickerValid =
      typeof ticker === "string" && ticker.length >= 3 && ticker.length <= 10;
    const hasDescription =
      typeof description === "string" && description.length > 0;
    const hasImage = image !== null && image !== undefined;
    const hasTwitter = typeof twitter === "string" && twitter.length > 0;
    const hasTelegram = typeof telegram === "string" && telegram.length > 0;
    const hasWebsite = typeof website === "string" && website.length > 0;

    return [
      { name: "name", label: "Name", isValid: isNameValid, isRequired: true },
      {
        name: "ticker",
        label: "Ticker",
        isValid: isTickerValid,
        isRequired: true,
      },
      {
        name: "description",
        label: "Description",
        isValid: hasDescription,
        isRequired: false,
      },
      { name: "image", label: "Image", isValid: hasImage, isRequired: false },
      {
        name: "twitter",
        label: "Twitter",
        isValid: hasTwitter,
        isRequired: false,
      },
      {
        name: "telegram",
        label: "Telegram",
        isValid: hasTelegram,
        isRequired: false,
      },
      {
        name: "website",
        label: "Website",
        isValid: hasWebsite,
        isRequired: false,
      },
    ];
  }, [watchedValues]);

  const onSubmitForm = async (data: CreateTokenFormData) => {
    setFormData(data);
    setStep("seed");
  };

  const handleSeedConfirm = async (seedAmount: string) => {
    if (!formData) return;

    // Call the hook with all data including socials
    const result = await createToken({
      name: formData.name,
      ticker: formData.ticker,
      description: formData.description || "",
      image: formData.image ?? null,
      twitter: formData.twitter,
      telegram: formData.telegram,
      website: formData.website,
      seedAmount: seedAmount,
    });

    // Show success modal on successful creation
    if (result.success && result.tokenAddress) {
      clearDraft(); // Clear saved draft
      setCreatedToken(result);
      setShowSuccessModal(true);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to token page with optimistic data for immediate display
    // The token page will poll until the indexer catches up
    if (createdToken) {
      router.push(buildOptimisticTokenUrl(createdToken));
    }
  };

  const handleBack = () => {
    setStep("form");
  };

  // Seed Step
  if (step === "seed" && formData) {
    return (
      <>
        <SeedStep
          tokenName={formData.name}
          tokenTicker={formData.ticker}
          onBack={handleBack}
          onConfirm={handleSeedConfirm}
          isPending={isPending}
        />
        {/* Success Modal */}
        {createdToken && (
          <TokenCreatedModal
            open={showSuccessModal}
            onClose={handleModalClose}
            tokenAddress={createdToken.tokenAddress || ""}
            tokenName={createdToken.tokenName || ""}
            tokenTicker={createdToken.tokenTicker || ""}
            signature={createdToken.signature || ""}
          />
        )}
      </>
    );
  }

  // Helper to check if a field is valid
  const isFieldValid = (fieldName: string) =>
    fieldStatus.find((f) => f.name === fieldName)?.isValid ?? false;

  // Form Step wrapped in PreflightChecks
  return (
    <PreflightChecks factoryConfigured={!!FACTORY_ADDRESS || true}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Progress indicator with clear draft */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <FormProgress fields={fieldStatus} />
            </div>
            {hasDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearDraft}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Token Name
                  {isFieldValid("name") && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Moon Rocket"
                    {...field}
                    className={cn(
                      isFieldValid("name") &&
                        "border-green-500/50 focus-visible:ring-green-500/20",
                    )}
                  />
                </FormControl>
                <FormDescription>
                  3-32 characters, letters, numbers, and spaces only
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ticker */}
          <FormField
            control={form.control}
            name="ticker"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Ticker Symbol
                  {isFieldValid("ticker") && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      placeholder="MOON"
                      className={cn(
                        "pl-7 uppercase font-mono",
                        isFieldValid("ticker") &&
                          "border-green-500/50 focus-visible:ring-green-500/20",
                      )}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                </FormControl>
                <FormDescription>3-10 uppercase characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell everyone about your token..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/280 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload */}
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Token Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value ?? null}
                    onChange={field.onChange}
                    error={form.formState.errors.image?.message}
                  />
                </FormControl>
                <FormDescription>
                  Upload a meme image for your token (optional but recommended)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Socials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Twitter className="h-3 w-3" />
                    Twitter
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="@handle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Send className="h-3 w-3" />
                    Telegram
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="@group" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Website
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://" type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg">
            Next: Set Seed Amount
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>
      </Form>
    </PreflightChecks>
  );
}
