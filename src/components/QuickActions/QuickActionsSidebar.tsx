import React, { useState, useEffect } from 'react';
import { 
  ArrowDownUp, 
  ExternalLink, 
  Droplet, 
  Settings, 
  Smartphone,
  Zap, 
  Check, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { triggerConfetti } from '../../utils/web3Helper';

interface QuickActionsSidebarProps {
  currentNetwork: BaseNetwork;
  activeTab: string;
  onOpenBridgeStatus: () => void;
  onRequestFaucet: () => void;
  onSelectTab: (tabId: string) => void;
}

export const QuickActionsSidebar: React.FC<QuickActionsSidebarProps> = ({
  currentNetwork,
  activeTab,
  onOpenBridgeStatus,
  onRequestFaucet,
  onSelectTab,
}) => {
  const [mounted, setMounted] = useState(false);
  const [faucetClaimed, setFaucetClaimed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Trigger subtle slide-in + scale entrance effect on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  const handleFaucet = () => {
    setFaucetClaimed(true);
    onRequestFaucet();
    triggerConfetti();
    setTimeout(() => {
      setFaucetClaimed(false);
    }, 1800);
  };

  const handleOpenExplorer = () => {
    const url = currentNetwork.explorerUrl || `https://basescan.org`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside 
      aria-label="Quick Actions Sidebar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center"
    >
      {/* Glassmorphism Sidebar Container with entrance animation & scale effect */}
      <div 
        className={`relative flex flex-col items-center gap-2 p-2 rounded-2xl bg-[#111317]/85 backdrop-blur-xl border border-[#262b36]/90 shadow-2xl shadow-black/80 ring-1 ring-white/5 transition-all duration-700 cubic-bezier(0.16,1,0.3,1) transform ${
          mounted 
            ? 'opacity-100 translate-x-0 scale-100 blur-0' 
            : 'opacity-0 -translate-x-8 scale-90 blur-sm pointer-events-none'
        } ${isHovered ? 'border-[#384255] shadow-[#0052ff]/10 ring-white/10' : ''}`}
      >
        
        {/* Brand / Header Indicator */}
        <div 
          className={`relative group flex items-center justify-center p-2 rounded-xl text-[#0052ff] hover:bg-[#0052ff]/15 transition-all duration-500 ${
            mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
          }`}
          style={{ transitionDelay: '80ms' }}
        >
          <div className="h-6 w-6 rounded-lg bg-[#0052ff]/20 flex items-center justify-center border border-[#0052ff]/30">
            <Zap className="h-3.5 w-3.5 text-[#3c8aff]" />
          </div>

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#181a22] border border-[#2b3140] text-xs font-semibold text-white shadow-2xl pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0052ff]"></span>
            <span>Quick Actions Rail</span>
          </div>
        </div>

        <div className="w-6 h-px bg-[#232730]" />

        {/* BUTTON 1: Bridge Status */}
        <div 
          className={`relative group transition-all duration-500 ${
            mounted ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95'
          }`}
          style={{ transitionDelay: '140ms' }}
        >
          <button
            onClick={onOpenBridgeStatus}
            aria-label="Check Bridge Status"
            className="relative h-10 w-10 rounded-xl flex items-center justify-center text-[#8a91a0] hover:text-white hover:bg-[#1a1d26] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#0052ff]/50"
          >
            <ArrowDownUp className="h-4 w-4 text-[#3c8aff] group-hover:scale-110 transition-transform" />
            
            {/* Live operational badge dot */}
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#66c800] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#66c800]"></span>
            </span>
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#181a22] border border-[#2b3140] text-xs text-white shadow-2xl pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
            <div className="font-bold flex items-center gap-1.5">
              <span>Bridge Status</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-[#66c800]/20 text-[#66c800] font-mono">Live</span>
            </div>
            <div className="text-[10px] text-[#8a91a0]">Ethereum L1 ↔ Base L2 Bridge</div>
          </div>
        </div>

        {/* BUTTON 2: Explorer */}
        <div 
          className={`relative group transition-all duration-500 ${
            mounted ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          <button
            onClick={handleOpenExplorer}
            aria-label="View Explorer"
            className="h-10 w-10 rounded-xl flex items-center justify-center text-[#8a91a0] hover:text-white hover:bg-[#1a1d26] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#ffd12f]/50"
          >
            <ExternalLink className="h-4 w-4 text-[#ffd12f] group-hover:scale-110 transition-transform" />
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#181a22] border border-[#2b3140] text-xs text-white shadow-2xl pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
            <div className="font-bold flex items-center gap-1.5">
              <span>View Explorer</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-[#ffd12f]/20 text-[#ffd12f] font-mono">Basescan</span>
            </div>
            <div className="text-[10px] text-[#8a91a0]">Browse {currentNetwork.name}</div>
          </div>
        </div>

        {/* BUTTON 3: Faucet */}
        <div 
          className={`relative group transition-all duration-500 ${
            mounted ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95'
          }`}
          style={{ transitionDelay: '260ms' }}
        >
          <button
            onClick={handleFaucet}
            aria-label="Request Faucet Funds"
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#66c800]/50 active:scale-95 ${
              faucetClaimed 
                ? 'bg-[#66c800]/20 text-[#66c800]' 
                : 'text-[#8a91a0] hover:text-white hover:bg-[#1a1d26]'
            }`}
          >
            {faucetClaimed ? (
              <Check className="h-4 w-4 text-[#66c800] animate-bounce" />
            ) : (
              <Droplet className="h-4 w-4 text-[#66c800] group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#181a22] border border-[#2b3140] text-xs text-white shadow-2xl pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
            <div className="font-bold flex items-center gap-1.5">
              <span>Request Faucet</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-[#66c800]/20 text-[#66c800] font-mono">+0.5 ETH</span>
            </div>
            <div className="text-[10px] text-[#8a91a0]">Instant testnet gas drop</div>
          </div>
        </div>

        {/* BUTTON 4: Settings (App Config) */}
        <div 
          className={`relative group transition-all duration-500 ${
            mounted ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95'
          }`}
          style={{ transitionDelay: '320ms' }}
        >
          <button
            onClick={() => onSelectTab('config')}
            aria-label="Settings and App Config"
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#0052ff]/50 active:scale-95 ${
              activeTab === 'config'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'text-[#8a91a0] hover:text-white hover:bg-[#1a1d26]'
            }`}
          >
            <Settings className={`h-4 w-4 group-hover:rotate-45 transition-transform ${
              activeTab === 'config' ? 'text-white' : 'text-[#dee1e7]'
            }`} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#181a22] border border-[#2b3140] text-xs text-white shadow-2xl pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
            <div className="font-bold">Settings & Configuration</div>
            <div className="text-[10px] text-[#8a91a0]">RPCs, Contracts, Diagnostics & Specs</div>
          </div>
        </div>

        <div className="w-6 h-px bg-[#232730]" />

        {/* BONUS BUTTON: Mini App View */}
        <div 
          className={`relative group transition-all duration-500 ${
            mounted ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95'
          }`}
          style={{ transitionDelay: '380ms' }}
        >
          <button
            onClick={() => onSelectTab('miniapp')}
            aria-label="Switch to Mini App Mode"
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#a855f7]/50 active:scale-95 ${
              activeTab === 'miniapp'
                ? 'bg-[#a855f7] text-white shadow-md shadow-[#a855f7]/30'
                : 'text-[#8a91a0] hover:text-white hover:bg-[#1a1d26]'
            }`}
          >
            <Smartphone className={`h-4 w-4 group-hover:scale-110 transition-transform ${
              activeTab === 'miniapp' ? 'text-white' : 'text-[#a855f7]'
            }`} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#181a22] border border-[#2b3140] text-xs text-white shadow-2xl pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
            <div className="font-bold">Mini App Mode</div>
            <div className="text-[10px] text-[#8a91a0]">Farcaster Frames v2 & Mobile View</div>
          </div>
        </div>

      </div>
    </aside>
  );
};
