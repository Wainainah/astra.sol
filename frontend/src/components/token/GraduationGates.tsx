/**
 * GraduationGates Component - Astra Protocol V7
 *
 * Shows graduation criteria status:
 * - Market Cap: $X / $42,000 (checkmark if met)
 * - Holders: X / 100 (checkmark if met)
 * - Concentration: X% / 10% (checkmark if under)
 * - Status: "Ready to graduate" or "Needs X more"
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  PieChart,
  Shield,
  Award,
  Lock,
  Unlock,
  Info,
} from "lucide-react";
import type { GraduationGates as GraduationGatesType } from "@/lib/api-types";
import {
  GRADUATION_MARKET_CAP_USD,
  GRADUATION_MIN_HOLDERS,
  GRADUATION_MAX_CONCENTRATION_BPS,
} from "@/lib/constants";

interface GraduationGatesProps {
  gates: GraduationGatesType;
  className?: string;
}

interface GateItemProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  unit: string;
  isMet: boolean;
  invertComparison?: boolean;
  description: string;
  warning?: string;
}

function GateItem({
  icon,
  label,
  current,
  target,
  unit,
  isMet,
  invertComparison = false,
  description,
  warning,
}: GateItemProps) {
  const displayCurrent = invertComparison
    ? (current / 100).toFixed(1)
    : current.toLocaleString();
  const displayTarget = invertComparison
    ? (target / 100).toFixed(0)
    : target.toLocaleString();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-help ${
            isMet
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-slate-900/50 border-slate-800"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              isMet ? "bg-emerald-500/20" : "bg-slate-800"
            }`}
          >
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300 text-sm font-medium">{label}</span>
              {isMet ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div className="flex items-baseline gap-1">
              <span
                className={`font-mono font-semibold ${
                  isMet ? "text-emerald-400" : "text-slate-100"
                }`}
              >
                {unit === "$" && unit}
                {displayCurrent}
                {unit !== "$" && unit}
              </span>
              <span className="text-slate-500 text-sm">/</span>
              <span className="text-slate-400 text-sm">
                {unit === "$" && unit}
                {displayTarget}
                {unit !== "$" && unit}
              </span>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="bg-slate-900 border-slate-700 text-slate-200 max-w-xs"
      >
        <p className="font-medium mb-1">{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
        {warning && !isMet && (
          <p className="text-sm text-rose-400 mt-2">{warning}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function GraduationGates({ gates, className = "" }: GraduationGatesProps) {
  // Check individual gates
  const marketCapMet = gates.marketCapUsd >= GRADUATION_MARKET_CAP_USD;
  const holdersMet = gates.holders >= GRADUATION_MIN_HOLDERS;
  const concentrationMet = gates.concentration <= GRADUATION_MAX_CONCENTRATION_BPS;

  // Calculate how many gates are met
  const gatesMet = [marketCapMet, holdersMet, concentrationMet].filter(Boolean).length;
  const totalGates = 3;

  // Get status configuration
  const getStatusConfig = () => {
    if (gates.canGraduate) {
      return {
        icon: <Unlock className="w-5 h-5" />,
        label: "Ready to Graduate",
        color: "emerald",
        message: "All criteria met! This launch can graduate to AMM.",
      };
    }
    if (gatesMet === 2) {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        label: "Almost There",
        color: "amber",
        message: `Just 1 more gate to pass. ${gates.blockingReasons[0]}`,
      };
    }
    if (gatesMet === 1) {
      return {
        icon: <Lock className="w-5 h-5" />,
        label: "In Progress",
        color: "blue",
        message: `${gatesMet}/${totalGates} gates passed. Keep building!`,
      };
    }
    return {
      icon: <Lock className="w-5 h-5" />,
      label: "Building Phase",
      color: "slate",
      message: "Launch is accumulating holders and market cap.",
    };
  };

  const status = getStatusConfig();

  const colorClasses: Record<string, { bg: string; border: string; text: string }> =
    {
      emerald: {
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
      },
      amber: {
        bg: "bg-amber-500/20",
        border: "border-amber-500/30",
        text: "text-amber-400",
      },
      blue: {
        bg: "bg-blue-500/20",
        border: "border-blue-500/30",
        text: "text-blue-400",
      },
      slate: {
        bg: "bg-slate-500/20",
        border: "border-slate-500/30",
        text: "text-slate-400",
      },
    };

  const colors = colorClasses[status.color];

  return (
    <TooltipProvider>
      <Card
        className={`bg-slate-950 border-slate-800 overflow-hidden ${className}`}
      >
        {/* Gradient accent based on status */}
        <div
          className={`h-1 ${
            gates.canGraduate
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
              : "bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600"
          }`}
        />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Graduation Gates
            </CardTitle>
            <Badge
              variant="outline"
              className={`${colors.border} ${colors.text}`}
            >
              {gatesMet}/{totalGates} Passed
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Banner */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border}`}
          >
            <div className={`${colors.text}`}>{status.icon}</div>
            <div className="flex-1">
              <div className={`font-medium ${colors.text}`}>{status.label}</div>
              <div className="text-slate-400 text-sm">{status.message}</div>
            </div>
          </div>

          {/* Gate Items */}
          <div className="space-y-2">
            {/* Market Cap Gate */}
            <GateItem
              icon={<TrendingUp className="w-4 h-4 text-cyan-400" />}
              label="Market Cap"
              current={gates.marketCapUsd}
              target={GRADUATION_MARKET_CAP_USD}
              unit="$"
              isMet={marketCapMet}
              description="Total value of all shares in the bonding curve. Must reach $42,000 for graduation."
              warning={
                !marketCapMet
                  ? `Need $${(GRADUATION_MARKET_CAP_USD - gates.marketCapUsd).toLocaleString()} more in market cap`
                  : undefined
              }
            />

            {/* Holders Gate */}
            <GateItem
              icon={<Users className="w-4 h-4 text-purple-400" />}
              label="Holders"
              current={gates.holders}
              target={GRADUATION_MIN_HOLDERS}
              unit=""
              isMet={holdersMet}
              description="Number of unique wallet addresses holding shares. Must have at least 100 holders."
              warning={
                !holdersMet
                  ? `Need ${GRADUATION_MIN_HOLDERS - gates.holders} more holders`
                  : undefined
              }
            />

            {/* Concentration Gate */}
            <GateItem
              icon={<PieChart className="w-4 h-4 text-amber-400" />}
              label="Top Holder"
              current={gates.concentration}
              target={GRADUATION_MAX_CONCENTRATION_BPS}
              unit="%"
              isMet={concentrationMet}
              invertComparison={true}
              description="Percentage of supply held by the largest holder. Must be under 10% to ensure decentralization."
              warning={
                !concentrationMet
                  ? `Top holder has ${(gates.concentration / 100).toFixed(1)}% - must be under 10%`
                  : undefined
              }
            />
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-2 text-slate-500 text-xs bg-slate-900/30 rounded-lg p-3 border border-slate-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="mb-1">
                <strong>What is graduation?</strong> When all gates are passed,
                the launch can graduate to a Raydium AMM. Shares convert to tokens
                at a rate proportional to your ownership.
              </p>
              <p>
                <strong>Why concentration matters:</strong> A single holder with
                too much supply can manipulate the market. The 10% limit ensures
                fair distribution.
              </p>
            </div>
          </div>

          {/* Rewards Preview */}
          {gates.canGraduate && (
            <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 rounded-lg p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">
                  Graduation Rewards
                </span>
              </div>
              <ul className="text-sm text-slate-300 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Shares convert to tradable tokens
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Listed on Raydium AMM
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Instant liquidity for all holders
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
