import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  Layers, 
  ShieldCheck, 
  Clock, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Zap, 
  Cpu, 
  Hash, 
  Lock,
  ArrowRight,
  Database,
  Timer,
  Scale
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface BaseWithdrawalsViewerProps {
  currentNetwork?: BaseNetwork;
}

export const BaseWithdrawalsViewer: React.FC<BaseWithdrawalsViewerProps> = ({ currentNetwork }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'contracts' | 'simulator' | 'proofs' | 'security'>('flow');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Simulator state
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [withdrawalValueEth, setWithdrawalValueEth] = useState('0.5');
  const [targetL1Address, setTargetL1Address] = useState('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  const [simCalldata, setSimCalldata] = useState('0x');
  const [challengeHoursRemaining, setChallengeHoursRemaining] = useState(168); // 7 days = 168 hours

  const L2_MESSAGE_PASSER_ADDRESS = '0x4200000000000000000000000000000000000016';
  const L1_OPTIMISM_PORTAL_ADDRESS = '0x49048044D57e1C92A77f79988d21Fa8fAF74E97e';

  const MESSAGE_PASSER_SOLIDITY = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title L2ToL1MessagePasser
 * @notice Predeployed on Base at 0x4200000000000000000000000000000000000016.
 *         Stores commitments to withdrawal messages in EVM storage.
 */
interface L2ToL1MessagePasser {
    event MessagePassed(
        uint256 indexed nonce,         // Global nonce for all withdrawal messages
        address indexed sender,        // Address on L2 initiating the withdrawal
        address indexed target,        // Address on L1 receiving the message/funds
        uint256 value,                 // ETH value in wei
        uint256 gasLimit,              // Gas limit forwarded on L1
        bytes data,                    // Calldata forwarded on L1
        bytes32 withdrawalHash         // keccak256 hash of the message attributes
    );

    event WithdrawerBalanceBurnt(uint256 indexed amount);

    function burn() external;

    function initiateWithdrawal(
        address _target, 
        uint256 _gasLimit, 
        bytes memory _data
    ) payable external;

    function messageNonce() external view returns (uint256);

    function sentMessages(bytes32) external view returns (bool);
}`;

  const OPTIMISM_PORTAL_SOLIDITY = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title OptimismPortal (Withdrawals Interface)
 * @notice Deployed on Ethereum L1. Verifies fault proofs and finalizes withdrawals.
 */
interface OptimismPortal {
    event WithdrawalFinalized(bytes32 indexed withdrawalHash, bool success);

    // Returns the authenticated L2 msg.sender during a relayed withdrawal call
    function l2Sender() external returns (address);

    function proveWithdrawalTransaction(
        Types.WithdrawalTransaction memory _tx,
        uint256 _l2OutputIndex,
        Types.OutputRootProof calldata _outputRootProof,
        bytes[] calldata _withdrawalProof
    ) external;

    function finalizeWithdrawalTransaction(
        Types.WithdrawalTransaction memory _tx
    ) external;
}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (label.startsWith('0x')) {
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 1800);
    } else {
      setCopiedCode(label);
      setTimeout(() => setCopiedCode(null), 1800);
    }
    triggerConfetti();
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setSimStep(1);

    // Step 1: Initiate on Base
    setTimeout(() => {
      setSimStep(2); // Step 2: Proving on L1
      setTimeout(() => {
        setSimStep(3); // Step 3: Challenge period starts
        setChallengeHoursRemaining(168);
        setTimeout(() => {
          setSimStep(4); // Step 4: Finalize on L1
          setChallengeHoursRemaining(0);
          setIsSimulating(false);
          triggerConfetti();
        }, 1500);
      }, 1300);
    }, 1100);
  };

  const resetSimulation = () => {
    setSimStep(0);
    setIsSimulating(false);
    setChallengeHoursRemaining(168);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#232938] bg-gradient-to-br from-[#10131a] via-[#121626] to-[#0f1118] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#ffd12f]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ffd12f] animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ffd12f]">
              Base Protocol Specifications · Cross-Domain Exit
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Standard Withdrawals (L2 → L1 Lifecycle)
          </h2>

          <p className="text-sm text-[#8a91a0] max-w-3xl leading-relaxed">
            A standard withdrawal is a cross-domain transaction initiated on Base and finalized on Ethereum. Secured by Base's fault proof game, withdrawals follow a strict 3-stage protocol: <strong>Initiate on Base</strong>, <strong>Prove on Ethereum</strong>, and <strong>Finalize after the 7-day challenge window</strong>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Initiator Predeploy:</span>
              <span className="text-[#3c8aff] font-bold">0x4200...0016</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Challenge Period:</span>
              <span className="text-[#ffd12f] font-bold">7 Days (Fault Dispute)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Address Aliasing:</span>
              <span className="text-[#66c800] font-bold">Disabled (l2Sender() auth)</span>
            </div>
            <a
              href="https://docs.base.org/llms.txt"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#0052ff]/15 hover:bg-[#0052ff]/25 border border-[#0052ff]/40 text-[#3c8aff] font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>docs.base.org Withdrawals Spec</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0c0e15] border border-[#202636] overflow-x-auto text-xs font-mono">
        {[
          { id: 'flow', label: 'Standard 3-Step Flow', icon: Layers },
          { id: 'simulator', label: 'Withdrawal Lifecycle Simulator', icon: ArrowUpRight },
          { id: 'contracts', label: 'Solidity Contracts', icon: FileCode },
          { id: 'proofs', label: 'Verification & Merkle Proofs', icon: Cpu },
          { id: 'security', label: 'Security & Attack Mitigations', icon: ShieldCheck },
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
                  : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STANDARD 3-STEP FLOW */}
      {activeTab === 'flow' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 3 Stages Horizontal Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-[#0052ff]/15 text-[#3c8aff] border border-[#0052ff]/30 font-mono text-[11px] font-bold">
                  STAGE 1 · BASE L2
                </span>
                <span className="text-[11px] text-[#717886] font-mono">~2 Seconds</span>
              </div>
              <h3 className="text-base font-bold text-white">1. Initiate on Base</h3>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                The user or smart contract calls <code>L2ToL1MessagePasser.initiateWithdrawal(target, gasLimit, data)</code> at <code>0x4200...0016</code>. The message hash is recorded in contract storage and emitted via <code>MessagePassed</code>.
              </p>
              <div className="p-2.5 rounded-xl bg-[#080a0f] border border-[#1b202e] font-mono text-[11px] text-[#3c8aff]">
                Gas: ~31,500 L2 gas ($0.0001)
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-[#3c8aff]/15 text-[#3c8aff] border border-[#3c8aff]/30 font-mono text-[11px] font-bold">
                  STAGE 2 · ETHEREUM L1
                </span>
                <span className="text-[11px] text-[#717886] font-mono">~1-2 Hours</span>
              </div>
              <h3 className="text-base font-bold text-white">2. Prove on Ethereum</h3>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                Once the sequencer submits the output proposal committing to this L2 block, a relayer submits <code>proveWithdrawalTransaction()</code> with Merkle inclusion proofs to <code>OptimismPortal</code> on L1.
              </p>
              <div className="p-2.5 rounded-xl bg-[#080a0f] border border-[#1b202e] font-mono text-[11px] text-[#ffd12f]">
                Enters 7-Day Dispute Window
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-[#66c800]/15 text-[#66c800] border border-[#66c800]/30 font-mono text-[11px] font-bold">
                  STAGE 3 · ETHEREUM L1
                </span>
                <span className="text-[11px] text-[#66c800] font-mono">Finality Release</span>
              </div>
              <h3 className="text-base font-bold text-white">3. Finalize on Ethereum</h3>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                After the 7-day fault dispute window concludes without challenge, <code>finalizeWithdrawalTransaction()</code> executes. ETH is released to target or the target contract is invoked with <code>l2Sender()</code> authenticated.
              </p>
              <div className="p-2.5 rounded-xl bg-[#080a0f] border border-[#1b202e] font-mono text-[11px] text-[#66c800]">
                Emits WithdrawalFinalized(hash, true)
              </div>
            </div>
          </div>

          {/* Key Differences: Aliasing vs l2Sender */}
          <div className="p-6 rounded-2xl border border-[#222838] bg-[#0c0e15] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#ffd12f]" />
              <span>Critical Architectural Difference: Address Aliasing on Withdrawals</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#8a91a0]">
              <div className="p-4 rounded-xl bg-[#121622] border border-[#1e2536] space-y-2">
                <div className="font-bold text-[#fc401f] font-mono uppercase">
                  Deposits (L1 → L2)
                </div>
                <p className="leading-relaxed">
                  Contract addresses on L1 are <strong>aliased</strong> by adding <code>0x1111...1111</code>. This is required because on L2, the sender address is returned directly by the EVM <code>CALLER</code> opcode, which could trick L2 contracts into believing an L2 contract called them.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#121622] border border-[#1e2536] space-y-2">
                <div className="font-bold text-[#66c800] font-mono uppercase">
                  Withdrawals (L2 → L1)
                </div>
                <p className="leading-relaxed">
                  Withdrawal senders are <strong>NOT aliased</strong>! On L1, the withdrawal call is dispatched by <code>OptimismPortal</code> as <code>msg.sender</code>. Target contracts read the real L2 caller unambiguously by calling <code>OptimismPortal.l2Sender()</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Third-Party Faster Bridges */}
          <div className="p-4 rounded-2xl bg-[#0052ff]/10 border border-[#0052ff]/30 text-xs text-[#dee1e7] flex items-start gap-3">
            <Zap className="h-5 w-5 text-[#3c8aff] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white font-mono uppercase">Need Faster Withdrawals? (Fast Liquidity Bridges)</span>
              <p className="text-[#8a91a0] leading-relaxed">
                The canonical 7-day challenge period is an inherent security requirement of optimistic rollups. Third-party liquidity networks (such as Across, Stargate, or Hop) provide sub-minute exits by fronting liquidity on L1 in exchange for a small fee, rebalancing via the 7-day canonical route in batches.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WITHDRAWAL LIFECYCLE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b202e] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Interactive Withdrawal Simulator</h3>
                <p className="text-xs text-[#8a91a0]">
                  Walk through the 3 protocol stages: <code>initiateWithdrawal</code> → <code>proveWithdrawalTransaction</code> → 7-day window → <code>finalizeWithdrawalTransaction</code>.
                </p>
              </div>

              {simStep > 0 && (
                <button
                  onClick={resetSimulation}
                  className="px-3 py-1.5 rounded-lg bg-[#161a26] border border-[#242c3d] text-xs font-mono text-[#8a91a0] hover:text-white flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset Simulator</span>
                </button>
              )}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[#717886]">ETH Amount to Withdraw:</label>
                <input
                  type="text"
                  value={withdrawalValueEth}
                  onChange={(e) => setWithdrawalValueEth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#22293a] text-white focus:border-[#0052ff] focus:outline-none"
                  placeholder="0.5"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[#717886]">Target L1 Recipient / Contract:</label>
                <input
                  type="text"
                  value={targetL1Address}
                  onChange={(e) => setTargetL1Address(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#22293a] text-white focus:border-[#0052ff] focus:outline-none"
                  placeholder="0x..."
                />
              </div>
            </div>

            {/* Visual 4-Phase Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
              {[
                {
                  step: 1,
                  name: '1. Initiate on L2',
                  sub: 'L2ToL1MessagePasser',
                  desc: 'Hash stored in sentMessages & burnt/locked on Base',
                  icon: ArrowUpRight,
                },
                {
                  step: 2,
                  name: '2. Output & Prove',
                  sub: 'OptimismPortal.prove',
                  desc: 'Relayer submits Merkle inclusion proof against L2 state root',
                  icon: Cpu,
                },
                {
                  step: 3,
                  name: '3. Challenge Window',
                  sub: `${challengeHoursRemaining}h remaining`,
                  desc: 'DisputeGameFactory window active for fault proof challenges',
                  icon: Timer,
                },
                {
                  step: 4,
                  name: '4. Finalize & Release',
                  sub: 'OptimismPortal.finalize',
                  desc: 'ETH transferred to L1 recipient; hash marked finalized',
                  icon: CheckCircle2,
                },
              ].map((s) => {
                const isPast = simStep >= s.step;
                const isCurrent = simStep === s.step && isSimulating;
                return (
                  <div
                    key={s.step}
                    className={`p-4 rounded-xl border transition-all ${
                      isPast
                        ? 'bg-[#0052ff]/10 border-[#0052ff]/40 text-white'
                        : 'bg-[#10131d] border-[#1f2536] text-[#6b7280]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs">{s.name}</span>
                      {isPast && <CheckCircle2 className="h-4 w-4 text-[#66c800]" />}
                    </div>
                    <div className="text-[11px] text-[#ffd12f]">{s.sub}</div>
                    <p className="text-[10px] text-[#8a91a0] font-sans mt-1 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Run Button */}
            <div className="pt-2">
              <button
                onClick={runSimulation}
                disabled={isSimulating || simStep === 4}
                className="w-full py-3 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-lg shadow-[#0052ff]/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Zap className={`h-4 w-4 ${isSimulating ? 'animate-bounce' : ''}`} />
                <span>
                  {isSimulating
                    ? 'Advancing Withdrawal Pipeline (Simulating 7-Day Transition)...'
                    : simStep === 4
                    ? 'Withdrawal Fully Finalized on Ethereum L1'
                    : `Simulate Complete 3-Step Withdrawal (${withdrawalValueEth} ETH)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SOLIDITY CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="space-y-6 animate-fadeIn">
          {/* L2ToL1MessagePasser */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e15] border border-[#202636]">
              <div className="flex items-center gap-2 text-xs font-mono">
                <FileCode className="h-4 w-4 text-[#3c8aff]" />
                <span className="text-white font-bold">L2ToL1MessagePasser.sol (Predeploy)</span>
                <span className="text-[#717886]">— {L2_MESSAGE_PASSER_ADDRESS}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(L2_MESSAGE_PASSER_ADDRESS, L2_MESSAGE_PASSER_ADDRESS)}
                  className="px-2.5 py-1 rounded-lg bg-[#181d2a] text-[11px] text-white font-mono hover:bg-[#202738] transition-colors"
                >
                  {copiedAddress === L2_MESSAGE_PASSER_ADDRESS ? 'Address Copied' : 'Copy Address'}
                </button>
                <button
                  onClick={() => handleCopy(MESSAGE_PASSER_SOLIDITY, 'passer')}
                  className="px-2.5 py-1 rounded-lg bg-[#181d2a] text-[11px] text-white font-mono hover:bg-[#202738] transition-colors"
                >
                  {copiedCode === 'passer' ? 'Code Copied' : 'Copy Code'}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-[#222838] bg-[#090b10] overflow-hidden">
              <pre className="p-4 font-mono text-xs text-[#dee1e7] overflow-x-auto leading-relaxed">
                <code>{MESSAGE_PASSER_SOLIDITY}</code>
              </pre>
            </div>
          </div>

          {/* OptimismPortal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e15] border border-[#202636]">
              <div className="flex items-center gap-2 text-xs font-mono">
                <FileCode className="h-4 w-4 text-[#ffd12f]" />
                <span className="text-white font-bold">OptimismPortal.sol (L1 Interface)</span>
                <span className="text-[#717886]">— {L1_OPTIMISM_PORTAL_ADDRESS}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(L1_OPTIMISM_PORTAL_ADDRESS, L1_OPTIMISM_PORTAL_ADDRESS)}
                  className="px-2.5 py-1 rounded-lg bg-[#181d2a] text-[11px] text-white font-mono hover:bg-[#202738] transition-colors"
                >
                  {copiedAddress === L1_OPTIMISM_PORTAL_ADDRESS ? 'Address Copied' : 'Copy Address'}
                </button>
                <button
                  onClick={() => handleCopy(OPTIMISM_PORTAL_SOLIDITY, 'portal')}
                  className="px-2.5 py-1 rounded-lg bg-[#181d2a] text-[11px] text-white font-mono hover:bg-[#202738] transition-colors"
                >
                  {copiedCode === 'portal' ? 'Code Copied' : 'Copy Code'}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-[#222838] bg-[#090b10] overflow-hidden">
              <pre className="p-4 font-mono text-xs text-[#dee1e7] overflow-x-auto leading-relaxed">
                <code>{OPTIMISM_PORTAL_SOLIDITY}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VERIFICATION & MERKLE PROOFS */}
      {activeTab === 'proofs' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-[#3c8aff]" />
                <span>Withdrawal Verification Inputs &amp; Output Root Proof</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-1 leading-relaxed">
                To prove a withdrawal on Ethereum L1, a relayer submits two primary data structures to the <code>OptimismPortal</code>: the <code>WithdrawalTransaction</code> and the <code>OutputRootProof</code>.
              </p>
            </div>

            {/* Struct Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#121622] border border-[#1f2536] space-y-2">
                <div className="text-[#3c8aff] font-bold">Types.WithdrawalTransaction</div>
                <div className="space-y-1 text-[#8a91a0] text-[11px]">
                  <div>• <code className="text-white">uint256 nonce</code>: global message nonce</div>
                  <div>• <code className="text-white">address sender</code>: L2 sender address</div>
                  <div>• <code className="text-white">address target</code>: L1 recipient address</div>
                  <div>• <code className="text-white">uint256 value</code>: ETH amount in wei</div>
                  <div>• <code className="text-white">uint256 gasLimit</code>: minimum gas forwarded</div>
                  <div>• <code className="text-white">bytes data</code>: arbitrary calldata</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#121622] border border-[#1f2536] space-y-2">
                <div className="text-[#ffd12f] font-bold">Types.OutputRootProof</div>
                <div className="space-y-1 text-[#8a91a0] text-[11px]">
                  <div>• <code className="text-white">bytes32 version</code>: output root version format</div>
                  <div>• <code className="text-white">bytes32 stateRoot</code>: L2 world state root</div>
                  <div>• <code className="text-white">bytes32 messagePasserStorageRoot</code>: storage root of 0x4200...16</div>
                  <div>• <code className="text-white">bytes32 latestBlockhash</code>: L2 block hash</div>
                </div>
              </div>
            </div>

            {/* Verification Logic Box */}
            <div className="p-4 rounded-xl bg-[#090b10] border border-[#1c2230] space-y-2 text-xs">
              <span className="font-mono font-bold text-[#66c800] uppercase">
                Consensus Verification Rules:
              </span>
              <ul className="text-[#8a91a0] space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                <li>
                  <code>l2OutputIndex</code> must match an existing proposal output in the dispute game / oracle.
                </li>
                <li>
                  <code>keccak256(outputRootProof)</code> must strictly equal the committed <code>outputRoot</code>.
                </li>
                <li>
                  <code>withdrawalProof</code> is an MPT (Merkle Patricia Trie) inclusion proof confirming that the withdrawal hash is in the storage trie of <code>L2ToL1MessagePasser</code>.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & ATTACK MITIGATIONS */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#fc401f]" />
              <h3 className="text-base font-bold text-white">Security Guarantees &amp; Attack Mitigations</h3>
            </div>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Cross-domain withdrawals are the primary target of bridge exploits in rollup systems. Base employs multiple deterministic constraints to guarantee fund safety.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-[#10131c] border border-[#202738] space-y-2">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-[#66c800]" />
                  <span>Double-Spend Prevention</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Every withdrawal has a unique <code>withdrawalHash</code>. Once proven and finalized, the hash is irreversibly recorded in <code>finalizedWithdrawals[withdrawalHash] = true</code> on the <code>OptimismPortal</code> to prevent replay attacks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#10131c] border border-[#202738] space-y-2">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-[#ffd12f]" />
                  <span>No Replay on Forwarding Failure</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  If the target call on L1 reverts during finalization (e.g. out of gas or target contract error), the withdrawal is still marked finalized and <strong>cannot be replayed</strong>. Applications must specify adequate <code>gasLimit</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#10131c] border border-[#202738] space-y-2">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#fc401f]" />
                  <span>OptimismPortal Permissions</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Because <code>OptimismPortal</code> dispatches arbitrary external calls with itself as <code>msg.sender</code>, never approve ERC-20 allowances to the portal contract, as anyone could construct a withdrawal claiming them.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
