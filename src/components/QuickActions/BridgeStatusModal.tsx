import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink, 
  Clock, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Database, 
  Layers,
  ArrowDownUp,
  AlertCircle
} from 'lucide-react';
import { BaseNetwork, TxLogEntry } from '../../types/base';
import { generateTxHash, triggerConfetti } from '../../utils/web3Helper';

interface BridgeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetwork: BaseNetwork;
  onAddTxLog: (entry: TxLogEntry) => void;
}

export const BridgeStatusModal: React.FC<BridgeStatusModalProps> = ({
  isOpen,
  onClose,
  currentNetwork,
  onAddTxLog,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'test-deposit' | 'test-withdrawal'>('status');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeSuccess, setBridgeSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateDeposit = () => {
    setIsBridging(true);
    setBridgeSuccess(null);
    setTimeout(() => {
      setIsBridging(false);
      const hash = generateTxHash();
      setBridgeSuccess(`Deposited 0.25 ETH to Base! L1 Log observed by Sequencer in L2 block.`);
      triggerConfetti();

      onAddTxLog({
        id: `bridge-dep-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'EVENT',
        name: 'OptimismPortal.depositTransaction',
        detail: `0.25 ETH bridged from Ethereum L1 -> Base L2. Deposited tx prepended to block.`,
        kind: 'ok',
        hash,
        gasUsed: 42100,
        gasFeeUsd: '$0.0004',
      });
    }, 1100);
  };

  const handleSimulateWithdrawal = () => {
    setIsBridging(true);
    setBridgeSuccess(null);
    setTimeout(() => {
      setIsBridging(false);
      const hash = generateTxHash();
      setBridgeSuccess(`Withdrawal initiated on Base L2! Output proposal will be submitted to DisputeGameFactory.`);
      triggerConfetti();

      onAddTxLog({
        id: `bridge-wd-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'EVENT',
        name: 'L2ToL1MessagePasser.initiateWithdrawal',
        detail: `Initiated withdrawal of 0.1 ETH to Ethereum L1. Dispute game active.`,
        kind: 'ok',
        hash,
        gasUsed: 31500,
        gasFeeUsd: '$0.0002',
      });
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-2xl space-y-5 text-white relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1f232c] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0052ff]/20 text-[#3c8aff] flex items-center justify-center border border-[#0052ff]/30">
              <ArrowDownUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Base Bridge Health & Status</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#66c800]/15 text-[#66c800] border border-[#66c800]/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#66c800] animate-pulse"></span>
                  OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-[#8a91a0]">
                Ethereum L1 ↔ Base L2 Canonical Bridge (OptimismPortal & DisputeGameFactory)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8a91a0] hover:text-white hover:bg-[#1a1d24] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0e1014] border border-[#232730] text-xs font-mono">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'status' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0] hover:text-white'
            }`}
          >
            Bridge Overview
          </button>
          <button
            onClick={() => setActiveTab('test-deposit')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'test-deposit' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0] hover:text-white'
            }`}
          >
            Test L1 → L2 Deposit
          </button>
          <button
            onClick={() => setActiveTab('test-withdrawal')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'test-withdrawal' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0] hover:text-white'
            }`}
          >
            Test L2 → L1 Withdrawal
          </button>
        </div>

        {/* VIEW 1: STATUS OVERVIEW */}
        {activeTab === 'status' && (
          <div className="space-y-4 text-xs">
            {/* Real-time Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#1f232b]">
                <div className="text-[10px] text-[#8a91a0] uppercase font-mono">L1 OptimismPortal</div>
                <div className="text-white font-bold text-sm mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#66c800]" />
                  <span>Healthy</span>
                </div>
                <div className="text-[10px] text-[#717886] mt-0.5">Uptime: 99.99%</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#1f232b]">
                <div className="text-[10px] text-[#8a91a0] uppercase font-mono">Avg Deposit Time</div>
                <div className="text-white font-bold text-sm mt-0.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#3c8aff]" />
                  <span>~1-3 mins</span>
                </div>
                <div className="text-[10px] text-[#717886] mt-0.5">L1 block inclusion</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#1f232b]">
                <div className="text-[10px] text-[#8a91a0] uppercase font-mono">Dispute Game</div>
                <div className="text-white font-bold text-sm mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#ffd12f]" />
                  <span>7 Days</span>
                </div>
                <div className="text-[10px] text-[#717886] mt-0.5">Challenge Window</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#1f232b]">
                <div className="text-[10px] text-[#8a91a0] uppercase font-mono">DA Batch Inbox</div>
                <div className="text-white font-bold text-sm mt-0.5 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-[#3c8aff]" />
                  <span>EIP-4844 Blobs</span>
                </div>
                <div className="text-[10px] text-[#717886] mt-0.5">&lt;$0.001 per tx</div>
              </div>
            </div>

            {/* Bridge Component Contracts */}
            <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-3 font-mono">
              <div className="text-xs font-bold text-white uppercase flex items-center justify-between">
                <span>Verified Bridge Contracts</span>
                <span className="text-[10px] text-[#3c8aff] lowercase">mainnet & sepolia synced</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#141722] border border-[#1f2537]">
                  <span className="text-[#8a91a0]">L2 StandardBridge (Predeploy):</span>
                  <span className="text-[#3c8aff] font-bold">0x4200000000000000000000000000000000000010</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#141722] border border-[#1f2537]">
                  <span className="text-[#8a91a0]">L1 StandardBridge:</span>
                  <span className="text-white">0x3154Cf16ccdb4C6d922629664174b904d80F2C35</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#141722] border border-[#1f2537]">
                  <span className="text-[#8a91a0]">L1 OptimismPortal:</span>
                  <span className="text-white">0x49048044D57e1C92A77f79988d21Fa8fAF74E97e</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#141722] border border-[#1f2537]">
                  <span className="text-[#8a91a0]">L1 DisputeGameFactory:</span>
                  <span className="text-white">0x43edB88C4B80fDD2CeEE3949752eabe26DF04215</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#141722] border border-[#1f2537]">
                  <span className="text-[#8a91a0]">L2 MessagePasser:</span>
                  <span className="text-white">0x4200000000000000000000000000000000000016</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#141722] border border-[#1f2537]">
                  <span className="text-[#8a91a0]">L1 Batch Inbox:</span>
                  <span className="text-white">0xFF00000000000000000000000000000000008453</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: TEST DEPOSIT */}
        {activeTab === 'test-deposit' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ArrowRight className="h-4 w-4 text-[#3c8aff]" />
                <span>Simulate L1 → Base L2 Deposit Flow</span>
              </div>
              <p className="text-[#8a91a0]">
                Executes a simulated call to <code>depositTransaction()</code> on the OptimismPortal. The transaction will trigger a TransactionDeposited event on L1, which the Base sequencer observes and includes at the head of the next block.
              </p>

              <div className="pt-3">
                <button
                  onClick={handleSimulateDeposit}
                  disabled={isBridging}
                  className="w-full py-2.5 rounded-xl bg-[#0052ff] hover:bg-[#0048e0] text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  <span>{isBridging ? 'Bridging Funds...' : 'Execute Test Deposit (0.25 ETH)'}</span>
                </button>
              </div>
            </div>

            {bridgeSuccess && (
              <div className="p-3.5 rounded-xl bg-[#66c800]/10 border border-[#66c800]/30 text-[#66c800] font-mono text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{bridgeSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: TEST WITHDRAWAL */}
        {activeTab === 'test-withdrawal' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#ffd12f]" />
                <span>Simulate Base L2 → L1 Withdrawal Flow</span>
              </div>
              <p className="text-[#8a91a0]">
                Calls <code>L2ToL1MessagePasser.initiateWithdrawal()</code>. The withdrawal will be posted to the Batch Inbox, an output root proposed to <code>DisputeGameFactory</code>, and eligible for finalization on L1 after the 7-day fault challenge window.
              </p>

              <div className="pt-3">
                <button
                  onClick={handleSimulateWithdrawal}
                  disabled={isBridging}
                  className="w-full py-2.5 rounded-xl bg-[#ffd12f] hover:bg-[#e6bb25] text-black font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isBridging ? 'animate-spin' : ''}`} />
                  <span>{isBridging ? 'Initiating Withdrawal...' : 'Execute Test Withdrawal (0.1 ETH)'}</span>
                </button>
              </div>
            </div>

            {bridgeSuccess && (
              <div className="p-3.5 rounded-xl bg-[#66c800]/10 border border-[#66c800]/30 text-[#66c800] font-mono text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{bridgeSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="pt-3 border-t border-[#1f232c] flex items-center justify-between text-xs">
          <a
            href="https://bridge.base.org"
            target="_blank"
            rel="noreferrer"
            className="text-[#3c8aff] hover:underline flex items-center gap-1 font-mono"
          >
            <span>Official Base Bridge (bridge.base.org)</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#181a22] text-[#dee1e7] hover:text-white border border-[#2b303c] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
