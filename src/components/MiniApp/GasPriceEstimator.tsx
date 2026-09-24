import React, { useState, useEffect, useMemo } from 'react';
import { 
  Fuel, 
  Gauge, 
  Zap, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  ArrowUpRight, 
  Check, 
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Activity
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';

export type GasTierId = 'eco' | 'standard' | 'priority';

export interface GasTierOption {
  id: GasTierId;
  name: string;
  speedLabel: string;
  estTime: string;
  blocks: string;
  maxFeeGwei: number;
  priorityFeeGwei: number;
  costUsd: number;
  isOptimal: boolean;
  savingsVsL1Percent: number;
}

interface GasPriceEstimatorProps {
  currentNetwork: BaseNetwork;
  selectedTier?: GasTierId;
  onSelectTier?: (tier: GasTierId, details: GasTierOption) => void;
  compact?: boolean;
}

export const GasPriceEstimator: React.FC<GasPriceEstimatorProps> = ({
  currentNetwork,
  selectedTier = 'standard',
  onSelectTier,
  compact = false,
}) => {
  // Dynamic network congestion state (0% to 100%)
  const [congestion, setCongestion] = useState<number>(24);
  const [baseFeeGwei, setBaseFeeGwei] = useState<number>(0.0028);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [simulatedCongestionMode, setSimulatedCongestionMode] = useState<'auto' | 'low' | 'med' | 'high'>('auto');
  const [activeTier, setActiveTier] = useState<GasTierId>(selectedTier);

  // Sync external prop if changed
  useEffect(() => {
    setActiveTier(selectedTier);
  }, [selectedTier]);

  // Congestion categorization
  const congestionCategory = useMemo<'low' | 'moderate' | 'high'>(() => {
    if (congestion < 35) return 'low';
    if (congestion < 70) return 'moderate';
    return 'high';
  }, [congestion]);

  // Dynamically calculate the 3 tiers based on live base fee & congestion
  const tiers = useMemo<Record<GasTierId, GasTierOption>>(() => {
    const ethPriceUsd = 2950;
    const estGasLimit = 65000; // typical ERC-20 / RWA transfer UserOp

    // Multipliers based on congestion
    const congestionFactor = 1 + (congestion / 100) * 0.8; // 1.0 to 1.8

    // Eco tier
    const ecoPriority = 0.001;
    const ecoMaxFee = Number((baseFeeGwei * 1.05 + ecoPriority).toFixed(4));
    const ecoCostUsd = Number(((ecoMaxFee * 1e-9 * estGasLimit) * ethPriceUsd).toFixed(5));

    // Standard tier
    const stdPriority = Number((0.0022 * congestionFactor).toFixed(4));
    const stdMaxFee = Number((baseFeeGwei * 1.25 + stdPriority).toFixed(4));
    const stdCostUsd = Number(((stdMaxFee * 1e-9 * estGasLimit) * ethPriceUsd).toFixed(5));

    // Priority tier
    const prioPriority = Number((0.0055 * congestionFactor * 1.3).toFixed(4));
    const prioMaxFee = Number((baseFeeGwei * 1.6 + prioPriority).toFixed(4));
    const prioCostUsd = Number(((prioMaxFee * 1e-9 * estGasLimit) * ethPriceUsd).toFixed(5));

    // Determine optimal recommendation dynamically
    // When congestion is high (>70%), priority is optimal to prevent sequencer re-ordering
    // When moderate or low, standard is optimal
    const standardIsOptimal = congestion <= 68;
    const priorityIsOptimal = congestion > 68;

    return {
      eco: {
        id: 'eco',
        name: 'Eco',
        speedLabel: 'Economical',
        estTime: congestion > 60 ? '~5.5s' : '~3.8s',
        blocks: '2-3 blocks',
        maxFeeGwei: ecoMaxFee,
        priorityFeeGwei: ecoPriority,
        costUsd: ecoCostUsd,
        isOptimal: false,
        savingsVsL1Percent: 99.4,
      },
      standard: {
        id: 'standard',
        name: 'Standard',
        speedLabel: 'Optimal',
        estTime: '~1.8s',
        blocks: 'Next block',
        maxFeeGwei: stdMaxFee,
        priorityFeeGwei: stdPriority,
        costUsd: stdCostUsd,
        isOptimal: standardIsOptimal,
        savingsVsL1Percent: 99.1,
      },
      priority: {
        id: 'priority',
        name: 'Priority',
        speedLabel: 'Instant',
        estTime: '<0.9s',
        blocks: 'Top of block',
        maxFeeGwei: prioMaxFee,
        priorityFeeGwei: prioPriority,
        costUsd: prioCostUsd,
        isOptimal: priorityIsOptimal,
        savingsVsL1Percent: 98.7,
      },
    };
  }, [baseFeeGwei, congestion]);

  // Handle tier selection
  const handleSelect = (tierId: GasTierId) => {
    setActiveTier(tierId);
    if (onSelectTier) {
      onSelectTier(tierId, tiers[tierId]);
    }
  };

  // Dynamic refresh ticker
  const refreshGasData = (targetMode?: 'auto' | 'low' | 'med' | 'high') => {
    setIsRefreshing(true);
    const mode = targetMode || simulatedCongestionMode;

    setTimeout(() => {
      let nextCongestion = congestion;
      let nextBaseFee = baseFeeGwei;

      if (mode === 'low') {
        nextCongestion = Math.floor(Math.random() * 15) + 15; // 15-30%
        nextBaseFee = 0.0018 + Math.random() * 0.0008;
      } else if (mode === 'med') {
        nextCongestion = Math.floor(Math.random() * 20) + 45; // 45-65%
        nextBaseFee = 0.0035 + Math.random() * 0.0012;
      } else if (mode === 'high') {
        nextCongestion = Math.floor(Math.random() * 18) + 74; // 74-92%
        nextBaseFee = 0.0065 + Math.random() * 0.0025;
      } else {
        // Auto natural drift
        const delta = (Math.random() - 0.48) * 6;
        nextCongestion = Math.min(95, Math.max(12, Math.round(congestion + delta)));
        const feeDelta = (Math.random() - 0.48) * 0.0006;
        nextBaseFee = Math.max(0.0015, Number((baseFeeGwei + feeDelta).toFixed(4)));
      }

      setCongestion(nextCongestion);
      setBaseFeeGwei(Number(nextBaseFee.toFixed(4)));
      setLastUpdated(0);
      setIsRefreshing(false);
    }, 350);
  };

  // Periodic dynamic polling simulation every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
      // Subtle micro jitter every 5 seconds
      if (simulatedCongestionMode === 'auto') {
        const delta = (Math.random() - 0.48) * 4;
        setCongestion((prev) => Math.min(92, Math.max(14, Math.round(prev + delta))));
        const feeDelta = (Math.random() - 0.48) * 0.0004;
        setBaseFeeGwei((prev) => Math.max(0.0018, Number((prev + feeDelta).toFixed(4))));
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [simulatedCongestionMode]);

  // COMPACT BADGE MODE (for header / summary bar)
  if (compact) {
    return (
      <div 
        onClick={() => refreshGasData()}
        className="cursor-pointer group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12151c] border border-[#232938] hover:border-[#3c8aff]/50 text-[10px] font-mono transition-all"
        title="Live Base L2 Gas Estimator · Click to refresh"
      >
        <Fuel className={`h-3 w-3 text-[#3c8aff] group-hover:scale-110 transition-transform ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="font-bold text-white">{tiers[activeTier].maxFeeGwei} Gwei</span>
        <span className="text-[#8a91a0]">·</span>
        <span className={`flex items-center gap-1 font-semibold ${
          congestionCategory === 'low' ? 'text-[#66c800]' :
          congestionCategory === 'moderate' ? 'text-[#ffd12f]' :
          'text-[#fc401f]'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            congestionCategory === 'low' ? 'bg-[#66c800] animate-pulse' :
            congestionCategory === 'moderate' ? 'bg-[#ffd12f]' :
            'bg-[#fc401f] animate-ping'
          }`} />
          {congestion}% {congestionCategory === 'low' ? 'Optimal' : congestionCategory === 'moderate' ? 'Normal' : 'Busy'}
        </span>
      </div>
    );
  }

  // FULL INTERACTIVE GAS ESTIMATOR CARD
  return (
    <div className="p-3.5 rounded-2xl bg-[#111319] border border-[#1f2430] shadow-xl relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
        congestionCategory === 'low' ? 'bg-[#66c800]/5' :
        congestionCategory === 'moderate' ? 'bg-[#ffd12f]/5' :
        'bg-[#fc401f]/5'
      }`} />

      {/* Header with Title, Live Status, and Manual Refresh */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#1c212b]">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-lg bg-[#0052ff]/15 flex items-center justify-center border border-[#0052ff]/25 text-[#3c8aff]">
            <Fuel className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Gas Price Estimator</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0052ff]/20 text-[#3c8aff] font-bold">
                EIP-1559 L2
              </span>
            </div>
            <div className="text-[10px] text-[#8a91a0]">
              Real-time fee calculation & sequencer queue monitoring
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refreshGasData()}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg bg-[#171a23] hover:bg-[#202532] text-[#8a91a0] hover:text-white border border-[#242b3a] transition-all flex items-center gap-1 text-[10px] active:scale-95"
          title="Refresh live gas price probe"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-[#3c8aff]' : ''}`} />
          <span className="hidden sm:inline font-mono text-[9px]">{lastUpdated < 2 ? 'Live' : `${lastUpdated}s`}</span>
        </button>
      </div>

      {/* Live Congestion Meter & Base Fee Indicator */}
      <div className="mt-3 p-2.5 rounded-xl bg-[#141722] border border-[#202636] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-[#8a91a0]" />
            <span className="text-[11px] font-semibold text-[#dee1e7]">Network Congestion:</span>
            <span className={`font-mono font-bold text-[11px] ${
              congestionCategory === 'low' ? 'text-[#66c800]' :
              congestionCategory === 'moderate' ? 'text-[#ffd12f]' :
              'text-[#fc401f]'
            }`}>
              {congestion}% ({congestionCategory === 'low' ? 'Low / Optimal' : congestionCategory === 'moderate' ? 'Moderate' : 'High Volume'})
            </span>
          </div>

          <div className="text-[10px] font-mono text-[#8a91a0]">
            Base: <span className="text-white font-bold">{baseFeeGwei}</span> Gwei
          </div>
        </div>

        {/* Visual Progress Bar Meter */}
        <div className="relative h-2 w-full rounded-full bg-[#1e2330] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              congestionCategory === 'low'
                ? 'bg-gradient-to-r from-[#66c800] to-[#88e025]'
                : congestionCategory === 'moderate'
                ? 'bg-gradient-to-r from-[#66c800] via-[#ffd12f] to-[#ffb800]'
                : 'bg-gradient-to-r from-[#ffd12f] via-[#ff6b00] to-[#fc401f]'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, congestion))}%` }}
          />
        </div>

        {/* Dynamic Contextual Smart Suggestion */}
        <div className={`flex items-start gap-1.5 text-[10px] leading-relaxed pt-0.5 ${
          congestionCategory === 'low' ? 'text-[#7fe023]' :
          congestionCategory === 'moderate' ? 'text-[#ffe066]' :
          'text-[#ff7e66]'
        }`}>
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            {congestionCategory === 'low' && (
              <>Low network congestion detected. <strong>Standard tier (0.004 Gwei)</strong> is optimal for immediate 1-block settlement with zero lag.</>
            )}
            {congestionCategory === 'moderate' && (
              <>Normal network traffic. <strong>Standard tier</strong> will confirm in next block (~1.8s). Eco tier may experience slight 1-2 block delay.</>
            )}
            {congestionCategory === 'high' && (
              <>Elevated sequencer queue depth ({congestion}%). <strong>Priority tier recommended</strong> to ensure high-priority block inclusion.</>
            )}
          </span>
        </div>
      </div>

      {/* Selectable Speed Tiers (Eco, Standard, Priority) */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(['eco', 'standard', 'priority'] as GasTierId[]).map((tierId) => {
          const tier = tiers[tierId];
          const isSelected = activeTier === tierId;

          return (
            <button
              key={tierId}
              type="button"
              onClick={() => handleSelect(tierId)}
              className={`relative p-2.5 rounded-xl border text-left transition-all active:scale-98 flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0052ff]/15 border-[#0052ff] ring-1 ring-[#0052ff]/40 shadow-md shadow-[#0052ff]/20'
                  : 'bg-[#141720] border-[#1e2330] hover:border-[#2f384a] hover:bg-[#181c26]'
              }`}
            >
              {/* Optimal Badge */}
              {tier.isOptimal && (
                <span className="absolute -top-2 right-1.5 px-1.5 py-0.2 rounded-full bg-[#66c800] text-black text-[8px] font-mono font-extrabold uppercase tracking-tight shadow">
                  Optimal
                </span>
              )}

              {/* Tier Name & Selection Indicator */}
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#dee1e7]'}`}>
                    {tier.name}
                  </span>
                  <div className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-[#0052ff] bg-[#0052ff]' : 'border-[#384255]'
                  }`}>
                    {isSelected && <Check className="h-2 w-2 text-white stroke-[3]" />}
                  </div>
                </div>

                <div className="text-[10px] text-[#8a91a0] flex items-center gap-1 mt-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{tier.estTime}</span>
                </div>
              </div>

              {/* Price Readout */}
              <div className="mt-2.5 pt-1.5 border-t border-[#1f2533]">
                <div className="font-mono font-bold text-xs text-white">
                  {tier.maxFeeGwei} <span className="text-[9px] font-normal text-[#8a91a0]">Gwei</span>
                </div>
                <div className="text-[9px] font-mono text-[#66c800]">
                  ${tier.costUsd < 0.0001 ? '<$0.0001' : `$${tier.costUsd.toFixed(4)}`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Paymaster Sponsorship Banner */}
      <div className="mt-3 p-2.5 rounded-xl bg-[#66c800]/10 border border-[#66c800]/25 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-[#66c800]/20 flex items-center justify-center text-[#66c800]">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#66c800]">Base Paymaster Sponsorship Active</div>
            <div className="text-[10px] text-[#8a91a0]">
              {tiers[activeTier].name} tier (${tiers[activeTier].costUsd.toFixed(4)}) is 100% sponsored.
            </div>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-xs font-extrabold text-[#66c800]">$0.00 ETH</div>
          <div className="text-[9px] text-[#8a91a0] line-through">
            {tiers[activeTier].maxFeeGwei} Gwei
          </div>
        </div>
      </div>

      {/* Interactive Simulation Controls (for evaluation & manual testing) */}
      <div className="mt-2.5 pt-2 border-t border-[#1c212b] flex items-center justify-between text-[10px]">
        <span className="text-[#717886] font-semibold">Simulate Congestion:</span>
        <div className="flex items-center gap-1 font-mono">
          <button
            type="button"
            onClick={() => {
              setSimulatedCongestionMode('auto');
              refreshGasData('auto');
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
              simulatedCongestionMode === 'auto'
                ? 'bg-[#0052ff] text-white'
                : 'bg-[#171a23] text-[#8a91a0] hover:text-white'
            }`}
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedCongestionMode('low');
              refreshGasData('low');
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
              simulatedCongestionMode === 'low'
                ? 'bg-[#66c800] text-black'
                : 'bg-[#171a23] text-[#66c800] hover:bg-[#66c800]/20'
            }`}
          >
            Low
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedCongestionMode('med');
              refreshGasData('med');
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
              simulatedCongestionMode === 'med'
                ? 'bg-[#ffd12f] text-black'
                : 'bg-[#171a23] text-[#ffd12f] hover:bg-[#ffd12f]/20'
            }`}
          >
            Med
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedCongestionMode('high');
              refreshGasData('high');
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
              simulatedCongestionMode === 'high'
                ? 'bg-[#fc401f] text-white'
                : 'bg-[#171a23] text-[#fc401f] hover:bg-[#fc401f]/20'
            }`}
          >
            High
          </button>
        </div>
      </div>
    </div>
  );
};
