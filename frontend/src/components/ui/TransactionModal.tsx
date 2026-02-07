"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ExternalLink, Check, X, AlertTriangle } from "lucide-react";

export type TransactionState = "idle" | "confirm" | "pending" | "success" | "error";

export interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: TransactionState;
  title: string;
  description?: string;
  // Pre-flight summary items
  summary?: { label: string; value: string }[];
  // What this action will do
  actions?: string[];
  // Transaction hash for pending/success states
  signature?: string;
  // Error message
  errorMessage?: string;
  // Callbacks
  onConfirm?: () => void;
  onRetry?: () => void;
  // Success content
  successTitle?: string;
  successDescription?: string;
  successActions?: { label: string; onClick: () => void }[];
}

const stepProgress: Record<TransactionState, number> = {
  idle: 0,
  confirm: 33,
  pending: 66,
  success: 100,
  error: 66,
};

/**
 * TransactionModal Component (V7)
 * 
 * Modal for displaying transaction states and confirmations.
 * Used by claim, refund, and other transaction flows.
 */
export function TransactionModal({
  open,
  onOpenChange,
  state,
  title,
  description,
  summary,
  actions,
  signature,
  errorMessage,
  onConfirm,
  onRetry,
  successTitle,
  successDescription,
  successActions,
}: TransactionModalProps) {
  const explorerUrl = signature
    ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {state === "success" && (
              <span className="text-green-500">🎉</span>
            )}
            {state === "error" && <X className="h-5 w-5 text-red-500" />}
            {state === "success" ? successTitle || title : title}
          </DialogTitle>
          {description && state === "confirm" && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Step Progress */}
        <div className="space-y-2">
          <Progress value={stepProgress[state]} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={state !== "idle" ? "text-primary" : ""}>
              Confirm
            </span>
            <span
              className={
                state === "pending" || state === "success" || state === "error"
                  ? "text-primary"
                  : ""
              }
            >
              Processing
            </span>
            <span className={state === "success" ? "text-primary" : ""}>
              Complete
            </span>
          </div>
        </div>

        {/* State-specific content */}
        <div className="py-4">
          {/* CONFIRM state */}
          {state === "confirm" && (
            <div className="space-y-4">
              {/* Summary */}
              {summary && summary.length > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  {summary.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions list */}
              {actions && actions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    This will:
                  </p>
                  <ul className="space-y-1">
                    {actions.map((action, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-3 w-3 text-primary" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* PENDING state */}
          {state === "pending" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Spinner className="h-12 w-12" />
              <p className="text-sm text-muted-foreground">
                Transaction pending...
              </p>
              {explorerUrl && (
                <Button variant="link" size="sm" asChild>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
              <Alert variant="default" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Do not close this window
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* SUCCESS state */}
          {state === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="rounded-full bg-green-500/20 p-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm text-center">
                {successDescription || "Transaction completed successfully!"}
              </p>
              {explorerUrl && (
                <Button variant="link" size="sm" asChild>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* ERROR state */}
          {state === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="rounded-full bg-red-500/20 p-4">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-sm text-center text-red-500">
                {errorMessage || "Transaction failed"}
              </p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <DialogFooter className="gap-2">
          {state === "confirm" && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={onConfirm}>Confirm</Button>
            </>
          )}

          {state === "success" && (
            <>
              {successActions?.map((action, idx) => (
                <Button
                  key={idx}
                  variant={idx === 0 ? "outline" : "default"}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
              {!successActions && (
                <Button onClick={() => onOpenChange(false)}>Close</Button>
              )}
            </>
          )}

          {state === "error" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onRetry && <Button onClick={onRetry}>Try Again</Button>}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage transaction modal state
 */
export function useTransactionModal() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<TransactionState>("idle");
  const [signature, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const reset = () => {
    setState("idle");
    setTxHash(undefined);
    setError(undefined);
  };

  const startConfirm = () => {
    reset();
    setState("confirm");
    setOpen(true);
  };

  const startPending = (hash?: string) => {
    setState("pending");
    if (hash) setTxHash(hash);
  };

  const setSuccess = (hash?: string) => {
    setState("success");
    if (hash) setTxHash(hash);
  };

  const setFailed = (errorMsg: string) => {
    setState("error");
    setError(errorMsg);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  return {
    open,
    setOpen,
    state,
    signature,
    error,
    startConfirm,
    startPending,
    setSuccess,
    setFailed,
    close,
    reset,
  };
}
