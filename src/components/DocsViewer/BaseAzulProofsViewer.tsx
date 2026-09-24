import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  ExternalLink, 
  Copy, 
  Check, 
  Zap, 
  Clock, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle,
  AlertCircle,
  Lock,
  ArrowRight,
  Database,
  RefreshCw,
  Hash,
  Scale,
  Code2,
  KeyRound,
  Binary,
  Flame,
  Award,
  Fingerprint,
  ChevronRight,
  Sparkles,
  Server
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface BaseAzulProofsViewerProps {
  currentNetwork?: BaseNetwork;
}

export const BaseAzulProofsViewer: React.FC<BaseAzulProofsViewerProps> = ({ currentNetwork }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'components' | 'simulator' | 'contracts' | 'security'>('architecture');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Addresses for Base Proof Contracts
  const DISPUTE_GAME_FACTORY_ADDRESS = '0x43edB88C4B80fDD2AdFF2412A7BebF9dF42cB40e';
  const TEE_REGISTRAR_ADDRESS = '0x7eE699B56972e90e7f7b3a0f18835848C1897eE6';
  const ZK_VERIFIER_ADDRESS = '0x999900000000000000000000000000000000Azul';

  // Simulator state
  const [simScenario, setSimScenario] = useState<'honest_tee' | 'malicious_disputed' | 'zk_fallback'>('honest_tee');
  const [simBlockStart, setSimBlockStart] = useState<number>(18240000);
  const [simBlockCount, setSimBlockCount] = useState<number>(1800);
  const [proposerBondEth, setProposerBondEth] = useState<number>(3.5);
  const [challengerBondEth, setChallengerBondEth] = useState<number>(3.5);
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    if (id.startsWith('0x')) {
      setCopiedAddress(id);
      setTimeout(() => setCopiedAddress(null), 2000);
    } else {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    }
    triggerConfetti();
  };

  // Run simulation step by step
  const startSimulation = (scenario: 'honest_tee' | 'malicious_disputed' | 'zk_fallback') => {
    setSimScenario(scenario);
    setSimStep(1);
    setIsSimulating(true);

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
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="rounded-2xl border border-[#222838] bg-gradient-to-br from-[#0e111a] via-[#101420] to-[#0c0e15] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0052ff]/20 text-[#3c8aff] border border-[#0052ff]/40 uppercase tracking-wider">
                Consensus &amp; Verification
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#66c800]/20 text-[#66c800] border border-[#66c800]/40">
                Azul Proof System
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ffd12f]/20 text-[#ffd12f] border border-[#ffd12f]/40">
                TEE + ZK Hybrid Multi-Prover
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-[#0052ff]" />
              <span>Azul Proof System &amp; Checkpoint Verification</span>
            </h1>
            <p className="text-xs text-[#8a91a0] max-w-3xl leading-relaxed">
              Complete specification of the offchain services and onchain contracts that make L2 checkpoint proposals verifiable from Ethereum in the <strong>Azul proof system</strong>. Proposals claim an output root for a fixed L2 block range, backed by AWS Nitro Enclave TEE proofs and permissionless ZK provers with onchain challenge resolution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => handleCopy(DISPUTE_GAME_FACTORY_ADDRESS, 'factory_addr')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-white border border-[#252d42] text-xs font-mono transition-colors"
            >
              {copiedAddress === 'factory_addr' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5 text-[#8a91a0]" />}
              <span>DisputeGameFactory: {shortenAddress(DISPUTE_GAME_FACTORY_ADDRESS)}</span>
            </button>

            <a
              href="https://docs.base.org/specifications/base-protocol/proofs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold transition-all shadow-md shadow-[#0052ff]/30"
            >
              <span>Base Docs Proofs</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-[#1e2538] overflow-x-auto pb-1">
          {[
            { id: 'architecture', label: 'Azul Architecture & Dual-Prover', icon: Layers },
            { id: 'components', label: 'Component Roles (6 Core Actors)', icon: Server },
            { id: 'simulator', label: 'Dispute Game & Proof Simulator', icon: Zap },
            { id: 'contracts', label: 'Contracts & Attestation Interfaces', icon: FileCode },
            { id: 'security', label: 'TEE vs ZK Multi-Prover Security', icon: Lock },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-[#0052ff] text-white shadow-lg shadow-[#0052ff]/25' 
                    : 'text-[#8a91a0] hover:text-white hover:bg-[#151926]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#0052ff]" />
                <span>Azul Hybrid Proof Architecture (TEE Fast-Path + ZK Dispute Defense)</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                How offchain actors compute L2 output roots, sign attestation certificates in hardware enclaves, and fall back to zero-knowledge mathematical proofs when disputed.
              </p>
            </div>

            {/* Architecture Pipeline Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3c8aff]/20 text-[#3c8aff] font-bold">PROPOSAL PATH</span>
                  <KeyRound className="h-4 w-4 text-[#3c8aff]" />
                </div>
                <h4 className="font-bold text-white text-sm">Common TEE Fast Path</h4>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Proposer requests proof from a registered <strong>AWS Nitro Enclave TEE Prover</strong>. The enclave verifies canonical L2 block state transition and signs the output root. Fast, low-latency, and minimal L1 verification gas.
                </p>
                <div className="pt-2 border-t border-[#1e2538] text-[10px] text-[#3c8aff] font-mono">
                  Gas: ~250k on L1 | Latency: Seconds
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ffd12f]/20 text-[#ffd12f] font-bold">MONITORING</span>
                  <AlertTriangle className="h-4 w-4 text-[#ffd12f]" />
                </div>
                <h4 className="font-bold text-white text-sm">Challenger Watchdogs</h4>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Offchain <strong>Challengers</strong> continuously re-derive L2 blocks from L1 data availability batches. If a proposed output root does not match canonical local state, the Challenger disputes the game onchain.
                </p>
                <div className="pt-2 border-t border-[#1e2538] text-[10px] text-[#ffd12f] font-mono">
                  Autonomous Re-execution &amp; Bond Slashing
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#66c800]/20 text-[#66c800] font-bold">DISPUTE RESOLUTION</span>
                  <Binary className="h-4 w-4 text-[#66c800]" />
                </div>
                <h4 className="font-bold text-white text-sm">Permissionless ZK Prover</h4>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  When a game is disputed, resolution requires a <strong>ZK Proof (Zero-Knowledge STF proof)</strong>. Anyone can permissionlessly submit a cryptographic proof confirming or overturning the claim, without trusting hardware manufacturers.
                </p>
                <div className="pt-2 border-t border-[#1e2538] text-[10px] text-[#66c800] font-mono">
                  100% Cryptographic Math | Trustless Fallback
                </div>
              </div>
            </div>

            {/* Output Root Structure */}
            <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#0052ff]" />
                <span>Output Root Formulation (What is Being Proven)</span>
              </h4>
              <p className="text-[11px] text-[#8a91a0]">
                Every checkpoint proposal commits to an output root representing the canonical state of Base at a specific L2 block number:
              </p>
              <div className="p-3 rounded-lg bg-[#101420] border border-[#1e2538] font-mono text-xs text-[#dee1e7]">
                outputRoot = keccak256(version_byte || state_root || withdrawal_storage_root || latest_block_hash)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px] font-mono text-[#8a91a0]">
                <div><span className="text-[#3c8aff]">version_byte:</span> 0x00 (Bedrock standard)</div>
                <div><span className="text-[#66c800]">state_root:</span> EVM world state trie root</div>
                <div><span className="text-[#ffd12f]">withdrawal_root:</span> L2ToL1MessagePasser storage</div>
                <div><span className="text-white">latest_block_hash:</span> Block hash at proposal height</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPONENTS (6 CORE ROLES) */}
      {activeTab === 'components' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-[#ffd12f]" />
                <span>The 6 Component Roles in the Azul Proof System</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                As specified in the official Base protocol documentation, each actor plays an exact role in maintaining L2 verification integrity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* 1. Proposer */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#0052ff]/20 text-[#3c8aff]">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">1. Proposer</h4>
                    <span className="text-[10px] font-mono text-[#8a91a0]">Creates Checkpoints</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Creates new checkpoint proposals on Ethereum. Computes the output root for a fixed block range (e.g. every 1,800 L2 blocks = 1 hour), deposits the required ETH bond, and attaches the prover certificate.
                </p>
              </div>

              {/* 2. Challenger */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#fc401f]/20 text-[#fc401f]">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">2. Challenger</h4>
                    <span className="text-[10px] font-mono text-[#8a91a0]">Disputes Bad Claims</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Watches in-progress games onchain and compares them against locally recomputed canonical L2 state. If a proposal diverges, the challenger automatically disputes the game and stakes a counter-bond.
                </p>
              </div>

              {/* 3. Registrar */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#ffd12f]/20 text-[#ffd12f]">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">3. Registrar</h4>
                    <span className="text-[10px] font-mono text-[#8a91a0]">TEE Signer Registry</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Maintains the onchain registry of accepted TEE signer identities. Validates AWS Nitro Enclave cryptographic attestation documents, checking PCR measurements (PCR0, PCR1, PCR2) against authorized binary hashes.
                </p>
              </div>

              {/* 4. TEE Prover */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#66c800]/20 text-[#66c800]">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">4. TEE Prover</h4>
                    <span className="text-[10px] font-mono text-[#8a91a0]">Nitro Enclave Path</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Produces hardware-backed proofs for the common proposal path. Executes inside an isolated AWS Nitro Enclave, verifying L1 DA and generating a cryptographic signature using an internal key bound to the attestation.
                </p>
              </div>

              {/* 5. ZK Prover */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#a855f7]/20 text-[#c084fc]">
                    <Binary className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">5. ZK Prover</h4>
                    <span className="text-[10px] font-mono text-[#8a91a0]">Zero-Knowledge Path</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Produces permissionless Zero-Knowledge proofs for proposal and dispute paths. Uses a zkVM (e.g. SP1, RISC Zero, OP Succinct) to mathematically prove the state transition without reliance on hardware security.
                </p>
              </div>

              {/* 6. Contracts */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#3c8aff]/20 text-[#3c8aff]">
                    <FileCode className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">6. Contracts</h4>
                    <span className="text-[10px] font-mono text-[#8a91a0]">Verification &amp; Bonds</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Verify proof material onchain, track game state, manage challenge clocks, and release withdrawals and bonds according to the game result. Feeds canonical roots to <code>OptimismPortal</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPUTE GAME SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#3c8aff]" />
                  <span>Azul Dispute Game &amp; Proof Lifecycle Simulator</span>
                </h3>
                <p className="text-xs text-[#8a91a0]">
                  Step through proposal submission, TEE signature validation, challenger dispute detection, and bond distribution.
                </p>
              </div>
            </div>

            {/* Scenario selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => startSimulation('honest_tee')}
                disabled={isSimulating}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  simScenario === 'honest_tee'
                    ? 'bg-[#0052ff]/15 border-[#0052ff] text-white shadow-lg shadow-[#0052ff]/15'
                    : 'bg-[#101420] border-[#1e2538] text-[#8a91a0] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Scenario A: Honest TEE Proposal</span>
                  <CheckCircle2 className="h-4 w-4 text-[#66c800]" />
                </div>
                <p className="text-[11px] text-[#8a91a0]">Standard path: TEE prover signs correct root. Challenge window passes without dispute. Bond released.</p>
              </button>

              <button
                onClick={() => startSimulation('malicious_disputed')}
                disabled={isSimulating}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  simScenario === 'malicious_disputed'
                    ? 'bg-[#fc401f]/15 border-[#fc401f] text-white shadow-lg shadow-[#fc401f]/15'
                    : 'bg-[#101420] border-[#1e2538] text-[#8a91a0] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Scenario B: Invalid Claim Disputed</span>
                  <AlertTriangle className="h-4 w-4 text-[#fc401f]" />
                </div>
                <p className="text-[11px] text-[#8a91a0]">Challenger detects state root divergence, opens dispute game with counter-bond, slashes malicious proposer.</p>
              </button>

              <button
                onClick={() => startSimulation('zk_fallback')}
                disabled={isSimulating}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  simScenario === 'zk_fallback'
                    ? 'bg-[#a855f7]/15 border-[#a855f7] text-white shadow-lg shadow-[#a855f7]/15'
                    : 'bg-[#101420] border-[#1e2538] text-[#8a91a0] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Scenario C: ZK Prover Fallback</span>
                  <Binary className="h-4 w-4 text-[#c084fc]" />
                </div>
                <p className="text-[11px] text-[#8a91a0]">Permissionless ZK proof submitted directly to Ethereum verifier, mathematically proving canonical state.</p>
              </button>
            </div>

            {/* Simulation Progress Timeline */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider">Game Execution Timeline</span>
                <span className="font-mono text-[#8a91a0]">
                  Block Range: #{simBlockStart.toLocaleString()} - #{(simBlockStart + simBlockCount).toLocaleString()} ({simBlockCount} blocks)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* Step 1 */}
                <div className={`p-3 rounded-lg border transition-all ${
                  simStep >= 1 ? 'bg-[#08090d] border-[#0052ff] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">1. Output Proposal</span>
                    {simStep >= 1 && <Check className="h-3.5 w-3.5 text-[#3c8aff]" />}
                  </div>
                  <p className="text-[10px] text-[#8a91a0]">
                    Proposer stakes {proposerBondEth} ETH bond and commits output root.
                  </p>
                </div>

                {/* Step 2 */}
                <div className={`p-3 rounded-lg border transition-all ${
                  simStep >= 2 ? 'bg-[#08090d] border-[#0052ff] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">2. Proof Verification</span>
                    {simStep >= 2 && <Check className="h-3.5 w-3.5 text-[#3c8aff]" />}
                  </div>
                  <p className="text-[10px] text-[#8a91a0]">
                    {simScenario === 'honest_tee' && 'TEE signature matched against Registrar key.'}
                    {simScenario === 'malicious_disputed' && 'Attestation flagged: Challenger detects mismatch!'}
                    {simScenario === 'zk_fallback' && 'zkVM STF proof verified by onchain ZkVerifier.'}
                  </p>
                </div>

                {/* Step 3 */}
                <div className={`p-3 rounded-lg border transition-all ${
                  simStep >= 3 ? 'bg-[#08090d] border-[#0052ff] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">3. Dispute Window</span>
                    {simStep >= 3 && <Check className="h-3.5 w-3.5 text-[#3c8aff]" />}
                  </div>
                  <p className="text-[10px] text-[#8a91a0]">
                    {simScenario === 'honest_tee' && '7-day challenge clock ticks down with 0 disputes.'}
                    {simScenario === 'malicious_disputed' && `Challenger posts ${challengerBondEth} ETH counter-bond.`}
                    {simScenario === 'zk_fallback' && 'Dispute game resolved instantly via cryptographic proof.'}
                  </p>
                </div>

                {/* Step 4 */}
                <div className={`p-3 rounded-lg border transition-all ${
                  simStep >= 4 ? 'bg-[#08090d] border-[#66c800] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">4. Finalization &amp; Bonds</span>
                    {simStep >= 4 && <Check className="h-3.5 w-3.5 text-[#66c800]" />}
                  </div>
                  <p className="text-[10px] text-[#8a91a0]">
                    {simScenario === 'honest_tee' && `Proposal finalized. ${proposerBondEth} ETH returned.`}
                    {simScenario === 'malicious_disputed' && `Proposer slashed! Challenger awarded ${proposerBondEth} ETH.`}
                    {simScenario === 'zk_fallback' && 'Truth state enforced. Withdrawals unlocked.'}
                  </p>
                </div>
              </div>

              {/* Status Outcome Banner */}
              {simStep === 4 && (
                <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
                  simScenario === 'honest_tee' 
                    ? 'bg-[#66c800]/10 border-[#66c800]/30 text-[#66c800]' 
                    : simScenario === 'malicious_disputed'
                    ? 'bg-[#fc401f]/10 border-[#fc401f]/30 text-[#fc401f]'
                    : 'bg-[#a855f7]/10 border-[#a855f7]/30 text-[#c084fc]'
                }`}>
                  <div className="flex items-center gap-2 text-xs">
                    <Award className="h-4 w-4 shrink-0" />
                    <span>
                      {simScenario === 'honest_tee' && 'Proposal APPROVED: Output root pushed to OptimismPortal for final withdrawal proofs.'}
                      {simScenario === 'malicious_disputed' && 'Proposal REJECTED: Invalid state purged. Canonical L2 chain preserved.'}
                      {simScenario === 'zk_fallback' && 'ZK Proof RESOLVED: Canonical state proven mathematically.'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSimStep(0)}
                    className="text-[11px] font-mono underline hover:opacity-80"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTRACTS & ATTESTATION */}
      {activeTab === 'contracts' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="h-5 w-5 text-[#3c8aff]" />
                <span>Onchain Contract Interfaces &amp; Nitro Attestation Layout</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Core Solidity interfaces deployed on Ethereum L1 that govern the Azul proof system.
              </p>
            </div>

            {/* Solidity Interface */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white font-mono">ITeeRegistrar.sol &amp; IDisputeGame.sol</span>
                <button
                  onClick={() => handleCopy(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface ITeeRegistrar {
    struct EnclaveIdentity {
        bytes32 pcr0;          // Enclave image measurement
        bytes32 pcr1;          // Linux kernel measurement
        bytes32 pcr2;          // Application binary measurement
        address signerAddress; // EOA key created inside the enclave
        uint64 registeredAt;   // Timestamp of registration
        bool isActive;         // Attestation status
    }

    function verifyAttestation(bytes calldata attestationDoc) external returns (address signer);
    function isSignerValid(address signer) external view returns (bool);
}

interface IDisputeGame {
    event Disputed(address indexed challenger, uint256 bond);
    event Resolved(uint8 status); // 0 = InProgress, 1 = ChallengerWins, 2 = DefenderWins

    function rootClaim() external view returns (bytes32);
    function l2BlockNumber() external view returns (uint256);
    function attack(uint256 parentIndex, bytes32 claim) external payable;
    function defend(uint256 parentIndex, bytes32 claim) external payable;
    function resolve() external returns (uint8);
}`, 'solidity_interfaces')}
                  className="flex items-center gap-1 text-[11px] text-[#3c8aff] hover:text-white"
                >
                  {copiedCode === 'solidity_interfaces' ? <Check className="h-3 w-3 text-[#66c800]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy Solidity</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] font-mono text-[11px] text-[#dee1e7] overflow-x-auto leading-relaxed">
                <pre>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface ITeeRegistrar {
    struct EnclaveIdentity {
        bytes32 pcr0;          // Enclave image measurement
        bytes32 pcr1;          // Linux kernel measurement
        bytes32 pcr2;          // Application binary measurement
        address signerAddress; // EOA key created inside the enclave
        uint64 registeredAt;   // Timestamp of registration
        bool isActive;         // Attestation status
    }

    function verifyAttestation(bytes calldata attestationDoc) external returns (address signer);
    function isSignerValid(address signer) external view returns (bool);
}

interface IDisputeGame {
    event Disputed(address indexed challenger, uint256 bond);
    event Resolved(uint8 status); // 0 = InProgress, 1 = ChallengerWins, 2 = DefenderWins

    function rootClaim() external view returns (bytes32);
    function l2BlockNumber() external view returns (uint256);
    function attack(uint256 parentIndex, bytes32 claim) external payable;
    function defend(uint256 parentIndex, bytes32 claim) external payable;
    function resolve() external returns (uint8);
}`}</pre>
              </div>
            </div>

            {/* AWS Nitro Attestation PCR breakdown */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#ffd12f]" />
                <span>AWS Nitro Platform Configuration Registers (PCRs)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#3c8aff] font-bold block mb-1">PCR0 (Image Hash)</span>
                  <p className="text-[10px] text-[#8a91a0]">Cryptographic hash of the compiled enclave EIF file containing the consensus client binary.</p>
                </div>
                <div className="p-3 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#66c800] font-bold block mb-1">PCR1 (Kernel / Boot)</span>
                  <p className="text-[10px] text-[#8a91a0]">Measurement of the Linux kernel, boot command line, and initial RAM filesystem.</p>
                </div>
                <div className="p-3 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#ffd12f] font-bold block mb-1">PCR2 (Application)</span>
                  <p className="text-[10px] text-[#8a91a0]">Measurement of the prover application code, configuration parameters, and execution environment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TEE VS ZK MULTI-PROVER SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#66c800]" />
                <span>Why Hybrid Multi-Prover? (Defense-in-Depth Comparison)</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Comparing single-prover architectures against the Azul dual-prover model combining hardware TEE isolation with pure zero-knowledge cryptographic math.
              </p>
            </div>

            {/* Comparison Matrix Table */}
            <div className="rounded-xl border border-[#1e2538] bg-[#0a0c12] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e2538] text-[11px] text-[#8a91a0] bg-[#101420]">
                    <th className="p-3">Dimension</th>
                    <th className="p-3">TEE Prover (Nitro)</th>
                    <th className="p-3">ZK Prover (zkVM)</th>
                    <th className="p-3">Azul Hybrid Model</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181e2e] text-[#dee1e7]">
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">Trust Assumption</td>
                    <td className="p-3 text-[#ffd12f]">Hardware manufacturer (AWS/AMD)</td>
                    <td className="p-3 text-[#66c800]">Pure cryptography &amp; math</td>
                    <td className="p-3 text-[#3c8aff] font-bold">1-of-N Cryptographic Guarantee</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">L1 Onchain Gas</td>
                    <td className="p-3 text-[#66c800]">~250k gas (signature verify)</td>
                    <td className="p-3 text-[#ffd12f]">~300k - 500k gas (Groth16/Plonk)</td>
                    <td className="p-3 text-[#3c8aff] font-bold">Lowest cost in happy path</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">Proving Latency</td>
                    <td className="p-3 text-[#66c800]">&lt; 10 seconds</td>
                    <td className="p-3 text-[#ffd12f]">5 - 15 minutes (GPU/FPGA)</td>
                    <td className="p-3 text-[#3c8aff] font-bold">Sub-minute checkpoints</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">Vulnerability Impact</td>
                    <td className="p-3 text-[#fc401f]">Hardware side-channel exploit</td>
                    <td className="p-3 text-[#fc401f]">Prover circuit / soundess bug</td>
                    <td className="p-3 text-[#66c800] font-bold">Neither can single-handedly forge state</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">Permissionless Dispute</td>
                    <td className="p-3 text-[#8a91a0]">Restricted to registered signers</td>
                    <td className="p-3 text-[#66c800]">100% Permissionless by anyone</td>
                    <td className="p-3 text-[#66c800] font-bold">Fully open to any challenger</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2 text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#ffd12f]" />
                <span>The Azul Security Principle</span>
              </span>
              <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                By pairing hardware-accelerated TEE enclaves with trustless Zero-Knowledge verification, Base gains the latency and cost advantages of trusted hardware while retaining the ultimate, non-negotiable security of mathematical proofs for every dispute. If an attacker compromises an enclave private key, they cannot forge a valid ZK state transition proof—rendering fraudulent proposals economically suicidal through bond slashing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
