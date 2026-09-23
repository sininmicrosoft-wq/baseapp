import React, { useState } from 'react';
import { 
  GitCommit, 
  Workflow, 
  FileCode, 
  Database, 
  Binary, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ChevronRight, 
  Server, 
  Cpu, 
  Box, 
  Layers, 
  RotateCcw, 
  Play, 
  Sliders, 
  Info,
  Copy,
  Check
} from 'lucide-react';
import { triggerConfetti } from '../../utils/web3Helper';

export const DerivationPipelineViewer: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(0);
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedWire, setCopiedWire] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'stages' | 'simulator' | 'wireformat' | 'reorgs'>('stages');

  // L2 Derivation State
  const [chainState, setChainState] = useState({
    l1BlockNumber: 20412890,
    safeL2Head: 18940210,
    unsafeL2Head: 18940216,
    finalizedL2Head: 18940198,
    channelBankSizeMb: 14.2,
    bufferedBatches: 6,
    l1Epoch: 20412890,
  });

  const stages = [
    {
      id: 1,
      name: 'L1 Traversal',
      short: 'Traversal',
      role: 'Reads the header of the next L1 block',
      inputs: 'L1 Ethereum block header stream',
      outputs: 'L1 block reference (number, hash, timestamp)',
      desc: 'In normal operations, reads new L1 blocks as they get created or during sync. Updates the local copy of the SystemConfig contract to ensure accurate batcher authentication.',
      parameters: ['SystemConfig updates: Type 0-7 (batcherHash, gasLimit, scalars)'],
      validations: ['Detects L1 reorgs', 'Maintains L1 origin reference'],
    },
    {
      id: 2,
      name: 'L1 Retrieval',
      short: 'Retrieval',
      role: 'Filters & extracts batcher transactions',
      inputs: 'L1 block transactions & receipts',
      outputs: 'Calldata / EIP-4844 blobs from Batcher',
      desc: 'Reads batcher transactions from the block where tx.to matches the Batch Inbox Address and tx.from matches the authenticated batch-sender from SystemConfig.',
      parameters: ['Batch Inbox Address: 0xFF00000000000000000000000000000000008453', 'Version byte 0x00 (frames) or 0x01 (da_commitment)'],
      validations: ['Validates sender signature matches SystemConfig', 'Discards unknown version bytes'],
    },
    {
      id: 3,
      name: 'Frame Queue',
      short: 'Frame Queue',
      role: 'Decodes and buffers channel frames',
      inputs: 'Batcher transaction calldata',
      outputs: 'Stream of individual channel frames',
      desc: 'Buffers one batcher data-transaction at a time and splits it into channel frames according to the 23-byte fixed header format.',
      parameters: ['Fixed overhead: 23 bytes per frame', 'Max frame_data_length: 1,000,000 bytes'],
      validations: ['Validates frame big-endian uint16/uint32 encodings', 'Rejects transaction if any frame fails parsing'],
    },
    {
      id: 4,
      name: 'Channel Bank',
      short: 'Channel Bank',
      role: 'Assembles interleaved channel frames',
      inputs: 'Channel frames from multiple channels',
      outputs: 'Ready, contiguous closed channels',
      desc: 'Buffers frames into channels in FIFO order. Prunes oldest channels if MAX_CHANNEL_BANK_SIZE is exceeded, and times out channels older than CHANNEL_TIMEOUT L1 blocks.',
      parameters: ['MAX_CHANNEL_BANK_SIZE: 1,000,000,000 bytes (Fjord)', 'Canyon FIFO ready rule'],
      validations: ['Drops duplicate frames', 'Prunes timed-out channels', 'Detects is_last == 1 closing frame'],
    },
    {
      id: 5,
      name: 'Channel Reader (Decoding)',
      short: 'Decompression',
      role: 'Decompresses byte streams into batches',
      inputs: 'Closed channel byte streams',
      outputs: 'Decoded sequencer batches',
      desc: 'Applies streaming ZLIB or Brotli decompression to the channel data, enforcing the MAX_RLP_BYTES_PER_CHANNEL safeguard to prevent zip-bomb attacks.',
      parameters: ['MAX_RLP_BYTES_PER_CHANNEL: 100,000,000 bytes (Fjord)', 'ZLIB RFC-1950 / Brotli decompression'],
      validations: ['Limits uncompressed RLP bytes', 'Rejects malformed RLP data streams'],
    },
    {
      id: 6,
      name: 'Batch Queue',
      short: 'Batch Queue',
      role: 'Reorders batches & generates empty fills',
      inputs: 'Decoded batches from reader',
      outputs: 'Ordered, gapless batch stream',
      desc: 'Validates batches against the safe head. Applies drop / accept / undecided / future rules. If gaps exist after the sequencing window, generates empty batches to preserve time invariants.',
      parameters: ['max_sequencer_drift: 1800s (Fjord constant)', 'L2 block time: 2.0s', 'Expected epoch size: 6 L2 blocks'],
      validations: ['batch.timestamp checks', 'parent_hash == safe_head.hash', 'batch.epoch_num <= epoch.number + 1'],
    },
    {
      id: 7,
      name: 'Payload Attributes Derivation',
      short: 'Attributes',
      role: 'Builds Execution Payload Attributes',
      inputs: 'Sequencer batch + L1 origin header + L1 deposits',
      outputs: 'PayloadAttributesV3 object for Reth',
      desc: 'Constructs the deterministic block inputs: 1) L1 attributes deposited tx, 2) user deposits from L1 receipts (first block of epoch), 3) sequencer user transactions, with noTxPool=true.',
      parameters: ['L1 Attributes Predeploy: 0x4200000000000000000000000000000000000002', 'noTxPool: true'],
      validations: ['Enforces strict transaction ordering', 'Injects Cancun parent_beacon_block_root'],
    },
    {
      id: 8,
      name: 'Engine Queue',
      short: 'Engine Queue',
      role: 'Drives execution engine via Engine API',
      inputs: 'PayloadAttributesV3',
      outputs: 'Canonical L2 block & forkchoice update',
      desc: 'Communicates with the Reth execution engine via engine_forkchoiceUpdatedV3, engine_getPayloadV3, and engine_newPayloadV3. Consolidates unsafe blocks into safe blocks.',
      parameters: ['Reth runtime Engine API', 'Consolidation matching (parent_hash, timestamp, tx list)'],
      validations: ['Manages finalized, safe, and unsafe heads', 'Triggers pipeline reset on L1 reorg'],
    },
  ];

  const handleSimulateNextStep = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimStep((prev) => (prev + 1) % 8);

      if (simStep === 7) {
        // Complete cycle: advance safe head by 1 block
        setChainState((prev) => ({
          ...prev,
          safeL2Head: prev.safeL2Head + 1,
          bufferedBatches: Math.max(0, prev.bufferedBatches - 1),
        }));
        triggerConfetti();
      }
    }, 450);
  };

  const handleRunFullEpoch = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setChainState((prev) => ({
        ...prev,
        l1BlockNumber: prev.l1BlockNumber + 1,
        l1Epoch: prev.l1Epoch + 1,
        safeL2Head: prev.safeL2Head + 6, // 12s / 2s = 6 blocks
        finalizedL2Head: prev.finalizedL2Head + 6,
        unsafeL2Head: prev.unsafeL2Head + 6,
      }));
      setSimStep(0);
      triggerConfetti();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0052ff] animate-pulse"></span>
              <span className="text-xs font-mono font-bold uppercase text-[#3c8aff]">
                Base Rollup Specification
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              L2 Chain Derivation Pipeline & Wire Format
            </h3>
            <p className="text-xs text-[#8a91a0] mt-0.5 max-w-2xl">
              Specification of how the rollup node deterministically derives canonical Base L2 blocks from Ethereum L1 batch data, channel frames, and deposit events.
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0e1014] border border-[#232730] text-xs font-mono">
            <button
              onClick={() => setActiveSubTab('stages')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeSubTab === 'stages' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              8 Stages
            </button>
            <button
              onClick={() => setActiveSubTab('simulator')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeSubTab === 'simulator' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              Live Runner
            </button>
            <button
              onClick={() => setActiveSubTab('wireformat')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeSubTab === 'wireformat' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              Wire Format
            </button>
            <button
              onClick={() => setActiveSubTab('reorgs')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeSubTab === 'reorgs' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              Reorgs & Reset
            </button>
          </div>
        </div>

        {/* Live Forkchoice Bar */}
        <div className="pt-3 border-t border-[#1f232c] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-[#0e1014] border border-[#1f232b]">
            <div className="text-[10px] text-[#8a91a0] uppercase font-mono">Current L1 Origin</div>
            <div className="font-mono text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span>#{chainState.l1BlockNumber}</span>
              <span className="text-[10px] text-[#3c8aff] font-normal">Epoch {chainState.l1Epoch}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0e1014] border border-[#1f232b]">
            <div className="text-[10px] text-[#8a91a0] uppercase font-mono">Safe L2 Head (Derived)</div>
            <div className="font-mono text-sm font-bold text-[#66c800] flex items-center gap-1.5 mt-0.5">
              <span>#{chainState.safeL2Head}</span>
              <span className="text-[10px] bg-[#66c800]/10 text-[#66c800] px-1 rounded">Canonical</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0e1014] border border-[#1f232b]">
            <div className="text-[10px] text-[#8a91a0] uppercase font-mono">Unsafe L2 Head (200ms)</div>
            <div className="font-mono text-sm font-bold text-[#3c8aff] flex items-center gap-1.5 mt-0.5">
              <span>#{chainState.unsafeL2Head}</span>
              <span className="text-[10px] bg-[#3c8aff]/10 text-[#3c8aff] px-1 rounded">+6 ahead</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0e1014] border border-[#1f232b]">
            <div className="text-[10px] text-[#8a91a0] uppercase font-mono">Finalized L2 Head</div>
            <div className="font-mono text-sm font-bold text-[#dee1e7] flex items-center gap-1.5 mt-0.5">
              <span>#{chainState.finalizedL2Head}</span>
              <span className="text-[10px] bg-[#232730] text-[#8a91a0] px-1 rounded">L1 Beacon</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: 8 PIPELINE STAGES EXPLORER */}
      {activeSubTab === 'stages' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Visual 8-Stage Pipeline Flow */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8a91a0] font-mono">
                Pipeline Stages (L1 Data In → L2 Block Out)
              </span>
              <span className="text-[11px] text-[#3c8aff] font-mono">
                Reverse Step Execution: Innermost stage stepped first
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {stages.map((stg, idx) => (
                <button
                  key={stg.id}
                  onClick={() => setSelectedStage(idx)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[90px] ${
                    selectedStage === idx
                      ? 'border-[#0052ff] bg-[#0052ff]/10 text-white ring-1 ring-[#0052ff]'
                      : 'border-[#232730] bg-[#0e1014] text-[#8a91a0] hover:text-white hover:border-[#384050]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#717886]">
                      0{stg.id}
                    </span>
                    {selectedStage === idx && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0052ff]"></span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs leading-tight text-white">{stg.short}</div>
                    <div className="text-[9px] text-[#717886] mt-0.5 line-clamp-1">Stage {stg.id}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Stage Detail Panel */}
          {(() => {
            const current = stages[selectedStage];
            return (
              <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#0052ff]/15 text-[#3c8aff] flex items-center justify-center font-bold text-base border border-[#0052ff]/30">
                      0{current.id}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white">Stage {current.id}: {current.name}</h4>
                      <p className="text-xs text-[#8a91a0]">{current.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedStage((prev) => Math.max(0, prev - 1))}
                      disabled={selectedStage === 0}
                      className="px-2.5 py-1 rounded-lg bg-[#181a22] text-xs text-[#dee1e7] disabled:opacity-30 border border-[#2b303c]"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setSelectedStage((prev) => Math.min(stages.length - 1, prev + 1))}
                      disabled={selectedStage === stages.length - 1}
                      className="px-2.5 py-1 rounded-lg bg-[#0052ff] text-xs text-white disabled:opacity-30 font-bold"
                    >
                      Next Stage
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Workflow className="h-4 w-4 text-[#3c8aff]" />
                      <span>Data In / Out Specifications</span>
                    </div>
                    <div className="space-y-1.5 text-[#dee1e7]">
                      <div>
                        <span className="text-[#8a91a0]">Input:</span> <span className="font-mono text-white">{current.inputs}</span>
                      </div>
                      <div>
                        <span className="text-[#8a91a0]">Output:</span> <span className="font-mono text-[#66c800]">{current.outputs}</span>
                      </div>
                    </div>
                    <p className="text-[#8a91a0] pt-2 border-t border-[#1f232b] leading-relaxed">
                      {current.desc}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-3">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-[#ffd12f]" />
                      <span>Protocol Parameters & Bounds</span>
                    </div>
                    <ul className="space-y-1.5 text-[#dee1e7]">
                      {current.parameters.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 font-mono text-[11px]">
                          <span className="text-[#ffd12f] font-bold">›</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-[#1f232b]">
                      <div className="text-[11px] font-bold text-[#8a91a0] uppercase mb-1">
                        Validity Rules Enforced:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {current.validations.map((v, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-[#161a24] border border-[#232938] text-[10px] text-[#3c8aff] font-mono"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SUBTAB 2: LIVE DERIVATION STEP RUNNER */}
      {activeSubTab === 'simulator' && (
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-base text-white">Interactive Derivation Step Engine</h4>
              <p className="text-xs text-[#8a91a0] mt-0.5">
                Simulate how the Rollup Node processes an L1 epoch and drives the Reth Execution Engine.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateNextStep}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-[#0052ff] hover:bg-[#0048e0] text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{isSimulating ? 'Processing...' : 'Step Pipeline (1 Action)'}</span>
              </button>

              <button
                onClick={handleRunFullEpoch}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-[#191c24] hover:bg-[#202532] border border-[#2c3240] text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#66c800]" />
                <span>Derive Full Epoch (+6 Blocks)</span>
              </button>
            </div>
          </div>

          {/* Stepper Visualizer */}
          <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[#3c8aff]">
                Active Step: {stages[simStep].name} (Stage {simStep + 1} of 8)
              </span>
              <span className="text-[#8a91a0] font-mono text-[11px]">
                Safe Head: #{chainState.safeL2Head}
              </span>
            </div>

            <div className="w-full bg-[#161820] h-2.5 rounded-full overflow-hidden flex">
              {stages.map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 transition-colors border-r border-[#0e1014] ${
                    idx === simStep
                      ? 'bg-[#0052ff] animate-pulse'
                      : idx < simStep
                      ? 'bg-[#66c800]'
                      : 'bg-[#232730]'
                  }`}
                />
              ))}
            </div>

            <div className="p-3 rounded-lg bg-[#141722] border border-[#232a3b] text-xs text-[#dee1e7]">
              <div className="font-bold text-white mb-1">Executed Action:</div>
              <p className="font-mono text-[11px] text-[#3c8aff]">
                › {stages[simStep].desc}
              </p>
            </div>
          </div>

          {/* Engine API Payload Preview */}
          <div className="p-4 rounded-xl bg-[#0a0b0e] border border-[#232730] font-mono text-xs text-[#dee1e7] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#717886]">
              <span>Reth Execution Engine API Payload (engine_forkchoiceUpdatedV3)</span>
              <span className="text-[#66c800]">Status: Synced</span>
            </div>
            <pre className="text-[11px] text-[#8a91a0] overflow-x-auto p-2 bg-[#060709] rounded-lg">
{`{
  "forkchoiceState": {
    "headBlockHash": "0x8453e02...${chainState.unsafeL2Head}",
    "safeBlockHash": "0x8453a19...${chainState.safeL2Head}",
    "finalizedBlockHash": "0x8453f00...${chainState.finalizedL2Head}"
  },
  "payloadAttributes": {
    "timestamp": "0x${(1727076000 + chainState.safeL2Head * 2).toString(16)}",
    "prevRandao": "0x4b7c19a0...33f1",
    "suggestedFeeRecipient": "0x4200000000000000000000000000000000000011",
    "gasLimit": "0x1c9c380", // 30,000,000
    "noTxPool": true,
    "transactions": [
      "0x7e... (L1AttributesDepositedTx)",
      "0x02... (B20 Asset Transfer UserOp)",
      "0x02... (Allowlist Verification)"
    ]
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* SUBTAB 3: WIRE FORMAT SPECIFICATION */}
      {activeSubTab === 'wireformat' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Frame Format Card */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-white">Channel Frame Wire Format</h4>
                <p className="text-xs text-[#8a91a0] mt-0.5">
                  Binary layout of data chunks carried inside batcher transactions to the L1 Batch Inbox.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded bg-[#0052ff]/15 text-[#3c8aff] font-mono text-xs font-bold">
                23 Bytes Fixed Overhead
              </span>
            </div>

            {/* Wire Structure Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#232730] space-y-1">
                <span className="text-[10px] text-[#3c8aff] font-bold">bytes16 (16B)</span>
                <div className="text-white font-bold">channel_id</div>
                <div className="text-[10px] text-[#717886]">Random opaque ID for channel</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#232730] space-y-1">
                <span className="text-[10px] text-[#ffd12f] font-bold">uint16 (2B)</span>
                <div className="text-white font-bold">frame_number</div>
                <div className="text-[10px] text-[#717886]">0-indexed sequence in channel</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#232730] space-y-1">
                <span className="text-[10px] text-[#66c800] font-bold">uint32 (4B)</span>
                <div className="text-white font-bold">frame_data_length</div>
                <div className="text-[10px] text-[#717886]">Capped to 1,000,000 bytes</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#232730] space-y-1">
                <span className="text-[10px] text-[#dee1e7] font-bold">bytes (var)</span>
                <div className="text-white font-bold">frame_data</div>
                <div className="text-[10px] text-[#717886]">Compressed batch payload chunk</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#232730] space-y-1">
                <span className="text-[10px] text-[#fc401f] font-bold">bool (1B)</span>
                <div className="text-white font-bold">is_last</div>
                <div className="text-[10px] text-[#717886]">1 if final frame, 0 otherwise</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0b0e] border border-[#1f232b] text-xs font-mono text-[#b1b7c3]">
              <span className="text-[#3c8aff]">frame</span> = channel_id (bytes16) ++ frame_number (uint16) ++ frame_data_length (uint32) ++ frame_data (bytes) ++ is_last (bool)
            </div>
          </div>

          {/* Batch Format Card */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-white">Sequencer Batch Format</h4>
                <p className="text-xs text-[#8a91a0] mt-0.5">
                  Standard batch format encoding transactions to be executed in a specific L2 block.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded bg-[#66c800]/15 text-[#66c800] font-mono text-xs font-bold">
                RLP Encoded
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0a0b0e] border border-[#1f232b] text-xs font-mono space-y-2 text-[#dee1e7]">
              <div>
                <span className="text-[#8a91a0]">batch_version 0:</span> <span className="text-[#ffd12f]">0x00</span> ++ rlp_encode([
              </div>
              <div className="pl-6 space-y-1 text-[11px] text-[#b1b7c3]">
                <div><span className="text-[#3c8aff]">parent_hash</span>: bytes32, // hash of previous L2 block</div>
                <div><span className="text-[#3c8aff]">epoch_number</span>: uint64, // L1 origin block number</div>
                <div><span className="text-[#3c8aff]">epoch_hash</span>: bytes32, // canonical L1 origin block hash</div>
                <div><span className="text-[#3c8aff]">timestamp</span>: uint64, // L2 block timestamp</div>
                <div><span className="text-[#3c8aff]">transaction_list</span>: [EIP-2718 encoded transactions]</div>
              </div>
              <div>])</div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: REORGS & RESET */}
      {activeSubTab === 'reorgs' && (
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4 animate-fadeIn">
          <div>
            <h4 className="font-bold text-base text-white">L1 Reorg Handling & Pipeline Reset Algorithm</h4>
            <p className="text-xs text-[#8a91a0] mt-0.5">
              How the Base Rollup Node traverses backwards and reconciles L2 state if an L1 reorganization occurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-[#ffd12f]" />
                <span>Finding the Sync Starting Point (FindL2Heads)</span>
              </div>
              <ol className="space-y-1.5 text-[#dee1e7] list-decimal pl-4">
                <li>Find current L2 forkchoice state (finalized / safe / unsafe).</li>
                <li>Find first L2 block with plausible canonical L1 reference.</li>
                <li>Find first L2 block with L1 reference older than the sequencing window to be new safe point.</li>
                <li>Find first L2 block older than channel-timeout (l2base).</li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-[#66c800]" />
                <span>Resetting Derivation Stages</span>
              </div>
              <ul className="space-y-1.5 text-[#dee1e7]">
                <li className="flex items-center gap-1.5">
                  <span className="text-[#66c800] font-bold">›</span>
                  <span><strong>Frame Queue & Channel Bank:</strong> Flushed cleanly.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#66c800] font-bold">›</span>
                  <span><strong>Channel Reader & Batch Queue:</strong> Reset to base L1 reference.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#66c800] font-bold">›</span>
                  <span><strong>Engine Queue:</strong> Issues forkchoice update with synced starting point.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
