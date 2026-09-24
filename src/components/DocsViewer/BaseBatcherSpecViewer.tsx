import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ExternalLink, 
  Copy, 
  Check, 
  Zap, 
  Clock, 
  FileCode, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  Database,
  RefreshCw,
  Hash,
  Scale,
  Code2,
  Gauge,
  Sliders,
  Radio,
  FileArchive,
  ArrowDownUp
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface BaseBatcherSpecViewerProps {
  currentNetwork?: BaseNetwork;
}

export const BaseBatcherSpecViewer: React.FC<BaseBatcherSpecViewerProps> = ({ currentNetwork }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'simulator' | 'da_inbox' | 'throttling' | 'hardforks'>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Canonical addresses & parameters
  const BATCHER_INBOX_ADDRESS = '0xFf00000000000000000000000000000000008453'; // Standard OP Stack Base Inbox EOA
  const CANONICAL_BATCHER_SIGNER = '0x5050F69a9786F081509234F1a7F4684b5E5b76C9';
  const MAX_BLOB_PAYLOAD_BYTES = 130044; // 130,044 bytes per EIP-4844 blob

  // Channel Packing Simulator State
  const [numL2Blocks, setNumL2Blocks] = useState<number>(12);
  const [avgTxPerBlock, setAvgTxPerBlock] = useState<number>(45);
  const [avgTxSizeBytes, setAvgTxSizeBytes] = useState<number>(240);
  const [selectedCodec, setSelectedCodec] = useState<'brotli' | 'zlib'>('brotli');
  const [simChannelTimeoutL1Blocks, setSimChannelTimeoutL1Blocks] = useState<number>(300);

  // Throttling Simulator State
  const [currentBacklogBytes, setCurrentBacklogBytes] = useState<number>(180000);
  const [backlogWarningThreshold, setBacklogWarningThreshold] = useState<number>(150000);
  const [backlogCriticalThreshold, setBacklogCriticalThreshold] = useState<number>(300000);
  const [l1OriginDeltaSeconds, setL1OriginDeltaSeconds] = useState<number>(420);

  // Copy helper
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

  // Channel simulation calculations
  const simResults = useMemo(() => {
    // Uncompressed RLP estimate: block header overhead ~ 500 bytes + txs
    const perBlockRlp = 500 + (avgTxPerBlock * avgTxSizeBytes);
    const totalUncompressedRlp = numL2Blocks * perBlockRlp;

    // Compression ratio: Brotli ~ 0.28x on EVM tx data, zlib ~ 0.40x
    const ratio = selectedCodec === 'brotli' ? 0.28 : 0.40;
    // Add 1 byte codec prefix if brotli
    const codecPrefixBytes = selectedCodec === 'brotli' ? 1 : 0;
    const compressedPayloadBytes = Math.floor(totalUncompressedRlp * ratio) + codecPrefixBytes;

    // Frame overhead: 16 bytes channel_id + 2 bytes frame_number + 4 bytes payload_len + 1 byte is_last = 23 bytes
    const frameHeaderBytes = 23;
    const maxPayloadPerBlob = MAX_BLOB_PAYLOAD_BYTES - frameHeaderBytes; // ~130,021 bytes

    const totalBlobsNeeded = Math.max(1, Math.ceil(compressedPayloadBytes / maxPayloadPerBlob));
    
    // Generate frame breakdown
    const frames = [];
    let remainingBytes = compressedPayloadBytes;
    for (let i = 0; i < totalBlobsNeeded; i++) {
      const payloadSize = Math.min(remainingBytes, maxPayloadPerBlob);
      const isLast = i === totalBlobsNeeded - 1;
      frames.push({
        frameNumber: i,
        channelId: '0x3a91c5e8...74b2',
        payloadBytes: payloadSize,
        totalFrameBytes: payloadSize + frameHeaderBytes,
        isLast,
        codecPrefix: i === 0 && selectedCodec === 'brotli' ? '0x01 (Brotli)' : null
      });
      remainingBytes -= payloadSize;
    }

    // Decompression amplification ratio
    const amplification = (totalUncompressedRlp / Math.max(1, compressedPayloadBytes)).toFixed(2);

    return {
      perBlockRlp,
      totalUncompressedRlp,
      compressedPayloadBytes,
      compressionRatio: (ratio * 100).toFixed(1),
      totalBlobsNeeded,
      amplification,
      frames
    };
  }, [numL2Blocks, avgTxPerBlock, avgTxSizeBytes, selectedCodec]);

  // Throttler status evaluation
  const throttleStatus = useMemo(() => {
    if (currentBacklogBytes >= backlogCriticalThreshold) {
      return {
        level: 'PAUSED',
        color: 'text-[#fc401f]',
        bgColor: 'bg-[#fc401f]/15 border-[#fc401f]/30',
        action: 'Halt block production until in-flight frames confirm on L1.',
        percentage: 100
      };
    } else if (currentBacklogBytes >= backlogWarningThreshold) {
      const range = backlogCriticalThreshold - backlogWarningThreshold;
      const progress = Math.min(100, Math.floor(((currentBacklogBytes - backlogWarningThreshold) / range) * 100));
      return {
        level: 'GRADUATED THROTTLE',
        color: 'text-[#ffd12f]',
        bgColor: 'bg-[#ffd12f]/15 border-[#ffd12f]/30',
        action: `Slow block proposal cadence by ${Math.floor(20 + progress * 0.6)}% to match L1 DA throughput.`,
        percentage: 50 + Math.floor(progress * 0.5)
      };
    } else {
      return {
        level: 'NOMINAL',
        color: 'text-[#66c800]',
        bgColor: 'bg-[#66c800]/15 border-[#66c800]/30',
        action: 'Full-rate 2-second block production with zero sequencer drag.',
        percentage: Math.min(40, Math.floor((currentBacklogBytes / backlogWarningThreshold) * 40))
      };
    }
  }, [currentBacklogBytes, backlogWarningThreshold, backlogCriticalThreshold]);

  // Drift check: max 1800 seconds from Fjord onward
  const isDriftExceeded = l1OriginDeltaSeconds > 1800;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER */}
      <div className="rounded-2xl border border-[#222838] bg-gradient-to-br from-[#0e111a] via-[#101420] to-[#0c0e15] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0052ff]/20 text-[#3c8aff] border border-[#0052ff]/40 uppercase tracking-wider">
                Consensus &amp; Data Availability
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#66c800]/20 text-[#66c800] border border-[#66c800]/40">
                EIP-4844 Blob Submitter
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ffd12f]/20 text-[#ffd12f] border border-[#ffd12f]/40">
                Fjord + Holocene Spec
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Boxes className="h-6 w-6 text-[#0052ff]" />
              <span>Batcher (Batch Submitter) Specification</span>
            </h1>
            <p className="text-xs text-[#8a91a0] max-w-3xl leading-relaxed">
              Specification of the batcher component responsible for posting L2 sequencer data to Ethereum (L1) for Data Availability (DA). Covers the unsafe-to-safe head gap, channel encoding, Brotli compression, frame fragmentation into EIP-4844 blobs, strict Holocene delivery, and sequencer drift throttling.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => handleCopy(BATCHER_INBOX_ADDRESS, 'inbox_addr')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-white border border-[#252d42] text-xs font-mono transition-colors"
            >
              {copiedAddress === 'inbox_addr' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5 text-[#8a91a0]" />}
              <span>Batcher Inbox: {shortenAddress(BATCHER_INBOX_ADDRESS)}</span>
            </button>

            <a
              href="https://docs.base.org/specifications/base-protocol/batcher"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold transition-all shadow-md shadow-[#0052ff]/30"
            >
              <span>Base Docs Spec</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-[#1e2538] overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Pipeline Architecture & Heads', icon: Layers },
            { id: 'channels', label: 'Channel & Frame Structure', icon: FileArchive },
            { id: 'simulator', label: 'Channel & Blob Packer Simulator', icon: Zap },
            { id: 'da_inbox', label: 'Data Availability & Inbox EOA', icon: Database },
            { id: 'throttling', label: 'Sequencer Drift & Throttling', icon: Gauge },
            { id: 'hardforks', label: 'Fjord & Holocene Rules Matrix', icon: ShieldCheck },
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

      {/* TAB 1: OVERVIEW & PIPELINE */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Architecture visual */}
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#0052ff]" />
                  <span>The Unsafe Head to Safe Head Lifecycle</span>
                </h3>
                <p className="text-xs text-[#8a91a0]">
                  How the batch submitter continuously bridges the gap between sequenced L2 blocks and canonical L1-confirmed blocks.
                </p>
              </div>
            </div>

            {/* 4-Stage Workflow diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#fc401f]/20 text-[#fc401f] font-bold">STAGE 1</span>
                  <Radio className="h-4 w-4 text-[#fc401f]" />
                </div>
                <h4 className="font-bold text-white text-sm">Unsafe L2 Head</h4>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Sequencer produces blocks every 2s on Base. These blocks are broadcast via P2P gossip and represent the latest execution state (unsafe head).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ffd12f]/20 text-[#ffd12f] font-bold">STAGE 2</span>
                  <FileArchive className="h-4 w-4 text-[#ffd12f]" />
                </div>
                <h4 className="font-bold text-white text-sm">Channel Encoding</h4>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Batcher batches unconfirmed blocks in strictly increasing order, compresses them via Brotli (RFC 7932), and slices them into fixed-size frames.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3c8aff]/20 text-[#3c8aff] font-bold">STAGE 3</span>
                  <Database className="h-4 w-4 text-[#3c8aff]" />
                </div>
                <h4 className="font-bold text-white text-sm">EIP-4844 Blob DA</h4>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Frames are posted as EIP-4844 blob transactions to the designated Batcher Inbox EOA on Ethereum, signed by the authenticated batcher key.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#66c800]/20 text-[#66c800] font-bold">STAGE 4</span>
                  <CheckCircle2 className="h-4 w-4 text-[#66c800]" />
                </div>
                <h4 className="font-bold text-white text-sm">Safe L2 Head</h4>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Verifier derivation nodes read L1 blob frames, reassemble channels, decode batches, and advance the canonical Safe L2 Head.
                </p>
              </div>
            </div>

            {/* Invariants and Rules */}
            <div className="p-4 rounded-xl bg-[#08090d] border border-[#1e2538] space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#3c8aff]" />
                <span>Fundamental Protocol Invariants</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#8a91a0]">
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0052ff] mt-1.5 shrink-0" />
                  <p><strong className="text-white">Single Open Channel:</strong> At most one channel may be open at any time. A new channel cannot be opened until all frames of the previous channel are submitted.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0052ff] mt-1.5 shrink-0" />
                  <p><strong className="text-white">Strict Block Continuity:</strong> Each block must be the direct child (parentHash match) of the previous block with zero gaps or overlaps.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0052ff] mt-1.5 shrink-0" />
                  <p><strong className="text-white">Deterministic Reorg Recovery:</strong> If the L2 chain reorgs, all unconfirmed channels and in-flight states are purged and reconstructed from the new canonical tip.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0052ff] mt-1.5 shrink-0" />
                  <p><strong className="text-white">Holocene Strict Monotonicity:</strong> Non-first frames must have <code>frame_number == prev + 1</code>. Batch timestamps within a channel must strictly increase.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHANNELS & FRAMES */}
      {activeTab === 'channels' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-[#ffd12f]" />
                <span>Channel Lifecycle &amp; Frame Layout Specification</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Channels encapsulate an ordered, compressed stream of RLP block batches. When closed, channels are sliced into frames that fit into L1 DA blobs.
              </p>
            </div>

            {/* Three closure triggers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#fc401f]" />
                  <span className="font-bold text-white">1. Max Blob Payload Capacity</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  A channel closes when adding the next batch would cause the compressed output to exceed the <strong>130,044 bytes</strong> blob limit. The overflowing batch is withheld and starts the next channel.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#ffd12f]" />
                  <span className="font-bold text-white">2. max_rlp_bytes_per_channel</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Enforces an uncompressed RLP size cap to protect verifiers from <strong>decompression amplification bombs</strong> (where a small payload expands to hundreds of megabytes).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#3c8aff]" />
                  <span className="font-bold text-white">3. max_channel_duration Timeout</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  Channels close on timeout if L1 advances more than <code>max_channel_duration</code> L1 blocks beyond the channel opening block. Prevents verifier frame buffers from timing out.
                </p>
              </div>
            </div>

            {/* Wire Format Specification */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[#66c800]" />
                <span>Binary Frame Wire Format (OP-Stack Specification)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#3c8aff] font-bold block">channel_id</span>
                  <span className="text-[10px] text-[#8a91a0]">16 Bytes</span>
                  <span className="text-[9px] text-[#717886] block mt-1">Unique UUID</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#ffd12f] font-bold block">frame_number</span>
                  <span className="text-[10px] text-[#8a91a0]">2 Bytes (uint16)</span>
                  <span className="text-[9px] text-[#717886] block mt-1">0, 1, 2... (strict)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#66c800] font-bold block">frame_data_length</span>
                  <span className="text-[10px] text-[#8a91a0]">4 Bytes (uint32)</span>
                  <span className="text-[9px] text-[#717886] block mt-1">Byte length</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-[#fc401f] font-bold block">is_last</span>
                  <span className="text-[10px] text-[#8a91a0]">1 Byte (uint8)</span>
                  <span className="text-[9px] text-[#717886] block mt-1">0 = false, 1 = true</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#08090d] border border-[#222838]">
                  <span className="text-white font-bold block">frame_data</span>
                  <span className="text-[10px] text-[#8a91a0]">Variable</span>
                  <span className="text-[9px] text-[#717886] block mt-1">Compressed payload</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#08090d] border border-[#1e2538] text-[11px] text-[#dee1e7] font-mono leading-relaxed">
                <span className="text-[#ffd12f] font-bold">// First Frame Codec Prefix Note:</span><br />
                The very first frame (<code className="text-[#3c8aff]">frame_number = 0</code>) prefixes <code className="text-[#66c800]">frame_data</code> with a 1-byte compression version: <code className="text-[#66c800]">0x01</code> for Brotli (Fjord+). All subsequent frames contain raw compressed chunks with no prefix.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHANNEL & BLOB PACKER SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#3c8aff]" />
                  <span>Channel Packing &amp; EIP-4844 Blob Fragmentation Simulator</span>
                </h3>
                <p className="text-xs text-[#8a91a0]">
                  Prospectively calculate channel compression ratios, shadow compressor output, and blob frame partitioning.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8a91a0] font-mono">Max Blob DA: 130,044 Bytes</span>
              </div>
            </div>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#101420] border border-[#1e2538] text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#8a91a0]">L2 Blocks In Channel:</span>
                  <span className="text-white font-mono font-bold">{numL2Blocks} blocks</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={numL2Blocks}
                  onChange={(e) => setNumL2Blocks(Number(e.target.value))}
                  className="w-full accent-[#0052ff]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#8a91a0]">Avg Tx / Block:</span>
                  <span className="text-white font-mono font-bold">{avgTxPerBlock} txs</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={avgTxPerBlock}
                  onChange={(e) => setAvgTxPerBlock(Number(e.target.value))}
                  className="w-full accent-[#0052ff]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#8a91a0]">Avg Tx Size:</span>
                  <span className="text-white font-mono font-bold">{avgTxSizeBytes} B</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  step="20"
                  value={avgTxSizeBytes}
                  onChange={(e) => setAvgTxSizeBytes(Number(e.target.value))}
                  className="w-full accent-[#0052ff]"
                />
              </div>

              <div>
                <span className="text-[11px] text-[#8a91a0] block mb-1">Compression Codec:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedCodec('brotli')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCodec === 'brotli'
                        ? 'bg-[#0052ff] text-white shadow-sm'
                        : 'bg-[#0a0c12] text-[#8a91a0] border border-[#222838]'
                    }`}
                  >
                    Brotli (0x01)
                  </button>
                  <button
                    onClick={() => setSelectedCodec('zlib')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCodec === 'zlib'
                        ? 'bg-[#ffd12f]/20 text-[#ffd12f] border border-[#ffd12f]/40'
                        : 'bg-[#0a0c12] text-[#8a91a0] border border-[#222838]'
                    }`}
                  >
                    zlib (Legacy)
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1">
                <span className="text-[11px] text-[#8a91a0]">Uncompressed RLP Size</span>
                <div className="text-lg font-bold font-mono text-white">
                  {(simResults.totalUncompressedRlp / 1024).toFixed(1)} KB
                </div>
                <span className="text-[10px] text-[#717886] font-mono">{simResults.totalUncompressedRlp.toLocaleString()} bytes</span>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1">
                <span className="text-[11px] text-[#8a91a0]">Compressed Channel Size</span>
                <div className="text-lg font-bold font-mono text-[#66c800]">
                  {(simResults.compressedPayloadBytes / 1024).toFixed(1)} KB
                </div>
                <span className="text-[10px] text-[#717886] font-mono">~{simResults.compressionRatio}% of uncompressed</span>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1">
                <span className="text-[11px] text-[#8a91a0]">EIP-4844 Blobs Needed</span>
                <div className="text-lg font-bold font-mono text-[#3c8aff]">
                  {simResults.totalBlobsNeeded} {simResults.totalBlobsNeeded === 1 ? 'Blob' : 'Blobs'}
                </div>
                <span className="text-[10px] text-[#717886] font-mono">{simResults.frames.length} frames total</span>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1">
                <span className="text-[11px] text-[#8a91a0]">Amplification Factor</span>
                <div className="text-lg font-bold font-mono text-[#ffd12f]">
                  {simResults.amplification}x
                </div>
                <span className="text-[10px] text-[#717886] font-mono">Safe under protocol cap</span>
              </div>
            </div>

            {/* Generated Frames Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Partitioned Frame Queue (In-Flight to L1)</span>
                <span className="text-[11px] font-mono text-[#8a91a0]">Strict Order Delivery Required</span>
              </h4>

              <div className="rounded-xl border border-[#1e2538] bg-[#0a0c12] overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1e2538] text-[11px] text-[#8a91a0] bg-[#101420]">
                      <th className="p-3">Frame #</th>
                      <th className="p-3">Channel ID</th>
                      <th className="p-3">Payload Size</th>
                      <th className="p-3">Header Overhead</th>
                      <th className="p-3">Version Prefix</th>
                      <th className="p-3">is_last Flag</th>
                      <th className="p-3">DA Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181e2e] text-[#dee1e7]">
                    {simResults.frames.map((f) => (
                      <tr key={f.frameNumber} className="hover:bg-[#121624]/60 transition-colors">
                        <td className="p-3 text-[#3c8aff] font-bold">#{f.frameNumber}</td>
                        <td className="p-3 text-[#8a91a0]">{f.channelId}</td>
                        <td className="p-3">{f.payloadBytes.toLocaleString()} B</td>
                        <td className="p-3 text-[#8a91a0]">23 B</td>
                        <td className="p-3">
                          {f.codecPrefix ? (
                            <span className="px-2 py-0.5 rounded bg-[#66c800]/20 text-[#66c800] text-[10px]">
                              {f.codecPrefix}
                            </span>
                          ) : (
                            <span className="text-[#717886] text-[10px]">None (Continuation)</span>
                          )}
                        </td>
                        <td className="p-3">
                          {f.isLast ? (
                            <span className="px-2 py-0.5 rounded bg-[#66c800]/20 text-[#66c800] text-[10px] font-bold">
                              true (Final)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-[#1e2538] text-[#8a91a0] text-[10px]">
                              false
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#0052ff]/20 text-[#3c8aff] text-[10px]">
                            EIP-4844 Blob #{f.frameNumber + 1}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA AVAILABILITY & INBOX EOA */}
      {activeTab === 'da_inbox' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-[#0052ff]" />
                <span>Batcher Inbox &amp; Cryptographic Sender Authentication</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Batcher transactions are addressed to an un-deployed EOA rather than a smart contract to optimize L1 gas and calldata consumption.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inbox Details */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#3c8aff]" />
                  <span>Batcher Inbox Address (EOA)</span>
                </span>
                
                <div className="p-3 rounded-lg bg-[#08090d] border border-[#222838] font-mono text-xs text-[#dee1e7] flex items-center justify-between">
                  <span className="truncate mr-2">{BATCHER_INBOX_ADDRESS}</span>
                  <button
                    onClick={() => handleCopy(BATCHER_INBOX_ADDRESS, 'inbox_detail')}
                    className="p-1 hover:text-white text-[#8a91a0]"
                  >
                    {copiedAddress === 'inbox_detail' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <p className="text-xs text-[#8a91a0] leading-relaxed">
                  Designated EOA used as the target address for all batcher transactions. Because there is no smart contract bytecode executed on L1, gas is purely consumed by base tx overhead and 4844 blob gas.
                </p>
              </div>

              {/* Authentication */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#66c800]" />
                  <span>SystemConfig batcherAddress Authentication</span>
                </span>

                <div className="p-3 rounded-lg bg-[#08090d] border border-[#222838] font-mono text-xs text-[#dee1e7] flex items-center justify-between">
                  <span className="truncate mr-2">{CANONICAL_BATCHER_SIGNER}</span>
                  <button
                    onClick={() => handleCopy(CANONICAL_BATCHER_SIGNER, 'signer_detail')}
                    className="p-1 hover:text-white text-[#8a91a0]"
                  >
                    {copiedAddress === 'signer_detail' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <p className="text-xs text-[#8a91a0] leading-relaxed">
                  The derivation pipeline authenticates transactions by recovering the ECDSA signature of the L1 tx and comparing it against the <code>batcherAddress</code> in the <code>SystemConfig</code> contract. Transactions from any other sender are dropped immediately.
                </p>
              </div>
            </div>

            {/* Resubmissions and Byte-Identical Invariant */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-[#ffd12f]" />
                <span>Byte-Identical Resubmission Rule</span>
              </h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                If an L1 transaction carrying a frame is dropped from the mempool or reorganized off L1, the batcher must resubmit that frame and all subsequent frames in the channel. <strong>Resubmitted frames must be strictly byte-identical to the originals</strong>: verifier nodes index frames by <code>(channel_id, frame_number)</code>. Any mismatch in payload or length will cause verifiers to flag the channel as corrupt and drop it completely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SEQUENCER DRIFT & THROTTLING */}
      {activeTab === 'throttling' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gauge className="h-5 w-5 text-[#fc401f]" />
                <span>Sequencer Drift (1800s) &amp; Backlog Throttling Feedback Loop</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Controls to prevent the L2 sequencer from generating state faster than the batch submitter can confirm to Ethereum L1.
              </p>
            </div>

            {/* Throttler status display */}
            <div className={`p-4 rounded-xl border ${throttleStatus.bgColor} space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className={`h-5 w-5 ${throttleStatus.color}`} />
                  <span className={`text-xs font-bold font-mono uppercase tracking-wider ${throttleStatus.color}`}>
                    Batcher Feedback Signal: {throttleStatus.level}
                  </span>
                </div>
                <span className="text-xs font-mono text-white font-bold">
                  Backlog: {(currentBacklogBytes / 1024).toFixed(1)} KB
                </span>
              </div>
              <p className="text-xs text-[#dee1e7]">
                {throttleStatus.action}
              </p>
            </div>

            {/* Interactive Throttler Slider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Simulate DA Backlog</h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8a91a0]">Unconfirmed Sequencer Backlog:</span>
                      <span className="text-white font-mono font-bold">{(currentBacklogBytes / 1024).toFixed(1)} KB</span>
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="450000"
                      step="10000"
                      value={currentBacklogBytes}
                      onChange={(e) => setCurrentBacklogBytes(Number(e.target.value))}
                      className="w-full accent-[#0052ff]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] text-[#8a91a0] pt-2">
                    <div>
                      <span>Warning Threshold:</span>
                      <p className="text-white font-mono font-bold">{(backlogWarningThreshold / 1024).toFixed(0)} KB</p>
                    </div>
                    <div>
                      <span>Pause Threshold:</span>
                      <p className="text-white font-mono font-bold">{(backlogCriticalThreshold / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sequencer Drift Simulator */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sequencer Drift (Fjord 1800s Limit)</h4>
                  {isDriftExceeded ? (
                    <span className="px-2 py-0.5 rounded bg-[#fc401f]/20 text-[#fc401f] text-[10px] font-bold">
                      EXCEEDED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[#66c800]/20 text-[#66c800] text-[10px] font-bold">
                      VALID
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8a91a0]">L2 Timestamp vs L1 Origin Delta:</span>
                      <span className={`font-mono font-bold ${isDriftExceeded ? 'text-[#fc401f]' : 'text-[#66c800]'}`}>
                        {l1OriginDeltaSeconds}s / 1800s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2400"
                      step="30"
                      value={l1OriginDeltaSeconds}
                      onChange={(e) => setL1OriginDeltaSeconds(Number(e.target.value))}
                      className="w-full accent-[#fc401f]"
                    />
                  </div>

                  <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                    {isDriftExceeded ? (
                      <span className="text-[#fc401f]">
                        <strong>CRITICAL:</strong> Delta exceeds 1800s. The derivation pipeline will reject user transactions and only accept deposit-only blocks!
                      </span>
                    ) : (
                      <span>
                        L2 timestamp is within the canonical 1800-second drift window. Sequencer may include arbitrary user transactions.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: HARDFORKS MATRIX */}
      {activeTab === 'hardforks' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#66c800]" />
                <span>Fjord &amp; Holocene Hardfork Protocol Rules Matrix</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Key protocol enhancements governing channel compression, decompression caps, and frame ordering invariants.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fjord */}
              <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#3c8aff]/20 text-[#3c8aff] uppercase">
                    Fjord Hardfork
                  </span>
                  <span className="text-[11px] font-mono text-[#8a91a0]">Compression &amp; Drift</span>
                </div>
                <h4 className="text-sm font-bold text-white">Brotli Codec &amp; Relaxed Channel Limits</h4>
                
                <ul className="space-y-2 text-xs text-[#8a91a0] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#66c800] mt-0.5 shrink-0" />
                    <span>Replaces legacy <strong>zlib</strong> with <strong>Brotli (RFC 7932)</strong>, saving 15-25% in L1 DA blob costs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#66c800] mt-0.5 shrink-0" />
                    <span>First frame carries <code>0x01</code> version byte. Lower nibble must not be <code>0x08</code> or <code>0x0f</code> to avoid zlib collisions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#66c800] mt-0.5 shrink-0" />
                    <span>Substantially increases <code>max_rlp_bytes_per_channel</code> and fixes <code>max_sequencer_drift</code> to 1800s.</span>
                  </li>
                </ul>
              </div>

              {/* Holocene */}
              <div className="p-5 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffd12f]/20 text-[#ffd12f] uppercase">
                    Holocene Hardfork
                  </span>
                  <span className="text-[11px] font-mono text-[#8a91a0]">Strict Ordering</span>
                </div>
                <h4 className="text-sm font-bold text-white">Strict Contiguous Frame &amp; Timestamp Invariants</h4>

                <ul className="space-y-2 text-xs text-[#8a91a0] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#ffd12f] mt-0.5 shrink-0" />
                    <span><strong>Strict Frame Ordering:</strong> Non-first frames must have <code>frame_number == prev + 1</code>. Any out-of-order frame causes channel drop.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#ffd12f] mt-0.5 shrink-0" />
                    <span><strong>No Interleaved Channels:</strong> If a new first frame arrives before the previous channel's final frame is seen, the incomplete channel is dropped.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#ffd12f] mt-0.5 shrink-0" />
                    <span><strong>Monotonic Batch Timestamps:</strong> Batches in a channel must have strictly increasing L2 timestamps with zero duplicate timestamps.</span>
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
