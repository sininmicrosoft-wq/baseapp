import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowDownUp, 
  ExternalLink, 
  Droplet, 
  Search, 
  Copy, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  Coins, 
  Workflow, 
  X, 
  ChevronRight, 
  Sparkles,
  Command,
  FileCode,
  Network,
  Wallet,
  KeyRound
} from 'lucide-react';
import { BaseNetwork, WalletAccount } from '../../types/base';
import { triggerConfetti } from '../../utils/web3Helper';

interface QuickActionsMenuProps {
  currentNetwork: BaseNetwork;
  wallet: WalletAccount;
  onOpenBridgeStatus: () => void;
  onRequestFaucet: () => void;
  onSelectTab: (tabId: string) => void;
  onQuickConnect?: () => void;
  contractAddress?: string;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  currentNetwork,
  wallet,
  onOpenBridgeStatus,
  onRequestFaucet,
  onSelectTab,
  onQuickConnect,
  contractAddress = '0xB20019e07cA8F6A3E147eFbA9D987116e7a18453',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [faucetPending, setFaucetPending] = useState(false);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K or Q to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleFaucetTap = () => {
    setFaucetPending(true);
    onRequestFaucet();
    setTimeout(() => {
      setFaucetPending(false);
    }, 600);
  };

  const handleOpenExplorer = () => {
    if (currentNetwork.explorerUrl) {
      window.open(currentNetwork.explorerUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://basescan.org/address/${contractAddress}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Quick Action Items Definition
  const actions = [
    {
      id: 'quick-connect',
      title: wallet.isConnected ? 'Manage Connected Wallet' : 'Quick Connect Wallet',
      category: 'Wallet & Access',
      subtitle: wallet.isConnected
        ? `Connected: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} (${wallet.isSmartWallet ? 'Passkey' : 'Injected'})`
        : 'Connect Base Smart Wallet with Passkeys or Browser Wallet',
      icon: wallet.isConnected ? Wallet : KeyRound,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15',
      badge: wallet.isConnected ? (wallet.isSmartWallet ? 'Passkey' : 'Injected') : '1-Click',
      badgeColor: wallet.isConnected ? 'bg-[#66c800]/20 text-[#66c800]' : 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        setIsOpen(false);
        if (onQuickConnect) {
          onQuickConnect();
        }
      },
    },
    {
      id: 'bridge',
      title: 'Check Bridge Status',
      category: 'Network & Infrastructure',
      subtitle: 'Inspect OptimismPortal, DisputeGameFactory & 7-day challenge period',
      icon: ArrowDownUp,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15',
      badge: 'L1 ↔ L2',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        setIsOpen(false);
        onOpenBridgeStatus();
      },
    },
    {
      id: 'faucet',
      title: 'Request Faucet Funds',
      category: 'Funds & Gas',
      subtitle: `Instant +0.5 ETH to ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
      icon: Droplet,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15',
      badge: '+0.5 ETH',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: handleFaucetTap,
    },
    {
      id: 'explorer',
      title: 'View Explorer',
      category: 'Network & Infrastructure',
      subtitle: `Browse ${currentNetwork.name} on Basescan / Blockscout`,
      icon: ExternalLink,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15',
      badge: 'Basescan',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: handleOpenExplorer,
    },
    {
      id: 'miniapp',
      title: 'Switch to Mini App Mode',
      category: 'Experiences',
      subtitle: 'Mobile-first Farcaster Frame v2 / Warpcast & Smart Wallet UI',
      icon: Smartphone,
      iconColor: 'text-[#a855f7]',
      iconBg: 'bg-[#a855f7]/15',
      badge: 'Frames v2',
      badgeColor: 'bg-[#a855f7]/20 text-[#a855f7]',
      action: () => {
        setIsOpen(false);
        onSelectTab('miniapp');
      },
    },
    {
      id: 'paymaster',
      title: 'Test Gasless Paymaster',
      category: 'Gas & Execution',
      subtitle: 'Simulate ERC-4337 Passkey sponsor transfers on Base',
      icon: Zap,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15',
      badge: 'Zero Gas',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: () => {
        setIsOpen(false);
        onSelectTab('paymaster');
      },
    },
    {
      id: 'derivation',
      title: 'Inspect Derivation Pipeline',
      category: 'Protocol Docs',
      subtitle: '8-stage Rollup Node execution & wire format specifications',
      icon: Workflow,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15',
      badge: '8 Stages',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        setIsOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'contracts',
      title: 'View Solidity Source Code',
      category: 'Smart Contracts',
      subtitle: 'Inspect B20PolicyRegistry, B20Token, and Diamond standard',
      icon: FileCode,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15',
      badge: 'Solidity 0.8.28',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        setIsOpen(false);
        onSelectTab('contracts');
      },
    },
  ];

  const filteredActions = searchQuery.trim()
    ? actions.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : actions;

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (Fixed Bottom-Right) */}
      <div className="fixed bottom-14 right-4 sm:right-6 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0052ff] to-[#0042d0] text-white shadow-xl shadow-[#0052ff]/30 hover:shadow-2xl hover:shadow-[#0052ff]/50 hover:scale-[1.03] transition-all border border-[#3c8aff]/40 focus:outline-none"
          title="Quick Actions (⌘K)"
        >
          <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center font-bold">
            <Zap className="h-4 w-4 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <span className="text-xs font-bold font-sans tracking-wide">Quick Actions</span>
          
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/30 text-white/90 border border-white/20">
            ⌘K
          </kbd>

          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#66c800]"></span>
          </span>
        </button>
      </div>

      {/* FLOATING QUICK ACTIONS MODAL / SIDEBAR DRAWER */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full sm:w-[440px] max-h-[85vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-[#232730] bg-[#111317] p-5 shadow-2xl flex flex-col space-y-4 text-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1f232c]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#0052ff]/20 text-[#3c8aff] flex items-center justify-center border border-[#0052ff]/30">
                  <Command className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Quick Actions & Shortcuts</h3>
                  <p className="text-[11px] text-[#8a91a0]">Instant tools for Base L2 & B20 Studio</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#8a91a0] hover:text-white hover:bg-[#1a1d24] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8a91a0]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shortcuts (Bridge, Faucet, Explorer, Mini App)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0a0b0e] border border-[#232730] text-xs text-white placeholder-[#5a6272] focus:border-[#0052ff] focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {/* Quick Copy / Status Chips */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={handleCopyContract}
                className="p-2.5 rounded-xl bg-[#0e1014] border border-[#1f232b] hover:border-[#3c8aff]/50 text-left transition-colors flex items-center justify-between"
                title="Click to copy B20 Token Address"
              >
                <div className="truncate">
                  <div className="text-[9px] text-[#8a91a0] uppercase">B20 Asset Token</div>
                  <div className="text-[11px] text-white font-bold truncate">
                    {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                  </div>
                </div>
                {copiedContract ? (
                  <Check className="h-3.5 w-3.5 text-[#66c800] shrink-0" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[#717886] shrink-0" />
                )}
              </button>

              <button
                onClick={handleCopyWallet}
                className="p-2.5 rounded-xl bg-[#0e1014] border border-[#1f232b] hover:border-[#3c8aff]/50 text-left transition-colors flex items-center justify-between"
                title="Click to copy Wallet Address"
              >
                <div className="truncate">
                  <div className="text-[9px] text-[#8a91a0] uppercase">Smart Wallet</div>
                  <div className="text-[11px] text-white font-bold truncate">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </div>
                </div>
                {copiedWallet ? (
                  <Check className="h-3.5 w-3.5 text-[#66c800] shrink-0" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[#717886] shrink-0" />
                )}
              </button>
            </div>

            {/* Scrollable Action List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[46vh]">
              {filteredActions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className="w-full p-2.5 rounded-xl bg-[#0e1014] hover:bg-[#151821] border border-[#1f232b] hover:border-[#0052ff]/40 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl ${act.iconBg} ${act.iconColor} flex items-center justify-center shrink-0`}>
                        <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white group-hover:text-[#3c8aff] transition-colors">
                            {act.title}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${act.badgeColor}`}>
                            {act.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8a91a0] mt-0.5 line-clamp-1">{act.subtitle}</p>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-[#717886] group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}

              {filteredActions.length === 0 && (
                <div className="text-center py-6 text-xs text-[#8a91a0]">
                  No shortcuts found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* Footer with network indicator */}
            <div className="pt-2 border-t border-[#1f232c] flex items-center justify-between text-[11px] font-mono text-[#8a91a0]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#66c800]"></span>
                <span className="text-white font-medium">{currentNetwork.name}</span>
                <span>(ID: {currentNetwork.chainId})</span>
              </div>
              <span>Gas: &lt;$0.001</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
