import React, { useState } from 'react';
import { 
  Terminal, 
  Database, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  Copy, 
  Check, 
  Play, 
  Activity, 
  Hash, 
  RefreshCw, 
  ExternalLink,
  Info,
  KeyRound,
  FileCode,
  GitBranch,
  Network
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';

interface BaseRollupNodeRPCSpecProps {
  currentNetwork: BaseNetwork;
}

export const BaseRollupNodeRPCSpec: React.FC<BaseRollupNodeRPCSpecProps> = ({ currentNetwork }) => {
  const [activeTab, setActiveTab] = useState<'method' | 'structures' | 'playground' | 'formula' | 'disputes'>('method');
  const [selectedReturnField, setSelectedReturnField] = useState<'version' | 'outputRoot' | 'blockRef' | 'withdrawalStorageRoot' | 'stateRoot' | 'syncStatus'>('outputRoot');
  const [blockNumInput, setBlockNumInput] = useState<string>('20584912');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCallingRpc, setIsCallingRpc] = useState<boolean>(false);
  const [rpcResponse, setRpcResponse] = useState<any | null>(null);

  const returnFieldDetails = {
    version: {
      title: 'version',
      type: 'DATA (32 Bytes)',
      badge: 'Commitment Version',
      badgeColor: 'bg-[#3c8aff]/15 text-[#3c8aff]',
      sample: '0x0000000000000000000000000000000000000000000000000000000000000000',
      description: 'The output root commitment scheme version number, beginning with version 0. It serves as a domain separator preventing cross-version collision if future upgrades introduce Verkle trees, ZK state roots, or alternative hashing schemes.',
      keyPoints: [
        '32-byte big-endian byte array',
        'Standard value: bytes32(0) across Bedrock, Canyon, Delta, Ecotone, and Isthmus',
        'Preimage Position: 1st argument of keccak256(version ++ stateRoot ++ withdrawalStorageRoot ++ blockHash)',
      ],
    },
    outputRoot: {
      title: 'outputRoot',
      type: 'DATA (32 Bytes)',
      badge: 'L1 Consensus Anchor',
      badgeColor: 'bg-[#66c800]/15 text-[#66c800]',
      sample: '0x789c0000000000002d4e6f8a0b1c3d5e7f9a1b3c5d7e9f1a3b5c7e9f1a3b5c7e',
      description: 'The canonical 32-byte cryptographic root proposal for the specified L2 block height. The L2 Output Proposer submits this root to the DisputeGameFactory on Ethereum L1. Dispute games and challenger bisection traces verify against this root.',
      keyPoints: [
        'Committed to Ethereum L1 DisputeGameFactory contract',
        'Subject to 7-day fault proof challenge window on mainnet',
        'Computed as keccak256(version ++ stateRoot ++ withdrawalStorageRoot ++ blockHash)',
      ],
    },
    blockRef: {
      title: 'blockRef',
      type: 'Object (L2BlockRef)',
      badge: 'Execution Reference',
      badgeColor: 'bg-[#3c8aff]/15 text-[#3c8aff]',
      sample: JSON.stringify({
        hash: '0x4b7e013a17e08c91a0b3f71c4290d6318e24fa10b9c3d4e5f6',
        number: '0x13a17e0',
        parentHash: '0x892a013a17df1e2d3c4b5a6978869504132b8e7f9a1c2d3',
        timestamp: '0x66f12340',
        l1origin: { hash: '0x1a8f...', number: '0x139d1b0' },
        sequenceNumber: '0x2'
      }, null, 2),
      description: 'An extended execution payload reference connecting the Base block to its Ethereum L1 genesis origin. It tracks the exact L1 block number and sequence number distance within the sequencing epoch.',
      keyPoints: [
        'Contains L2 block hash, number, parentHash, and timestamp',
        'l1origin (BlockID): Identifies the L1 block containing the epoch start batch',
        'sequenceNumber: distance (in L2 blocks) to the first block of the current L1 epoch',
      ],
    },
    withdrawalStorageRoot: {
      title: 'withdrawalStorageRoot',
      type: 'DATA (32 Bytes)',
      badge: 'L2ToL1MessagePasser',
      badgeColor: 'bg-[#ffd12f]/15 text-[#ffd12f]',
      sample: '0x9812000000000000f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1',
      description: 'The Merkle Patricia storage trie root of the L2ToL1MessagePasser predeploy contract (0x4200000000000000000000000000000000000016). When users initiate withdrawals on Base, message hashes are stored in this trie.',
      keyPoints: [
        'Predeploy address: 0x4200000000000000000000000000000000000016',
        'Powers OptimismPortal.proveWithdrawalTransaction on Ethereum L1',
        'Users submit an eth_getProof storage proof against this root to prove withdrawal inclusion',
      ],
    },
    stateRoot: {
      title: 'stateRoot',
      type: 'DATA (32 Bytes)',
      badge: 'World State Trie',
      badgeColor: 'bg-[#3c8aff]/15 text-[#3c8aff]',
      sample: '0x673a000000000000b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
      description: 'The root hash of the global Ethereum world state trie after executing all transactions in the block. Encapsulates account nonces, ETH balances, smart contract bytecode, and storage tries (including B20 token balances and cap tables).',
      keyPoints: [
        'Calculated by Reth execution client on Base',
        'Commits to all account balances, token states, and contract storage on L2',
        'Used in state transition proofs and MIPS execution traces during fault dispute games',
      ],
    },
    syncStatus: {
      title: 'syncStatus',
      type: 'Object (SyncStatus)',
      badge: 'Driver Snapshot',
      badgeColor: 'bg-[#ffd12f]/15 text-[#ffd12f]',
      sample: JSON.stringify({
        current_l1: { number: '0x139d1b0', hash: '0x1a8f...' },
        head_l1: { number: '0x139d1b0' },
        safe_l1: { number: '0x139d190' },
        finalized_l1: { number: '0x139d170' },
        unsafe_l2: { number: '0x13a17e0' },
        safe_l2: { number: '0x13a17df' },
        finalized_l2: { number: '0x13a1560' }
      }, null, 2),
      description: 'Instantaneous snapshot of the rollup driver state tracking L1 and L2 heads across unsafe, safe, and finalized stages. Provides critical observability into node sync progress, batcher lag, and P2P mesh health.',
      keyPoints: [
        'L1 Checkpoints: current_l1, current_l1_finalized, head_l1, safe_l1, finalized_l1',
        'L2 Heads: unsafe_l2 (P2P gossip), safe_l2 (L1 batch derived), finalized_l2 (Casper finalized)',
        'Crucial for detecting chain reorgs and sequencing pipeline bottlenecks',
      ],
    },
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert decimal to hex
  const blockNumInt = parseInt(blockNumInput, 10) || 20584912;
  const blockNumHex = '0x' + blockNumInt.toString(16);

  const simulateRpcCall = () => {
    setIsCallingRpc(true);
    setTimeout(() => {
      // Deterministically generate simulated output root hashes based on block number
      const mockL1Block = 20854300 + Math.floor(blockNumInt / 10);
      const mockL1Hex = '0x' + mockL1Block.toString(16);
      const mockL2Hash = `0x4b7e${blockNumInt.toString(16).padStart(8, '0')}8c91a0b3f71c4290d6318e24fa10b9c3d4e5f6`;
      const mockParentHash = `0x892a${(blockNumInt - 1).toString(16).padStart(8, '0')}f1e2d3c4b5a6978869504132b8e7f9a1c2d3`;
      const mockL1OriginHash = `0x1a8f${mockL1Block.toString(16).padStart(8, '0')}3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b`;
      const mockOutputRoot = `0x789c${(blockNumInt * 7).toString(16).padStart(8, '0')}2d4e6f8a0b1c3d5e7f9a1b3c5d7e9f1a3b5c`;
      const mockWithdrawalRoot = `0x9812${(blockNumInt * 3).toString(16).padStart(8, '0')}f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7`;
      const mockStateRoot = `0x673a${(blockNumInt * 5).toString(16).padStart(8, '0')}b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5`;

      const response = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          version: '0x0000000000000000000000000000000000000000000000000000000000000000',
          outputRoot: mockOutputRoot,
          blockRef: {
            hash: mockL2Hash,
            number: blockNumHex,
            parentHash: mockParentHash,
            timestamp: '0x66f12340',
            l1origin: {
              hash: mockL1OriginHash,
              number: mockL1Hex
            },
            sequenceNumber: '0x2'
          },
          withdrawalStorageRoot: mockWithdrawalRoot,
          stateRoot: mockStateRoot,
          syncStatus: {
            current_l1: {
              hash: mockL1OriginHash,
              number: mockL1Hex,
              parentHash: '0x3b1c94018274acfe719462839bce8394b0819273618491029384756102938475',
              timestamp: '0x66f12330'
            },
            current_l1_finalized: {
              hash: '0x0d93841029384756102938475610293847561029384756102938475610293847',
              number: '0x' + (mockL1Block - 64).toString(16),
              parentHash: '0x9482710394857102938475610293847561029384756102938475610293847561',
              timestamp: '0x66f11dc0'
            },
            head_l1: {
              hash: mockL1OriginHash,
              number: mockL1Hex,
              parentHash: '0x3b1c94018274acfe719462839bce8394b0819273618491029384756102938475',
              timestamp: '0x66f12330'
            },
            safe_l1: {
              hash: '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
              number: '0x' + (mockL1Block - 32).toString(16),
              parentHash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
              timestamp: '0x66f120d0'
            },
            finalized_l1: {
              hash: '0x0d93841029384756102938475610293847561029384756102938475610293847',
              number: '0x' + (mockL1Block - 64).toString(16),
              parentHash: '0x9482710394857102938475610293847561029384756102938475610293847561',
              timestamp: '0x66f11dc0'
            },
            unsafe_l2: {
              hash: mockL2Hash,
              number: blockNumHex,
              parentHash: mockParentHash,
              timestamp: '0x66f12340',
              l1origin: {
                hash: mockL1OriginHash,
                number: mockL1Hex
              },
              sequenceNumber: '0x2'
            },
            safe_l2: {
              hash: mockParentHash,
              number: '0x' + (blockNumInt - 1).toString(16),
              parentHash: '0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
              timestamp: '0x66f1233e',
              l1origin: {
                hash: mockL1OriginHash,
                number: mockL1Hex
              },
              sequenceNumber: '0x1'
            },
            finalized_l2: {
              hash: '0x2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c',
              number: '0x' + (blockNumInt - 640).toString(16),
              parentHash: '0x1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
              timestamp: '0x66f11dc0',
              l1origin: {
                hash: '0x0d93841029384756102938475610293847561029384756102938475610293847',
                number: '0x' + (mockL1Block - 64).toString(16)
              },
              sequenceNumber: '0x0'
            },
            pending_safe_l2: {
              hash: mockParentHash,
              number: '0x' + (blockNumInt - 1).toString(16),
              parentHash: '0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
              timestamp: '0x66f1233e',
              l1origin: {
                hash: mockL1OriginHash,
                number: mockL1Hex
              },
              sequenceNumber: '0x1'
            },
            queued_unsafe_l2: {
              hash: mockL2Hash,
              number: blockNumHex,
              parentHash: mockParentHash,
              timestamp: '0x66f12340',
              l1origin: {
                hash: mockL1OriginHash,
                number: mockL1Hex
              },
              sequenceNumber: '0x2'
            }
          }
        }
      };

      setRpcResponse(response);
      setIsCallingRpc(false);
    }, 400);
  };

  const curlCommand = `curl -X POST \\
  -H "Content-Type: application/json" \\
  --data '{
    "jsonrpc": "2.0",
    "method": "optimism_outputAtBlock",
    "params": ["${blockNumHex}"],
    "id": 1
  }' \\
  ${currentNetwork.rpcUrl}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#3c8aff]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3c8aff]">
                Base Rollup Node RPC API Specification
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              optimism_outputAtBlock & L2 Output Roots
            </h2>
            <p className="text-xs sm:text-sm text-[#8a91a0] mt-1 max-w-3xl leading-relaxed">
              Rollup nodes expose <code className="text-[#3c8aff] font-mono">optimism_outputAtBlock</code> to compute and return the 32-byte 
              L2 output root, state root, and withdrawal storage root from <code className="text-white font-mono">L2ToL1MessagePasser</code>. 
              These commitments power Base fault proofs, dispute games, and L1 withdrawal finalization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-[#0052ff]/10 text-[#3c8aff] border border-[#0052ff]/30 text-xs font-mono">
              Rollup RPC Standard
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-[#1f232c]">
          <button
            onClick={() => setActiveTab('method')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'method' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            RPC Method Definition
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'structures' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            Structures (L2BlockRef, SyncStatus)
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'playground' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            Interactive RPC Playground
          </button>
          <button
            onClick={() => setActiveTab('formula')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'formula' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            Output Root Keccak256 Formula
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'disputes' ? 'bg-[#0052ff] text-white shadow-sm' : 'bg-[#14161c] text-[#8a91a0] hover:text-white'
            }`}
          >
            L1 Fault Proofs & Dispute Games
          </button>
        </div>
      </div>

      {/* TAB 1: METHOD DEFINITION */}
      {activeTab === 'method' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#3c8aff]" />
                Method: <code className="text-[#3c8aff] font-mono">optimism_outputAtBlock</code>
              </h3>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                Returns the canonical 32-byte cryptographic output root and associated chain metadata for a given L2 block height. 
                This is the exact root posted to the L1 <code className="text-white font-mono">DisputeGameFactory</code> by proposers.
              </p>

              {/* Parameters Table */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[#8a91a0]">
                  Parameters
                </h4>
                <div className="rounded-xl border border-[#262b36] overflow-hidden text-xs">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-[#141720] text-[#8a91a0] border-b border-[#262b36]">
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f232c] bg-[#0d0f14] text-white">
                      <tr>
                        <td className="p-3 text-[#3c8aff]">blockNumber</td>
                        <td className="p-3 text-[#ffd12f]">QUANTITY (64 bits)</td>
                        <td className="p-3 text-[#b1b7c3] font-sans">
                          L2 integer block number encoded as a hex quantity string (e.g. &quot;0x13a17e0&quot;).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Return Values Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[#8a91a0]">
                    Return Fields (Select to Inspect)
                  </h4>
                  <span className="text-[11px] text-[#3c8aff] font-mono">
                    Click any field to view cryptographic role & schema
                  </span>
                </div>

                <div className="rounded-xl border border-[#262b36] overflow-hidden text-xs">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-[#141720] text-[#8a91a0] border-b border-[#262b36]">
                      <tr>
                        <th className="p-3">Field</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f232c] bg-[#0d0f14] text-white">
                      {(['version', 'outputRoot', 'blockRef', 'withdrawalStorageRoot', 'stateRoot', 'syncStatus'] as const).map((fieldName) => {
                        const fieldInfo = returnFieldDetails[fieldName];
                        const isSelected = selectedReturnField === fieldName;
                        return (
                          <tr
                            key={fieldName}
                            onClick={() => setSelectedReturnField(fieldName)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#0052ff]/15 border-l-2 border-l-[#0052ff]'
                                : 'hover:bg-[#141722]'
                            }`}
                          >
                            <td className="p-3">
                              <span className={`font-bold ${
                                fieldName === 'outputRoot'
                                  ? 'text-[#66c800]'
                                  : fieldName === 'withdrawalStorageRoot'
                                  ? 'text-[#ffd12f]'
                                  : 'text-[#3c8aff]'
                              }`}>
                                {fieldName}
                              </span>
                            </td>
                            <td className="p-3 text-[#ffd12f]">{fieldInfo.type}</td>
                            <td className="p-3 text-[#b1b7c3] font-sans truncate max-w-xs">
                              {fieldInfo.description}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                isSelected
                                  ? 'bg-[#0052ff] text-white font-bold'
                                  : 'bg-[#1e2330] text-[#8a91a0]'
                              }`}>
                                {isSelected ? 'Active' : 'Inspect'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Return Field Deep-Dive Inspector Card */}
                {selectedReturnField && (
                  <div className="p-4 rounded-xl border border-[#0052ff]/40 bg-[#0c0e14] space-y-3 mt-4 animate-fadeIn shadow-lg shadow-[#0052ff]/5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f232c] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-mono font-bold text-white">
                          Field: <span className="text-[#3c8aff]">{returnFieldDetails[selectedReturnField].title}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${returnFieldDetails[selectedReturnField].badgeColor}`}>
                          {returnFieldDetails[selectedReturnField].badge}
                        </span>
                        <span className="text-xs font-mono text-[#8a91a0]">
                          ({returnFieldDetails[selectedReturnField].type})
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopy(`field-${selectedReturnField}`, returnFieldDetails[selectedReturnField].sample)}
                        className="text-xs text-[#8a91a0] hover:text-white flex items-center gap-1 font-mono bg-[#141720] px-2.5 py-1 rounded-lg border border-[#232732]"
                      >
                        {copiedKey === `field-${selectedReturnField}` ? (
                          <>
                            <Check className="h-3 w-3 text-[#66c800]" />
                            <span className="text-[#66c800]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Sample</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-[#b1b7c3] leading-relaxed">
                      {returnFieldDetails[selectedReturnField].description}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-mono font-bold text-[#8a91a0] uppercase tracking-wider">
                        Key Architectural Specifications:
                      </span>
                      <ul className="space-y-1 text-xs text-[#b1b7c3]">
                        {returnFieldDetails[selectedReturnField].keyPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#0052ff] mt-1.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-mono text-[#8a91a0]">
                        Payload Representation:
                      </span>
                      <pre className="p-3 rounded-lg bg-[#11131a] border border-[#232732] font-mono text-[11px] text-[#3c8aff] overflow-x-auto leading-relaxed">
                        {returnFieldDetails[selectedReturnField].sample}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Info Card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#66c800]" />
                L2 Output Root Security
              </h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                The output root binds the entire L2 execution state and the withdrawal message trie into a single 32-byte commitment. 
                Any withdrawal from Base to L1 is proven against this commitment.
              </p>
              <div className="p-3 rounded-lg bg-[#0c0e14] border border-[#232732] text-[11px] font-mono text-[#b1b7c3] space-y-1">
                <div>• Version: <span className="text-[#3c8aff]">uint256 (0)</span></div>
                <div>• Predeploy: <span className="text-white">L2ToL1MessagePasser</span></div>
                <div>• Predeploy Addr: <span className="text-[#ffd12f]">0x4200...0016</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-3">
              <h4 className="font-bold text-sm text-white">Documentation Reference</h4>
              <p className="text-xs text-[#8a91a0]">
                Extended from the Ethereum Execution Engine API specs (Paris/Shanghai).
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

      {/* TAB 2: STRUCTURES */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BlockID & L1BlockRef */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Hash className="h-4 w-4 text-[#3c8aff]" />
              BlockID & L1BlockRef
            </h3>
            <p className="text-xs text-[#8a91a0]">
              Identifies Ethereum L1 consensus checkpoints ingested by the rollup driver derivation pipeline.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-2">
                <div className="text-white font-bold text-xs flex justify-between">
                  <span className="text-[#3c8aff]">BlockID</span>
                  <span className="text-[#8a91a0]">Minimal Identifier</span>
                </div>
                <div className="text-[#8a91a0] text-[11px] space-y-1">
                  <div>• <code className="text-white">hash</code>: DATA (32 Bytes)</div>
                  <div>• <code className="text-white">number</code>: QUANTITY (64 Bits)</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-2">
                <div className="text-white font-bold text-xs flex justify-between">
                  <span className="text-[#66c800]">L1BlockRef</span>
                  <span className="text-[#8a91a0]">Full L1 Anchor</span>
                </div>
                <div className="text-[#8a91a0] text-[11px] space-y-1">
                  <div>• <code className="text-white">hash</code>: DATA (32 Bytes)</div>
                  <div>• <code className="text-white">number</code>: QUANTITY (64 Bits)</div>
                  <div>• <code className="text-white">parentHash</code>: DATA (32 Bytes)</div>
                  <div>• <code className="text-white">timestamp</code>: QUANTITY (64 Bits)</div>
                </div>
              </div>
            </div>
          </div>

          {/* L2BlockRef */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#ffd12f]" />
              L2BlockRef
            </h3>
            <p className="text-xs text-[#8a91a0]">
              Extended execution reference linking each Base block directly to its L1 derivation origin.
            </p>

            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-2 text-xs font-mono">
              <div className="text-white font-bold text-xs flex justify-between border-b border-[#232732] pb-2">
                <span className="text-[#ffd12f]">L2BlockRef</span>
                <span className="text-[#8a91a0]">Base Execution Reference</span>
              </div>
              <div className="text-[#8a91a0] text-[11px] space-y-1.5 pt-1">
                <div>• <code className="text-white">hash</code>: DATA (32 Bytes) - Base block hash</div>
                <div>• <code className="text-white">number</code>: QUANTITY (64 Bits) - Base block height</div>
                <div>• <code className="text-white">parentHash</code>: DATA (32 Bytes)</div>
                <div>• <code className="text-white">timestamp</code>: QUANTITY (64 Bits)</div>
                <div>• <code className="text-[#3c8aff]">l1origin</code>: BlockID (L1 block where epoch started)</div>
                <div>• <code className="text-[#66c800]">sequenceNumber</code>: QUANTITY (Distance to first block of epoch)</div>
              </div>
            </div>
          </div>

          {/* SyncStatus */}
          <div className="md:col-span-2 rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#66c800]" />
              SyncStatus (Rollup Driver Snapshot)
            </h3>
            <p className="text-xs text-[#8a91a0]">
              Complete state tracking across both layers. The driver continuously maintains these heads to advance derivation and detect reorganizations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-1">
                <span className="text-[#3c8aff] font-bold">head_l1</span>
                <p className="text-[11px] text-[#8a91a0]">Latest observed L1 block header.</p>
              </div>
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-1">
                <span className="text-[#3c8aff] font-bold">safe_l1</span>
                <p className="text-[11px] text-[#8a91a0]">L1 safe head verified by consensus.</p>
              </div>
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-1">
                <span className="text-[#3c8aff] font-bold">finalized_l1</span>
                <p className="text-[11px] text-[#8a91a0]">Irreversible L1 Casper-finalized block.</p>
              </div>
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-1">
                <span className="text-[#ffd12f] font-bold">unsafe_l2</span>
                <p className="text-[11px] text-[#8a91a0]">Speculative head gossiped over P2P mesh.</p>
              </div>
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-1">
                <span className="text-[#66c800] font-bold">safe_l2</span>
                <p className="text-[11px] text-[#8a91a0]">Derived deterministically from L1 batches.</p>
              </div>
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-1">
                <span className="text-[#66c800] font-bold">finalized_l2</span>
                <p className="text-[11px] text-[#8a91a0]">Derived strictly from finalized L1 batches.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="h-4 w-4 text-[#3c8aff]" />
                Interactive optimism_outputAtBlock RPC Caller
              </h3>
              <p className="text-xs text-[#8a91a0] mt-1">
                Test JSON-RPC calls against the Base rollup driver to inspect real output roots, state roots, and synchronization metrics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8a91a0] font-mono">Preset:</span>
              <button
                onClick={() => { setBlockNumInput('20584912'); }}
                className="px-2.5 py-1 rounded-lg bg-[#1a1e27] hover:bg-[#252b38] text-xs font-mono text-white transition-colors"
              >
                #20,584,912
              </button>
              <button
                onClick={() => { setBlockNumInput('19842000'); }}
                className="px-2.5 py-1 rounded-lg bg-[#1a1e27] hover:bg-[#252b38] text-xs font-mono text-white transition-colors"
              >
                #19,842,000
              </button>
            </div>
          </div>

          {/* Input & Action */}
          <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-xs font-mono text-[#8a91a0] mb-1">
                  L2 Block Number (Decimal):
                </label>
                <input
                  type="number"
                  value={blockNumInput}
                  onChange={(e) => setBlockNumInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#141720] border border-[#2d3342] text-xs font-mono text-white outline-none focus:border-[#0052ff]"
                  placeholder="e.g. 20584912"
                />
              </div>

              <div className="flex-1 min-w-[240px]">
                <label className="block text-xs font-mono text-[#8a91a0] mb-1">
                  Encoded QUANTITY Hex Parameter:
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-[#141720] border border-[#232732] text-xs font-mono text-[#3c8aff]">
                  {blockNumHex}
                </div>
              </div>

              <div className="self-end">
                <button
                  onClick={simulateRpcCall}
                  disabled={isCallingRpc}
                  className="px-5 py-2 rounded-lg bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-[#0052ff]/20 disabled:opacity-50"
                >
                  {isCallingRpc ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  <span>Execute RPC Call</span>
                </button>
              </div>
            </div>
          </div>

          {/* cURL Request & JSON-RPC Response */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* cURL Snippet */}
            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-[#3c8aff]" />
                  cURL Request
                </span>
                <button
                  onClick={() => handleCopy('curl', curlCommand)}
                  className="text-xs text-[#8a91a0] hover:text-white flex items-center gap-1 font-mono"
                >
                  {copiedKey === 'curl' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'curl' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-[#11131a] border border-[#232732] font-mono text-[11px] text-[#3c8aff] overflow-x-auto leading-relaxed">
                {curlCommand}
              </pre>
            </div>

            {/* Response Output */}
            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-[#66c800]" />
                  JSON-RPC Response
                </span>
                {rpcResponse && (
                  <button
                    onClick={() => handleCopy('response', JSON.stringify(rpcResponse, null, 2))}
                    className="text-xs text-[#8a91a0] hover:text-white flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'response' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'response' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {rpcResponse ? (
                <pre className="p-3 rounded-lg bg-[#11131a] border border-[#232732] font-mono text-[11px] text-[#b1b7c3] overflow-x-auto max-h-[300px] leading-relaxed">
                  {JSON.stringify(rpcResponse, null, 2)}
                </pre>
              ) : (
                <div className="p-8 rounded-lg bg-[#11131a] border border-dashed border-[#232732] text-center text-xs text-[#8a91a0]">
                  Click &quot;Execute RPC Call&quot; above to fetch output roots and driver synchronization state.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FORMULA */}
      {activeTab === 'formula' && (
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Hash className="h-4 w-4 text-[#ffd12f]" />
              Cryptographic Output Root Composition
            </h3>
            <p className="text-xs text-[#8a91a0] mt-1">
              How the rollup node hashes execution state, withdrawal storage, and block identifiers into the single 32-byte output root.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-4">
            <div className="text-xs font-mono text-[#8a91a0]">Output Root Formula:</div>
            <div className="p-4 rounded-lg bg-[#141720] border border-[#2d3342] text-xs font-mono text-white break-all leading-relaxed">
              <span className="text-[#ffd12f]">output_root</span> = keccak256(
              <span className="text-[#3c8aff]">version_byte_32</span> ++ 
              <span className="text-[#66c800]">state_root</span> ++ 
              <span className="text-[#ffd12f]">withdrawal_storage_root</span> ++ 
              <span className="text-white">block_hash</span>)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
              <div className="p-3 rounded-lg bg-[#11131a] border border-[#232732] space-y-1">
                <span className="text-[#3c8aff] font-bold">1. version_byte_32 (32 Bytes)</span>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  Version identifier, currently all zeros (<code className="text-white font-mono">bytes32(0)</code>). Reserved for future upgrades to the state commitment scheme.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#11131a] border border-[#232732] space-y-1">
                <span className="text-[#66c800] font-bold">2. state_root (32 Bytes)</span>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  The Merkle Patricia Trie root of the entire Base account state (including token contracts, balances, and nonces) at the target block.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#11131a] border border-[#232732] space-y-1">
                <span className="text-[#ffd12f] font-bold">3. withdrawal_storage_root (32 Bytes)</span>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  The storage trie root of <code className="text-white font-mono">L2ToL1MessagePasser</code> predeploy (<code className="text-[#ffd12f] font-mono">0x4200...0016</code>). Stores hashes of all initiated withdrawals.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#11131a] border border-[#232732] space-y-1">
                <span className="text-white font-bold">4. block_hash (32 Bytes)</span>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  The block hash of the target Base L2 block, preventing collisions and anchoring output roots strictly to canonical chain blocks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DISPUTES & WITHDRAWALS */}
      {activeTab === 'disputes' && (
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#66c800]" />
              Role in Fault Proofs & L1 Withdrawal Finalization
            </h3>
            <p className="text-xs text-[#8a91a0] mt-1">
              Connecting <code className="text-[#3c8aff] font-mono">optimism_outputAtBlock</code> to the on-chain Fault Proof System on Ethereum L1.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-2">
              <div className="h-8 w-8 rounded-lg bg-[#0052ff]/20 text-[#3c8aff] flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-white">Root Proposal on L1</h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                The L2 Output Proposer calls <code className="text-white font-mono">optimism_outputAtBlock</code> to obtain the output root and posts it to the <code className="text-[#3c8aff] font-mono">DisputeGameFactory</code> on L1.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-2">
              <div className="h-8 w-8 rounded-lg bg-[#ffd12f]/20 text-[#ffd12f] flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-white">7-Day Dispute Window</h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                Challengers run fault proof programs (OP-Kona / OP-Program) against L1 data. If the proposed output root is fraudulent, it is challenged and disputed.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#262b36] bg-[#0c0e14] space-y-2">
              <div className="h-8 w-8 rounded-lg bg-[#66c800]/20 text-[#66c800] flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-white">Finalize Withdrawal on L1</h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                Users prove their withdrawal transaction against the proven output root using the <code className="text-[#ffd12f] font-mono">withdrawalStorageRoot</code> in <code className="text-white font-mono">OptimismPortal</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
