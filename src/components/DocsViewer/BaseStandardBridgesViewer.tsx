import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ExternalLink, 
  Copy, 
  Check, 
  Zap, 
  Clock, 
  Code2, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  AlertCircle,
  FileCode,
  Lock,
  ArrowRight,
  Database,
  RefreshCw,
  Boxes
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface BaseStandardBridgesViewerProps {
  currentNetwork?: BaseNetwork;
}

export const BaseStandardBridgesViewer: React.FC<BaseStandardBridgesViewerProps> = ({ currentNetwork }) => {
  const [activeTab, setActiveTab] = useState<'spec' | 'interface' | 'simulator' | 'b20'>('spec');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Simulator state
  const [simAssetType, setSimAssetType] = useState<'ETH' | 'ERC20'>('ERC20');
  const [simDirection, setSimDirection] = useState<'deposit' | 'withdrawal'>('deposit');
  const [simAmount, setSimAmount] = useState('50000');
  const [simTokenSymbol, setSimTokenSymbol] = useState('B20-EXM');
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const L2_STANDARD_BRIDGE_ADDRESS = '0x4200000000000000000000000000000000000010';
  const L1_STANDARD_BRIDGE_ADDRESS = '0x3154Cf16ccdb4C6d922629664174b904d80F2C35';
  const L2_CROSS_DOMAIN_MESSENGER = '0x4200000000000000000000000000000000000007';
  const L1_CROSS_DOMAIN_MESSENGER = '0x866E82a600A1414e583f7F13623F1aC5d58b0Afa';

  const STANDARD_BRIDGE_SOLIDITY = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title StandardBridge
 * @notice Specification of the standard bridge contracts enabling cross-domain
 *         ETH and ERC-20 token transfers between L1 and L2 on Base.
 *         Predeploy address on Base (L2): 0x4200000000000000000000000000000000000010
 */
interface StandardBridge {
    event ERC20BridgeFinalized(
        address indexed localToken, 
        address indexed remoteToken, 
        address indexed from, 
        address to, 
        uint256 amount, 
        bytes extraData
    );
    event ERC20BridgeInitiated(
        address indexed localToken, 
        address indexed remoteToken, 
        address indexed from, 
        address to, 
        uint256 amount, 
        bytes extraData
    );
    event ETHBridgeFinalized(
        address indexed from, 
        address indexed to, 
        uint256 amount, 
        bytes extraData
    );
    event ETHBridgeInitiated(
        address indexed from, 
        address indexed to, 
        uint256 amount, 
        bytes extraData
    );

    function bridgeERC20(
        address _localToken, 
        address _remoteToken, 
        uint256 _amount, 
        uint32 _minGasLimit, 
        bytes memory _extraData
    ) external;

    function bridgeERC20To(
        address _localToken, 
        address _remoteToken, 
        address _to, 
        uint256 _amount, 
        uint32 _minGasLimit, 
        bytes memory _extraData
    ) external;

    function bridgeETH(
        uint32 _minGasLimit, 
        bytes memory _extraData
    ) payable external;

    function bridgeETHTo(
        address _to, 
        uint32 _minGasLimit, 
        bytes memory _extraData
    ) payable external;

    function deposits(
        address _localToken, 
        address _remoteToken
    ) view external returns (uint256);

    function finalizeBridgeERC20(
        address _localToken, 
        address _remoteToken, 
        address _from, 
        address _to, 
        uint256 _amount, 
        bytes memory _extraData
    ) external;

    function finalizeBridgeETH(
        address _from, 
        address _to, 
        uint256 _amount, 
        bytes memory _extraData
    ) payable external;

    function messenger() view external returns (address);
    function OTHER_BRIDGE() view external returns (address);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(STANDARD_BRIDGE_SOLIDITY);
    setCopiedCode(true);
    triggerConfetti();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    triggerConfetti();
    setTimeout(() => setCopiedAddress(null), 1800);
  };

  const runBridgeSimulation = () => {
    setIsSimulating(true);
    setSimStep(1);

    setTimeout(() => {
      setSimStep(2);
      setTimeout(() => {
        setSimStep(3);
        setTimeout(() => {
          setSimStep(4);
          setIsSimulating(false);
          triggerConfetti();
        }, 1200);
      }, 1200);
    }, 1100);
  };

  const resetBridgeSimulation = () => {
    setSimStep(0);
    setIsSimulating(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="rounded-3xl border border-[#232938] bg-gradient-to-br from-[#10131a] via-[#121626] to-[#0f1118] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0052ff] animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3c8aff]">
              Base Protocol Specifications · Cross-Domain Bridging
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Standard Bridges (L1 ↔ L2)
          </h2>

          <p className="text-sm text-[#8a91a0] max-w-3xl leading-relaxed">
            The standard bridges are responsible for cross-domain ETH and ERC-20 token transfers between Ethereum (L1) and Base (L2). Built directly on top of the cross-domain messenger contracts, they expose a canonical, battle-tested interface that handles both L1-native and L2-native assets while maintaining complete backwards compatibility with Bedrock contracts.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Predeploy (L2):</span>
              <span className="text-[#3c8aff] font-bold">0x4200...0010</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Architecture:</span>
              <span className="text-[#66c800] font-bold">ProxyAdmin Upgradable</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Foundation:</span>
              <span className="text-[#ffd12f] font-bold">CrossDomainMessenger</span>
            </div>
            <a
              href="https://docs.base.org/llms.txt"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#0052ff]/15 hover:bg-[#0052ff]/25 border border-[#0052ff]/40 text-[#3c8aff] font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>docs.base.org Standard Bridges Spec</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0c0e15] border border-[#202636] overflow-x-auto text-xs font-mono">
        {[
          { id: 'spec', label: 'Protocol Architecture & Flow', icon: Layers },
          { id: 'interface', label: 'StandardBridge.sol Interface', icon: Code2 },
          { id: 'simulator', label: 'Cross-Domain Bridge Simulator', icon: ArrowLeftRight },
          { id: 'b20', label: 'B20 RWA Cross-Domain Security', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
                isActive
                  ? 'bg-[#0052ff] text-white shadow-md font-bold'
                  : 'text-[#8a91a0] hover:text-white hover:bg-[#161a26]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ARCHITECTURE & LIFECYCLE SPEC */}
      {activeTab === 'spec' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Canonical Bridge Pair Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* L1 Standard Bridge */}
            <div className="rounded-2xl border border-[#222838] bg-[#0f121a] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-[#3c8aff]/15 text-[#3c8aff] border border-[#3c8aff]/30 font-mono text-[11px] font-bold">
                  Ethereum Layer 1
                </span>
                <span className="text-[11px] text-[#717886] font-mono">Governed by ProxyAdmin</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">L1StandardBridge</h3>
                <p className="text-xs text-[#8a91a0] mt-1 leading-relaxed">
                  Deployed on Ethereum L1. Locks L1-native tokens in escrow or burns L2-native withdrawal representations upon finalization.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#090b10] border border-[#1c2230] font-mono text-xs flex items-center justify-between">
                <span className="text-[#3c8aff] select-all truncate">{L1_STANDARD_BRIDGE_ADDRESS}</span>
                <button
                  onClick={() => handleCopyAddress(L1_STANDARD_BRIDGE_ADDRESS)}
                  className="p-1 rounded text-[#8a91a0] hover:text-white transition-colors shrink-0 ml-2"
                  title="Copy Address"
                >
                  {copiedAddress === L1_STANDARD_BRIDGE_ADDRESS ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="text-[11px] text-[#717886] space-y-1">
                <div>• Messenger: <code className="text-white">{shortenAddress(L1_CROSS_DOMAIN_MESSENGER, 4)}</code></div>
                <div>• Counterpart: <code>OTHER_BRIDGE() → L2StandardBridge</code></div>
              </div>
            </div>

            {/* L2 Standard Bridge */}
            <div className="rounded-2xl border border-[#222838] bg-[#0f121a] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-[#0052ff]/15 text-[#0052ff] border border-[#0052ff]/30 font-mono text-[11px] font-bold">
                  Base Layer 2 (Predeploy)
                </span>
                <span className="text-[11px] text-[#66c800] font-mono font-bold">Genesis Slot 0x10</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">L2StandardBridge</h3>
                <p className="text-xs text-[#8a91a0] mt-1 leading-relaxed">
                  Predeployed on Base at genesis. Mints synthetic L2 tokens on deposit, or burns L2 tokens to initiate withdrawals back to Ethereum.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#090b10] border border-[#1c2230] font-mono text-xs flex items-center justify-between">
                <span className="text-[#3c8aff] select-all truncate">{L2_STANDARD_BRIDGE_ADDRESS}</span>
                <button
                  onClick={() => handleCopyAddress(L2_STANDARD_BRIDGE_ADDRESS)}
                  className="p-1 rounded text-[#8a91a0] hover:text-white transition-colors shrink-0 ml-2"
                  title="Copy Address"
                >
                  {copiedAddress === L2_STANDARD_BRIDGE_ADDRESS ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="text-[11px] text-[#717886] space-y-1">
                <div>• Messenger: <code className="text-white">{shortenAddress(L2_CROSS_DOMAIN_MESSENGER, 4)}</code> (0x4200...0007)</div>
                <div>• Counterpart: <code>OTHER_BRIDGE() → L1StandardBridge</code></div>
              </div>
            </div>
          </div>

          {/* Core Architectural Lifecycle */}
          <div className="p-6 rounded-2xl border border-[#222838] bg-[#0c0e15] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Boxes className="h-4 w-4 text-[#3c8aff]" />
              <span>Token Bridging Mechanics: L1 Native vs L2 Native Assets</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#121622] border border-[#1e2536] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#66c800] uppercase font-mono">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Case A: L1 Native Assets (e.g. USDC, DAI, UNI)</span>
                </div>
                <ul className="text-xs text-[#8a91a0] space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    <strong className="text-white">Deposit (L1 → L2):</strong> Tokens are transferred to and locked in the <code>L1StandardBridge</code> escrow contract. A deposit message is dispatched to <code>L2StandardBridge</code>, which calls <code>mint()</code> on the corresponding <code>OptimismMintableERC20</code> on Base.
                  </li>
                  <li>
                    <strong className="text-white">Withdrawal (L2 → L1):</strong> The user initiates withdrawal on Base; <code>L2StandardBridge</code> calls <code>burn()</code>. After the 7-day fault dispute window elapses on L1, <code>finalizeBridgeERC20()</code> unlocks the deposited tokens.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#121622] border border-[#1e2536] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ffd12f] uppercase font-mono">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Case B: L2 Native Assets (e.g. B20 Securities Minted on Base)</span>
                </div>
                <ul className="text-xs text-[#8a91a0] space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    <strong className="text-white">Withdrawal (L2 → L1):</strong> Tokens are locked inside the <code>L2StandardBridge</code> escrow on Base, and a message is passed to L1.
                  </li>
                  <li>
                    <strong className="text-white">Deposit (L1 → L2):</strong> When bridging back from Ethereum L1 to Base, the synthetic token on L1 is burned, and <code>finalizeBridgeERC20()</code> on Base releases the original locked L2 native tokens back to the owner.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upgradability Card */}
          <div className="p-4 rounded-2xl bg-[#ffd12f]/10 border border-[#ffd12f]/30 flex items-start gap-3 text-xs text-[#dee1e7]">
            <AlertCircle className="h-5 w-5 text-[#ffd12f] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-[#ffd12f] uppercase tracking-wide text-[11px] font-mono">
                Standard Bridge Upgradability & Proxy Architecture
              </div>
              <p className="text-[#c5cad6] leading-relaxed">
                Both the L1 and L2 Standard Bridges are deployed behind upgradable ERC-1967 proxies governed by the Base <code>ProxyAdmin</code>. This ensures protocol upgrades (e.g., Canyon, Ecotone, Isthmus) can patch security issues without migrating locked token liquidity or disrupting <code>OTHER_BRIDGE()</code> address bindings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOLIDITY INTERFACE EXPLORER */}
      {activeTab === 'interface' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e15] border border-[#202636]">
            <div className="flex items-center gap-2 text-xs font-mono">
              <FileCode className="h-4 w-4 text-[#3c8aff]" />
              <span className="text-white font-bold">StandardBridge.sol</span>
              <span className="text-[#717886]">— Official Base OP Stack Interface</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Interface'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-[#222838] bg-[#090b10] overflow-hidden">
            <pre className="p-5 font-mono text-xs text-[#dee1e7] overflow-x-auto leading-relaxed">
              <code>{STANDARD_BRIDGE_SOLIDITY}</code>
            </pre>
          </div>

          {/* Function Signature Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-[#0f121a] border border-[#1f2433] space-y-1.5">
              <div className="font-mono font-bold text-[#3c8aff]">bridgeERC20 / bridgeERC20To</div>
              <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                Initiates an ERC-20 transfer to the counterpart domain. Requires approving the bridge as spender for <code>_amount</code>. <code>_minGasLimit</code> guarantees sufficient gas on the destination domain.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0f121a] border border-[#1f2433] space-y-1.5">
              <div className="font-mono font-bold text-[#66c800]">bridgeETH / bridgeETHTo</div>
              <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                Payable bridge function for native Ether. Ether is sent as <code>msg.value</code> and credited 1:1 on the target domain without wrapped intermediaries.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0f121a] border border-[#1f2433] space-y-1.5">
              <div className="font-mono font-bold text-[#ffd12f]">deposits(address, address)</div>
              <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                Public mapping tracking total locked deposits per <code>(localToken, remoteToken)</code> pair to ensure solvency and prevent duplicate minting.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0f121a] border border-[#1f2433] space-y-1.5">
              <div className="font-mono font-bold text-[#dee1e7]">finalizeBridgeERC20 / ETH</div>
              <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                Invoked strictly by the <code>messenger()</code> contract when executing cross-domain messages forwarded by the other domain's bridge.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CROSS-DOMAIN BRIDGE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b202e] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Interactive Standard Bridge Executor</h3>
                <p className="text-xs text-[#8a91a0]">
                  Simulate calling <code>StandardBridge.bridgeERC20()</code> or <code>bridgeETH()</code> across the Base derivation pipeline.
                </p>
              </div>

              {simStep > 0 && (
                <button
                  onClick={resetBridgeSimulation}
                  className="px-3 py-1.5 rounded-lg bg-[#161a26] border border-[#242c3d] text-xs font-mono text-[#8a91a0] hover:text-white flex items-center gap-1.5 self-start"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset Test</span>
                </button>
              )}
            </div>

            {/* Config Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#717886] font-mono">Direction</label>
                <div className="flex rounded-xl bg-[#141824] p-1 border border-[#22293a]">
                  <button
                    onClick={() => { setSimDirection('deposit'); resetBridgeSimulation(); }}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                      simDirection === 'deposit' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0]'
                    }`}
                  >
                    L1 → Base L2
                  </button>
                  <button
                    onClick={() => { setSimDirection('withdrawal'); resetBridgeSimulation(); }}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                      simDirection === 'withdrawal' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0]'
                    }`}
                  >
                    Base L2 → L1
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#717886] font-mono">Asset Type</label>
                <div className="flex rounded-xl bg-[#141824] p-1 border border-[#22293a]">
                  <button
                    onClick={() => { setSimAssetType('ERC20'); resetBridgeSimulation(); }}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                      simAssetType === 'ERC20' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0]'
                    }`}
                  >
                    B20 ERC-20
                  </button>
                  <button
                    onClick={() => { setSimAssetType('ETH'); resetBridgeSimulation(); }}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                      simAssetType === 'ETH' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0]'
                    }`}
                  >
                    Native ETH
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#717886] font-mono">Amount</label>
                <input
                  type="text"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#22293a] text-white font-mono text-xs focus:border-[#0052ff] focus:outline-none"
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Stepper Pipeline */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono font-bold uppercase text-[#717886]">
                Bridge Execution Lifecycle
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {[
                  {
                    step: 1,
                    title: '1. Initiate on Source',
                    desc: simDirection === 'deposit' 
                      ? 'L1StandardBridge.bridgeERC20() emits ERC20BridgeInitiated'
                      : 'L2StandardBridge.bridgeERC20() burns units & emits event',
                  },
                  {
                    step: 2,
                    title: '2. Messenger Dispatch',
                    desc: 'CrossDomainMessenger encapsulates calldata & gas limit',
                  },
                  {
                    step: 3,
                    title: '3. Layer 2 Inclusion',
                    desc: simDirection === 'deposit'
                      ? 'Sequencer derives deposit tx & includes at head of block'
                      : 'DisputeGame proposal submitted to L1 factory',
                  },
                  {
                    step: 4,
                    title: '4. Finalize & Credit',
                    desc: 'finalizeBridgeERC20() mints/unlocks units to recipient',
                  },
                ].map((s) => {
                  const isPast = simStep >= s.step;
                  const isCurrent = simStep === s.step && isSimulating;
                  return (
                    <div
                      key={s.step}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isPast
                          ? 'bg-[#0052ff]/10 border-[#0052ff]/40 text-white'
                          : 'bg-[#10131d] border-[#1f2536] text-[#6b7280]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-xs">
                          {s.title}
                        </span>
                        {isPast && <CheckCircle2 className="h-3.5 w-3.5 text-[#66c800]" />}
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#8a91a0]">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                onClick={runBridgeSimulation}
                disabled={isSimulating || simStep === 4}
                className="w-full py-3 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-lg shadow-[#0052ff]/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Zap className={`h-4 w-4 ${isSimulating ? 'animate-bounce' : ''}`} />
                <span>
                  {isSimulating
                    ? 'Executing Bridge Steps Across Domains...'
                    : simStep === 4
                    ? 'Bridge Lifecycle Completed Successfully'
                    : `Execute Standard Bridge (${simAmount} ${simAssetType === 'ETH' ? 'ETH' : simTokenSymbol})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: B20 RWA CROSS-DOMAIN SECURITY */}
      {activeTab === 'b20' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#3c8aff]" />
              <h3 className="text-base font-bold text-white">
                B20 Tokenized Securities Cross-Domain Architecture
              </h3>
            </div>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              When tokenized securities, institutional private credit, or commercial real estate equity units are bridged between Ethereum L1 (for deep institutional secondary liquidity) and Base L2 (for sub-cent cap table rebalancing and dividend distributions), strict legal compliance must be enforced on both domains.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#10131c] border border-[#202738] space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#66c800]" />
                  <span>Dual-Domain Policy Registry</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Both L1 and L2 token contracts implement the B20 standard hook: before <code>finalizeBridgeERC20()</code> credits tokens to the <code>to</code> address, it verifies that the recipient possesses valid KYC/AML accreditations on the destination chain.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#10131c] border border-[#202738] space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#ffd12f]" />
                  <span>Immutable Cap Table Parity</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  The sum of circulating tokens on Base plus locked tokens in <code>deposits(localToken, remoteToken)</code> on L1 precisely equals the legal maximum authorized units filed with regulators (e.g. SEC Form D).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#10131c] border border-[#202738] space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#3c8aff]" />
                  <span>Atomic Attestation Forwarding</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Using the <code>extraData</code> parameter in <code>bridgeERC20(..., bytes extraData)</code>, issuers pack EAS attestation UIDs directly into the cross-domain messenger payload for atomic investor credential verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
