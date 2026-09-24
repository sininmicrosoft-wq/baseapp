import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { AssetMetadata } from '../../types/base';
import { formatNumber } from '../../utils/web3Helper';

interface RwaPriceVolumeChartProps {
  asset: AssetMetadata;
  userBalance?: number;
}

type Timeframe = '7D' | '30D' | '90D' | '1Y';
type ViewMode = 'all' | 'price' | 'volume';

interface ChartDataPoint {
  date: string;
  fullDate: string;
  price: number;
  volume: number;
  volumeUsd: number;
  txCount: number;
}

export const RwaPriceVolumeChart: React.FC<RwaPriceVolumeChartProps> = ({
  asset,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // Base nominal price per token adjusted by asset multiplier (WAD)
  const baseTokenPrice = 100 / Math.max(1, asset.multiplier);

  // Generate deterministic, realistic historical series based on timeframe & asset symbol
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const pointsCount = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : timeframe === '90D' ? 45 : 52;
    const data: ChartDataPoint[] = [];
    const now = new Date();

    // Deterministic seed based on symbol ASCII sum
    const seed = asset.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 42);

    let currentPrice = baseTokenPrice * 0.92;

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now);
      if (timeframe === '7D' || timeframe === '30D') {
        d.setDate(d.getDate() - i);
      } else if (timeframe === '90D') {
        d.setDate(d.getDate() - i * 2);
      } else {
        d.setDate(d.getDate() - i * 7);
      }

      // Pseudo-random walk with positive drift
      const noise = Math.sin((i + seed) * 0.45) * 1.8 + Math.cos((i * 1.3 + seed) * 0.2) * 1.2;
      const stepChange = noise * (baseTokenPrice * 0.015);
      currentPrice = Math.max(baseTokenPrice * 0.75, currentPrice + stepChange);

      // Volume correlates with price volatility
      const baseVol = 25000 + Math.abs(noise) * 18000;
      const volume = Math.round(baseVol * (asset.multiplier >= 2 ? 1.5 : 1));
      const volumeUsd = Math.round(volume * currentPrice);
      const txCount = Math.round(18 + Math.abs(noise) * 22);

      const dateStr = timeframe === '7D'
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : timeframe === '1Y'
        ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const fullDateStr = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      data.push({
        date: dateStr,
        fullDate: fullDateStr,
        price: Number(currentPrice.toFixed(2)),
        volume,
        volumeUsd,
        txCount,
      });
    }

    // Force the last point to align with current base price
    if (data.length > 0) {
      data[data.length - 1].price = Number(baseTokenPrice.toFixed(2));
    }

    return data;
  }, [timeframe, asset.symbol, baseTokenPrice, asset.multiplier]);

  // Derived metrics
  const firstPrice = chartData[0]?.price || baseTokenPrice;
  const lastPrice = chartData[chartData.length - 1]?.price || baseTokenPrice;
  const priceChange = lastPrice - firstPrice;
  const percentChange = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const totalVolume = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.volume, 0);
  }, [chartData]);

  const avgDailyVolume = useMemo(() => {
    return chartData.length > 0 ? Math.round(totalVolume / chartData.length) : 0;
  }, [totalVolume, chartData]);

  const maxPrice = useMemo(() => Math.max(...chartData.map((d) => d.price)), [chartData]);
  const minPrice = useMemo(() => Math.min(...chartData.map((d) => d.price)), [chartData]);

  return (
    <div className="p-3.5 rounded-2xl bg-[#111319] border border-[#1f2430] shadow-xl relative overflow-hidden">
      {/* Background glow behind chart */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-[#0052ff]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Mode Toggles */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-lg bg-[#0052ff]/15 flex items-center justify-center border border-[#0052ff]/25 text-[#3c8aff]">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>RWA Market Activity</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0052ff]/20 text-[#3c8aff] font-bold">
                {asset.symbol}
              </span>
            </div>
            <div className="text-[10px] text-[#8a91a0]">
              Historical price trend & daily volume
            </div>
          </div>
        </div>

        {/* View Mode Toggle: All / Price / Volume */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#171a23] border border-[#242b3a] text-[10px] font-bold">
          <button
            onClick={() => setViewMode('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'all'
                ? 'bg-[#0052ff] text-white'
                : 'text-[#8a91a0] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setViewMode('price')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'price'
                ? 'bg-[#0052ff] text-white'
                : 'text-[#8a91a0] hover:text-white'
            }`}
          >
            Price
          </button>
          <button
            onClick={() => setViewMode('volume')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'volume'
                ? 'bg-[#0052ff] text-white'
                : 'text-[#8a91a0] hover:text-white'
            }`}
          >
            Vol
          </button>
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="flex items-baseline justify-between mt-2.5 pb-2.5 border-b border-[#1c212b]">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-extrabold text-white tracking-tight">
              ${lastPrice.toFixed(2)}
            </span>
            <span className="text-[11px] text-[#8a91a0] font-mono">USD</span>
            <div
              className={`flex items-center gap-0.5 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isPositive
                  ? 'text-[#66c800] bg-[#66c800]/15'
                  : 'text-[#fc401f] bg-[#fc401f]/15'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {priceChange.toFixed(2)} ({isPositive ? '+' : ''}
                {percentChange.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="text-[10px] text-[#717886] mt-0.5">
            Normalized to {asset.multiplier}x WAD split factor
          </div>
        </div>

        {/* Timeframe Selector Buttons */}
        <div className="flex items-center gap-1 text-[10px] font-mono font-semibold">
          {(['7D', '30D', '90D', '1Y'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded-md transition-all active:scale-95 ${
                timeframe === tf
                  ? 'bg-[#252b3a] text-white font-bold border border-[#38435b]'
                  : 'text-[#8a91a0] hover:text-[#dee1e7] hover:bg-[#1a1d26]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Composed Area & Bar Chart */}
      <div className="w-full h-44 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 6, left: -18, bottom: 0 }}
          >
            <defs>
              {/* Price Area Linear Gradient */}
              <linearGradient id="rwaPriceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0052ff" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#0052ff" stopOpacity={0.0} />
              </linearGradient>

              {/* Volume Bar Linear Gradient */}
              <linearGradient id="rwaVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#66c800" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#66c800" stopOpacity={0.15} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1b1f29"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              stroke="#4f5768"
              tick={{ fontSize: 9, fill: '#717886' }}
              tickLine={false}
              axisLine={{ stroke: '#1f2430' }}
              interval="preserveStartEnd"
            />

            {/* Left Y-Axis for Price */}
            {(viewMode === 'all' || viewMode === 'price') && (
              <YAxis
                yAxisId="priceAxis"
                orientation="left"
                stroke="#4f5768"
                tick={{ fontSize: 9, fill: '#717886' }}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(val) => `$${Math.round(val)}`}
              />
            )}

            {/* Right Y-Axis for Volume */}
            {(viewMode === 'all' || viewMode === 'volume') && (
              <YAxis
                yAxisId="volumeAxis"
                orientation="right"
                stroke="#4f5768"
                tick={{ fontSize: 9, fill: '#717886' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax * 3.5']}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                hide={viewMode === 'all'} // keep chart clean in combined mode
              />
            )}

            {/* Custom Interactive Tooltip */}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload as ChartDataPoint;
                  return (
                    <div className="p-2.5 rounded-xl bg-[#141722]/95 backdrop-blur-md border border-[#2b3345] shadow-2xl text-xs font-sans min-w-[170px] z-50">
                      <div className="text-[10px] text-[#8a91a0] font-mono border-b border-[#232a38] pb-1 mb-1.5 flex justify-between items-center">
                        <span>{data.fullDate}</span>
                        <span className="text-[#3c8aff] font-bold">{asset.symbol}</span>
                      </div>
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#8a91a0] text-[10px]">Token Price:</span>
                          <span className="font-bold text-white">${data.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#8a91a0] text-[10px]">24h Volume:</span>
                          <span className="font-bold text-[#66c800]">
                            {formatNumber(data.volume)} {asset.symbol}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#8a91a0] text-[10px]">USD Volume:</span>
                          <span className="text-[#dee1e7]">
                            ${formatNumber(data.volumeUsd)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-[#232a38]/80 text-[10px]">
                          <span className="text-[#717886]">Transactions:</span>
                          <span className="text-[#3c8aff] font-semibold">{data.txCount} UserOps</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Daily Volume Bar component */}
            {(viewMode === 'all' || viewMode === 'volume') && (
              <Bar
                yAxisId={viewMode === 'volume' ? 'volumeAxis' : 'priceAxis'}
                dataKey="volume"
                fill="url(#rwaVolumeGradient)"
                radius={[2, 2, 0, 0]}
                barSize={timeframe === '7D' ? 14 : timeframe === '30D' ? 4 : 2.5}
                opacity={viewMode === 'all' ? 0.35 : 0.85}
              />
            )}

            {/* Token Price Area Curve */}
            {(viewMode === 'all' || viewMode === 'price') && (
              <Area
                yAxisId="priceAxis"
                type="monotone"
                dataKey="price"
                stroke="#0052ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#rwaPriceGradient)"
                activeDot={{
                  r: 4,
                  stroke: '#3c8aff',
                  strokeWidth: 2,
                  fill: '#ffffff',
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Statistical Legend */}
      <div className="mt-2.5 pt-2 border-t border-[#1a1f28] grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
        <div className="p-1.5 rounded-lg bg-[#141720] border border-[#1f2533]">
          <div className="text-[#717886] text-[9px] uppercase tracking-wider">Range Low</div>
          <div className="font-bold text-white mt-0.5">${minPrice.toFixed(2)}</div>
        </div>
        <div className="p-1.5 rounded-lg bg-[#141720] border border-[#1f2533]">
          <div className="text-[#717886] text-[9px] uppercase tracking-wider">Range High</div>
          <div className="font-bold text-white mt-0.5">${maxPrice.toFixed(2)}</div>
        </div>
        <div className="p-1.5 rounded-lg bg-[#141720] border border-[#1f2533]">
          <div className="text-[#717886] text-[9px] uppercase tracking-wider">Avg Daily Vol</div>
          <div className="font-bold text-[#66c800] mt-0.5">{formatNumber(avgDailyVolume)}</div>
        </div>
      </div>
    </div>
  );
};
