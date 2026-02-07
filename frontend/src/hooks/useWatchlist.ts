"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "astra-watchlist";
const MAX_ITEMS = 100;

function getStoredWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStoredWatchlist(watchlist: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  } catch {
    // localStorage might be full or disabled
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage after mount (SSR-safe)
  useEffect(() => {
    setWatchlist(getStoredWatchlist());
    setMounted(true);
  }, []);

  // Sync across tabs via storage event
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setWatchlist(getStoredWatchlist());
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isWatched = useCallback(
    (address: string): boolean => {
      return watchlist.includes(address);
    },
    [watchlist]
  );

  const addToWatchlist = useCallback(
    (address: string): boolean => {
      if (watchlist.includes(address)) return false;
      if (watchlist.length >= MAX_ITEMS) return false;

      const newWatchlist = [...watchlist, address];
      setWatchlist(newWatchlist);
      setStoredWatchlist(newWatchlist);
      return true;
    },
    [watchlist]
  );

  const removeFromWatchlist = useCallback(
    (address: string): boolean => {
      if (!watchlist.includes(address)) return false;

      const newWatchlist = watchlist.filter((a) => a !== address);
      setWatchlist(newWatchlist);
      setStoredWatchlist(newWatchlist);
      return true;
    },
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    (address: string): boolean => {
      if (watchlist.includes(address)) {
        return removeFromWatchlist(address);
      } else {
        return addToWatchlist(address);
      }
    },
    [watchlist, addToWatchlist, removeFromWatchlist]
  );

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
    setStoredWatchlist([]);
  }, []);

  return {
    watchlist,
    isWatched,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    clearWatchlist,
    mounted,
    isFull: watchlist.length >= MAX_ITEMS,
  };
}
