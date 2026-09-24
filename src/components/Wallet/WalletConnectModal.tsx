import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Coins, 
  Check, 
  X, 
  ExternalLink, 
  Smartphone, 
  Fingerprint, 
  Sparkles,
  LogOut,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { BaseNetwork, WalletAccount, TxLogEntry } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetwork: BaseNetwork;
  wallet: WalletAccount;
  setWallet: React.Dispatch<React.SetStateAction<WalletAccount>>;
  onAddTxLog?: (entry: TxLogEntry) => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  currentNetwork,
  wallet,
  setWallet,
  onAddTxLog,
}) => {
  const [connectingType, setConnectingType] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConnectSmartWallet = () => {
    setConnectingType('smart');
    setTimeout(() => {
      const mockAddress = '0x8453B20d826a57E88aDb34589d8F07C647a196e7';
      setWallet({
        address: mockAddress,
        isConnected: true,
        isSmartWallet: true,
        passkeyName: 'TouchID / FaceID Passkey',
        balanceEth: 1.54,
        balanceToken: 600,
        networkId: currentNetwork.id,
      });

      if (onAddTxLog) {
        onAddTxLog({
          id: `connect-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toTimeString().split(' ')[0],
          level: 'INFO',
          name: 'SmartWalletConnected',
          detail: `Passkey session verified for ${mockAddress} on ${currentNetwork.name}`,
          kind: 'ok',
        });
      }

      setConnectingType(null);
      onClose();
      triggerConfetti();
    }, 400);
  };

  const handleConnectInjected = async () => {
    setConnectingType('injected');
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          const acc = accounts[0];
          setWallet({
            address: acc,
            isConnected: true,
            isSmartWallet: false,
            balanceEth: 0.92,
            balanceToken: 250,
            networkId: currentNetwork.id,
          });

          if (onAddTxLog) {
            onAddTxLog({
              id: `connect-${Date.now()}`,
              timestamp: new Date().toISOString(),
              timeFormatted: new Date().toTimeString().split(' ')[0],
              level: 'INFO',
              name: 'InjectedWalletConnected',
              detail: `Browser wallet connected: ${acc}`,
              kind: 'ok',
            });
          }

          setConnectingType(null);
          onClose();
          triggerConfetti();
          return;
        }
      } catch (err) {
        console.warn('Injected wallet request canceled or failed', err);
      }
    }

    // Fallback if no extension or rejected
    setTimeout(() => {
      const fallbackAddress = '0x1234567890abcdef1234567890abcdef12345678';
      setWallet({
        address: fallbackAddress,
        isConnected: true,
        isSmartWallet: false,
        balanceEth: 0.75,
        balanceToken: 150,
        networkId: currentNetwork.id,
      });
      setConnectingType(null);
      onClose();
      triggerConfetti();
    }, 400);
  };

  const handleDisconnect = () => {
    setWallet((prev) => ({
      ...prev,
      isConnected: false,
      address: '',
    }));

    if (onAddTxLog) {
      onAddTxLog({
        id: `disconnect-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'INFO',
        name: 'WalletDisconnected',
        detail: 'User disconnected wallet session',
        kind: 'info',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-[#2b303c] bg-[#12141a] p-6 shadow-2xl z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#232730]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#0052ff] flex items-center justify-center text-white shadow-md shadow-[#0052ff]/30">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Connect to Base</h3>
              <p className="text-[11px] text-[#8a91a0]">
                Target: <span className="text-[#3c8aff] font-mono">{currentNetwork.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#717886] hover:text-white hover:bg-[#1f232d] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Status banner if already connected */}
        {wallet.isConnected && wallet.address && (
          <div className="p-3.5 rounded-xl border border-[#0052ff]/40 bg-[#0052ff]/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#66c800] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#66c800]"></span>
              </span>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Currently Connected:</span>
                  <span className="font-mono text-[#3c8aff]">{shortenAddress(wallet.address)}</span>
                </div>
                <div className="text-[10px] text-[#8a91a0]">
                  {wallet.isSmartWallet ? 'Base Smart Wallet (Passkey)' : 'Browser Injected'} · {wallet.balanceEth.toFixed(2)} ETH
                </div>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="px-2.5 py-1 rounded-lg bg-[#2a1b1e] hover:bg-[#3d1e23] border border-[#ff4d4d]/30 text-[#ff6b6b] text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span>Disconnect</span>
            </button>
          </div>
        )}

        <p className="text-xs text-[#8a91a0] leading-relaxed">
          Select your preferred connection method. Base Smart Wallet supports passkeys without seed phrases or gas fees.
        </p>

        {/* Connect Options */}
        <div className="space-y-3">
          {/* Option 1: Base Smart Wallet (Recommended) */}
          <button
            onClick={handleConnectSmartWallet}
            disabled={connectingType !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-[#0052ff] bg-[#0052ff]/10 hover:bg-[#0052ff]/20 text-left transition-all group active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#0052ff] flex items-center justify-center text-white shadow-md shadow-[#0052ff]/40 group-hover:scale-105 transition-transform">
                {connectingType === 'smart' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Fingerprint className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Base Smart Wallet</span>
                  <span className="bg-[#66c800] text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-[#b1b7c3] mt-0.5">
                  1-Click Touch ID / Face ID passkey. No seed phrases.
                </p>
              </div>
            </div>
            <span className="text-[#3c8aff] font-bold text-sm group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>

          {/* Option 2: Browser Injected (Coinbase Wallet / MetaMask / Rainbow) */}
          <button
            onClick={handleConnectInjected}
            disabled={connectingType !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#2b303c] bg-[#1a1d24] hover:bg-[#202530] text-left transition-all group active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#262b37] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                {connectingType === 'injected' ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-[#3c8aff]" />
                ) : (
                  <Coins className="h-5 w-5 text-[#3c8aff]" />
                )}
              </div>
              <div>
                <span className="font-bold text-sm text-white">Browser Extension Wallet</span>
                <p className="text-xs text-[#8a91a0] mt-0.5">
                  Coinbase Wallet, Rainbow, MetaMask, Rabby
                </p>
              </div>
            </div>
            <span className="text-[#717886] font-bold text-sm group-hover:translate-x-1 transition-transform group-hover:text-white">
              →
            </span>
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[#232730] flex items-center justify-between text-[11px] text-[#717886]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#66c800]" />
            <span>ERC-4337 Account Abstraction</span>
          </span>
          <span className="text-[#3c8aff] font-mono">Chain ID: {currentNetwork.chainId}</span>
        </div>
      </div>
    </div>
  );
};
