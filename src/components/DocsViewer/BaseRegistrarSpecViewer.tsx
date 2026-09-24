import React, { useState, useMemo } from 'react';
import { 
  KeyRound, 
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
  Binary,
  Sliders,
  ChevronRight,
  Sparkles,
  Server,
  Play,
  Square,
  Terminal,
  Activity,
  FileCheck,
  Search,
  Filter,
  UserCheck,
  UserX,
  Radio,
  Workflow
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface BaseRegistrarSpecViewerProps {
  currentNetwork?: BaseNetwork;
  onNavigateToProofs?: () => void;
  onNavigateToProposer?: () => void;
  onNavigateToChallenger?: () => void;
}

export const BaseRegistrarSpecViewer: React.FC<BaseRegistrarSpecViewerProps> = ({
  currentNetwork,
  onNavigateToProofs,
  onNavigateToProposer,
  onNavigateToChallenger
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'discovery' | 'proving' | 'registration' | 'revocation' | 'safety'>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Canonical Addresses
  const TEE_PROVER_REGISTRY_ADDRESS = '0x7eE699B56972e90e7f7b3a0f18835848C1897eE6';
  const NITRO_ENCLAVE_VERIFIER_ADDRESS = '0x9b99f3C316e6f1B83802905187eF494E5105bF46';
  const TEE_VERIFIER_ADDRESS = '0x5C246d5E4929D37e8c3F17b20464f1696F158F89';

  // Simulator States
  // 1. Prover Instance Discovery Simulator
  const [targetGroupArn, setTargetGroupArn] = useState<string>('arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tee-provers/abcdef1234567890');
  const [filterState, setFilterState] = useState<'all' | 'healthy' | 'unhealthy' | 'draining'>('all');
  const [warmupSeconds, setWarmupSeconds] = useState<number>(300);

  // 2. Boundless Deterministic Slot Simulator
  const [testSignerAddress, setTestSignerAddress] = useState<string>('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [attemptIndex, setAttemptIndex] = useState<number>(0);

  // 3. Majority-Reachable Orphan Guard Simulator
  const [totalFleetCount, setTotalFleetCount] = useState<number>(10);
  const [reachableCount, setReachableCount] = useState<number>(8);

  // 4. CRL Revocation Checker Simulator
  const [crlHostInput, setCrlHostInput] = useState<string>('https://nitro-enclave-crl.us-east-1.amazonaws.com/nitro-intermediate.crl');
  const [sampleCertHash, setSampleCertHash] = useState<string>('0xd94318c5e937d2b452817290bc9381710928a719283710928371902837192038');
  const [isDurableRevoked, setIsDurableRevoked] = useState<boolean>(false);

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

  // Compute deterministic slot: pseudo keccak256
  const computedSlot = useMemo(() => {
    // Simulated hash of signer + attempt: 32-bit slot
    let hash = 0;
    const str = `${testSignerAddress.toLowerCase()}-${attemptIndex}`;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    const unsigned = (hash >>> 0);
    const hex = '0x' + unsigned.toString(16).padStart(8, '0');
    return {
      slotIndex: unsigned,
      slotHex: hex,
      boundlessRequestId: `req_${hex}_${attemptIndex}`
    };
  }, [testSignerAddress, attemptIndex]);

  // Majority guard calculation
  const isMajorityGuardTriggered = (reachableCount * 2) <= totalFleetCount;

  // Mock fleet data
  const mockInstances = [
    { id: 'i-01a2b3c4d5e6f7001', ip: '10.0.12.44', state: 'healthy', enclaves: 2, launchAgeSec: 14200 },
    { id: 'i-01a2b3c4d5e6f7002', ip: '10.0.12.45', state: 'healthy', enclaves: 2, launchAgeSec: 8400 },
    { id: 'i-01a2b3c4d5e6f7003', ip: '10.0.12.46', state: 'initial', enclaves: 2, launchAgeSec: 120 },
    { id: 'i-01a2b3c4d5e6f7004', ip: '10.0.12.47', state: 'unhealthy', enclaves: 2, launchAgeSec: 180 }, // in warm-up!
    { id: 'i-01a2b3c4d5e6f7005', ip: '10.0.12.48', state: 'draining', enclaves: 2, launchAgeSec: 86400 },
  ];

  const filteredInstances = mockInstances.filter(i => {
    if (filterState === 'all') return true;
    return i.state === filterState;
  });

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
                Offchain Registrar Service
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ffd12f]/20 text-[#ffd12f] border border-[#ffd12f]/40">
                AWS Nitro Attestation ZK Verifier
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <KeyRound className="h-6 w-6 text-[#0052ff]" />
              <span>Registrar Specification &amp; TEE Signer Registry</span>
            </h1>
            <p className="text-xs text-[#8a91a0] max-w-3xl leading-relaxed">
              Specification of the <strong>registrar</strong>, the offchain service that discovers running AWS Nitro Enclave TEE provers, fetches attestation documents, generates Groth16 attestation ZK proofs via Boundless / RISC Zero, and maintains the onchain signer registry in <code>TEEProverRegistry</code> while enforcing two-layer CRL revocation checks and safe orphan pruning.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => handleCopy(TEE_PROVER_REGISTRY_ADDRESS, 'tee_registry_addr')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-white border border-[#252d42] text-xs font-mono transition-colors"
            >
              {copiedAddress === 'tee_registry_addr' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5 text-[#8a91a0]" />}
              <span>Registry: {shortenAddress(TEE_PROVER_REGISTRY_ADDRESS)}</span>
            </button>

            <a
              href="https://github.com/base/contracts/blob/main/src/L1/proofs/tee/TEEProverRegistry.sol"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold transition-all shadow-md shadow-[#0052ff]/30"
            >
              <span>TEEProverRegistry.sol</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-[#1e2538] overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Responsibilities & Driver Loop', icon: Layers },
            { id: 'discovery', label: 'ALB Discovery & Warm-up', icon: Server },
            { id: 'proving', label: 'Attestation ZK & Slot Recovery', icon: Binary },
            { id: 'registration', label: 'Onchain Transactions & Orphan Pruning', icon: FileCheck },
            { id: 'revocation', label: '2-Layer CRL Revocation', icon: ShieldCheck },
            { id: 'safety', label: '11 Protocol Safety Invariants', icon: Lock },
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

      {/* TAB 1: OVERVIEW & DRIVER LOOP */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 8 Core Responsibilities */}
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#0052ff]" />
                <span>8 Conforming Responsibilities of the Registrar</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                The registrar is operated by Base to maintain the onchain set of trusted TEE signers. Without registrar attestation, no TEE fast-path proof can be accepted by <code>AggregateVerifier</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { step: '1', title: 'Discover Provers', desc: 'Poll AWS ALB target group & EC2 metadata for running prover instances.' },
                { step: '2', title: 'Fetch Attestations', desc: 'Call enclave_signerPublicKey & enclave_signerAttestation with fresh random 32B nonce.' },
                { step: '3', title: 'CRL & Revocation Checks', desc: 'Enforce onchain durable check first, then query AWS distribution point CRLs.' },
                { step: '4', title: 'Generate ZK Proofs', desc: 'Produce Groth16 SNARK proving attestation document validity via Boundless/RISC Zero.' },
                { step: '5', title: 'Submit registerSigner', desc: 'Broadcast TEEProverRegistry.registerSigner(output, proof) on Ethereum L1.' },
                { step: '6', title: 'Deregister Orphans', desc: 'Prune dead signers with deregisterSigner() protected by majority-reachable guard.' },
                { step: '7', title: 'Revoke Intermediate Certs', desc: 'Broadcast NitroEnclaveVerifier.revokeCert() when AWS withdraws an intermediate.' },
                { step: '8', title: 'Deterministic Recovery', desc: 'Probe Boundless slots across restarts to avoid redundant proof re-spending.' },
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

            {/* Architectural Boundary & PCR0 Agnosticism */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <span className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#ffd12f]" />
                  <span>PCR0-Agnostic Registration</span>
                </span>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  The registrar does <strong>not</strong> gate which PCR0 measurements are accepted. Registration is PCR0-agnostic so that the next enclave image's signers can be pre-registered ahead of a protocol hardfork. Enforcement of the active image hash happens onchain inside <code>TEEVerifier</code> against the game's <code>TEE_IMAGE_HASH</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <span className="font-bold text-white flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[#66c800]" />
                  <span>Single Writer Guarantee</span>
                </span>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  The registrar treats every onchain signer not seen in its own active instance set as an orphan candidate. Therefore, a single registrar must be the <strong>sole writer</strong> for a given <code>TEEProverRegistry</code> to prevent two registrars from mutual orphan deregistration wars.
                </p>
              </div>
            </div>

            {/* Driver Loop Visual Flow */}
            <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-3">
              <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                <Workflow className="h-4 w-4 text-[#3c8aff]" />
                <span>The Registrar Driver Loop</span>
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-2 text-xs font-mono text-center">
                <div className="p-2.5 rounded-lg bg-[#101420] border border-[#252d42] text-[#dee1e7] flex-1 w-full">
                  1. Discover Instances
                </div>
                <ChevronRight className="h-4 w-4 text-[#717886] hidden sm:block shrink-0" />
                <div className="p-2.5 rounded-lg bg-[#101420] border border-[#252d42] text-[#dee1e7] flex-1 w-full">
                  2. Concurrent Batch Process
                </div>
                <ChevronRight className="h-4 w-4 text-[#717886] hidden sm:block shrink-0" />
                <div className="p-2.5 rounded-lg bg-[#101420] border border-[#252d42] text-[#dee1e7] flex-1 w-full">
                  3. Read Onchain Signers
                </div>
                <ChevronRight className="h-4 w-4 text-[#717886] hidden sm:block shrink-0" />
                <div className="p-2.5 rounded-lg bg-[#101420] border border-[#252d42] text-[#dee1e7] flex-1 w-full">
                  4. Deregister Orphans
                </div>
                <ChevronRight className="h-4 w-4 text-[#717886] hidden sm:block shrink-0" />
                <div className="p-2.5 rounded-lg bg-[#101420] border border-[#252d42] text-[#3c8aff] flex-1 w-full">
                  5. Sleep poll_interval
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALB DISCOVERY & WARM-UP WINDOW */}
      {activeTab === 'discovery' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-[#ffd12f]" />
                <span>AWS ALB Target Group Polling &amp; Warm-up Grace Period</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Provers run inside EC2 Nitro Enclaves. Discovery calls <code>DescribeTargetHealth</code> and <code>DescribeInstances</code> to build private JSON-RPC endpoints.
              </p>
            </div>

            {/* Health State Mapping Table */}
            <div className="rounded-xl border border-[#1e2538] bg-[#0a0c12] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e2538] text-[11px] text-[#8a91a0] bg-[#101420]">
                    <th className="p-3">AWS Target State</th>
                    <th className="p-3">Internal Driver State</th>
                    <th className="p-3">should_register()</th>
                    <th className="p-3">Active Set Contribution</th>
                    <th className="p-3">Behavior &amp; Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181e2e] text-[#dee1e7]">
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-mono font-bold text-[#66c800]">healthy</td>
                    <td className="p-3 font-mono">Healthy</td>
                    <td className="p-3 text-[#66c800] font-bold">true</td>
                    <td className="p-3 text-white">Yes</td>
                    <td className="p-3 text-[#8a91a0]">Steady-state active prover; generate proof and register.</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-mono font-bold text-[#3c8aff]">initial</td>
                    <td className="p-3 font-mono">Initial</td>
                    <td className="p-3 text-[#66c800] font-bold">true</td>
                    <td className="p-3 text-white">Yes</td>
                    <td className="p-3 text-[#8a91a0]">New instance joining target group; register before first healthcheck.</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-mono font-bold text-[#ffd12f]">unhealthy</td>
                    <td className="p-3 font-mono">Unhealthy</td>
                    <td className="p-3 text-[#ffd12f] font-bold">Warm-up check</td>
                    <td className="p-3 text-white">Yes</td>
                    <td className="p-3 text-[#8a91a0]">
                      Allowed to register <em>only</em> if within <code>unhealthy_registration_window</code> ({warmupSeconds}s) of launch.
                    </td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-mono font-bold text-[#fc401f]">draining</td>
                    <td className="p-3 font-mono">Draining</td>
                    <td className="p-3 text-[#fc401f] font-bold">false</td>
                    <td className="p-3 text-white">Yes (Protected)</td>
                    <td className="p-3 text-[#8a91a0]">
                      Rotating out. Contributes to active set to <strong>prevent premature deregistration</strong>!
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Interactive Fleet Discovery Inspector */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white">Simulated AWS ALB Target Fleet</h4>
                  <p className="text-[11px] text-[#8a91a0]">Test warm-up filter and address derivation for running enclaves</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#8a91a0]">Filter:</span>
                  {(['all', 'healthy', 'unhealthy', 'draining'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setFilterState(mode)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize transition-all ${
                        filterState === mode 
                          ? 'bg-[#0052ff] text-white font-bold' 
                          : 'bg-[#08090d] text-[#8a91a0] hover:text-white border border-[#222838]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filteredInstances.map(inst => {
                  const isWarmupEligible = inst.state === 'unhealthy' && inst.launchAgeSec <= warmupSeconds;
                  const canRegister = inst.state === 'healthy' || inst.state === 'initial' || isWarmupEligible;

                  return (
                    <div key={inst.id} className="p-3 rounded-lg bg-[#08090d] border border-[#1e2538] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{inst.id}</span>
                        <span className="text-[#8a91a0]">IP: {inst.ip}:8545</span>
                        <span className="text-[#3c8aff]">{inst.enclaves} Enclaves</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          inst.state === 'healthy' ? 'bg-[#66c800]/20 text-[#66c800]' :
                          inst.state === 'initial' ? 'bg-[#3c8aff]/20 text-[#3c8aff]' :
                          inst.state === 'draining' ? 'bg-[#fc401f]/20 text-[#fc401f]' :
                          'bg-[#ffd12f]/20 text-[#ffd12f]'
                        }`}>
                          {inst.state}
                        </span>

                        <span className="text-[10px] text-[#8a91a0]">
                          Launched {inst.launchAgeSec}s ago
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          canRegister ? 'bg-[#66c800]/20 text-[#66c800]' : 'bg-[#1e2538] text-[#717886]'
                        }`}>
                          {canRegister ? 'Eligible to Register' : 'Active Only (No Reg)'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTESTATION ZK PROVING & DETERMINISTIC SLOT RECOVERY */}
      {activeTab === 'proving' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Binary className="h-5 w-5 text-[#3c8aff]" />
                <span>Attestation Proof Provider &amp; Restart Recovery</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                The registrar produces proof material by invoking <code>AttestationProofProvider</code> (Boundless marketplace or direct RISC Zero guest). Across process restarts, it recovers in-flight proofs using deterministic request slots.
              </p>
            </div>

            {/* Backends Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#0052ff]" />
                    <span>boundless (Primary Production Backend)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0052ff]/20 text-[#3c8aff]">Marketplace</span>
                </div>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Submits <code>RequestParams</code> to the Boundless decentralized prover network with <code>prefix_match(image_id)</code> to prevent program replay attacks. Requests are serialized behind a dedicated wallet mutex.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#ffd12f]" />
                    <span>direct (Local / Bonsai Fallback)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ffd12f]/20 text-[#ffd12f]">Bonsai / Guest ELF</span>
                </div>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Loads the guest ELF locally and proves via <code>risc0_zkvm::default_prover()</code>, routing to Bonsai or local GPU provers. Used during Boundless incidents or private deployments.
                </p>
              </div>
            </div>

            {/* Deterministic Slot Formula & Interactive Calculator */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#66c800]" />
                  <span>Boundless Deterministic Request Slot Calculator</span>
                </h4>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#1e2538] font-mono text-xs text-[#3c8aff]">
                  request_index(signer, attempt) = u32::from_be_bytes(keccak256(signer || attempt)[..4])
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-[#8a91a0] block mb-1">Signer Ethereum Address</label>
                  <input
                    type="text"
                    value={testSignerAddress}
                    onChange={(e) => setTestSignerAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#08090d] border border-[#222838] text-white font-mono text-xs focus:outline-none focus:border-[#0052ff]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#8a91a0] block mb-1">Attempt Number (0..max_recovery_attempts)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={attemptIndex}
                    onChange={(e) => setAttemptIndex(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-[#08090d] border border-[#222838] text-white font-mono text-xs focus:outline-none focus:border-[#0052ff]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#08090d] border border-[#1e2538] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-[#8a91a0] block text-[10px]">Deterministic Boundless Slot:</span>
                  <span className="text-[#66c800] font-bold text-sm">{computedSlot.slotHex} ({computedSlot.slotIndex.toLocaleString()})</span>
                </div>
                <div className="text-right">
                  <span className="text-[#8a91a0] block text-[10px]">Max Attestation Age Guard:</span>
                  <span className="text-[#ffd12f] font-bold">3,300s (Strictly under onchain MAX_AGE 3,600s)</span>
                </div>
              </div>
            </div>

            {/* Slot State Action Matrix */}
            <div className="rounded-xl border border-[#1e2538] bg-[#0a0c12] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e2538] text-[11px] text-[#8a91a0] bg-[#101420]">
                    <th className="p-3">Boundless Slot Status</th>
                    <th className="p-3">Registrar Action Across Restart</th>
                    <th className="p-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181e2e] text-[#dee1e7]">
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-mono font-bold text-[#8a91a0]">Unknown</td>
                    <td className="p-3 text-[#8a91a0]">Record as candidate fresh-submission slot; continue probing.</td>
                    <td className="p-3 text-white">Fresh candidate</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-mono font-bold text-[#ffd12f]">Locked</td>
                    <td className="p-3 text-[#8a91a0]">Resume wait_for_request_fulfillment() and use receipt.</td>
                    <td className="p-3 text-[#66c800]">Resume in-flight</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-mono font-bold text-[#66c800]">Fulfilled</td>
                    <td className="p-3 text-[#8a91a0]">Fetch receipt; verify age &lt; 3300s. If fresh, reuse!</td>
                    <td className="p-3 text-[#66c800]">Save proving cost</td>
                  </tr>
                  <tr className="hover:bg-[#121624]/60">
                    <td className="p-3 font-mono font-bold text-[#fc401f]">Expired</td>
                    <td className="p-3 text-[#8a91a0]">Skip slot permanently; continue scanning.</td>
                    <td className="p-3 text-[#fc401f]">Skip stale slot</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REGISTRATION TX & ORPHAN PRUNING */}
      {activeTab === 'registration' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-[#66c800]" />
                <span>Onchain Registration Pipeline &amp; Majority Orphan Guard</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                How the registrar broadcasts <code>registerSigner()</code> and <code>deregisterSigner()</code>, with built-in post-error reconciliation and network outage guards.
              </p>
            </div>

            {/* Solidity Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
                <span className="text-[#66c800] font-bold">TEEProverRegistry.registerSigner()</span>
                <pre className="p-2.5 rounded-lg bg-[#101420] text-[#dee1e7] text-[11px] leading-relaxed overflow-x-auto">
{`TEEProverRegistry.registerSigner(
    output,      // ABI-encoded VerifierJournal
    proofBytes   // Groth16 SNARK seal
)`}
                </pre>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  Submitted for every unregistered enclave. Pre-checked with <code>isRegisteredSigner(signer)</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-2">
                <span className="text-[#fc401f] font-bold">TEEProverRegistry.deregisterSigner()</span>
                <pre className="p-2.5 rounded-lg bg-[#101420] text-[#dee1e7] text-[11px] leading-relaxed overflow-x-auto">
{`TEEProverRegistry.deregisterSigner(
    signer       // address of unreachable enclave
)`}
                </pre>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  Prunes dead signers. Subject to <strong>Majority-Reachable Guard</strong> and recheck before send.
                </p>
              </div>
            </div>

            {/* Interactive Majority-Reachable Guard Simulator */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#ffd12f]" />
                    <span>Majority-Reachable Guard Simulator</span>
                  </h4>
                  <p className="text-[11px] text-[#8a91a0]">
                    Prevents a transient AWS or VPC outage from mass-deregistering the entire prover fleet.
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                  isMajorityGuardTriggered 
                    ? 'bg-[#fc401f]/20 text-[#fc401f] border border-[#fc401f]/40' 
                    : 'bg-[#66c800]/20 text-[#66c800] border border-[#66c800]/40'
                }`}>
                  {isMajorityGuardTriggered ? 'GUARD BLOCKS CLEANUP' : 'CLEANUP PERMITTED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="text-[#8a91a0] block mb-1">Total Discovered Instances: {totalFleetCount}</label>
                  <input
                    type="range"
                    min="2"
                    max="50"
                    value={totalFleetCount}
                    onChange={(e) => setTotalFleetCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-[#8a91a0] block mb-1">Reachable Instances: {reachableCount}</label>
                  <input
                    type="range"
                    min="0"
                    max={totalFleetCount}
                    value={reachableCount}
                    onChange={(e) => setReachableCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#08090d] border border-[#1e2538] text-xs">
                <span className="font-mono text-[#3c8aff]">
                  Condition: reachable_instances * 2 &lt;= total_instances ({reachableCount * 2} &lt;= {totalFleetCount})
                </span>
                <p className="text-[#8a91a0] mt-1 text-[11px]">
                  {isMajorityGuardTriggered 
                    ? '⚠️ AWS VPC network partition suspected! Orphan cleanup is skipped to preserve live onchain signers.' 
                    : '✅ Healthy majority verified. Safe to proceed with orphan deregistration.'}
                </p>
              </div>
            </div>

            {/* Post-Error Reconciliation Notice */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2 text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-[#3c8aff]" />
                <span>Post-Error Reconciliation Guard</span>
              </span>
              <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                Fee-bumping and nonce races can report transaction errors even when the underlying transaction was successfully mined. When an error is returned after mining, the registrar immediately re-reads <code>isRegisteredSigner(signer)</code>. If true, the attempt is treated as a success, preventing expensive redundant ZK proving.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 2-LAYER CRL REVOCATION */}
      {activeTab === 'revocation' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#fc401f]" />
                <span>Two-Layer Certificate Revocation Architecture</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                When CRL checking is enabled, the registrar enforces revocation using two layers in strict order to eliminate the risk of revoked certificate rehabilitation.
              </p>
            </div>

            {/* Two Layers Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#ffd12f]" />
                    <span>Layer 1: Onchain Durable Revocation Pre-Check</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ffd12f]/20 text-[#ffd12f]">Zero Network</span>
                </div>
                <div className="p-2 rounded bg-[#08090d] font-mono text-[11px] text-[#dee1e7]">
                  NitroEnclaveVerifier.revokedCerts(certPathDigest)
                </div>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Checks whether the intermediate was previously revoked onchain. Any hit immediately blocks registration and skips Layer 2. This prevents AWS from silently rehabilitating a revoked intermediate if it later prunes older CRL entries.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Radio className="h-4 w-4 text-[#fc401f]" />
                    <span>Layer 2: AWS CRL Distribution Points</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#fc401f]/20 text-[#fc401f]">Network CRL</span>
                </div>
                <div className="p-2 rounded bg-[#08090d] font-mono text-[11px] text-[#dee1e7]">
                  NitroEnclaveVerifier.revokeCert(certPathDigest)
                </div>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Fetches live CRL with host allowlisting (<code>.amazonaws.com</code> and <code>nitro-enclave</code> keywords), zero HTTP redirects, and 10 MiB payload bounds. If serial matches, submits <code>revokeCert()</code> onchain.
                </p>
              </div>
            </div>

            {/* Interactive CRL Host Allowlist Checker */}
            <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">SSRF Defense: CRL Distribution Point Allowlist Validator</h4>
                <p className="text-[11px] text-[#8a91a0]">
                  Verifies that CRL endpoints strictly conform to AWS security invariants.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={crlHostInput}
                  onChange={(e) => setCrlHostInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#08090d] border border-[#222838] text-white font-mono text-xs focus:outline-none focus:border-[#0052ff]"
                />

                {(() => {
                  const isAmazon = crlHostInput.includes('.amazonaws.com');
                  const isNitro = crlHostInput.includes('nitro-enclave');
                  const isValid = isAmazon && isNitro;

                  return (
                    <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono ${
                      isValid ? 'bg-[#66c800]/10 border-[#66c800]/30 text-[#66c800]' : 'bg-[#fc401f]/10 border-[#fc401f]/30 text-[#fc401f]'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <span>{isValid ? 'VALID AWS NITRO CRL ENDPOINT' : 'REJECTED: SUSPECTED SSRF ATTACK'}</span>
                      </div>
                      <span className="text-[10px] text-[#8a91a0]">Bounded to 10 MiB | No Redirects</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: 11 PROTOCOL SAFETY INVARIANTS */}
      {activeTab === 'safety' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#66c800]" />
                <span>11 Mandatory Protocol Safety Invariants</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Every conforming registrar implementation must adhere to these 11 formal safety guarantees to preserve proof system integrity.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: '1', title: 'Majority-Reachable Outage Guard', text: 'Do not deregister live signers because of transient AWS or VPC outages. Apply reachable * 2 > total guard before any deregistration.' },
                { id: '2', title: 'Active Set Protection for Draining Instances', text: 'Treat Draining and Unhealthy instances as active so long as their JSON-RPC responds, avoiding race conditions during node rotations.' },
                { id: '3', title: 'Unguessable Nonce Freshness', text: 'Generate a fresh random 32-byte nonce per instance batch so the verifier journal carries an unforgeable freshness commitment.' },
                { id: '4', title: 'Deterministic Slot Derivation', text: 'Derive Boundless request slots deterministically: request_index(signer, attempt) = u32::from_be_bytes(keccak256(signer || attempt)[..4]).' },
                { id: '5', title: 'Strict Attestation Freshness Window', text: 'Reject recovered proofs older than max_attestation_age (3,300s), keeping proofs strictly inside onchain MAX_AGE (3,600s).' },
                { id: '6', title: 'ExecutionReverted Recovery Blocking', text: 'Block recovery for a signer after an ExecutionReverted error so the next cycle proves freshly rather than re-submitting bad data.' },
                { id: '7', title: 'Post-Mining Error Reconciliation', text: 'Recheck isRegisteredSigner() after transaction errors to absorb fee-bumping and nonce-race false negatives.' },
                { id: '8', title: 'Pre-Deregistration Race Guard', text: 'Recheck isRegisteredSigner() immediately before submitting deregisterSigner() to avoid wasted gas on already-deregistered signers.' },
                { id: '9', title: 'Durable Revocation Pre-Check Order', text: 'Always run Layer 1 (onchain durable check) before Layer 2 (network CRLs) so previously revoked intermediates cannot be rehabilitated.' },
                { id: '10', title: 'SSRF & Resource Exhaustion Defense', text: 'Enforce strict host allowlisting (.amazonaws.com + nitro-enclave), zero HTTP redirects, and 10 MiB response bounds on CRL fetches.' },
                { id: '11', title: 'Graceful Transient Error Handling', text: 'Treat transient AWS API errors, RPC blips, and Boundless polling delays as retryable next-tick conditions rather than failure signals.' },
              ].map(inv => (
                <div key={inv.id} className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] flex items-start gap-3.5">
                  <span className="h-6 w-6 rounded-lg bg-[#0052ff]/20 text-[#3c8aff] font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {inv.id}
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-xs">{inv.title}</h4>
                    <p className="text-[#8a91a0] text-[11px] leading-relaxed mt-1">{inv.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
