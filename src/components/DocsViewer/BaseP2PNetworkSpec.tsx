import React, { useState } from 'react';
import { 
  Radio, 
  Network, 
  ShieldCheck, 
  Server, 
  Cpu, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Terminal, 
  Activity, 
  Hash, 
  FileCode, 
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Search
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';

interface BaseP2PNetworkSpecProps {
  currentNetwork: BaseNetwork;
}

export const BaseP2PNetworkSpec: React.FC<BaseP2PNetworkSpecProps> = ({ currentNetwork }) => {
  const [selectedTopic, setSelectedTopic] = useState<'blocksv1' | 'blocksv2' | 'blocksv3' | 'blocksv4'>('blocksv4');
  const [activeTab, setActiveTab] = useState<'overview' | 'discv5' | 'libp2p' | 'gossip' | 'reqresp' | 'validator'>('overview');
  const [simulatedBlockNum, setSimulatedBlockNum] = useState<number>(20584912);
  const [simResult, setSimResult] = useState<{ status: string; code: number; details: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const gossipTopics = [
    {
      id: 'blocksv1',
      version: 'v1',
      hardfork: 'Pre-Canyon / Shanghai',
      topicPath: `/optimism/${currentNetwork.chainId}/0/blocks`,
      structure: '65B signature + SSZ ExecutionPayload',
      compression: 'Snappy block-compression (10 MiB limit)',
      note: 'Legacy blocks without EIP-4844 blob gas fields and without withdrawals.',
    },
    {
      id: 'blocksv2',
      version: 'v2',
      hardfork: 'Canyon / Delta',
      topicPath: `/optimism/${currentNetwork.chainId}/1/blocks`,
      structure: '65B signature + SSZ ExecutionPayload',
      compression: 'Snappy block-compression',
      note: 'Empty withdrawals list enforced; no blob gas fields.',
    },
    {
      id: 'blocksv3',
      version: 'v3',
      hardfork: 'Ecotone',
      topicPath: `/optimism/${currentNetwork.chainId}/2/blocks`,
      structure: '65B signature + 32B parentBeaconBlockRoot + SSZ ExecutionPayload',
      compression: 'Snappy block-compression',
      note: 'Requires parentBeaconBlockRoot from L1 consensus and blob gas fields set to zero.',
    },
    {
      id: 'blocksv4',
      version: 'v4 (Latest)',
      hardfork: 'Isthmus',
      topicPath: `/optimism/${currentNetwork.chainId}/3/blocks`,
      structure: '65B signature + 32B parentBeaconBlockRoot + SSZ ExecutionPayload (with withdrawalsRoot)',
      compression: 'Snappy block-compression',
      note: 'ExecutionPayload modified to include L2 withdrawalsRoot for improved L1 dispute proofs.',
    },
  ];

  const validationRules = [
    { step: 1, signal: 'REJECT', rule: 'Snappy decompression check', detail: 'Fails if byte stream is not valid single-block Snappy compression.' },
    { step: 2, signal: 'REJECT', rule: 'Block encoding check', detail: 'Fails if structure does not match the hardfork topic concatenation specs.' },
    { step: 3, signal: 'REJECT', rule: 'Timestamp staleness (> 60s past)', detail: 'Rejects payload.timestamp older than 60s in the past (clock skew grace boundary).' },
    { step: 4, signal: 'REJECT', rule: 'Timestamp drift (> 5s future)', detail: 'Rejects payload.timestamp more than 5s into the future.' },
    { step: 5, signal: 'REJECT', rule: 'Block hash validity', detail: 'Rejects if block_hash in payload does not match header contents.' },
    { step: 6, signal: 'REJECT', rule: 'Topic version constraints', detail: 'Enforces withdrawals and blob gas field rules per hardfork (v1 vs v2 vs v3 vs v4).' },
    { step: 7, signal: 'REJECT', rule: 'Height equivocation (> 5 blocks)', detail: 'Rejects if more than 5 distinct blocks observed at the exact same block height.' },
    { step: 8, signal: 'IGNORE', rule: 'Already seen message', detail: 'Silently ignores previously processed blocks (peer not penalized).' },
    { step: 9, signal: 'REJECT', rule: 'Sequencer secp256k1 signature', detail: 'Verifies keccak256(domain ++ chain_id ++ payload_hash) against authorized sequencer public key.' },
    { step: 10, signal: 'ACCEPT', rule: 'Relay & mark seen', detail: 'Relays gossiped block to LibP2P mesh peers and submits to local Reth engine.' },
  ];

  const handleSimulateReqResp = () => {
    setSimResult({
      status: 'res = 0 (SUCCESS)',
      code: 0,
      details: `Retrieved ExecutionPayload for L2 Block #${simulatedBlockNum.toLocaleString()} via /opstack/req/payload_by_number/${currentNetwork.chainId}/0/. Validated against canonical parent hash.`,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#3c8aff] animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3c8aff]">
                Base Rollup Protocol Specification
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              P2P Network, Discovery & Gossip Architecture
            </h2>
            <p className="text-xs sm:text-sm text-[#8a91a0] mt-1 max-w-3xl leading-relaxed">
              Base rollup nodes maintain a high-performance peer-to-peer network for sub-second &quot;unsafe&quot; block propagation, 
              bypassing L1 latency in the happy case while preserving canonical L1 derivation as the ultimate ground truth.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-[#0052ff]/10 text-[#3c8aff] border border-[#0052ff]/30 text-xs font-mono">
              Chain ID: {currentNetwork.chainId}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-[#1f232c]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            P2P Stack Overview
          </button>
          <button
            onClick={() => setActiveTab('discv5')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'discv5' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            Discv5 & Node Discovery
          </button>
          <button
            onClick={() => setActiveTab('libp2p')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'libp2p' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            LibP2P & Transport
          </button>
          <button
            onClick={() => setActiveTab('gossip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'gossip' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            GossipSub & Block Topics
          </button>
          <button
            onClick={() => setActiveTab('validator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'validator' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            Extended Validator
          </button>
          <button
            onClick={() => setActiveTab('reqresp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'reqresp' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            Req-Resp Sync Protocol
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Network className="h-4 w-4 text-[#3c8aff]" />
                The Three Layers of the Base P2P Stack
              </h3>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                The rollup node peer-to-peer service allows sequencers, replicas, and RPC nodes to synchronize L2 blocks within milliseconds 
                instead of waiting for the ~12-minute Ethereum L1 batch confirmation loop.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-[#262b36] bg-[#0d0f14] space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-[#0052ff]/20 text-[#3c8aff] flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-white">Discv5 Discovery</h4>
                  <p className="text-[11px] text-[#8a91a0] leading-normal">
                    Decentralized DHT discovery via Node Records (ENRs) containing IP, TCP/UDP ports, and RLP-encoded OpStack Chain ID & Fork ID.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#262b36] bg-[#0d0f14] space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-[#ffd12f]/20 text-[#ffd12f] flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-white">LibP2P Transport</h4>
                  <p className="text-[11px] text-[#8a91a0] leading-normal">
                    Noise XX handshake encryption with secp256k1 network identity, mplex/yamux multiplexing, and tide-system peer count pruning.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#262b36] bg-[#0d0f14] space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-[#66c800]/20 text-[#66c800] flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-white">GossipSub 1.1</h4>
                  <p className="text-[11px] text-[#8a91a0] leading-normal">
                    Mesh-based pubsub with peer scoring, strict `StrictNoSign` content identification, Snappy compression, and sequencer validation.
                  </p>
                </div>
              </div>
            </div>

            {/* Speculative Unsafe Chain vs Canonical L1 */}
            <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#66c800]" />
                Speculative Unsafe Chain vs. Canonical L1 Ground Truth
              </h3>
              <div className="p-4 rounded-xl border border-[#2e3545] bg-[#0c0e14] text-xs space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-[#3c8aff] mt-1.5 shrink-0"></div>
                  <div>
                    <span className="font-bold text-white">Fast Speculative Execution:</span>
                    <p className="text-[#8a91a0] mt-0.5">
                      The L2 data retrieved via P2P is strictly a speculative extension (&quot;unsafe chain&quot;) to improve latency. Replicas process blocks immediately for responsive user transactions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-[#66c800] mt-1.5 shrink-0"></div>
                  <div>
                    <span className="font-bold text-white">Always Reorganizes to Canonical L1:</span>
                    <p className="text-[#8a91a0] mt-0.5">
                      The rollup node <strong className="text-white">always</strong> prioritizes Ethereum L1 data and reorganizes automatically if unsafe P2P blocks diverge from the batcher&apos;s published blobs on L1.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-[#ffd12f] mt-1.5 shrink-0"></div>
                  <div>
                    <span className="font-bold text-white">Zero Consensus Security Degradation:</span>
                    <p className="text-[#8a91a0] mt-0.5">
                      P2P behavior is a soft-rule: malicious peers are penalized, scored, and banned. Even if the entire P2P mesh were to fail, nodes cleanly fall back to high-latency canonical L1 derivation with complete security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Specifications Card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#3c8aff]" />
                P2P Network Parameters
              </h4>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-[#1f232c]">
                  <span className="text-[#8a91a0]">Discovery DHT</span>
                  <span className="text-white">Discv5</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1f232c]">
                  <span className="text-[#8a91a0]">Transport</span>
                  <span className="text-white">TCP (IPv4 & IPv6)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1f232c]">
                  <span className="text-[#8a91a0]">Handshake / Security</span>
                  <span className="text-[#66c800]">Libp2p-noise (XX)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1f232c]">
                  <span className="text-[#8a91a0]">Multiplexing</span>
                  <span className="text-white">mplex (6.7.0) & yamux</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1f232c]">
                  <span className="text-[#8a91a0]">PubSub Protocol</span>
                  <span className="text-[#3c8aff]">GossipSub 1.1</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1f232c]">
                  <span className="text-[#8a91a0]">Mesh Targets</span>
                  <span className="text-white">D=8 (Low: 6, High: 12)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1f232c]">
                  <span className="text-[#8a91a0]">Heartbeat Interval</span>
                  <span className="text-[#ffd12f]">0.5 seconds</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1f232c]">
                  <span className="text-[#8a91a0]">Compression</span>
                  <span className="text-white">Snappy (Single block)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#8a91a0]">Max Payload</span>
                  <span className="text-white">10 MiB</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-3">
              <h4 className="font-bold text-sm text-white">Official Reference</h4>
              <p className="text-xs text-[#8a91a0]">
                Base P2P implementation conforms to the OP Stack specification and Eth2 consensus P2P wire standards.
              </p>
              <a
                href="https://docs.base.org/llms.txt"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#3c8aff] hover:underline font-mono"
              >
                <span>Read in Base Documentation Index</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCV5 */}
      {activeTab === 'discv5' && (
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-[#3c8aff]" />
              Discv5 Node Discovery & Ethereum Node Record (ENR)
            </h3>
            <p className="text-xs text-[#8a91a0] mt-1">
              Base nodes discover peers using the Ethereum Discv5 DHT. Node records (ENRs) are signed base64 blobs containing network identity and OpStack filter tags.
            </p>
          </div>

          {/* ENR Structure Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">ENR Key-Value Fields</span>
                <span className="text-[10px] font-mono text-[#66c800] bg-[#66c800]/15 px-2 py-0.5 rounded">RLP Encoded</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-[#141720] border border-[#232732] flex justify-between">
                  <span className="text-[#3c8aff]">ip / ip6</span>
                  <span className="text-[#8a91a0]">IPv4 or IPv6 Address</span>
                </div>
                <div className="p-2 rounded-lg bg-[#141720] border border-[#232732] flex justify-between">
                  <span className="text-[#3c8aff]">tcp</span>
                  <span className="text-[#8a91a0]">Local LibP2P Listening Port (9222)</span>
                </div>
                <div className="p-2 rounded-lg bg-[#141720] border border-[#232732] flex justify-between">
                  <span className="text-[#3c8aff]">udp</span>
                  <span className="text-[#8a91a0]">Discv5 DHT Listening Port (9222)</span>
                </div>
                <div className="p-2 rounded-lg bg-[#141720] border border-[#232732] flex justify-between">
                  <span className="text-[#ffd12f]">opstack</span>
                  <span className="text-white">chain ID (varint) ++ fork ID (varint)</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">Sample Base Node ENR</span>
                <button
                  onClick={() => handleCopy('enr', 'enr:-J24QDS7...sample...base')}
                  className="text-xs text-[#8a91a0] hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'enr' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'enr' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 rounded-lg bg-[#11131a] border border-[#232732] font-mono text-[11px] text-[#3c8aff] break-all leading-relaxed">
                enr:-J24QGk8F_Z74b8r...84538453...V3VpZ...base64
              </div>
              <p className="text-[11px] text-[#8a91a0]">
                Discv5 is shared with L1 consensus, testnets, and execution nodes. Nodes only dial peers whose <code className="text-white font-mono">opstack</code> field matches the current chain ID and fork number.
              </p>
            </div>
          </div>

          {/* 5-Step Peer Discovery Pipeline */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider text-[#8a91a0]">
              Base 5-Stage Peer Discovery Pipeline
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0d0f14] space-y-1">
                <div className="font-mono text-[#3c8aff] font-bold">01. FINDNODES</div>
                <p className="text-[10.5px] text-[#8a91a0]">Fill DHT routing table via Discv5 UDP requests.</p>
              </div>
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0d0f14] space-y-1">
                <div className="font-mono text-[#3c8aff] font-bold">02. RANDOM PULL</div>
                <p className="text-[10.5px] text-[#8a91a0]">Iterate RandomNodes() to discover unexplored clusters.</p>
              </div>
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0d0f14] space-y-1">
                <div className="font-mono text-[#3c8aff] font-bold">03. FETCH RECORDS</div>
                <p className="text-[10.5px] text-[#8a91a0]">Pull ENR records when peer count drops below low-tide.</p>
              </div>
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0d0f14] space-y-1">
                <div className="font-mono text-[#ffd12f] font-bold">04. OPSTACK FILTER</div>
                <p className="text-[10.5px] text-[#8a91a0]">Verify chain ID and fork number match Base configuration.</p>
              </div>
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0d0f14] space-y-1">
                <div className="font-mono text-[#66c800] font-bold">05. DIAL PEER</div>
                <p className="text-[10.5px] text-[#8a91a0]">Initiate LibP2P Noise handshake if not on deny-list.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIBP2P */}
      {activeTab === 'libp2p' && (
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#3c8aff]" />
              LibP2P Transport, Handshake & Peer Management
            </h3>
            <p className="text-xs text-[#8a91a0] mt-1">
              Connections are established over TCP and secured with the Noise XX handshake using the node&apos;s secp256k1 network key.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-3">
              <h4 className="font-bold text-xs text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#66c800]" />
                Noise XX Handshake Security
              </h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                Prioritized in protocol negotiation. Secures the channel while proving ownership of the <code className="text-white font-mono">PeerID</code>. 
                Separate from consensus identity to protect sequencer privacy and allow multi-node redundancy.
              </p>
              <div className="p-2.5 rounded-lg bg-[#141720] text-xs font-mono text-[#b1b7c3] space-y-1 border border-[#232732]">
                <div>• Protocol: <span className="text-[#3c8aff]">/noise</span> (XX Pattern)</div>
                <div>• Identity: <span className="text-white">secp256k1 P2P Key</span></div>
                <div>• Negotiation: <span className="text-white">multistream-select 1.0</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-3">
              <h4 className="font-bold text-xs text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#ffd12f]" />
                Tide-System Peer Management
              </h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                Rollup nodes automatically regulate peer count using low-watermark (&quot;low tide&quot;) and high-watermark (&quot;high tide&quot;) boundaries.
              </p>
              <div className="p-2.5 rounded-lg bg-[#141720] text-xs font-mono text-[#b1b7c3] space-y-1 border border-[#232732]">
                <div>• Low Tide: <span className="text-[#ffd12f]">Search & dial new peers</span></div>
                <div>• High Tide: <span className="text-[#fc401f]">Prune lowest scoring peers</span></div>
                <div>• Grace Period: <span className="text-white">Protected upon joining</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOSSIPSUB & BLOCK TOPICS */}
      {activeTab === 'gossip' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#3c8aff]" />
                GossipSub 1.1 Block Propagation Topics
              </h3>
              <p className="text-xs text-[#8a91a0] mt-1">
                Base disseminates newly minted blocks across the network using snappy-compressed GossipSub topics formatted as:
                <code className="text-[#3c8aff] font-mono ml-1">/optimism/&lt;chainId&gt;/&lt;hardfork_version&gt;/blocks</code>
              </p>
            </div>

            {/* Hardfork Topics Selector */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              {gossipTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedTopic === topic.id
                      ? 'border-[#0052ff] bg-[#0052ff]/15 ring-1 ring-[#0052ff]'
                      : 'border-[#232730] bg-[#0e1014] hover:border-[#384050]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{topic.version.toUpperCase()}</span>
                    <span className="text-[10px] font-mono text-[#8a91a0]">{topic.hardfork}</span>
                  </div>
                  <div className="text-xs font-mono text-[#3c8aff] mt-2 truncate">
                    .../{topic.id === 'blocksv1' ? '0' : topic.id === 'blocksv2' ? '1' : topic.id === 'blocksv3' ? '2' : '3'}/blocks
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Topic Details */}
            {(() => {
              const current = gossipTopics.find((t) => t.id === selectedTopic)!;
              return (
                <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-3 mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f232c] pb-3">
                    <div>
                      <span className="text-xs font-mono text-[#8a91a0]">GossipSub Topic Path</span>
                      <div className="text-sm font-mono font-bold text-white">{current.topicPath}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#0052ff]/20 text-[#3c8aff] text-xs font-mono font-bold">
                      {current.hardfork}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-1">
                    <div>
                      <span className="text-[#8a91a0]">Block Wire Encoding:</span>
                      <div className="text-white mt-0.5">{current.structure}</div>
                    </div>
                    <div>
                      <span className="text-[#8a91a0]">Compression:</span>
                      <div className="text-white mt-0.5">{current.compression}</div>
                    </div>
                  </div>

                  <p className="text-xs text-[#b1b7c3] pt-2 border-t border-[#1f232c]">
                    <strong className="text-white">Specification Note:</strong> {current.note}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 5: EXTENDED VALIDATOR */}
      {activeTab === 'validator' && (
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#ffd12f]" />
              Extended Validator 10-Step Pipeline
            </h3>
            <p className="text-xs text-[#8a91a0] mt-1">
              Before relaying or submitting any gossiped block to Reth, the rollup node runs this strict validation pipeline to prevent spam and protect network integrity.
            </p>
          </div>

          <div className="space-y-2">
            {validationRules.map((rule) => {
              const isReject = rule.signal === 'REJECT';
              const isIgnore = rule.signal === 'IGNORE';
              return (
                <div
                  key={rule.step}
                  className="p-3 rounded-xl border border-[#232730] bg-[#0c0e14] flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#8a91a0] w-6">
                      #{rule.step.toString().padStart(2, '0')}
                    </span>
                    <div>
                      <div className="font-bold text-white">{rule.rule}</div>
                      <div className="text-[11px] text-[#8a91a0] mt-0.5">{rule.detail}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                      isReject
                        ? 'bg-[#fc401f]/15 text-[#fc401f]'
                        : isIgnore
                        ? 'bg-[#ffd12f]/15 text-[#ffd12f]'
                        : 'bg-[#66c800]/15 text-[#66c800]'
                    }`}
                  >
                    [{rule.signal}]
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: REQ-RESP SYNC PROTOCOL */}
      {activeTab === 'reqresp' && (
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#66c800]" />
              Req-Resp Sync: <code className="text-[#3c8aff] font-mono">payload_by_number</code>
            </h3>
            <p className="text-xs text-[#8a91a0] mt-1">
              Optional fast-sync protocol to request execution payloads by block number, fill gaps upon missed gossip, and sync short-to-medium ranges of unsafe L2 blocks.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono border-b border-[#1f232c] pb-2">
              <span className="text-[#8a91a0]">Protocol ID</span>
              <span className="text-[#3c8aff] font-bold">/opstack/req/payload_by_number/{currentNetwork.chainId}/0/</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-1">
              <div>
                <span className="text-[#8a91a0]">Request Format:</span>
                <p className="text-white mt-0.5">&lt;num&gt;: little-endian uint64</p>
              </div>
              <div>
                <span className="text-[#8a91a0]">Response Format:</span>
                <p className="text-white mt-0.5">&lt;res&gt;&lt;version&gt;&lt;payload&gt;</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#141720] border border-[#232732] text-xs space-y-1 font-mono">
              <div className="text-[#8a91a0]">Response Result Codes:</div>
              <div className="text-[#66c800]">• 0: Success (version + payload follow)</div>
              <div className="text-[#ffd12f]">• 1: Valid request, but payload unavailable</div>
              <div className="text-[#fc401f]">• 2: Invalid request</div>
              <div className="text-[#fc401f]">• 3+: Other error</div>
            </div>
          </div>

          {/* Interactive Simulation Console */}
          <div className="p-4 rounded-xl border border-[#0052ff]/30 bg-[#0052ff]/5 space-y-3">
            <h4 className="font-bold text-xs text-white flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-[#3c8aff]" />
              Interactive Req-Resp Simulator
            </h4>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8a91a0] font-mono">Block Number:</span>
                <input
                  type="number"
                  value={simulatedBlockNum}
                  onChange={(e) => setSimulatedBlockNum(Number(e.target.value))}
                  className="px-3 py-1 rounded-lg bg-[#141720] border border-[#2b303c] text-xs font-mono text-white outline-none w-36"
                />
              </div>

              <button
                onClick={handleSimulateReqResp}
                className="px-4 py-1.5 rounded-lg bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold transition-colors"
              >
                Fetch Payload By Number
              </button>
            </div>

            {simResult && (
              <div className="p-3 rounded-lg bg-[#0c0e14] border border-[#232730] font-mono text-xs space-y-1 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="text-[#66c800] font-bold">{simResult.status}</span>
                  <span className="text-[#8a91a0]">• Code {simResult.code}</span>
                </div>
                <p className="text-[#b1b7c3] text-[11px]">{simResult.details}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
