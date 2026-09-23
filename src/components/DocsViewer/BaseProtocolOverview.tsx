import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  ExternalLink, 
  Box, 
  Server, 
  GitMerge, 
  Share2, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw,
  Network,
  Workflow,
  Radio,
  Terminal
} from 'lucide-react';
import { DerivationPipelineViewer } from './DerivationPipelineViewer';
import { BaseP2PNetworkSpec } from './BaseP2PNetworkSpec';
import { BaseRollupNodeRPCSpec } from './BaseRollupNodeRPCSpec';
import { BaseNetwork } from '../../types/base';
import { BASE_NETWORKS } from '../../data/mockBaseData';

interface BaseProtocolOverviewProps {
  currentNetwork?: BaseNetwork;
}

export const BaseProtocolOverview: React.FC<BaseProtocolOverviewProps> = ({ currentNetwork }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'derivation' | 'p2p' | 'rpc' | 'flows' | 'components' | 'participants'>('derivation');
  const [selectedFlow, setSelectedFlow] = useState<'deposit' | 'transaction' | 'withdrawal'>('deposit');
  const [flowStep, setFlowStep] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Flow step definitions from official Base specifications
  const flows = {
    deposit: {
      title: 'Depositing ETH/Assets to Base',
      desc: 'How assets move trustlessly from Ethereum L1 into Base L2 blocks.',
      steps: [
        {
          actor: 'User on Ethereum L1',
          action: 'submit deposit',
          target: 'OptimismPortal (L1 Contract)',
          detail: 'User calls depositTransaction() on OptimismPortal with ETH or ERC20. OptimismPortal emits a TransactionDeposited event on L1.',
          status: 'L1 Transaction Confirmed',
        },
        {
          actor: 'Base Sequencer',
          action: 'fetch deposit events',
          target: 'OptimismPortal (L1)',
          detail: 'Sequencer rollup node continuously monitors L1 for TransactionDeposited logs within the derivation window.',
          status: 'L1 Log Observed',
        },
        {
          actor: 'Base Sequencer',
          action: 'generate deposit block',
          target: 'L2 Execution Engine (Reth)',
          detail: 'Sequencer places deposit transactions deterministically at the very beginning of the corresponding L2 block. No user signature required; caller is derived from L1 sender.',
          status: 'L2 Block Generated',
        },
        {
          actor: 'User on Base L2',
          action: 'transact on L2',
          target: 'Base L2 Network',
          detail: 'User now has funds available on Base L2 to pay gas, mint B20 assets, and interact with contracts at ultra-low fees (<$0.001).',
          status: 'L2 Balance Available',
        },
        {
          actor: 'Batcher',
          action: 'post batches to L1',
          target: 'Batch Inbox Address (L1)',
          detail: 'Sequencer batches and compresses all subsequent L2 transactions into channel frames and commits them back to L1 via EIP-4844 blobs.',
          status: 'Data Availability Secured',
        },
      ],
    },
    transaction: {
      title: 'Sending Transactions & 200ms Flashblocks',
      desc: 'Sub-second execution on Base with Reth and 200ms Flashblock pre-confirmations.',
      steps: [
        {
          actor: 'User / DApp',
          action: 'eth_sendRawTransaction',
          target: 'Base RPC Node',
          detail: 'User signs a transaction (or Passkey UserOp via Base Paymaster) and submits to the JSON-RPC interface.',
          status: 'RPC Mempool Received',
        },
        {
          actor: 'Sequencer (Active)',
          action: 'Produce 200ms Flashblock',
          target: 'Consensus Engine',
          detail: 'Base sequencer produces Flashblocks every 200ms, committing to transaction ordering within the block as it is being assembled.',
          status: 'Flashblock Pre-Confirmed (200ms)',
        },
        {
          actor: 'P2P Gossip Network',
          action: 'Disseminate unsafe blocks',
          target: 'Validator Nodes',
          detail: 'Unsafe (unconfirmed on L1) blocks are streamed over P2P to full nodes and validators for instant user feedback and low-latency state queries.',
          status: 'P2P Propagated',
        },
        {
          actor: 'Batcher Service',
          action: 'Compress & post to L1',
          target: 'Batch Inbox Address (L1)',
          detail: 'Batcher compresses L2 blocks into channel frames and posts them as calldata or EIP-4844 data blobs to L1 Batch Inbox.',
          status: 'L1 Data Availability Posted',
        },
      ],
    },
    withdrawal: {
      title: 'Withdrawing from Base to Ethereum L1',
      desc: 'Initiating on L2, disputing via DisputeGameFactory, and finalizing on OptimismPortal.',
      steps: [
        {
          actor: 'User on Base L2',
          action: 'initiate withdrawal',
          target: 'L2ToL1MessagePasser (L2 Predeploy 0x4200...0016)',
          detail: 'User initiates withdrawal on Base L2. The transaction burns/locks L2 tokens and emits WithdrawalInitiated event.',
          status: 'L2 Withdrawal Initiated',
        },
        {
          actor: 'Sequencer',
          action: 'submit transaction batch',
          target: 'Batch Inbox Address (L1)',
          detail: 'The withdrawal transaction is compressed and committed to Ethereum L1 for data availability.',
          status: 'Batch Posted to L1',
        },
        {
          actor: 'Proposers',
          action: 'submit output proposal',
          target: 'DisputeGameFactory (L1 Contract)',
          detail: 'Proposer submits an output root assertion of the L2 state to DisputeGameFactory on L1.',
          status: 'Output Root Proposed',
        },
        {
          actor: 'DisputeGameFactory',
          action: 'generate fault proof game',
          target: 'AggregateVerifier / Fault Game',
          detail: 'A dispute game contract is instantiated. Challengers have the 7-day challenge window to verify or dispute state transitions.',
          status: 'Game Created (7-Day Window)',
        },
        {
          actor: 'User',
          action: 'submit withdrawal proof',
          target: 'OptimismPortal (L1)',
          detail: 'User submits Merkle proof showing their withdrawal was included in the proposed L2 output root.',
          status: 'Proof Proven on L1',
        },
        {
          actor: 'Challengers / Network',
          action: 'wait for finalization',
          target: 'Proof Game Contract',
          detail: '7-day challenge period passes without valid disputes against the proposed state.',
          status: 'Game Resolved Valid',
        },
        {
          actor: 'User',
          action: 'finalize withdrawal',
          target: 'OptimismPortal (L1)',
          detail: 'User sends finalization transaction to OptimismPortal. Portal verifies the game resolved in favor of the proposer.',
          status: 'OptimismPortal Verified',
        },
        {
          actor: 'OptimismPortal',
          action: 'execute withdrawal payout',
          target: 'Recipient / External Contracts (L1)',
          detail: 'OptimismPortal releases locked ETH or assets to the recipient on Ethereum L1. Withdrawal complete!',
          status: 'Funds Unlocked on L1',
        },
      ],
    },
  };

  const currentFlowData = flows[selectedFlow];

  const handleNextStep = () => {
    setFlowStep((prev) => (prev + 1) % currentFlowData.steps.length);
  };

  const handlePrevStep = () => {
    setFlowStep((prev) => (prev === 0 ? currentFlowData.steps.length - 1 : prev - 1));
  };

  const handleReset = () => {
    setFlowStep(0);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-[#232730] bg-gradient-to-br from-[#111317] via-[#0f1116] to-[#121620] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0052ff] animate-pulse"></span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3c8aff]">
                Base Chain Protocol Architecture
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Ethereum L2 Rollup Specification & User Flows
            </h2>
            <p className="text-xs sm:text-sm text-[#8a91a0] leading-relaxed">
              Base is an optimistic rollup built on Ethereum. L2 transaction batches are posted to Ethereum for data availability, 
              and interactive fault proofs allow anyone to challenge invalid state transitions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://docs.base.org/llms.txt"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#191c24] hover:bg-[#222733] border border-[#2b303c] text-xs font-mono text-[#dee1e7] flex items-center gap-1.5 transition-colors"
            >
              <span>docs.base.org/llms.txt</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#3c8aff]" />
            </a>
          </div>
        </div>

        {/* View Mode Nav */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-[#1f232c]">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'architecture'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Protocol Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('derivation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'derivation'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            <Workflow className="h-3.5 w-3.5" />
            <span>Derivation Pipeline (8 Stages)</span>
          </button>

          <button
            onClick={() => setActiveTab('p2p')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'p2p'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>P2P Network & Gossip</span>
          </button>

          <button
            onClick={() => setActiveTab('rpc')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'rpc'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Rollup Node RPC</span>
          </button>

          <button
            onClick={() => setActiveTab('flows')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'flows'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            <GitMerge className="h-3.5 w-3.5" />
            <span>Interactive Flow Visualizer</span>
          </button>

          <button
            onClick={() => setActiveTab('components')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'components'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>5 Core Components</span>
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'participants'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Network Participants</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SYSTEM ARCHITECTURE DIAGRAM */}
      {activeTab === 'architecture' && (
        <div className="space-y-6 animate-fadeIn">
          {/* High-Level Architecture Grid */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-6">
            <div>
              <h3 className="font-bold text-white text-base">Cross-Layer System Architecture</h3>
              <p className="text-xs text-[#8a91a0] mt-0.5">
                How Ethereum L1 contracts, Base L2 nodes (Reth execution & consensus), batchers, proposers, and users interconnect.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* L1 Ethereum Box */}
              <div className="lg:col-span-4 rounded-xl border border-[#3b4354] bg-[#0c0e14] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#3c8aff] font-mono">
                    Ethereum L1 Layer
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#3c8aff]/10 text-[#3c8aff] font-mono">
                    Settlement & DA
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[#141722] border border-[#232a3b] space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#0052ff]"></span>
                      <span>OptimismPortal</span>
                    </div>
                    <p className="text-[11px] text-[#8a91a0]">
                      L1 gateway contract. Receives deposits (depositTransaction) and finalizes proven withdrawals.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#141722] border border-[#232a3b] space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#ffd12f]"></span>
                      <span>Batch Inbox Address</span>
                    </div>
                    <p className="text-[11px] text-[#8a91a0]">
                      Designated L1 address where Batcher writes compressed transaction channel frames / EIP-4844 blobs.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#141722] border border-[#232a3b] space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#66c800]"></span>
                      <span>DisputeGameFactory</span>
                    </div>
                    <p className="text-[11px] text-[#8a91a0]">
                      Instantiates onchain AggregateVerifier dispute games. Allows proposers to assert state and challengers to contest.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Flow Conduit (Middle Connectors) */}
              <div className="lg:col-span-4 rounded-xl border border-[#232730] bg-[#0e1015] p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ffd12f] font-mono">
                    Rollup Infrastructure
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#ffd12f]/10 text-[#ffd12f] font-mono">
                    Batcher & Proposers
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[#14161d] border border-[#232730] space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-[#ffd12f]" />
                      <span>Batcher Service</span>
                    </div>
                    <p className="text-[11px] text-[#8a91a0]">
                      Runs alongside Sequencer; compresses L2 blocks into frames, sending calldata/blobs to L1 Batch Inbox.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#14161d] border border-[#232730] space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#66c800]" />
                      <span>Proposers & Challengers</span>
                    </div>
                    <p className="text-[11px] text-[#8a91a0]">
                      Proposers submit output proposals to DisputeGameFactory. Challengers independently execute state to verify assertions.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#14161d] border border-[#232730] space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#3c8aff]" />
                      <span>200ms Flashblocks</span>
                    </div>
                    <p className="text-[11px] text-[#8a91a0]">
                      Sequencer commits to transaction order every 200ms before block sealing for ultra-fast user experiences.
                    </p>
                  </div>
                </div>
              </div>

              {/* L2 Base Node Box */}
              <div className="lg:col-span-4 rounded-xl border border-[#0052ff]/40 bg-[#0a0d16] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0052ff] font-mono">
                    Base L2 Node
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#0052ff]/15 text-[#3c8aff] font-mono">
                    Execution & Consensus
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[#121625] border border-[#1d253d] space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-[#0052ff]" />
                      <span>Consensus (Rollup Node)</span>
                    </div>
                    <p className="text-[11px] text-[#8a91a0]">
                      Derivation pipeline reads L1 batches and deposit events. Constructs payload attributes and drives execution engine via Engine API.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#121625] border border-[#1d253d] space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-[#3c8aff]" />
                      <span>Execution Engine (Reth)</span>
                    </div>
                    <p className="text-[11px] text-[#8a91a0]">
                      High-performance Rust-based Reth runtime. Exposes Ethereum JSON-RPC API, executes transactions, manages B20 state.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#121625] border border-[#1d253d] space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Box className="h-3.5 w-3.5 text-[#66c800]" />
                      <span>Predeploys & Precompiles</span>
                    </div>
                    <p className="text-[11px] text-[#8a91a0]">
                      Fixed system contracts on L2 for fee distribution, L1 attribute injection, message passing, and B20 policy precompiles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: L2 CHAIN DERIVATION PIPELINE */}
      {activeTab === 'derivation' && <DerivationPipelineViewer />}

      {/* VIEW: P2P NETWORK & GOSSIP SPECIFICATION */}
      {activeTab === 'p2p' && (
        <BaseP2PNetworkSpec currentNetwork={currentNetwork || BASE_NETWORKS['base-vibenet']} />
      )}

      {/* VIEW: ROLLUP NODE RPC & OUTPUT ROOTS */}
      {activeTab === 'rpc' && (
        <BaseRollupNodeRPCSpec currentNetwork={currentNetwork || BASE_NETWORKS['base-vibenet']} />
      )}

      {/* VIEW 3: INTERACTIVE USER FLOW VISUALIZER */}
      {activeTab === 'flows' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Flow Picker */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#111317] border border-[#232730]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Select Protocol Flow:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setSelectedFlow('deposit');
                    setFlowStep(0);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedFlow === 'deposit'
                      ? 'bg-[#0052ff] text-white'
                      : 'bg-[#181a22] text-[#8a91a0] hover:text-white'
                  }`}
                >
                  1. Depositing ETH to Base
                </button>
                <button
                  onClick={() => {
                    setSelectedFlow('transaction');
                    setFlowStep(0);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedFlow === 'transaction'
                      ? 'bg-[#0052ff] text-white'
                      : 'bg-[#181a22] text-[#8a91a0] hover:text-white'
                  }`}
                >
                  2. 200ms Flashblocks & Tx
                </button>
                <button
                  onClick={() => {
                    setSelectedFlow('withdrawal');
                    setFlowStep(0);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedFlow === 'withdrawal'
                      ? 'bg-[#0052ff] text-white'
                      : 'bg-[#181a22] text-[#8a91a0] hover:text-white'
                  }`}
                >
                  3. Withdrawing & Fault Proofs
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevStep}
                className="px-2.5 py-1 rounded-lg bg-[#181a22] text-[#dee1e7] hover:text-white text-xs border border-[#2b303c] transition-colors"
              >
                Prev Step
              </button>
              <button
                onClick={handleNextStep}
                className="px-3 py-1 rounded-lg bg-[#0052ff] text-white text-xs font-bold hover:bg-[#0048e0] transition-colors"
              >
                Next Step ({flowStep + 1}/{currentFlowData.steps.length})
              </button>
              <button
                onClick={handleReset}
                title="Reset Flow"
                className="p-1.5 rounded-lg bg-[#181a22] text-[#8a91a0] hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Current Step Spotlight */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#3c8aff] uppercase">
                  Step {flowStep + 1} of {currentFlowData.steps.length}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{currentFlowData.title}</h3>
                <p className="text-xs text-[#8a91a0] mt-0.5">{currentFlowData.desc}</p>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#66c800]/15 text-[#66c800] text-xs font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>{currentFlowData.steps[flowStep].status}</span>
              </span>
            </div>

            {/* Step Action Visual Card */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-[#141724] to-[#0f1118] border border-[#252c3d] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#0052ff]/20 text-[#3c8aff] flex items-center justify-center font-bold text-lg border border-[#0052ff]/30">
                  {flowStep + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{currentFlowData.steps[flowStep].actor}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#8a91a0]" />
                    <span className="font-mono text-xs text-[#3c8aff] bg-[#0052ff]/15 px-2 py-0.5 rounded">
                      {currentFlowData.steps[flowStep].action}
                    </span>
                  </div>
                  <div className="text-xs text-[#dee1e7] mt-1">
                    Target: <span className="font-mono text-white font-semibold">{currentFlowData.steps[flowStep].target}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Explanation */}
            <div className="p-4 rounded-xl bg-[#0e1015] border border-[#1f232b] text-xs text-[#b1b7c3] leading-relaxed">
              <p>{currentFlowData.steps[flowStep].detail}</p>
            </div>

            {/* Step Progress Dots */}
            <div className="flex items-center gap-2 pt-2">
              {currentFlowData.steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFlowStep(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === flowStep
                      ? 'w-8 bg-[#0052ff]'
                      : idx < flowStep
                      ? 'w-3 bg-[#66c800]'
                      : 'w-3 bg-[#232730]'
                  }`}
                  title={`Jump to step ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: 5 PROTOCOL COMPONENTS */}
      {activeTab === 'components' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
          {/* Component 1: Consensus */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#0052ff]/10 text-[#0052ff] flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white text-base">1. Consensus (Rollup Node)</h4>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Derives the canonical L2 chain from L1 data. Reads transaction batches from the Batch Inbox and deposit events from OptimismPortal, constructs payload attributes, and drives the execution engine via the Engine API.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0e1015] border border-[#1f232b] text-[11px] font-mono text-[#3c8aff]">
              Derivation Pipeline → Engine API
            </div>
          </div>

          {/* Component 2: Execution */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#66c800]/10 text-[#66c800] flex items-center justify-center">
              <Server className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white text-base">2. Execution (Reth Engine)</h4>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Reth-based runtime written in Rust. Exposes standard Ethereum JSON-RPC API and processes blocks. System predeploys, precompiles, and preinstalls extend the EVM for L1 attribute injection and B20 policies.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0e1015] border border-[#1f232b] text-[11px] font-mono text-[#66c800]">
              EVM Compatible · Predeploys · Precompiles
            </div>
          </div>

          {/* Component 3: Bridging */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#ffd12f]/10 text-[#ffd12f] flex items-center justify-center">
              <Share2 className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white text-base">3. Bridging (OptimismPortal)</h4>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Deposits flow from OptimismPortal into L2 as special deposit transactions at the head of blocks. Withdrawals flow in reverse: user initiates on L2, proposer submits output root to DisputeGameFactory, and user proves + finalizes on L1.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0e1015] border border-[#1f232b] text-[11px] font-mono text-[#ffd12f]">
              OptimismPortal ↔ L2ToL1MessagePasser
            </div>
          </div>

          {/* Component 4: Batcher */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#fc401f]/10 text-[#fc401f] flex items-center justify-center">
              <Box className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white text-base">4. Batcher (DA Layer)</h4>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Service run by sequencer that compresses L2 transaction data into channel frames and posts them as calldata or EIP-4844 blobs to the Batch Inbox on L1. Ensures any validator can independently reconstruct the L2 state.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0e1015] border border-[#1f232b] text-[11px] font-mono text-[#fc401f]">
              EIP-4844 Blobs · Batch Inbox
            </div>
          </div>

          {/* Component 5: Proofs */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#3c8aff]/10 text-[#3c8aff] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white text-base">5. Proofs & Dispute Games</h4>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Proposers create checkpoint games through DisputeGameFactory. Proof material is checked by onchain verifier contracts, and challengers can dispute invalid claims. Valid withdrawals finalize once games resolve.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0e1015] border border-[#1f232b] text-[11px] font-mono text-[#3c8aff]">
              DisputeGameFactory · AggregateVerifier
            </div>
          </div>

          {/* Bonus: 200ms Flashblocks */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#0052ff]/10 text-[#0052ff] flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white text-base">200ms Flashblocks</h4>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Base's high-frequency block production feature. The sequencer produces Flashblocks every 200ms, committing to transaction ordering within the block as it is being built, giving sub-second pre-confirmations.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0e1015] border border-[#1f232b] text-[11px] font-mono text-[#3c8aff]">
              200ms Pre-confirmations · Sub-second UX
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: 3 NETWORK PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#0052ff] font-bold uppercase">Role 1</span>
              <span className="px-2 py-0.5 rounded bg-[#0052ff]/15 text-[#3c8aff] text-[10px] font-mono">
                Initiators
              </span>
            </div>
            <h4 className="text-lg font-bold text-white">Users & DApps</h4>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Submit transactions directly to the sequencer or interact with contracts on Ethereum (e.g. OptimismPortal for deposits). Query transaction data and balances from validator-operated RPC endpoints.
            </p>
            <ul className="text-xs text-[#dee1e7] space-y-1.5 pt-2 border-t border-[#1f232b]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#66c800]" />
                <span>Submit L2 transactions via eth_sendRawTransaction</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#66c800]" />
                <span>Submit L1 deposits/withdrawals</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#66c800]" />
                <span>Use Passkeys & Base Paymasters for gasless ops</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#ffd12f] font-bold uppercase">Role 2</span>
              <span className="px-2 py-0.5 rounded bg-[#ffd12f]/15 text-[#ffd12f] text-[10px] font-mono">
                Block Producers
              </span>
            </div>
            <h4 className="text-lg font-bold text-white">Sequencer</h4>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Fills the role of block producer on Base (single active sequencer). Orders user transactions and deposit streams into blocks, produces 200ms Flashblocks, and posts compressed batches to L1. Not a trusted actor.
            </p>
            <ul className="text-xs text-[#dee1e7] space-y-1.5 pt-2 border-t border-[#1f232b]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#ffd12f]" />
                <span>Accepts transactions from users directly</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#ffd12f]" />
                <span>Produces Flashblocks every 200ms</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#ffd12f]" />
                <span>Submits compressed batches to L1 Batch Inbox</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#66c800] font-bold uppercase">Role 3</span>
              <span className="px-2 py-0.5 rounded bg-[#66c800]/15 text-[#66c800] text-[10px] font-mono">
                State Verifiers
              </span>
            </div>
            <h4 className="text-lg font-bold text-white">Validators / Proposers</h4>
            <p className="text-xs text-[#8a91a0] leading-relaxed">
              Execute the L2 state transition function independently of the Sequencer. Maintain network integrity, serve data to users, submit assertions about L2 state to DisputeGameFactory on L1, and dispute invalid assertions.
            </p>
            <ul className="text-xs text-[#dee1e7] space-y-1.5 pt-2 border-t border-[#1f232b]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#66c800]" />
                <span>Sync rollup data from L1 and Sequencer</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#66c800]" />
                <span>Submit output proposals to DisputeGameFactory</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#66c800]" />
                <span>Challenge invalid state transitions during 7-day window</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
