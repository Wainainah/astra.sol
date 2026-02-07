"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Sparkles, TrendingUp, Lock, Coins } from "lucide-react";

interface GraduationCelebrationProps {
  open: boolean;
  onClose: () => void;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
}

export function GraduationCelebration({
  open,
  onClose,
  tokenName,
  tokenSymbol,
  tokenAddress,
}: GraduationCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple confetti animation
  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const colors = ["#10B981", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6"];

    // Create particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravity
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        // Remove particles that are off screen
        if (p.y > canvas.height + 50) {
          particles.splice(i, 1);
        }
      });

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [open]);

  const jupiterUrl = tokenAddress
    ? `https://jup.ag/swap/SOL-${tokenAddress}`
    : "https://jup.ag";

  const explorerUrl = `https://explorer.solana.com/address/${tokenAddress}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        {/* Confetti canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-50"
          style={{ position: "fixed", top: 0, left: 0 }}
        />

        <DialogHeader className="text-center pt-4">
          <div className="text-6xl mb-4 animate-bounce">🚀</div>
          <DialogTitle className="text-3xl flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Graduated!
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </DialogTitle>
          <DialogDescription className="text-lg">
            <span className="font-semibold text-foreground">
              ${tokenSymbol}
            </span>{" "}
            is now trading on Jupiter!
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge variant="secondary" className="font-mono text-lg mb-2">
                  ${tokenSymbol}
                </Badge>
                <p className="font-semibold text-lg">{tokenName}</p>
              </div>
              <div className="text-5xl">🎉</div>
            </div>

            <div className="space-y-3 pt-4 border-t border-green-500/20">
              <div className="flex items-center gap-3 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Trading live on Jupiter DEX</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Lock className="h-4 w-4 text-amber-500" />
                <span>LP tokens locked in vault</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Coins className="h-4 w-4 text-blue-500" />
                <span>Creator vesting has started</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            asChild
          >
            <a href={jupiterUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Trade on Jupiter
            </a>
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                View on Explorer
              </a>
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
