"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  Time,
  AreaSeries,
} from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useSolPrice } from "@/hooks/useSolPrice";
import { GRADUATION_MARKET_CAP_USD } from "@/lib/constants";

// Price data point type - V7 uses Market Cap USD instead of share count
interface PricePoint {
  time: Time;
  value: number; // Market Cap in USD
}

interface BondingCurveChartProps {
  tokenAddress: string;
}

export function BondingCurveChart({ tokenAddress }: BondingCurveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [timeframe, setTimeframe] = useState<"1H" | "1D" | "ALL">("ALL");
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // V7: Use market cap in USD instead of locked SOL
  const { price: solPrice, toUsd } = useSolPrice();
  const [currentMarketCapUsd, setCurrentMarketCapUsd] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);

  // V7: Fixed graduation target in USD
  const graduationTargetUsd = GRADUATION_MARKET_CAP_USD;

  // Generate mock chart data based on market cap
  const generateMockData = useCallback((): PricePoint[] => {
    const data: PricePoint[] = [];
    const now = Math.floor(Date.now() / 1000) as Time;
    const points = 100;
    
    // Generate realistic market cap progression
    let marketCap = 500 + Math.random() * 1000; // Start between $500-$1500
    
    for (let i = points; i >= 0; i--) {
      const time = (now - i * 3600) as Time; // Hourly data
      
      // Random walk with upward bias
      const change = (Math.random() - 0.45) * 100;
      marketCap = Math.max(100, marketCap + change);
      
      data.push({
        time,
        value: marketCap,
      });
    }
    
    return data;
  }, []);

  // Initialize mock data
  useEffect(() => {
    const mockData = generateMockData();
    setPriceData(mockData);
    
    // Set current market cap from latest data point
    if (mockData.length > 0) {
      const latest = mockData[mockData.length - 1].value;
      setCurrentMarketCapUsd(latest);
      
      // Calculate 24h change
      const dayAgoIndex = Math.max(0, mockData.length - 24);
      const dayAgoValue = mockData[dayAgoIndex].value;
      const change = ((latest - dayAgoValue) / dayAgoValue) * 100;
      setPriceChange24h(change);
    }
    
    setIsLoading(false);
  }, [generateMockData, tokenAddress]);

  // Mock real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMarketCapUsd((prev) => {
        const change = (Math.random() - 0.48) * 50;
        const newValue = Math.max(100, prev + change);
        
        // Add new data point
        const now = Math.floor(Date.now() / 1000) as Time;
        setPriceData((prevData) => {
          const newData = [...prevData, { time: now, value: newValue }];
          // Keep last 200 points
          return newData.slice(-200);
        });
        
        return newValue;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate progress to graduation based on market cap
  const progressPercent = useMemo(() => {
    return Math.min((currentMarketCapUsd / graduationTargetUsd) * 100, 100);
  }, [currentMarketCapUsd, graduationTargetUsd]);

  // Filter data based on timeframe
  const getFilteredData = useCallback((): PricePoint[] => {
    if (priceData.length === 0) return [];

    const now = Math.floor(Date.now() / 1000);
    let cutoff: number;

    switch (timeframe) {
      case "1H":
        cutoff = now - 60 * 60; // 1 hour
        break;
      case "1D":
        cutoff = now - 24 * 60 * 60; // 24 hours
        break;
      case "ALL":
      default:
        return priceData;
    }

    return priceData.filter((p) => (p.time as number) >= cutoff);
  }, [priceData, timeframe]);

  // Create/update chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart if it doesn't exist
    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#9CA3AF",
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.05)" },
          horzLines: { color: "rgba(255, 255, 255, 0.05)" },
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
        timeScale: {
          borderColor: "rgba(255, 255, 255, 0.1)",
          timeVisible: true,
        },
        // V7: Right price scale shows Market Cap in USD
        rightPriceScale: {
          borderColor: "rgba(255, 255, 255, 0.1)",
          tickMarkFormatter: (price: number) => {
            return `$${(price / 1000).toFixed(1)}k`;
          },
        },
        crosshair: {
          horzLine: {
            color: "rgba(255, 255, 255, 0.2)",
            labelBackgroundColor: "#10B981",
          },
          vertLine: {
            color: "rgba(255, 255, 255, 0.2)",
            labelBackgroundColor: "#10B981",
          },
        },
      });

      seriesRef.current = chartRef.current.addSeries(AreaSeries, {
        lineColor: "#10B981",
        topColor: "rgba(16, 185, 129, 0.4)",
        bottomColor: "rgba(16, 185, 129, 0.0)",
        lineWidth: 2,
        // V7: Price formatter for market cap
        priceFormat: {
          type: "custom",
          formatter: (price: number) => {
            if (price >= 1_000_000) {
              return `$${(price / 1_000_000).toFixed(2)}M`;
            }
            if (price >= 1_000) {
              return `$${(price / 1_000).toFixed(1)}k`;
            }
            return `$${price.toFixed(0)}`;
          },
        },
      });
    }

    // Update data with filtered timeframe
    const filteredData = getFilteredData();
    if (seriesRef.current && filteredData.length > 0) {
      seriesRef.current.setData(filteredData);
      chartRef.current?.timeScale().fitContent();
    }

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [priceData, timeframe, getFilteredData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  if (isLoading && priceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Cap Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = priceChange24h >= 0;

  // Format market cap for display
  const formatMarketCap = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle>Market Cap</CardTitle>
            <span className="text-xl font-mono font-bold">
              {formatMarketCap(currentMarketCapUsd)}
            </span>
            {priceChange24h !== 0 && (
              <Badge
                variant="default"
                className={
                  isPositive
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                }
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {isPositive ? "+" : ""}
                {priceChange24h.toFixed(2)}%
              </Badge>
            )}
            <Badge
              variant="default"
              className="bg-green-500/20 text-green-500"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
          <Tabs
            value={timeframe}
            onValueChange={(v) => setTimeframe(v as typeof timeframe)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="1H" className="text-xs px-2">
                1H
              </TabsTrigger>
              <TabsTrigger value="1D" className="text-xs px-2">
                1D
              </TabsTrigger>
              <TabsTrigger value="ALL" className="text-xs px-2">
                ALL
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Chart container */}
        <div ref={chartContainerRef} className="h-[300px]" />

        {/* Progress bar - V7: Shows progress to graduation market cap */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Progress to Graduation
            </span>
            <span className="font-mono">
              {formatMarketCap(currentMarketCapUsd)} / {formatMarketCap(graduationTargetUsd)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
