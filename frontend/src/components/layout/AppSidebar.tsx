"use client";

/**
 * AppSidebar Component - Astra Protocol V7
 * 
 * Left sidebar with:
 * - Navigation items (Home, Portfolio, Create, etc.)
 * - Stats/Info section
 * - Collapsible on mobile
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  TrendingUp,
  Wallet,
  Rocket,
  BarChart3,
  Settings,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Zap,
  Users,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AppSidebarProps {
  className?: string;
}

const MAIN_NAV = [
  {
    href: "/",
    label: "Explore",
    icon: TrendingUp,
    description: "Discover tokens",
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: Wallet,
    description: "Your positions",
  },
  {
    href: "/create",
    label: "Launch Token",
    icon: Rocket,
    description: "Create new token",
    highlight: true,
  },
];

const SECONDARY_NAV = [
  {
    href: "/stats",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/docs",
    label: "Documentation",
    icon: HelpCircle,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

const EXTERNAL_LINKS = [
  {
    href: "https://github.com/astra-protocol",
    label: "GitHub",
    icon: ExternalLink,
  },
  {
    href: "https://twitter.com/astraprotocol",
    label: "Twitter",
    icon: ExternalLink,
  },
];

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { publicKey } = useWallet();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-slate-950 border-r border-slate-800/50",
        className
      )}
    >
      {/* Logo section - shown only on mobile/sidebar view */}
      <div className="p-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg" />
            <div className="absolute inset-0.5 bg-slate-950 rounded-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-lg">
            <span className="text-slate-100">Astra</span>
            <span className="text-cyan-400">V7</span>
          </span>
        </Link>
      </div>

      <Separator className="bg-slate-800/50 lg:hidden" />

      <ScrollArea className="flex-1 py-4">
        {/* Main Navigation */}
        <nav className="px-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Main
          </p>
          {MAIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "group relative",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900",
                  item.highlight && !isActive && "text-purple-400 hover:text-purple-300"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive
                      ? "text-cyan-400"
                      : item.highlight
                      ? "text-purple-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="block font-medium text-sm">{item.label}</span>
                  <span className="block text-xs text-slate-600 group-hover:text-slate-500">
                    {item.description}
                  </span>
                </div>
                {item.highlight && (
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-[10px] px-1.5"
                  >
                    New
                  </Badge>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-500 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4 bg-slate-800/50" />

        {/* Secondary Navigation */}
        <nav className="px-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Resources
          </p>
          {SECONDARY_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
              >
                <item.icon className="w-4 h-4 text-slate-500" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* External Links */}
        <nav className="px-3 mt-4 space-y-1">
          {EXTERNAL_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              <item.icon className="w-4 h-4 text-slate-500" />
              <span className="text-sm">{item.label}</span>
            </a>
          ))}
        </nav>
      </ScrollArea>

      {/* Stats Section */}
      <div className="p-4 border-t border-slate-800/50">
        <div className="bg-slate-900/50 rounded-lg p-3 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Protocol Stats
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-slate-950/50 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Coins className="w-3 h-3" />
                Tokens
              </div>
              <p className="font-mono text-sm text-slate-200">1,247</p>
            </div>
            <div className="p-2 bg-slate-950/50 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Users className="w-3 h-3" />
                Users
              </div>
              <p className="font-mono text-sm text-slate-200">8.5K</p>
            </div>
          </div>

          <div className="p-2 bg-slate-950/50 rounded">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              Graduation Target
            </div>
            <p className="font-mono text-sm text-slate-200">$42,000</p>
          </div>
        </div>

        {/* Version */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <span>v7.0.0</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Mainnet
          </span>
        </div>
      </div>
    </aside>
  );
}
