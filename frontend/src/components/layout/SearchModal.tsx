"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TokenStatus } from "@/components/token/TokenCard";
import { getTokens } from "@/data/api";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, AlertCircle } from "lucide-react";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusIcons: Record<TokenStatus, React.ReactNode> = {
  active: <TrendingUp className="h-4 w-4 text-success" />,
  graduated: <TrendingUp className="h-4 w-4 text-secondary" />,
  refunding: <AlertCircle className="h-4 w-4 text-destructive" />,
};

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch tokens for search
  const { data: tokensData, isLoading } = useQuery({
    queryKey: ["search-tokens"],
    queryFn: () => getTokens({ limit: 100 }),
    enabled: open,
    staleTime: 60_000,
  });

  const tokens = tokensData?.tokens ?? [];

  // Filter tokens based on search query
  const filteredTokens = tokens.filter((token) => {
    const query = searchQuery.toLowerCase();
    return (
      token.name.toLowerCase().includes(query) ||
      token.ticker.toLowerCase().includes(query) ||
      token.address.toLowerCase().includes(query) ||
      token.creator.toLowerCase().includes(query)
    );
  });

  // Group tokens by status
  const activeTokens = filteredTokens.filter((t) => t.status === "active");
  const graduatedTokens = filteredTokens.filter(
    (t) => t.status === "graduated",
  );
  const refundingTokens = filteredTokens.filter(
    (t) => t.status === "refunding",
  );

  // Handle token selection
  const handleSelect = useCallback(
    (tokenAddress: string) => {
      onOpenChange(false);
      router.push(`/token/${tokenAddress}`);
    },
    [onOpenChange, router],
  );

  // Keyboard shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search tokens by name, ticker, or address..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">
              Loading tokens...
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No tokens found.
            </div>
          )}
        </CommandEmpty>

        {activeTokens.length > 0 && (
          <CommandGroup heading="Active">
            {activeTokens.map((token) => (
              <CommandItem
                key={token.address}
                onSelect={() => handleSelect(token.address)}
                className="flex items-center gap-2 cursor-pointer"
              >
                {statusIcons[token.status]}
                <div className="flex flex-col">
                  <span className="font-medium">{token.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ${token.ticker} • {token.lockedBasis.toFixed(2)} SOL
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {graduatedTokens.length > 0 && (
          <CommandGroup heading="Graduated">
            {graduatedTokens.map((token) => (
              <CommandItem
                key={token.address}
                onSelect={() => handleSelect(token.address)}
                className="flex items-center gap-2 cursor-pointer"
              >
                {statusIcons[token.status]}
                <div className="flex flex-col">
                  <span className="font-medium">{token.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ${token.ticker} • Graduated
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {refundingTokens.length > 0 && (
          <CommandGroup heading="Refunding">
            {refundingTokens.map((token) => (
              <CommandItem
                key={token.address}
                onSelect={() => handleSelect(token.address)}
                className="flex items-center gap-2 cursor-pointer"
              >
                {statusIcons[token.status]}
                <div className="flex flex-col">
                  <span className="font-medium">{token.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ${token.ticker} • Refund Available
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredTokens.length > 0 && (
          <div className="py-2 px-2 text-xs text-muted-foreground border-t">
            <div className="flex items-center gap-4">
              <span>⌘K to open</span>
              <span>↵ to select</span>
              <span>ESC to close</span>
            </div>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
