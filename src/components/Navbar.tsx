import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChevronDown, 
  Flame, 
  KeyRound, 
  Check, 
  Droplet, 
  ExternalLink,
  Layers,
  FileCode2,
  Users2,
  Sparkles,
  BookOpen,
  PlusCircle,
  Coins,
  Settings
} from 'lucide-react';
import { BaseNetwork, NetworkId, WalletAccount } from '../types/base';
import { BASE_NETWORKS } from '../data/mockBaseData';
import { shortenAddress, formatNumber, triggerConfetti } from '../utils/web3Helper';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentNetwork: BaseNetwork;
  setCurrentNetwork: (net: BaseNetwork) => void;
  wallet: WalletAccount;
  setWallet: React.Dispatch<React.SetStateAction<WalletAccount>>;
  onFaucetClaim: () => void;
  tokenSymbol: string;
  userTokenBalance: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentNetwork,
  setCurrentNetwork,
  wallet,
  setWallet,
  onFaucetClaim,
  tokenSymbol,
  userTokenBalance,
}) => {
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [faucetClaiming, setFaucetClaiming] = useState(false);

  const handleConnectSmartWallet = () => {
    // Generate or restore Base Smart Wallet
    const mockAddress = '0x8453B20d826a57E88aDb34589d8F07C647a196e7';
    setWallet({
      address: mockAddress,
      isConnected: true,
      isSmartWallet: true,
      passkeyName: 'TouchID / FaceID Passkey',
      balanceEth: 1.25,
      balanceToken: 600,
      networkId: currentNetwork.id,
    });
    setShowWalletModal(false);
    triggerConfetti();
  };

  const handleConnectInjected = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setWallet({
            address: accounts[0],
            isConnected: true,
            isSmartWallet: false,
            balanceEth: 0.85,
            balanceToken: 100,
            networkId: currentNetwork.id,
          });
          setShowWalletModal(false);
          return;
        }
      } catch (err) {
        console.warn('Injected wallet request canceled', err);
      }
    }
    // Fallback if no extension installed
    handleConnectSmartWallet();
  };

  const handleDisconnect = () => {
    setWallet(prev => ({
      ...prev,
      isConnected: false,
      address: '',
    }));
    setShowAccountMenu(false);
  };

  const triggerFaucet = () => {
    setFaucetClaiming(true);
    setTimeout(() => {
      onFaucetClaim();
      setFaucetClaiming(false);
      triggerConfetti();
    }, 800);
  };

  const navTabs = [
    { id: 'simulator', label: 'B20 Asset Simulator', icon: Sparkles },
    { id: 'workshop', label: 'Custom RWA Workshop', icon: PlusCircle },
    { id: 'captable', label: 'Cap Table & Policies', icon: Users2 },
    { id: 'contracts', label: 'Solidity & Deploy', icon: FileCode2 },
    { id: 'paymaster', label: 'Base Paymaster (Gasless)', icon: Flame },
    { id: 'guides', label: 'Base Docs & Guides', icon: BookOpen },
    { id: 'config', label: 'App Config', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#232730] bg-[#0a0b0d]/90 backdrop-blur-md">
        {/* Top Announcement & Gas Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#1c1f26] bg-[#0e1014] px-4 py-1.5 text-xs text-[#8a91a0]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-[#f0f2f5]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#0052ff] animate-pulse"></span>
              Built on Base Layer 2
            </span>
            <span className="hidden sm:inline text-[#3e4554]">|</span>
            <span className="hidden sm:inline text-[#b1b7c3]">
              B20 Real-World Asset (RWA) Standard Specification
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[#717886]">Base Gas:</span>
              <span className="font-mono text-[#66c800] font-semibold">0.001 Gwei ($0.0002)</span>
              <span className="rounded bg-[#66c800]/10 px-1 py-0.2 text-[10px] text-[#66c800] font-bold">
                99.8% vs L1
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1 text-[#717886]">
              <span>Finality:</span>
              <span className="font-mono text-[#f0f2f5]">~2.0s</span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('simulator')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              {/* Base official circle logo */}
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#0052ff] text-white shadow-lg shadow-[#0052ff]/30 group-hover:scale-105 transition-transform">
                <div className="h-4 w-4 rounded-full bg-white"></div>
                <div className="absolute right-0 h-4 w-2 bg-[#0052ff]"></div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-white font-mono">BASE</span>
                  <span className="rounded-md bg-[#0052ff]/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#3c8aff] uppercase border border-[#0052ff]/30">
                    B20 Studio
                  </span>
                </div>
                <p className="text-[10.5px] text-[#717886] font-mono leading-none">RWA & Tokenized Securities</p>
              </div>
            </div>
          </div>

          {/* Center Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#14161c] p-1 rounded-xl border border-[#232730]">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#0052ff] text-white shadow-sm'
                      : 'text-[#8a91a0] hover:text-[#f0f2f5] hover:bg-[#1b1e26]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            {/* Faucet Button */}
            <button
              onClick={triggerFaucet}
              disabled={faucetClaiming}
              title="Claim 0.5 testnet Base ETH"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#191c24] hover:bg-[#202530] text-[#dee1e7] text-xs border border-[#2b303c] transition-colors disabled:opacity-60"
            >
              <Droplet className={`h-3.5 w-3.5 text-[#3c8aff] ${faucetClaiming ? 'animate-bounce' : ''}`} />
              <span>{faucetClaiming ? 'Claiming…' : 'Faucet'}</span>
            </button>

            {/* Quick App Config Button */}
            <button
              onClick={() => setActiveTab('config')}
              title="App Configuration & RPC Settings"
              className={`p-1.5 rounded-lg border transition-colors ${
                activeTab === 'config'
                  ? 'bg-[#0052ff] text-white border-[#0052ff]'
                  : 'bg-[#14161c] hover:bg-[#1b1e26] text-[#dee1e7] border-[#232730]'
              }`}
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Network Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#14161c] hover:bg-[#1b1e26] text-xs font-mono text-[#dee1e7] border border-[#232730] transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-[#0052ff]"></span>
                <span className="hidden sm:inline">{currentNetwork.name}</span>
                <span className="sm:hidden">{currentNetwork.id === 'base-mainnet' ? 'Mainnet' : 'Vibenet'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#717886]" />
              </button>

              {showNetworkMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#2b303c] bg-[#14161c] p-1.5 shadow-2xl z-50">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[#717886] uppercase tracking-wider">
                    Select Network
                  </div>
                  {Object.values(BASE_NETWORKS).map((net) => (
                    <button
                      key={net.id}
                      onClick={() => {
                        setCurrentNetwork(net);
                        setShowNetworkMenu(false);
                      }}
                      className={`flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        currentNetwork.id === net.id
                          ? 'bg-[#0052ff]/15 text-[#3c8aff] font-medium'
                          : 'text-[#b1b7c3] hover:bg-[#1b1e26] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${net.id === 'base-mainnet' ? 'bg-[#0052ff]' : 'bg-[#3c8aff]'}`}></span>
                        <div className="text-left">
                          <div>{net.name}</div>
                          <div className="text-[10px] text-[#717886] font-mono">Chain ID {net.chainId}</div>
                        </div>
                      </div>
                      {currentNetwork.id === net.id && <Check className="h-3.5 w-3.5 text-[#3c8aff]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Wallet Button */}
            {wallet.isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14161c] hover:bg-[#1b1e26] border border-[#232730] transition-colors"
                >
                  <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-[#0052ff] to-[#66c800] flex items-center justify-center text-[10px] font-bold text-white">
                    {wallet.isSmartWallet ? '⚡' : 'W'}
                  </div>
                  <div className="text-left leading-tight hidden md:block">
                    <div className="text-xs font-mono font-medium text-white flex items-center gap-1">
                      {shortenAddress(wallet.address, 3)}
                      {wallet.isSmartWallet && (
                        <span className="text-[9px] bg-[#0052ff]/30 text-[#3c8aff] px-1 py-0.1 rounded font-sans">
                          Smart
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-[#8a91a0]">
                      {formatNumber(wallet.balanceEth)} ETH · {formatNumber(userTokenBalance)} {tokenSymbol}
                    </div>
                  </div>
                  <ChevronDown className="h-3 w-3 text-[#717886]" />
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#2b303c] bg-[#14161c] p-3 shadow-2xl z-50">
                    <div className="flex items-center justify-between border-b border-[#232730] pb-2 mb-2">
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {wallet.isSmartWallet ? 'Base Smart Wallet' : 'Injected Web3 Wallet'}
                        </div>
                        <div className="text-[11px] font-mono text-[#8a91a0]">{shortenAddress(wallet.address, 6)}</div>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-[#66c800]"></span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#b1b7c3] mb-3">
                      <div className="flex justify-between">
                        <span className="text-[#717886]">ETH Balance:</span>
                        <span className="font-mono font-medium text-white">{formatNumber(wallet.balanceEth)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#717886]">{tokenSymbol} Balance:</span>
                        <span className="font-mono font-medium text-white">{formatNumber(userTokenBalance)} {tokenSymbol}</span>
                      </div>
                      {wallet.isSmartWallet && (
                        <div className="flex items-center gap-1 text-[11px] text-[#66c800] bg-[#66c800]/10 p-1.5 rounded-lg mt-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Passkey Authenticated (ERC-4337)</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#232730] flex gap-2">
                      <a
                        href={`${currentNetwork.explorerUrl}/address/${wallet.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#1e222c] hover:bg-[#252a36] text-[11px] text-[#dee1e7] transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Explorer</span>
                      </a>
                      <button
                        onClick={handleDisconnect}
                        className="flex-1 py-1.5 rounded-lg bg-[#fc401f]/15 hover:bg-[#fc401f]/25 text-[#fc401f] text-[11px] font-medium transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-semibold shadow-md shadow-[#0052ff]/20 transition-all active:scale-95"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden border-t border-[#1c1f26] bg-[#0c0e12] px-3 py-2 overflow-x-auto flex gap-1.5">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#0052ff] text-white'
                    : 'text-[#8a91a0] hover:text-white bg-[#14161c]'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2b303c] bg-[#14161c] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#232730]">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-[#0052ff] flex items-center justify-center text-white">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-base text-white">Connect to Base</h3>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-[#717886] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8a91a0] mt-3 mb-4">
              Connect seamlessly using Base Smart Wallet with native Passkeys, or your existing browser extension.
            </p>

            <div className="space-y-3">
              {/* Option 1: Base Smart Wallet (Recommended) */}
              <button
                onClick={handleConnectSmartWallet}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-[#0052ff] bg-[#0052ff]/10 hover:bg-[#0052ff]/20 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#0052ff] flex items-center justify-center text-white shadow-md shadow-[#0052ff]/40">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">Base Smart Wallet</span>
                      <span className="bg-[#66c800] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-[#b1b7c3]">1-Click Touch ID / Face ID. No seed phrase required.</p>
                  </div>
                </div>
                <span className="text-[#3c8aff] font-bold text-xs group-hover:translate-x-1 transition-transform">→</span>
              </button>

              {/* Option 2: Browser Injected (Coinbase Wallet / MetaMask) */}
              <button
                onClick={handleConnectInjected}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#2b303c] bg-[#1a1d24] hover:bg-[#202530] text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#2b303c] flex items-center justify-center text-white">
                    <Coins className="h-5 w-5 text-[#3c8aff]" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-white">Browser Wallet</span>
                    <p className="text-xs text-[#8a91a0]">Coinbase Wallet, Rainbow, MetaMask, Rabby</p>
                  </div>
                </div>
                <span className="text-[#717886] font-bold text-xs">→</span>
              </button>
            </div>

            <div className="mt-5 pt-3 border-t border-[#232730] flex items-center justify-between text-[11px] text-[#717886]">
              <span>Powered by ERC-4337 Account Abstraction</span>
              <span className="text-[#3c8aff]">Sub-cent gas fees</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
