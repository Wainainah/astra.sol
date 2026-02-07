"use client";

import { useEffect, useState, useRef } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  end,
  duration = 1000,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCount();
          }
        });
      },
      { threshold: 0.1 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateCount = () => {
    const startTime = Date.now();
    const startValue = 0;

    const step = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (end - startValue) * easeOut;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  const formattedCount =
    decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formattedCount}
      {suffix}
    </span>
  );
}
