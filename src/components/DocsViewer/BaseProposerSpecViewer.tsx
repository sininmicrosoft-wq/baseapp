import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  ExternalLink, 
  Copy, 
  Check, 
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
  Sliders,
  DollarSign,
  ChevronRight,
  Sparkles,
  Server,
  Play,
  Square,
  Terminal,
  Compass,
  FileCheck
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface BaseProposerSpecViewerProps {
  currentNetwork?: BaseNetwork;
  onNavigateToProofs?: () => void;
  onNavigateToChallenger?: () => void;
}

export const BaseProposerSpecViewer: React.FC<BaseProposerSpecViewerProps> = ({ 
  currentNetwork,
  onNavigateToProofs,
  onNavigateToChallenger
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'recovery' | 'packer' | 'creation' | 'retries' | 'admin'>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Canonical Addresses
  const DISPUTE_GAME_FACTORY_ADDRESS = '0x43edB88C4B80fDD2AdFF2412A7BebF9dF42cB40e';
  const ANCHOR_STATE_REGISTRY_ADDRESS = '0x12d6a7B20235C1F033504838612140b2A676E46a';
  const TEE_PROVER_REGISTRY_ADDRESS = '0x7eE699B56972e90e7f7b3a0f18835848C1897eE6';

  // Interactive Checkpoint Configuration
  const [blockInterval, setBlockInterval] = useState<number>(1800); // 1800 blocks (1 hour on 2s blocks)
  const [intermediateInterval, setIntermediateInterval] = useState<number>(300); // 300 blocks per root
  const [parentL2Block, setParentL2Block] = useState<number>(18240000);
  const [safeHeadBlock, setSafeHeadBlock] = useState<number>(18243600);
  const [safeHeadMode, setSafeHeadMode] = useState<'finalized' | 'safe'>('finalized');
  const [initBondEth, setInitBondEth] = useState<number>(3.5);

  // Parent Recovery Simulator State
  const [recoveryStep, setRecoveryStep] = useState<number>(0);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  // Dry Run / Admin state
  const [isProposerRunning, setIsProposerRunning] = useState<boolean>(true);
  const [isDryRunMode, setIsDryRunMode] = useState<boolean>(false);

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

  // Math Calculations
  const targetBlock = parentL2Block + blockInterval;
  const isTargetSafe = targetBlock <= safeHeadBlock;
  const intermediateCount = intermediateInterval > 0 ? Math.floor(blockInterval / intermediateInterval) : 0;
  const isValidIntervalModulo = intermediateInterval > 0 && blockInterval % intermediateInterval === 0;

  // Simulate parent recovery walk
  const runRecoverySimulation = () => {
    setIsRecovering(true);
    setRecoveryStep(1);
    setTimeout(() => {
      setRecoveryStep(2);
      setTimeout(() => {
        setRecoveryStep(3);
        setTimeout(() => {
          setRecoveryStep(4);
          setIsRecovering(false);
          triggerConfetti();
        }, 800);
      }, 800);
    }, 800);
  };

  // Sample binary layout fields
  const journalOffsets = useMemo(() => {
    let offset = 0;
    const fields = [
      { name: 'proposer', bytes: 20, desc: 'L1 transaction sender address (20 bytes)' },
      { name: 'l1OriginHash', bytes: 32, desc: 'L1 block hash where proof is anchored (32 bytes)' },
      { name: 'prevOutputRoot', bytes: 32, desc: 'Output root of previous checkpoint parent (32 bytes)' },
      { name: 'startingL2Block', bytes: 8, desc: 'Parent L2 block number (uint64 big-endian, 8 bytes)' },
      { name: 'outputRoot', bytes: 32, desc: 'Claimed output root at target block (32 bytes)' },
      { name: 'endingL2Block', bytes: 8, desc: 'Target L2 block number (uint64 big-endian, 8 bytes)' },
      { name: `intermediateRoots (${intermediateCount}x)`, bytes: 32 * intermediateCount, desc: `Sampled every ${intermediateInterval} blocks (32 * ${intermediateCount} = ${32 * intermediateCount} bytes)` },
      { name: 'configHash', bytes: 32, desc: 'Rollup chain configuration commitment (32 bytes)' },
      { name: 'teeImageHash', bytes: 32, desc: 'Expected AWS Nitro Enclave image measurement (32 bytes)' },
    ];

    return fields.map(f => {
      const start = offset;
      offset += f.bytes;
      return { ...f, start, end: offset - 1 };
    });
  }, [intermediateCount, intermediateInterval]);

  const totalJournalBytes = journalOffsets.length > 0 ? journalOffsets[journalOffsets.length - 1].end + 1 : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="rounded-2xl border border-[#222838] bg-gradient-to-br from-[#0e111a] via-[#101420] to-[#0c0e15] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0052ff]/20 text-[#3c8aff] border border-[#0052ff]/40 uppercase tracking-wider">
                Azul Proof System
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#66c800]/20 text-[#66c800] border border-[#66c800]/40">
                Offchain Proposer Service
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ffd12f]/20 text-[#ffd12f] border border-[#ffd12f]/40">
                AWS Nitro TEE Fast-Path
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Zap className="h-6 w-6 text-[#0052ff]" />
              <span>Proposer Specification &amp; Checkpoint Pipeline</span>
            </h1>
            <p className="text-xs text-[#8a91a0] max-w-3xl leading-relaxed">
              Specification of the <strong>proposer</strong>, the offchain service that turns canonical L2 checkpoint ranges into <code>AggregateVerifier</code> games on Ethereum L1. It performs deterministic parent recovery from the anchor root, sources AWS Nitro Enclave TEE proofs, revalidates intermediate roots against canonical state, and calls <code>DisputeGameFactory.createWithInitData()</code> with the required bond.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => handleCopy(DISPUTE_GAME_FACTORY_ADDRESS, 'factory_addr')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-white border border-[#252d42] text-xs font-mono transition-colors"
            >
              {copiedAddress === 'factory_addr' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5 text-[#8a91a0]" />}
              <span>Factory: {shortenAddress(DISPUTE_GAME_FACTORY_ADDRESS)}</span>
            </button>

            <a
              href="https://docs.base.org/specifications/base-protocol/proofs/proposer"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold transition-all shadow-md shadow-[#0052ff]/30"
            >
              <span>Base Docs Proposer</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-[#1e2538] overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Responsibilities & Pipeline Flow', icon: Layers },
            { id: 'recovery', label: 'Deterministic Parent Recovery', icon: Compass },
            { id: 'packer', label: 'TEE Journal & Binary Preimage', icon: Binary },
            { id: 'creation', label: 'Game Creation & extraData', icon: FileCheck },
            { id: 'retries', label: 'Retry Matrix & Reorg Handling', icon: RefreshCw },
            { id: 'admin', label: 'Admin JSON-RPC & Dry Run Mode', icon: Terminal },
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

      {/* TAB 1: OVERVIEW & PIPELINE FLOW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#0052ff]" />
                <span>9 Core Responsibilities of the Conforming Proposer</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Every checkpoint proposal follows a strict, sequential pipeline to ensure that onchain checkpoint games form an unbroken, canonical chain of state commitments.
              </p>
            </div>

            {/* 9 Step Visual Pipeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                { step: '1', title: 'Read Parameters', desc: 'Query AggregateVerifier.BLOCK_INTERVAL, INTERMEDIATE_BLOCK_INTERVAL, initBonds.' },
                { step: '2', title: 'Recover Parent State', desc: 'Forward walk from AnchorStateRegistry to latest canonical onchain tip.' },
                { step: '3', title: 'Select Target Block', desc: 'Ensure target = parent + BLOCK_INTERVAL <= safeHead.' },
                { step: '4', title: 'Build prover_prove Request', desc: 'Assemble agreed parent roots, claimed target root, and L1 head anchor.' },
                { step: '5', title: 'Require TEE Proof Result', desc: 'Accept only ProofResult::Tee for game creation; reject ZK on proposer path.' },
                { step: '6', title: 'Pre-Submission Validation', desc: 'Re-verify aggregate root and ALL intermediate roots against live canonical L2.' },
                { step: '7', title: 'Pre-check TEE Signer', desc: 'Optionally query TEEProverRegistry.isValidSigner(signer) to avoid reverts.' },
                { step: '8', title: 'Submit createWithInitData', desc: 'Broadcast transaction with packed extraData, initData, and required ETH bond.' },
                { step: '9', title: 'Handle Duplicate Reverts', desc: 'Treat GameAlreadyExists as success, refresh recovery tip, and advance.' },
              ].map(item => (
                <div key={item.step} className="p-3.5 rounded-xl bg-[#101420] border border-[#1e2538] flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-lg bg-[#0052ff]/20 text-[#3c8aff] font-mono font-bold flex items-center justify-center text-xs">
                      {item.step}
                    </span>
                    <Sparkles className="h-3.5 w-3.5 text-[#717886]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{item.title}</h4>
                    <p className="text-[#8a91a0] text-[11px] leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Separation of Concerns Callout */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2 text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#66c800]" />
                <span>Strict Boundary of Responsibility</span>
              </span>
              <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                The proposer's role is strictly limited to <em>generating and proposing</em> checkpoint claims. The proposer <strong>does not</strong> challenge games, resolve games, claim bonds, or decide withdrawal finality. Those dispute and settlement responsibilities are managed exclusively by the <strong>Challenger</strong> and onchain <strong>Proof Contracts</strong> (such as <code>OptimismPortal</code> and <code>DelayedWETH</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETERMINISTIC PARENT RECOVERY */}
      {activeTab === 'recovery' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#ffd12f]" />
                <span>Deterministic Parent Recovery &amp; Forward Walk</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Unlike naive index scanning, conforming proposers never search for a subjective "best" game. They execute a deterministic forward walk keyed by each game's exact cryptographic identity.
              </p>
            </div>

            {/* Recovery State Tuple */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#101420] border border-[#1e2538]">
                <span className="text-[#8a91a0] block text-[10px]">parentAddress</span>
                <span className="text-[#3c8aff] font-bold">Game Proxy or Anchor Registry</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#101420] border border-[#1e2538]">
                <span className="text-[#8a91a0] block text-[10px]">parentOutputRoot</span>
                <span className="text-[#66c800] font-bold">Claimed Root at Parent Block</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#101420] border border-[#1e2538]">
                <span className="text-[#8a91a0] block text-[10px]">parentL2BlockNumber</span>
                <span className="text-[#ffd12f] font-bold">Block Height of Parent</span>
              </div>
            </div>

            {/* Unique Key Lookup Code */}
            <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#3c8aff] font-bold">Deterministic Factory Key Lookup</span>
                <span className="text-[#8a91a0]">DisputeGameFactory.sol</span>
              </div>
              <div className="p-3 rounded-lg bg-[#101420] font-mono text-xs text-[#dee1e7]">
                DisputeGameFactory.games(gameType, rootClaim, extraData)
              </div>
              <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                If the factory lookup returns <code>address(0)</code>, forward walk stops immediately: the current parent is the canonical tip. If a game is returned, the parent advances to that game proxy, and the walk continues.
              </p>
            </div>

            {/* Interactive Recovery Walk Simulator */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Interactive Forward Walk Simulator</h4>
                  <p className="text-[11px] text-[#8a91a0]">Trace how the proposer verifies the parent chain from the Anchor Registry</p>
                </div>
                <button
                  onClick={runRecoverySimulation}
                  disabled={isRecovering}
                  className="px-3 py-1.5 rounded-lg bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold transition-all shadow-md shadow-[#0052ff]/20 flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRecovering ? 'animate-spin' : ''}`} />
                  <span>Execute Walk</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* Step 1 */}
                <div className={`p-3 rounded-lg border transition-all ${
                  recoveryStep >= 1 ? 'bg-[#08090d] border-[#0052ff] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <span className="font-bold text-[11px] block mb-1">1. Read Anchor Root</span>
                  <p className="text-[10px] text-[#8a91a0]">
                    Fetch AnchorStateRegistry.getAnchorRoot() at Block #{parentL2Block.toLocaleString()}.
                  </p>
                </div>

                {/* Step 2 */}
                <div className={`p-3 rounded-lg border transition-all ${
                  recoveryStep >= 2 ? 'bg-[#08090d] border-[#0052ff] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <span className="font-bold text-[11px] block mb-1">2. Query Step #1</span>
                  <p className="text-[10px] text-[#8a91a0]">
                    Compute expected block #{parentL2Block + blockInterval} &amp; fetch factory game. <strong>Found!</strong>
                  </p>
                </div>

                {/* Step 3 */}
                <div className={`p-3 rounded-lg border transition-all ${
                  recoveryStep >= 3 ? 'bg-[#08090d] border-[#0052ff] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <span className="font-bold text-[11px] block mb-1">3. Query Step #2</span>
                  <p className="text-[10px] text-[#8a91a0]">
                    Compute expected block #{parentL2Block + blockInterval * 2} &amp; fetch factory game. <strong>Returns 0x0!</strong>
                  </p>
                </div>

                {/* Step 4 */}
                <div className={`p-3 rounded-lg border transition-all ${
                  recoveryStep >= 4 ? 'bg-[#08090d] border-[#66c800] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <span className="font-bold text-[11px] block mb-1">4. Tip Established</span>
                  <p className="text-[10px] text-[#8a91a0]">
                    Recovery stops. Next target is Block #{(parentL2Block + blockInterval * 2).toLocaleString()}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEE PROPOSAL JOURNAL & BINARY PREIMAGE */}
      {activeTab === 'packer' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Binary className="h-5 w-5 text-[#3c8aff]" />
                <span>TEE Proposal Journal &amp; Binary Wire Layout</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                The AWS Nitro Enclave signs <code>keccak256(journal)</code>. Conforming proposers reconstruct and verify this exact packed byte sequence before broadcasting to L1.
              </p>
            </div>

            {/* Binary Layout Table */}
            <div className="rounded-xl border border-[#1e2538] bg-[#0a0c12] overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1e2538] text-[11px] text-[#8a91a0] bg-[#101420]">
                    <th className="p-3">Byte Range</th>
                    <th className="p-3">Field Name</th>
                    <th className="p-3">Bytes</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181e2e] text-[#dee1e7]">
                  {journalOffsets.map((f, idx) => (
                    <tr key={idx} className="hover:bg-[#121624]/60">
                      <td className="p-3 text-[#3c8aff]">
                        [{f.start.toString().padStart(4, '0')} .. {f.end.toString().padStart(4, '0')}]
                      </td>
                      <td className="p-3 font-bold text-white">{f.name}</td>
                      <td className="p-3 text-[#ffd12f]">{f.bytes} B</td>
                      <td className="p-3 text-[#8a91a0] font-sans">{f.desc}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#101420] font-bold">
                    <td className="p-3 text-[#66c800]">[0000 .. {(totalJournalBytes - 1).toString().padStart(4, '0')}]</td>
                    <td className="p-3 text-white">Total Packed Journal Length</td>
                    <td className="p-3 text-[#66c800]">{totalJournalBytes} B</td>
                    <td className="p-3 text-[#8a91a0] font-sans">Preimage input to keccak256() for ECDSA enclave signature</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Interactive prover_prove Request Payload */}
            <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#66c800] font-bold">prover_prove(ProofRequest) RPC Payload</span>
                <button
                  onClick={() => handleCopy(`{
  "jsonrpc": "2.0",
  "method": "prover_prove",
  "params": [{
    "l1_head": "0x4a91c8502f5db2802f0ad4365b21008b8b9bfdae01ad28b6d3b3c375628b082a",
    "l1_head_number": 20894510,
    "agreed_l2_head_hash": "0x5391d4ff1049ad5f2129e924a0d843818e6c43fa92e591705e4b2d3550e201b1",
    "agreed_l2_output_root": "0x2289ac12048956e1892095810295812049581204958120495812049581204958",
    "claimed_l2_output_root": "0x9810495812049581204958120495812049581204958120495812049581204958",
    "claimed_l2_block_number": ${targetBlock},
    "proposer": "0x1404104958120495812049581204958120495812",
    "intermediate_block_interval": ${intermediateInterval},
    "image_hash": "0x3f58a914048956e1892095810295812049581204958120495812049581204958"
  }],
  "id": 1
}`, 'prover_req')}
                  className="flex items-center gap-1 text-[11px] text-[#3c8aff] hover:text-white"
                >
                  {copiedCode === 'prover_req' ? <Check className="h-3 w-3 text-[#66c800]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy JSON-RPC</span>
                </button>
              </div>

              <pre className="p-3 rounded-lg bg-[#101420] text-[#dee1e7] font-mono text-[11px] overflow-x-auto leading-relaxed">
{`{
  "method": "prover_prove",
  "params": [{
    "claimed_l2_block_number": ${targetBlock},
    "intermediate_block_interval": ${intermediateInterval},
    "intermediate_count": ${intermediateCount},
    "expected_journal_bytes": ${totalJournalBytes}
  }]
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GAME CREATION & EXTRADATA */}
      {activeTab === 'creation' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-[#66c800]" />
                <span>Onchain Game Creation Call &amp; Calldata Encoding</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                How the proposer calls <code>DisputeGameFactory.createWithInitData()</code> on Ethereum L1, packing <code>extraData</code> and <code>initData</code>.
              </p>
            </div>

            {/* Solidity Function Call */}
            <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
              <span className="text-xs font-bold text-white font-mono">DisputeGameFactory.createWithInitData()</span>
              <pre className="p-3 rounded-lg bg-[#101420] text-[#dee1e7] font-mono text-xs leading-relaxed overflow-x-auto">
{`DisputeGameFactory.createWithInitData{value: initBond}(
    gameType,      // e.g. AGGREGATE_VERIFIER_GAME_TYPE (uint32)
    rootClaim,     // aggregateProposal.outputRoot (bytes32)
    extraData,     // packed l2BlockNumber || parentAddress || intermediateRoots
    initData       // packed proofType(1) || l1OriginHash(32) || l1OriginNumber(32) || signature(65)
)`}
              </pre>
            </div>

            {/* ExtraData and InitData Packing Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <span className="text-[#3c8aff] font-bold">extraData Binary Encoding (Packed)</span>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838] text-white">
                  l2BlockNumber(32) || parentAddress(20) || intermediateRoots(32 * N)
                </div>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  <strong>Not ABI encoded!</strong> Raw contiguous binary concatenation. N = {intermediateCount} intermediate roots.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <span className="text-[#66c800] font-bold">initData Binary Encoding (Packed)</span>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838] text-white">
                  proofType(1) || l1OriginHash(32) || l1OriginNumber(32) || signature(65)
                </div>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  <code>proofType = 0</code> for TEE. ECDSA <code>v</code> normalized to 27 or 28 before broadcast.
                </p>
              </div>
            </div>

            {/* Safe Head Constraint */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#ffd12f]" />
                  <span>Safe Head Invariant Check</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isTargetSafe ? 'bg-[#66c800]/20 text-[#66c800]' : 'bg-[#fc401f]/20 text-[#fc401f]'
                }`}>
                  {isTargetSafe ? 'TARGET IS SAFE' : 'UNSAFE (CANNOT PROPOSE)'}
                </span>
              </div>
              <p className="text-xs text-[#8a91a0]">
                Proposers must <strong>never</strong> submit proposals past the safe head (<code>targetBlock &lt;= safeHead</code>). Target block #{targetBlock.toLocaleString()} is {isTargetSafe ? 'within' : 'exceeding'} safe head #{safeHeadBlock.toLocaleString()}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RETRY MATRIX & REORG HANDLING */}
      {activeTab === 'retries' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-[#ffd12f]" />
                <span>Deterministic Retry Matrix &amp; Reorg Recovery</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Required behavior for handling transient network failures, prover timeouts, and Ethereum/Base chain reorganizations.
              </p>
            </div>

            {/* Matrix Table */}
            <div className="rounded-xl border border-[#1e2538] bg-[#0a0c12] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e2538] text-[11px] text-[#8a91a0] bg-[#101420]">
                    <th className="p-3">Failure Mode</th>
                    <th className="p-3">Required Protocol Behavior</th>
                    <th className="p-3">Max Retries / Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181e2e] text-[#dee1e7]">
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">Recovery RPC / Read Error</td>
                    <td className="p-3 text-[#8a91a0]">Skip current tick and retry parent recovery on next tick.</td>
                    <td className="p-3 text-[#3c8aff] font-mono">Indefinite (Wait for RPC)</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">Proof Request Failure</td>
                    <td className="p-3 text-[#8a91a0]">Retry proof target on later ticks.</td>
                    <td className="p-3 text-[#ffd12f] font-mono">Up to 3 attempts</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">Repeated Proof Failure</td>
                    <td className="p-3 text-[#8a91a0]">Reset pipeline state and re-recover canonical parent from L1.</td>
                    <td className="p-3 text-[#fc401f] font-mono">Pipeline Reset</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">L1 Submission Failure</td>
                    <td className="p-3 text-[#8a91a0]">Preserve proved result; bump fee / resubmit on later tick.</td>
                    <td className="p-3 text-[#3c8aff] font-mono">Fee Bumping</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">L1 Submission Timeout</td>
                    <td className="p-3 text-[#8a91a0]">Treat as submission failure and retry after recovery refresh.</td>
                    <td className="p-3 text-[#ffd12f] font-mono">10 Minute Timeout</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-[#66c800]">GameAlreadyExists Revert</td>
                    <td className="p-3 text-[#8a91a0]">Treat as success! Refresh recovery from L1 tip and advance.</td>
                    <td className="p-3 text-[#66c800] font-mono">Zero Error (Advance)</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">Canonical Root Mismatch (Reorg)</td>
                    <td className="p-3 text-[#8a91a0]">Discard pending proof and re-prove from recovered L1 state.</td>
                    <td className="p-3 text-[#fc401f] font-mono">Instant Invalidation</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-bold text-white">Invalid TEE Signer</td>
                    <td className="p-3 text-[#8a91a0]">Discard invalid proof and request fresh enclave attestation.</td>
                    <td className="p-3 text-[#fc401f] font-mono">Discard Proof</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ADMIN JSON-RPC & DRY RUN MODE */}
      {activeTab === 'admin' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-[#3c8aff]" />
                <span>Admin JSON-RPC Management &amp; Dry Run Mode</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Proposer daemons provide optional operational admin RPC endpoints and dry-run execution modes for infrastructure testing.
              </p>
            </div>

            {/* Admin Endpoints */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1">
                <span className="text-[#66c800] font-bold">admin_startProposer</span>
                <p className="text-[11px] text-[#8a91a0] font-sans">Starts the proving pipeline. Returns error if already running.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1">
                <span className="text-[#fc401f] font-bold">admin_stopProposer</span>
                <p className="text-[11px] text-[#8a91a0] font-sans">Stops the proving pipeline. Returns error if already stopped.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1">
                <span className="text-[#3c8aff] font-bold">admin_proposerRunning</span>
                <p className="text-[11px] text-[#8a91a0] font-sans">Returns boolean status: true if pipeline is actively running.</p>
              </div>
            </div>

            {/* Interactive Admin Controls */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Simulate Proposer Process State</span>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isProposerRunning ? 'bg-[#66c800] animate-pulse' : 'bg-[#fc401f]'}`} />
                  <span className="text-xs font-mono text-white">
                    {isProposerRunning ? 'RUNNING' : 'STOPPED'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setIsProposerRunning(true)}
                  disabled={isProposerRunning}
                  className="px-3 py-1.5 rounded-lg bg-[#66c800]/20 hover:bg-[#66c800]/30 text-[#66c800] border border-[#66c800]/40 font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>admin_startProposer</span>
                </button>

                <button
                  onClick={() => setIsProposerRunning(false)}
                  disabled={!isProposerRunning}
                  className="px-3 py-1.5 rounded-lg bg-[#fc401f]/20 hover:bg-[#fc401f]/30 text-[#fc401f] border border-[#fc401f]/40 font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>admin_stopProposer</span>
                </button>

                <button
                  onClick={() => setIsDryRunMode(!isDryRunMode)}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                    isDryRunMode 
                      ? 'bg-[#ffd12f]/20 text-[#ffd12f] border-[#ffd12f]/40' 
                      : 'bg-[#08090d] text-[#8a91a0] border-[#222838]'
                  }`}
                >
                  Dry Run Mode: {isDryRunMode ? 'ENABLED (NO L1 TX)' : 'DISABLED (REAL BROADCAST)'}
                </button>
              </div>

              {isDryRunMode && (
                <div className="p-3.5 rounded-lg bg-[#ffd12f]/10 border border-[#ffd12f]/30 text-xs text-[#ffd12f]">
                  <strong>Dry Run Mode Active:</strong> The proposer executes full parent recovery, checkpoint selection, proof sourcing, and pre-submission validation, but suppresses L1 transaction broadcasting. Ideal for staging tests.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
