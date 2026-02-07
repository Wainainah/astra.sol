"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Check, X, Loader2 } from "lucide-react";

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onAvailabilityChange?: (available: boolean) => void;
}

export function UsernameInput({
  value,
  onChange,
  onAvailabilityChange,
}: UsernameInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce the input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Check availability when debounced value changes
  useEffect(() => {
    if (!debouncedValue) {
      setIsAvailable(false);
      setError(null);
      onAvailabilityChange?.(false);
      return;
    }

    checkAvailability(debouncedValue);
  }, [debouncedValue]);

  const checkAvailability = useCallback(
    async (username: string) => {
      setIsChecking(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/users/check-username?username=${encodeURIComponent(username)}`,
        );
        const data = await response.json();

        if (data.available) {
          setIsAvailable(true);
          setError(null);
          onAvailabilityChange?.(true);
        } else {
          setIsAvailable(false);
          setError(data.error || "Username is not available");
          onAvailabilityChange?.(false);
        }
      } catch (err) {
        setIsAvailable(false);
        setError("Failed to check availability");
        onAvailabilityChange?.(false);
      } finally {
        setIsChecking(false);
      }
    },
    [onAvailabilityChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase();
    onChange(newValue);
    setIsAvailable(false);
    setError(null);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleChange}
        placeholder="username"
        className={`pr-10 ${
          error
            ? "border-red-500 focus-visible:ring-red-500"
            : isAvailable && value
              ? "border-green-500 focus-visible:ring-green-500"
              : ""
        }`}
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isChecking ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isAvailable && value ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : error && value ? (
          <X className="h-4 w-4 text-red-500" />
        ) : null}
      </div>

      {error && value && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {isAvailable && value && (
        <p className="text-xs text-green-500 mt-1">Username is available</p>
      )}
    </div>
  );
}
