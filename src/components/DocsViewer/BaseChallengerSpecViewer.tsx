import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
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
  AlertCircle,
  Lock,
  ArrowRight,
  Database,
  RefreshCw,
  Hash,
  Scale,
  Code2,
  Binary,
  Radio,
  Sliders,
  DollarSign,
  ChevronRight,
  Sparkles,
  Server,
  Eye,
  GitBranch
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface BaseChallengerSpecViewerProps {
  currentNetwork?: BaseNetwork;
  onNavigateToProofs?: () => void;
}

export const BaseChallengerSpecViewer: React.FC<BaseChallengerSpecViewerProps> = ({ 
  currentNetwork,
  onNavigateToProofs
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'validator' | 'proof_lifecycle' | 'bonds' | 'driver'>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Canonical onchain addresses
  const AGGREGATE_VERIFIER_ADDRESS = '0x000000000000000000000000000000000000Aggr';
  const ANCHOR_STATE_REGISTRY_ADDRESS = '0x12d6a7B20235C1F033504838612140b2A676E46a';
  const DISPUTE_GAME_FACTORY_ADDRESS = '0x43edB88C4B80fDD2AdFF2412A7BebF9dF42cB40e';
  const DELAYED_WETH_ADDRESS = '0x5C246d5E4929D37e8c3F17b20464f1696F158F89';

  // Candidate Category Evaluator State
  const [evalTeeProver, setEvalTeeProver] = useState<'non-zero' | 'zero'>('non-zero');
  const [evalZkProver, setEvalZkProver] = useState<'zero' | 'non-zero'>('zero');
  const [evalCounteredIndex, setEvalCounteredIndex] = useState<number>(0);

  // Root Validation Interactive Simulator State
  const [simStartBlock, setSimStartBlock] = useState<number>(18240000);
  const [simSequenceNumber, setSimSequenceNumber] = useState<number>(18241800);
  const [simInterval, setSimInterval] = useState<number>(300); // 300 blocks per intermediate root
  const [simSimulateMismatchAt, setSimSimulateMismatchAt] = useState<number>(2); // 0-based index of mismatch

  // Bond Claiming Simulator Step
  const [bondClaimStep, setBondClaimStep] = useState<number>(1);
  const [isAdvancingBond, setIsAdvancingBond] = useState<boolean>(false);

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

  // Evaluated Category and Challenger Action
  const evaluatedCategory = useMemo(() => {
    const isTee = evalTeeProver === 'non-zero';
    const isZk = evalZkProver === 'non-zero';
    const countered = evalCounteredIndex;

    if (!isTee && !isZk) {
      return {
        category: 'Fully Nullified Game',
        badgeColor: 'bg-[#8a91a0]/20 text-[#8a91a0] border-[#8a91a0]/30',
        action: 'Both prover addresses are zero. Game is already resolved or nullified. Skip game.',
        call: 'None',
        intent: 'Skip'
      };
    }

    if (isTee && !isZk && countered === 0) {
      return {
        category: 'Invalid TEE proposal',
        badgeColor: 'bg-[#3c8aff]/20 text-[#3c8aff] border-[#3c8aff]/30',
        action: 'Validate all checkpoint roots. If invalid, prefer TEE nullification and fall back to ZK challenge().',
        call: 'nullify() [TEE] or challenge() [ZK]',
        intent: 'Nullify / Challenge'
      };
    }

    if (isTee && isZk && countered > 0) {
      return {
        category: 'Fraudulent ZK challenge',
        badgeColor: 'bg-[#fc401f]/20 text-[#fc401f] border-[#fc401f]/30',
        action: 'Validate only the challenged checkpoint. If the challenged root is correct, submit ZK nullify().',
        call: 'nullify(proofBytes, index, expectedRoot)',
        intent: 'Nullify Fraudulent ZK'
      };
    }

    if (!isTee && isZk && countered === 0) {
      return {
        category: 'Invalid ZK proposal',
        badgeColor: 'bg-[#a855f7]/20 text-[#c084fc] border-[#a855f7]/30',
        action: 'Validate all checkpoint roots. If invalid, submit ZK nullify().',
        call: 'nullify(proofBytes, index, expectedRoot)',
        intent: 'Nullify Invalid ZK'
      };
    }

    if (isTee && isZk && countered === 0) {
      return {
        category: 'Invalid dual proposal',
        badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f] border-[#ffd12f]/30',
        action: 'Validate all checkpoint roots. If invalid, nullify the TEE proof first, then rescan to handle the remaining ZK proof.',
        call: 'nullify() [TEE] -> rescan -> nullify() [ZK]',
        intent: 'Sequential Dual Nullify'
      };
    }

    return {
      category: 'Unexpected Game State',
      badgeColor: 'bg-[#fc401f]/20 text-[#fc401f] border-[#fc401f]/30',
      action: 'Countered index > 0 without dual prover configuration is unexpected. Skipped by conforming challenger.',
      call: 'Skip',
      intent: 'Unexpected'
    };
  }, [evalTeeProver, evalZkProver, evalCounteredIndex]);

  // Root validation breakdown calculations
  const validationBreakdown = useMemo(() => {
    const totalBlocks = Math.max(0, simSequenceNumber - simStartBlock);
    const expectedRootCount = simInterval > 0 ? Math.floor(totalBlocks / simInterval) : 0;
    
    const checkpoints = [];
    let firstMismatchIndex: number | null = null;

    for (let i = 0; i < expectedRootCount; i++) {
      const blockNum = simStartBlock + simInterval * (i + 1);
      const isMismatch = simSimulateMismatchAt !== -1 && i === simSimulateMismatchAt;
      
      if (isMismatch && firstMismatchIndex === null) {
        firstMismatchIndex = i;
      }

      checkpoints.push({
        index: i,
        blockNum,
        onchainRoot: isMismatch ? '0xbad000000000000000000000000000000000000000000000000000000000bad0' : `0x${(i + 1).toString(16).padStart(4, '0')}...canonical_root`,
        recomputedRoot: `0x${(i + 1).toString(16).padStart(4, '0')}...canonical_root`,
        status: isMismatch ? 'MISMATCH' : 'MATCH',
        firstMismatch: isMismatch && firstMismatchIndex === i
      });
    }

    return {
      totalBlocks,
      expectedRootCount,
      checkpoints,
      firstMismatchIndex
    };
  }, [simStartBlock, simSequenceNumber, simInterval, simSimulateMismatchAt]);

  const advanceBondLifecycle = () => {
    setIsAdvancingBond(true);
    setTimeout(() => {
      setBondClaimStep((prev) => (prev < 4 ? prev + 1 : 1));
      setIsAdvancingBond(false);
      triggerConfetti();
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="rounded-2xl border border-[#222838] bg-gradient-to-br from-[#0e111a] via-[#101420] to-[#0c0e15] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#fc401f]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#fc401f]/20 text-[#fc401f] border border-[#fc401f]/40 uppercase tracking-wider">
                Azul Proof System
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#3c8aff]/20 text-[#3c8aff] border border-[#3c8aff]/40">
                Offchain Watchdog Service
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#66c800]/20 text-[#66c800] border border-[#66c800]/40">
                Permissionless ZK &amp; TEE Disputes
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <AlertTriangle className="h-6 w-6 text-[#fc401f]" />
              <span>Challenger Specification &amp; Dispute Pipeline</span>
            </h1>
            <p className="text-xs text-[#8a91a0] max-w-3xl leading-relaxed">
              Specification of the <strong>challenger</strong>, the offchain service that protects Base's proof system by independently checking in-progress <code>AggregateVerifier</code> games against canonical L2 state, deriving output roots from account proofs, and submitting <code>nullify()</code> or <code>challenge()</code> transactions to nullify invalid claims on Ethereum L1.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => handleCopy(ANCHOR_STATE_REGISTRY_ADDRESS, 'anchor_addr')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-white border border-[#252d42] text-xs font-mono transition-colors"
            >
              {copiedAddress === 'anchor_addr' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5 text-[#8a91a0]" />}
              <span>AnchorRegistry: {shortenAddress(ANCHOR_STATE_REGISTRY_ADDRESS)}</span>
            </button>

            <a
              href="https://docs.base.org/specifications/base-protocol/proofs/challenger"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold transition-all shadow-md shadow-[#0052ff]/30"
            >
              <span>Base Docs Challenger</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-[#1e2538] overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Responsibilities & Trustless Model', icon: Eye },
            { id: 'matrix', label: 'Candidate Category Matrix', icon: GitBranch },
            { id: 'validator', label: 'Output Root Validation Formulas', icon: Hash },
            { id: 'proof_lifecycle', label: 'Proof Sourcing & Lifecycle', icon: Zap },
            { id: 'bonds', label: 'Bond Claiming & DelayedWETH', icon: DollarSign },
            { id: 'driver', label: 'Driver Loop & Safety Invariants', icon: Server },
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

      {/* TAB 1: OVERVIEW & TRUSTLESS MODEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#fc401f]" />
                <span>Zero-Trust Verification: The Challenger's Mission</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                The challenger does not trust onchain games or sequencer claims. It reconstructs reality directly from L2 consensus headers and Ethereum L1 data availability.
              </p>
            </div>

            {/* 7 Core Responsibilities Workflow */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 text-xs">
              {[
                { step: '1', title: 'Scan Factory', desc: 'Read post-anchor DisputeGameFactory games.' },
                { step: '2', title: 'Filter Games', desc: 'Select IN_PROGRESS games needing verification.' },
                { step: '3', title: 'Recompute Roots', desc: 'Derive canonical output roots from L2 node.' },
                { step: '4', title: 'Find First Bad Root', desc: 'Pinpoint exact index of first divergence.' },
                { step: '5', title: 'Source Proof', desc: 'Request TEE or ZK proof for the bad interval.' },
                { step: '6', title: 'Submit L1 Dispute', desc: 'Call nullify() or challenge() on L1.' },
                { step: '7', title: 'Claim Bonds', desc: 'Track 4-stage DelayedWETH bond distribution.' },
              ].map(item => (
                <div key={item.step} className="p-3 rounded-xl bg-[#101420] border border-[#1e2538] flex flex-col justify-between space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="h-5 w-5 rounded-full bg-[#0052ff]/20 text-[#3c8aff] font-mono font-bold flex items-center justify-center text-[10px]">
                      {item.step}
                    </span>
                    <Sparkles className="h-3 w-3 text-[#717886]" />
                  </div>
                  <h4 className="font-bold text-white text-[11px]">{item.title}</h4>
                  <p className="text-[#8a91a0] text-[10px] leading-tight">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Permissionless ZK vs Fast TEE Paths */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Binary className="h-4 w-4 text-[#66c800]" />
                    <span>Permissionless ZK Path</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#66c800]/20 text-[#66c800] text-[10px] font-mono font-bold">
                    Open To Anyone
                  </span>
                </div>
                <p className="text-xs text-[#8a91a0] leading-relaxed">
                  Any community member with access to standard L1/L2 RPCs, a ZK proving service (zkVM), and an L1 wallet can run the challenger. No special API keys or hardware enclaves are required. The math mathematically proves state transitions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#3c8aff]" />
                    <span>Fast TEE Nullification Path</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#3c8aff]/20 text-[#3c8aff] text-[10px] font-mono font-bold">
                    Sub-Minute Fast Path
                  </span>
                </div>
                <p className="text-xs text-[#8a91a0] leading-relaxed">
                  Challengers configured with an AWS Nitro Enclave endpoint can nullify invalid TEE-backed proposals rapidly before falling back to heavier ZK proving, saving L1 gas and slashing malicious actors within seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE CATEGORY MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-[#ffd12f]" />
                <span>The 4 Candidate Game Categories &amp; Challenger Action Matrix</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                A game is selected only when <code>status() == IN_PROGRESS</code>. The onchain tuple <code>(teeProver, zkProver, counteredByIntermediateRootIndexPlusOne)</code> determines the candidate category.
              </p>
            </div>

            {/* Matrix Table */}
            <div className="rounded-xl border border-[#1e2538] bg-[#0a0c12] overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1e2538] text-[11px] text-[#8a91a0] bg-[#101420]">
                    <th className="p-3">TEE Prover</th>
                    <th className="p-3">ZK Prover</th>
                    <th className="p-3">Countered Index</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Challenger Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181e2e] text-[#dee1e7]">
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 text-[#3c8aff]">non-zero</td>
                    <td className="p-3 text-[#8a91a0]">zero</td>
                    <td className="p-3 text-[#8a91a0]">0</td>
                    <td className="p-3 font-bold text-white font-sans">Invalid TEE proposal</td>
                    <td className="p-3 text-[#8a91a0] font-sans">Validate all checkpoint roots. If invalid, prefer TEE nullification and fall back to ZK <code>challenge()</code>.</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 text-[#3c8aff]">non-zero</td>
                    <td className="p-3 text-[#66c800]">non-zero</td>
                    <td className="p-3 text-[#fc401f]">&gt; 0</td>
                    <td className="p-3 font-bold text-[#fc401f] font-sans">Fraudulent ZK challenge</td>
                    <td className="p-3 text-[#8a91a0] font-sans">Validate only the challenged checkpoint. If the challenged root is correct, submit ZK <code>nullify()</code>.</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 text-[#8a91a0]">zero</td>
                    <td className="p-3 text-[#66c800]">non-zero</td>
                    <td className="p-3 text-[#8a91a0]">0</td>
                    <td className="p-3 font-bold text-[#c084fc] font-sans">Invalid ZK proposal</td>
                    <td className="p-3 text-[#8a91a0] font-sans">Validate all checkpoint roots. If invalid, submit ZK <code>nullify()</code>.</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 text-[#3c8aff]">non-zero</td>
                    <td className="p-3 text-[#66c800]">non-zero</td>
                    <td className="p-3 text-[#8a91a0]">0</td>
                    <td className="p-3 font-bold text-[#ffd12f] font-sans">Invalid dual proposal</td>
                    <td className="p-3 text-[#8a91a0] font-sans">Validate all checkpoint roots. If invalid, nullify the TEE proof first, then rescan to handle the remaining ZK proof.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Interactive Category Evaluator */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Interactive Game State Evaluator</span>
                <span className="text-[11px] font-mono text-[#8a91a0]">Simulate Onchain Tuple</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-[#8a91a0] block mb-1">teeProver Slot:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEvalTeeProver('non-zero')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                        evalTeeProver === 'non-zero' ? 'bg-[#0052ff] text-white' : 'bg-[#08090d] text-[#8a91a0] border border-[#222838]'
                      }`}
                    >
                      Non-Zero (Active)
                    </button>
                    <button
                      onClick={() => setEvalTeeProver('zero')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                        evalTeeProver === 'zero' ? 'bg-[#0052ff] text-white' : 'bg-[#08090d] text-[#8a91a0] border border-[#222838]'
                      }`}
                    >
                      0x00...00 (Zero)
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#8a91a0] block mb-1">zkProver Slot:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEvalZkProver('zero')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                        evalZkProver === 'zero' ? 'bg-[#0052ff] text-white' : 'bg-[#08090d] text-[#8a91a0] border border-[#222838]'
                      }`}
                    >
                      0x00...00 (Zero)
                    </button>
                    <button
                      onClick={() => setEvalZkProver('non-zero')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                        evalZkProver === 'non-zero' ? 'bg-[#0052ff] text-white' : 'bg-[#08090d] text-[#8a91a0] border border-[#222838]'
                      }`}
                    >
                      Non-Zero (Active)
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#8a91a0] block mb-1">counteredIndex + 1:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEvalCounteredIndex(0)}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                        evalCounteredIndex === 0 ? 'bg-[#0052ff] text-white' : 'bg-[#08090d] text-[#8a91a0] border border-[#222838]'
                      }`}
                    >
                      0 (Unchallenged)
                    </button>
                    <button
                      onClick={() => setEvalCounteredIndex(3)}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                        evalCounteredIndex > 0 ? 'bg-[#fc401f] text-white' : 'bg-[#08090d] text-[#8a91a0] border border-[#222838]'
                      }`}
                    >
                      &gt; 0 (ZK Challenged)
                    </button>
                  </div>
                </div>
              </div>

              {/* Evaluation Card */}
              <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8a91a0]">Classified Category:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${evaluatedCategory.badgeColor}`}>
                      {evaluatedCategory.category}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-white">
                    Target Call: <code className="text-[#3c8aff] font-bold">{evaluatedCategory.call}</code>
                  </div>
                </div>
                <p className="text-xs text-[#dee1e7] leading-relaxed">
                  <strong>Challenger Directive:</strong> {evaluatedCategory.action}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OUTPUT ROOT VALIDATION FORMULAS */}
      {activeTab === 'validator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Hash className="h-5 w-5 text-[#3c8aff]" />
                <span>Output Root Validation &amp; Checkpoint Formulas</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                How the challenger calculates the expected intermediate checkpoint blocks, compares onchain roots against account proofs, and extracts the first invalid index.
              </p>
            </div>

            {/* Formulas Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <span className="text-[#ffd12f] font-bold">Checkpoint Block Formula</span>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838] text-white">
                  block = startingBlockNumber + INTERMEDIATE_BLOCK_INTERVAL * (i + 1)
                </div>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  Where <code>i</code> is the 0-based checkpoint index within the proposed output array.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <span className="text-[#66c800] font-bold">Submitted Root Count Formula</span>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838] text-white">
                  count = (l2SequenceNumber - startingBlockNumber) / INTERMEDIATE_BLOCK_INTERVAL
                </div>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  Must divide evenly. Any arithmetic overflow or count mismatch triggers immediate scan failure.
                </p>
              </div>
            </div>

            {/* 6-Step Verification Protocol */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#66c800]" />
                <span>6-Step Root Recomputation Algorithm</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#8a91a0]">
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <strong className="text-white">1. Fetch L2 Header:</strong> Query L2 execution RPC by block number.
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <strong className="text-white">2. Verify Header Hash:</strong> Confirm RPC header hash matches consensus hash.
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <strong className="text-white">3. Query eth_getProof:</strong> Fetch proof for <code>L2ToL1MessagePasser</code> (0x4200...16).
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <strong className="text-white">4. Verify Against State Root:</strong> Validate Merkle account proof against header root.
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <strong className="text-white">5. Assemble Output Root:</strong> <code>keccak256(version || stateRoot || storageRoot || blockHash)</code>.
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <strong className="text-white">6. Detect First Mismatch:</strong> First discrepancy determines <code>intermediateRootIndex</code> to prove!
                </div>
              </div>
            </div>

            {/* Interactive Checkpoint Scanner Simulator */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-bold text-white">Checkpoint Scanner Simulator</h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#8a91a0]">Simulate Mismatch:</span>
                  <select
                    value={simSimulateMismatchAt}
                    onChange={(e) => setSimSimulateMismatchAt(Number(e.target.value))}
                    className="px-2 py-1 rounded bg-[#08090d] text-white border border-[#222838] text-xs font-mono"
                  >
                    <option value={-1}>None (All Valid)</option>
                    <option value={0}>Checkpoint #0 (Starting Block)</option>
                    <option value={1}>Checkpoint #1</option>
                    <option value={2}>Checkpoint #2 (Middle)</option>
                    <option value={5}>Checkpoint #5 (Final)</option>
                  </select>
                </div>
              </div>

              {/* Table of scanned checkpoints */}
              <div className="rounded-xl border border-[#1e2538] bg-[#0a0c12] overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1e2538] text-[11px] text-[#8a91a0] bg-[#101420]">
                      <th className="p-3">Index (i)</th>
                      <th className="p-3">Checkpoint L2 Block</th>
                      <th className="p-3">Claimed Onchain Root</th>
                      <th className="p-3">Recomputed Canonical Root</th>
                      <th className="p-3">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181e2e] text-[#dee1e7]">
                    {validationBreakdown.checkpoints.map(cp => (
                      <tr 
                        key={cp.index} 
                        className={`transition-colors ${
                          cp.firstMismatch ? 'bg-[#fc401f]/10' : 'hover:bg-[#121624]/60'
                        }`}
                      >
                        <td className="p-3 font-bold text-[#3c8aff]">#{cp.index}</td>
                        <td className="p-3">#{cp.blockNum.toLocaleString()}</td>
                        <td className={`p-3 truncate max-w-[140px] ${cp.status === 'MISMATCH' ? 'text-[#fc401f] font-bold' : ''}`}>
                          {cp.onchainRoot}
                        </td>
                        <td className="p-3 text-[#66c800] truncate max-w-[140px]">
                          {cp.recomputedRoot}
                        </td>
                        <td className="p-3">
                          {cp.firstMismatch ? (
                            <span className="px-2 py-0.5 rounded bg-[#fc401f]/20 text-[#fc401f] text-[10px] font-bold border border-[#fc401f]/40">
                              FIRST MISMATCH (PROVE THIS)
                            </span>
                          ) : cp.status === 'MISMATCH' ? (
                            <span className="text-[#fc401f] text-[10px]">MISMATCH (Skipped)</span>
                          ) : (
                            <span className="text-[#66c800] text-[10px]">VALID</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validationBreakdown.firstMismatchIndex !== null && (
                <div className="p-3.5 rounded-lg bg-[#fc401f]/10 border border-[#fc401f]/30 flex items-center justify-between text-xs text-[#fc401f]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      Target Index Identified: <strong>Index #{validationBreakdown.firstMismatchIndex}</strong>. The challenger will request proof strictly for the interval ending at Block #{(simStartBlock + simInterval * (validationBreakdown.firstMismatchIndex + 1)).toLocaleString()}.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROOF SOURCING & LIFECYCLE */}
      {activeTab === 'proof_lifecycle' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#ffd12f]" />
                <span>Proof Sourcing &amp; Pending Proof State Machine</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Challengers prove only the interval containing the invalid checkpoint. Tracked in memory via a resilient 5-phase finite state machine.
              </p>
            </div>

            {/* ZK Sourcing Parameters Box */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Binary className="h-4 w-4 text-[#66c800]" />
                <span>ZK Prover Job Request Parameters</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#8a91a0] block text-[10px]">start_block_number</span>
                  <span className="text-white font-bold">Invalid Interval Start</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#8a91a0] block text-[10px]">number_of_blocks_to_prove</span>
                  <span className="text-[#3c8aff] font-bold">INTERMEDIATE_BLOCK_INTERVAL</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#8a91a0] block text-[10px]">proof_type</span>
                  <span className="text-[#66c800] font-bold">Groth16 SNARK</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#8a91a0] block text-[10px]">session_id (Deterministic)</span>
                  <span className="text-[#ffd12f] font-bold">keccak(gameAddr, index)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#8a91a0] block text-[10px]">prover_address</span>
                  <span className="text-white font-bold">L1 Signer Address</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#8a91a0] block text-[10px]">l1_head</span>
                  <span className="text-[#3c8aff] font-bold">Game Creation l1Head</span>
                </div>
              </div>
            </div>

            {/* State Machine Visualizer */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Pending Proof Lifecycle State Machine
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#3c8aff] font-bold">AwaitingProof</span>
                    <Clock className="h-4 w-4 text-[#3c8aff]" />
                  </div>
                  <p className="text-[11px] text-[#8a91a0] font-sans">
                    ZK job accepted by proving service. Polled each driver tick. If TEE, ready immediately.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#66c800] font-bold">ReadyToSubmit</span>
                    <Zap className="h-4 w-4 text-[#66c800]" />
                  </div>
                  <p className="text-[11px] text-[#8a91a0] font-sans">
                    Proof receipt received. Rechecks game status, encodes <code>nullify()</code> or <code>challenge()</code>, and broadcasts to L1.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffd12f] font-bold">NeedsRetry</span>
                    <RefreshCw className="h-4 w-4 text-[#ffd12f]" />
                  </div>
                  <p className="text-[11px] text-[#8a91a0] font-sans">
                    Failed proof jobs retried up to 3 times. TEE failure triggers instant fallback to pre-built ZK proof.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8a91a0] font-bold">Dropped</span>
                    <CheckCircle2 className="h-4 w-4 text-[#8a91a0]" />
                  </div>
                  <p className="text-[11px] text-[#8a91a0] font-sans">
                    Transaction confirmed, game resolved, prover slot zeroed, or retries exhausted. Memory cleared.
                  </p>
                </div>
              </div>

              {/* Transactions comparison */}
              <div className="p-3 rounded-lg bg-[#08090d] border border-[#1e2538] text-[11px] text-[#dee1e7] font-mono leading-relaxed">
                <span className="text-[#3c8aff] font-bold">// Dispute Calls:</span><br />
                • <code className="text-[#66c800]">nullify(proofBytes, index, expectedRoot)</code>: Removes invalid TEE/ZK proof or refutes fraudulent ZK challenge.<br />
                • <code className="text-[#fc401f]">challenge(proofBytes, index, expectedRoot)</code>: Challenges an invalid TEE proposal with a counter-ZK proof.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BOND CLAIMING */}
      {activeTab === 'bonds' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#66c800]" />
                <span>4-Stage Bond Lifecycle &amp; DelayedWETH Claiming</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                When configured with bond claim addresses, the challenger automatically tracks, claims, and withdraws accrued ETH bonds via DelayedWETH.
              </p>
            </div>

            {/* 4-Stage Bond Stepper Simulator */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Bond Recovery Protocol Lifecycle
                </span>
                <button
                  onClick={advanceBondLifecycle}
                  disabled={isAdvancingBond}
                  className="px-3 py-1.5 rounded-lg bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold transition-all shadow-md shadow-[#0052ff]/20 flex items-center gap-1.5"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>Advance Stage ({bondClaimStep}/4)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* Stage 1 */}
                <div className={`p-4 rounded-xl border transition-all ${
                  bondClaimStep >= 1 ? 'bg-[#08090d] border-[#0052ff] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[11px]">1. NeedsResolve</span>
                    <Clock className="h-3.5 w-3.5 text-[#3c8aff]" />
                  </div>
                  <p className="text-[10px] text-[#8a91a0]">
                    Wait for <code>gameOver()</code> to return true. Submit <code>resolve()</code> to finalize game outcome.
                  </p>
                </div>

                {/* Stage 2 */}
                <div className={`p-4 rounded-xl border transition-all ${
                  bondClaimStep >= 2 ? 'bg-[#08090d] border-[#0052ff] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[11px]">2. NeedsUnlock</span>
                    <Lock className="h-3.5 w-3.5 text-[#ffd12f]" />
                  </div>
                  <p className="text-[10px] text-[#8a91a0]">
                    Submit first <code>claimCredit()</code> to unlock credit in the <code>DelayedWETH</code> contract.
                  </p>
                </div>

                {/* Stage 3 */}
                <div className={`p-4 rounded-xl border transition-all ${
                  bondClaimStep >= 3 ? 'bg-[#08090d] border-[#0052ff] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[11px]">3. AwaitingDelay</span>
                    <Clock className="h-3.5 w-3.5 text-[#ffd12f]" />
                  </div>
                  <p className="text-[10px] text-[#8a91a0]">
                    Wait for the mandatory <code>DelayedWETH</code> delay period to expire (security buffer).
                  </p>
                </div>

                {/* Stage 4 */}
                <div className={`p-4 rounded-xl border transition-all ${
                  bondClaimStep >= 4 ? 'bg-[#08090d] border-[#66c800] text-white' : 'bg-[#08090d]/50 border-[#181e2e] text-[#717886]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[11px]">4. NeedsWithdraw</span>
                    <DollarSign className="h-3.5 w-3.5 text-[#66c800]" />
                  </div>
                  <p className="text-[10px] text-[#8a91a0]">
                    Submit second <code>claimCredit()</code> to release and withdraw liquid ETH into operator wallet.
                  </p>
                </div>
              </div>

              {/* Defender Wins Anchor Update */}
              <div className="p-3.5 rounded-lg bg-[#08090d] border border-[#1e2538] text-xs text-[#8a91a0] flex items-center justify-between">
                <span>
                  <strong className="text-white">Anchor Update Rule:</strong> When games resolve with <code>DEFENDER_WINS</code>, the challenger performs a best-effort, permissionless call to <code>AnchorStateRegistry.setAnchorState(game)</code> to advance the canonical anchor.
                </span>
                <span className="px-2 py-0.5 rounded bg-[#66c800]/20 text-[#66c800] font-mono text-[10px]">
                  Permissionless
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DRIVER LOOP & SAFETY */}
      {activeTab === 'driver' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-[#3c8aff]" />
                <span>Driver Loop &amp; Mandatory Safety Invariants</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Continuous operation sequence executed by the challenger daemon on every polling tick.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Driver Tick */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-[#3c8aff]" />
                  <span>Each Driver Loop Tick</span>
                </h4>
                <ol className="space-y-2 text-xs text-[#8a91a0]">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-[#3c8aff] font-bold">1.</span>
                    <span>Poll pending proof sessions and submit ready dispute transactions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-[#3c8aff] font-bold">2.</span>
                    <span>Discover claimable bonds and advance tracked <code>DelayedWETH</code> claims.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-[#3c8aff] font-bold">3.</span>
                    <span>Scan for in-progress candidate games post-anchor in factory.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-[#3c8aff] font-bold">4.</span>
                    <span>Validate intermediate roots and initiate proofs for new candidates.</span>
                  </li>
                </ol>
              </div>

              {/* Safety Requirements */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#66c800]" />
                  <span>5 Protocol Safety Invariants</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#8a91a0]">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#66c800] mt-0.5 shrink-0" />
                    <span><strong>Never trust game roots:</strong> Always recompute from L2 consensus headers &amp; account proofs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#66c800] mt-0.5 shrink-0" />
                    <span><strong>Bind to game's l1Head:</strong> Ensure proof journals match onchain verified context.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#66c800] mt-0.5 shrink-0" />
                    <span><strong>Local check for ZK challenges:</strong> Validate only the challenged checkpoint, not earlier roots.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#66c800] mt-0.5 shrink-0" />
                    <span><strong>Atomic pre-submit check:</strong> Verify prover slot isn't already zeroed to prevent gas burn.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#66c800] mt-0.5 shrink-0" />
                    <span><strong>Handle missing blocks as retry:</strong> Unavailable L2 blocks must never trigger false disputes.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
