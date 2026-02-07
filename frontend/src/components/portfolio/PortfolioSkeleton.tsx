"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for Portfolio Summary Cards
 */
export function PortfolioSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton for Holdings Table
 */
export function HoldingsTableSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      {/* Desktop Skeleton */}
      <div className="hidden lg:block">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b">
            <div className="flex items-center gap-3 flex-[2]">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile Skeleton */}
      <div className="lg:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for Transaction History
 */
export function TransactionHistorySkeleton() {
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      {/* Desktop Skeleton */}
      <div className="hidden md:block">
        <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-6 w-16" />
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-14" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Portfolio Page Skeleton
 */
export function PortfolioPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Summary Cards */}
      <PortfolioSummarySkeleton />

      {/* Holdings Section */}
      <div>
        <Skeleton className="h-6 w-24 mb-4" />
        <HoldingsTableSkeleton />
      </div>

      {/* Transactions Section */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <TransactionHistorySkeleton />
      </div>
    </div>
  );
}
