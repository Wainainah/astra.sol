"use client";

/**
 * Header Component - Astra Protocol V7
 * 
 * Top navigation bar with:
 * - Logo
 * - Search
 * - Navigation links
 * - Wallet connect button
 * - User menu
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/ui/wallet-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Menu,
  Rocket,
  TrendingUp,
  Wallet,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn, truncate } from "@/lib/utils";
import { AppSidebar } from "./AppSidebar";

interface HeaderProps {
  className?: string;
}

const NAV_LINKS = [
  { href: "/", label: "Explore", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/create", label: "Launch", icon: Rocket },
];

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const { publicKey, disconnect } = useWallet();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "bg-slate-950/80 backdrop-blur-xl",
        "border-b border-slate-800/50",
        className
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Mobile menu + Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-slate-400">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-slate-950 border-slate-800">
              <AppSidebar className="w-full" />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0.5 bg-slate-950 rounded-md flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-bold text-lg hidden sm:block">
              <span className="text-slate-100">Astra</span>
              <span className="text-cyan-400">V7</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    "flex items-center gap-2",
                    isActive
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search tokens..."
              className={cn(
                "pl-10 bg-slate-900/50 border-slate-800",
                "placeholder:text-slate-500",
                "focus:border-cyan-500/50 focus:ring-cyan-500/20"
              )}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 hidden lg:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Wallet + User */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-400"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Wallet button */}
          {!publicKey ? (
            <WalletButton />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="hidden sm:inline font-mono text-sm">
                    {truncate(publicKey.toBase58(), 4, 4)}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-slate-950 border-slate-800"
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-sm text-slate-500">Connected as</p>
                  <p className="font-mono text-sm text-slate-300 truncate">
                    {publicKey.toBase58()}
                  </p>
                </div>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/portfolio">
                    <Wallet className="w-4 h-4 mr-2" />
                    Portfolio
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  onClick={disconnect}
                  className="cursor-pointer text-red-400 focus:text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
