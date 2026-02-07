/**
 * Astra Protocol V7 - Root Layout
 * 
 * Provides:
 * - HTML structure with dark theme
 * - Solana wallet adapter
 * - Global styles
 * - Sidebar/Header navigation
 */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { SolanaProvider } from "@/components/providers/SolanaProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Astra Protocol V7 - Bonding Curve Launchpad",
  description: "Launch and trade tokens on Solana with fair bonding curves. V7 features simplified economics, no locked/unlocked shares, and clear graduation mechanics.",
  keywords: ["Solana", "bonding curve", "token launch", "crypto", "defi", "Astra Protocol"],
  openGraph: {
    title: "Astra Protocol V7",
    description: "Fair token launches on Solana",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          jetbrainsMono.variable,
          "font-sans antialiased",
          "bg-slate-950 text-slate-100",
          "min-h-screen"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
        >
          <SolanaProvider>
            <div className="flex min-h-screen">
              {/* Sidebar - hidden on mobile */}
              <AppSidebar className="hidden lg:flex w-64 shrink-0" />
              
              {/* Main content area */}
              <div className="flex flex-col flex-1 min-w-0">
                {/* Header */}
                <Header />
                
                {/* Page content */}
                <main className="flex-1 overflow-auto">
                  <div className="container mx-auto px-4 py-6 max-w-7xl">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </SolanaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
