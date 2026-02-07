"use client";

import { useMemo } from "react";

interface BlockiesAvatarProps {
  address: string;
  size?: number;
  className?: string;
}

// Simple blockies implementation using canvas
export function BlockiesAvatar({
  address,
  size = 64,
  className = "",
}: BlockiesAvatarProps) {
  const canvasDataUrl = useMemo(() => {
    // Create seed from address
    const seed = address.toLowerCase();

    // Generate color from seed
    const seedHash = seed.split("").reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) return "";

    // Generate colors
    const hue = Math.abs(seedHash % 360);
    const bgColor = `hsl(${hue}, 70%, 80%)`;
    const spotColor = `hsl(${hue}, 70%, 40%)`;

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Draw geometric pattern (8x8 grid)
    const cellSize = size / 8;
    ctx.fillStyle = spotColor;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 4; j++) {
        // Only left half, mirror for symmetry
        const charIndex = (i * 4 + j) % seed.length;
        const charCode = seed.charCodeAt(charIndex);

        if (charCode % 2 === 0) {
          // Draw on left side
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
          // Mirror on right side
          ctx.fillRect((7 - j) * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }

    return canvas.toDataURL();
  }, [address, size]);

  return (
    <img
      src={canvasDataUrl}
      alt={`Avatar for ${address.slice(0, 6)}...${address.slice(-4)}`}
      className={`rounded-full border-2 border-border ${className}`}
      width={size}
      height={size}
    />
  );
}
