import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Sparkles, 
  FileCode, 
  BookOpen, 
  Coins, 
  ArrowRight, 
  Clock, 
  ChevronRight, 
  ExternalLink, 
  Copy, 
  Check, 
  Workflow, 
  ShieldCheck, 
  Flame,
  Layers
} from 'lucide-react';
import { AssetMetadata, BaseNetwork, CapTableHolder, ScenarioFlow, TxLogEntry } from '../../types/base';
import { PRESET_RWA_TEMPLATES } from '../../data/mockBaseData';
import { shortenAddress } from '../../utils/web3Helper';

interface GlobalSearchBarProps {
  asset: AssetMetadata;
  holders?: CapTableHolder[];
  logs: TxLogEntry[];
  currentNetwork: BaseNetwork;
  onSelectTab: (tabId: string) => void;
  onSelectFlow?: (flowId: ScenarioFlow) => void;
  onSelectAssetTemplate?: (template: typeof PRESET_RWA_TEMPLATES[0]) => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'assets' | 'logs' | 'guides';
  badge: string;
  badgeColor: string;
  action: () => void;
  copyText?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  asset,
  holders = [],
  logs,
  currentNetwork,
  onSelectTab,
  onSelectFlow,
  onSelectAssetTemplate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'assets' | 'logs' | 'guides'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: `/` or `Cmd/Ctrl+K` to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is already typing in an input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) && target !== inputRef.current) {
        return;
      }

      if (e.key === '/' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // 1. ASSET ITEMS (Active Asset + Presets + Cap table holders)
  const assetItems: SearchItem[] = [
    {
      id: `current-asset-${asset.tokenAddress}`,
      title: `${asset.name} (${asset.symbol})`,
      subtitle: `Active B20 Asset • ${asset.tokenAddress} • Cap: ${asset.supplyCap.toLocaleString()}`,
      category: 'assets',
      badge: 'Active Token',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff] border border-[#0052ff]/30',
      action: () => {
        onSelectTab('simulator');
        setIsOpen(false);
      },
      copyText: asset.tokenAddress,
    },
    ...PRESET_RWA_TEMPLATES.map((tpl) => ({
      id: `tpl-${tpl.symbol}`,
      title: `${tpl.name} (${tpl.symbol})`,
      subtitle: `${tpl.type} • Precision: ${tpl.decimals} dec • ${tpl.description}`,
      category: 'assets' as const,
      badge: tpl.type,
      badgeColor: 'bg-[#ffd12f]/15 text-[#ffd12f] border border-[#ffd12f]/30',
      action: () => {
        if (onSelectAssetTemplate) {
          onSelectAssetTemplate(tpl);
        }
        onSelectTab('workshop');
        setIsOpen(false);
      },
      copyText: tpl.assetId,
    })),
    ...holders.map((h) => ({
      id: `holder-${h.address}`,
      title: `${h.name} (${h.category})`,
      subtitle: `${shortenAddress(h.address, 6)} • Balance: ${h.rawBalance.toLocaleString()} ${asset.symbol}`,
      category: 'assets' as const,
      badge: h.isAllowlisted ? 'Allowlisted' : 'Unapproved',
      badgeColor: h.isAllowlisted ? 'bg-[#66c800]/15 text-[#66c800]' : 'bg-[#fc401f]/15 text-[#fc401f]',
      action: () => {
        onSelectTab('captable');
        setIsOpen(false);
      },
      copyText: h.address,
    })),
  ];

  // 2. TRANSACTION LOG ITEMS
  const logItems: SearchItem[] = logs.slice(0, 15).map((l) => ({
    id: `log-${l.id}`,
    title: `${l.name} (${l.level})`,
    subtitle: `${l.detail} ${l.gasFeeUsd ? `• Fee: ${l.gasFeeUsd}` : ''} • ${l.timeFormatted}`,
    category: 'logs',
    badge: l.kind === 'ok' ? 'Success' : l.kind === 'err' ? 'Failed' : 'Info',
    badgeColor: l.kind === 'ok' 
      ? 'bg-[#66c800]/15 text-[#66c800]' 
      : l.kind === 'err' 
      ? 'bg-[#fc401f]/15 text-[#fc401f]' 
      : 'bg-[#3c8aff]/15 text-[#3c8aff]',
    action: () => {
      // Toggle or show logs
      onSelectTab('simulator');
      setIsOpen(false);
    },
    copyText: l.hash || l.detail,
  }));

  // 3. DOCUMENTATION GUIDES & PROTOCOL SPECS
  const guideItems: SearchItem[] = [
    {
      id: 'guide-create',
      title: 'Guide: Create an Asset Token',
      subtitle: 'Deploy and configure B20 Asset shared standard with six-decimal precision',
      category: 'guides',
      badge: 'B20 Spec',
      badgeColor: 'bg-[#0052ff]/15 text-[#3c8aff]',
      action: () => {
        if (onSelectFlow) onSelectFlow('create');
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-issue',
      title: 'Guide: Issue Units to Holders',
      subtitle: 'Batch minting units to KYC allowlisted investors with multicall efficiency',
      category: 'guides',
      badge: 'B20 Spec',
      badgeColor: 'bg-[#0052ff]/15 text-[#3c8aff]',
      action: () => {
        if (onSelectFlow) onSelectFlow('issue');
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-restrict',
      title: 'Guide: Restrict Eligible Holders',
      subtitle: 'B20PolicyRegistry allowlist and blocklist enforcement before transfers',
      category: 'guides',
      badge: 'Compliance',
      badgeColor: 'bg-[#ffd12f]/15 text-[#ffd12f]',
      action: () => {
        if (onSelectFlow) onSelectFlow('restrict');
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-split',
      title: 'Guide: Dynamic Multiplier (Stock Splits)',
      subtitle: 'Update WAD multiplier to execute 2:1 stock splits without looping balances',
      category: 'guides',
      badge: 'Dynamic Multiplier',
      badgeColor: 'bg-[#66c800]/15 text-[#66c800]',
      action: () => {
        if (onSelectFlow) onSelectFlow('split');
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-derivation',
      title: 'Guide: L2 Derivation Pipeline (8 Stages)',
      subtitle: 'L1 Traversal, Retrieval, Frame Queue, Channel Bank, Batch Queue to Reth Engine API',
      category: 'guides',
      badge: 'Rollup Spec',
      badgeColor: 'bg-[#3c8aff]/15 text-[#3c8aff]',
      action: () => {
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-paymaster',
      title: 'Guide: Base Gasless Paymaster (ERC-4337)',
      subtitle: 'Sponsored passkey transactions and UserOp validation with zero user gas',
      category: 'guides',
      badge: 'ERC-4337',
      badgeColor: 'bg-[#ffd12f]/15 text-[#ffd12f]',
      action: () => {
        onSelectTab('paymaster');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-bridge',
      title: 'Guide: Base Bridge & Fault Proofs',
      subtitle: 'OptimismPortal, DisputeGameFactory, 7-day challenge window & L2ToL1MessagePasser',
      category: 'guides',
      badge: 'Bridge',
      badgeColor: 'bg-[#0052ff]/15 text-[#3c8aff]',
      action: () => {
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-p2p',
      title: 'Guide: P2P Network, Discovery & Gossip',
      subtitle: 'Discv5 DHT, LibP2P Noise XX handshake, GossipSub 1.1 unsafe block propagation',
      category: 'guides',
      badge: 'P2P Spec',
      badgeColor: 'bg-[#3c8aff]/15 text-[#3c8aff]',
      action: () => {
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-p2p-topics',
      title: 'Guide: GossipSub Block Topics (blocksv1 - blocksv4)',
      subtitle: '/optimism/chainId/version/blocks, Snappy block compression, SSZ ExecutionPayload',
      category: 'guides',
      badge: 'Gossip Topics',
      badgeColor: 'bg-[#ffd12f]/15 text-[#ffd12f]',
      action: () => {
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-p2p-reqresp',
      title: 'Guide: P2P Req-Resp Sync (payload_by_number)',
      subtitle: '/opstack/req/payload_by_number, little-endian block queries, version envelopes',
      category: 'guides',
      badge: 'Req-Resp',
      badgeColor: 'bg-[#66c800]/15 text-[#66c800]',
      action: () => {
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-rpc-output',
      title: 'RPC: optimism_outputAtBlock (L2 Output Roots)',
      subtitle: 'Rollup node API returning version, outputRoot, withdrawalStorageRoot, and stateRoot',
      category: 'guides',
      badge: 'Rollup RPC',
      badgeColor: 'bg-[#3c8aff]/15 text-[#3c8aff]',
      action: () => {
        onSelectTab('guides');
        setIsOpen(false);
      },
      copyText: 'optimism_outputAtBlock',
    },
    {
      id: 'guide-rpc-structures',
      title: 'RPC Structures: L2BlockRef, BlockID & SyncStatus',
      subtitle: 'Engine API types, sequenceNumber, l1origin, and driver synchronization status snapshot',
      category: 'guides',
      badge: 'Rollup Types',
      badgeColor: 'bg-[#ffd12f]/15 text-[#ffd12f]',
      action: () => {
        onSelectTab('guides');
        setIsOpen(false);
      },
    },
    {
      id: 'guide-withdrawal-root',
      title: 'Spec: L2ToL1MessagePasser & Withdrawal Storage Root',
      subtitle: 'Storage root of 0x4200...0016 for proving L2 withdrawal inclusion on Ethereum L1',
      category: 'guides',
      badge: 'Fault Proofs',
      badgeColor: 'bg-[#66c800]/15 text-[#66c800]',
      action: () => {
        onSelectTab('guides');
        setIsOpen(false);
      },
      copyText: '0x4200000000000000000000000000000000000016',
    },
  ];

  // Combined and filtered items
  const allItems = [...assetItems, ...logItems, ...guideItems];

  const filteredItems = allItems.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false;
    }
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q)
    );
  });

  const countByCategory = {
    all: allItems.length,
    assets: assetItems.length,
    logs: logItems.length,
    guides: guideItems.length,
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
      {/* Search Input Box */}
      <div 
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-[#111317] border-[#0052ff] ring-2 ring-[#0052ff]/20 shadow-lg shadow-[#0052ff]/10'
            : 'bg-[#14161c] hover:bg-[#181b22] border-[#232730] hover:border-[#384050]'
        }`}
      >
        <Search className={`h-3.5 w-3.5 transition-colors ${isOpen ? 'text-[#3c8aff]' : 'text-[#8a91a0]'}`} />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search assets, tx logs, guides..."
          className="bg-transparent border-none outline-none text-xs text-white placeholder-[#687082] w-full font-sans"
        />

        {query ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-0.5 rounded text-[#8a91a0] hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1c202a] text-[#8a91a0] border border-[#2b3140] pointer-events-none">
            /
          </kbd>
        )}
      </div>

      {/* Dropdown Results Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-[480px] top-full mt-2 rounded-2xl border border-[#262b36] bg-[#111317]/95 backdrop-blur-xl shadow-2xl shadow-black/80 z-50 overflow-hidden animate-fadeIn">
          
          {/* Filter Categories Bar */}
          <div className="flex items-center gap-1 p-2 border-b border-[#1f232c] bg-[#0c0e12]/80 text-xs font-mono">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeCategory === 'all' 
                  ? 'bg-[#0052ff] text-white font-bold shadow-sm' 
                  : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              <span>All</span>
              <span className="text-[10px] opacity-75">{countByCategory.all}</span>
            </button>

            <button
              onClick={() => setActiveCategory('assets')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeCategory === 'assets' 
                  ? 'bg-[#0052ff] text-white font-bold shadow-sm' 
                  : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              <Coins className="h-3 w-3" />
              <span>B20 Assets</span>
              <span className="text-[10px] opacity-75">{countByCategory.assets}</span>
            </button>

            <button
              onClick={() => setActiveCategory('logs')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeCategory === 'logs' 
                  ? 'bg-[#0052ff] text-white font-bold shadow-sm' 
                  : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>Tx Logs</span>
              <span className="text-[10px] opacity-75">{countByCategory.logs}</span>
            </button>

            <button
              onClick={() => setActiveCategory('guides')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeCategory === 'guides' 
                  ? 'bg-[#0052ff] text-white font-bold shadow-sm' 
                  : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              <BookOpen className="h-3 w-3" />
              <span>Docs</span>
              <span className="text-[10px] opacity-75">{countByCategory.guides}</span>
            </button>
          </div>

          {/* Result Items List */}
          <div className="max-h-[380px] overflow-y-auto p-1.5 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8a91a0]">
                No matches found for &quot;{query}&quot;
                <div className="mt-1 text-[11px] text-[#555d6e]">
                  Try searching for &quot;EXM&quot;, &quot;createB20&quot;, &quot;Derivation&quot;, or &quot;Paymaster&quot;
                </div>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isAsset = item.category === 'assets';
                const isLog = item.category === 'logs';
                const isGuide = item.category === 'guides';

                return (
                  <div
                    key={item.id}
                    onClick={item.action}
                    className="p-2.5 rounded-xl hover:bg-[#171a23] border border-transparent hover:border-[#2b3140] cursor-pointer transition-all flex items-start justify-between group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-[#1a1d26] border border-[#2b3140] text-[#8a91a0] group-hover:text-white group-hover:border-[#3c8aff]/50 transition-colors">
                        {isAsset && <Coins className="h-3.5 w-3.5 text-[#ffd12f]" />}
                        {isLog && <Clock className="h-3.5 w-3.5 text-[#66c800]" />}
                        {isGuide && <BookOpen className="h-3.5 w-3.5 text-[#3c8aff]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white group-hover:text-[#3c8aff] transition-colors truncate">
                            {item.title}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8a91a0] mt-0.5 line-clamp-1">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {item.copyText && (
                        <button
                          onClick={(e) => handleCopy(item.id, item.copyText!, e)}
                          title="Copy address / hash"
                          className="p-1 rounded-md text-[#717886] hover:text-white hover:bg-[#202532] transition-colors"
                        >
                          {copiedId === item.id ? (
                            <Check className="h-3.5 w-3.5 text-[#66c800]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <ChevronRight className="h-4 w-4 text-[#434a59] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Shortcuts Footer */}
          <div className="p-2 border-t border-[#1f232c] bg-[#0c0e12]/80 flex items-center justify-between text-[10.5px] text-[#717886] font-mono">
            <div className="flex items-center gap-2">
              <span>Press <kbd className="px-1 py-0.2 rounded bg-[#181b24] text-white">Esc</kbd> to close</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.2 rounded bg-[#181b24] text-white">/</kbd> to focus</span>
            </div>
            <span className="text-[#3c8aff]">{filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}</span>
          </div>

        </div>
      )}
    </div>
  );
};
