import React, { useState, useMemo } from 'react';
import { 
  ArrowDownCircle, 
  Layers, 
  ShieldCheck, 
  Flame, 
  Cpu, 
  Calculator, 
  Copy, 
  Check, 
  Info, 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  Hash, 
  CheckCircle2, 
  AlertTriangle,
  Code2,
  Lock,
  ArrowRight,
  Database
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { triggerConfetti, shortenAddress } from '../../utils/web3Helper';

interface BaseDepositsViewerProps {
  currentNetwork?: BaseNetwork;
}

export const BaseDepositsViewer: React.FC<BaseDepositsViewerProps> = ({ currentNetwork }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'sourcehash' | 'aliasing' | 'gasmarket' | 'l1attributes'>('overview');

  // Source hash state
  const [sourceType, setSourceType] = useState<'user' | 'attributes' | 'upgrade'>('user');
  const [l1BlockHash, setL1BlockHash] = useState('0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b');
  const [l1LogIndex, setL1LogIndex] = useState('42');
  const [seqNumber, setSeqNumber] = useState('3');
  const [upgradeIntent, setUpgradeIntent] = useState('Base-Isthmus-Upgrade-v2');

  // Address Aliasing state
  const [l1ContractInput, setL1ContractInput] = useState('0x3154Cf16ccdb4C6d922629664174b904d80F2C35');
  const [copiedAlias, setCopiedAlias] = useState(false);

  // Guaranteed Gas Market simulator state
  const [requestedGas, setRequestedGas] = useState<number>(3000000);
  const [currentL1BaseFeeGwei, setCurrentL1BaseFeeGwei] = useState<number>(15);
  const [currentL2DepositBaseFeeGwei, setCurrentL2DepositBaseFeeGwei] = useState<number>(1);
  const [prevBoughtGas, setPrevBoughtGas] = useState<number>(4500000);

  // Calculate Address Alias: (address + 0x1111000000000000000000000000000000001111) % (1 << 160)
  const l2AliasAddress = useMemo(() => {
    try {
      const clean = l1ContractInput.trim().toLowerCase();
      if (!/^0x[0-9a-f]{40}$/.test(clean)) return 'Invalid 20-byte address';
      const addrBigInt = BigInt(clean);
      const offset = BigInt('0x1111000000000000000000000000000000001111');
      const mask160 = (1n << 160n) - 1n;
      const aliased = (addrBigInt + offset) & mask160;
      return '0x' + aliased.toString(16).padStart(40, '0');
    } catch {
      return 'Calculation error';
    }
  }, [l1ContractInput]);

  // Compute Source Hash simulation
  const computedSourceHash = useMemo(() => {
    // Simulated deterministic keccak256 hash representation
    if (sourceType === 'user') {
      const seed = `0:${l1BlockHash}:${l1LogIndex}`;
      return `0x7e00${hashString(seed).padStart(60, '0')}`;
    } else if (sourceType === 'attributes') {
      const seed = `1:${l1BlockHash}:${seqNumber}`;
      return `0x7e01${hashString(seed).padStart(60, '0')}`;
    } else {
      const seed = `2:${upgradeIntent}`;
      return `0x7e02${hashString(seed).padStart(60, '0')}`;
    }
  }, [sourceType, l1BlockHash, l1LogIndex, seqNumber, upgradeIntent]);

  // Simple string hash helper for simulation
  function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16);
    return hex.repeat(8).slice(0, 58);
  }

  // Guaranteed Gas Market Math
  const MAX_RESOURCE_LIMIT = 20000000;
  const ELASTICITY_MULTIPLIER = 10;
  const TARGET_RESOURCE_LIMIT = MAX_RESOURCE_LIMIT / ELASTICITY_MULTIPLIER; // 2,000,000
  const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8;

  const gasMarketMetrics = useMemo(() => {
    const deltaGas = prevBoughtGas - TARGET_RESOURCE_LIMIT;
    const baseFeePerGasDelta = Math.floor(
      (currentL2DepositBaseFeeGwei * deltaGas) / TARGET_RESOURCE_LIMIT / BASE_FEE_MAX_CHANGE_DENOMINATOR
    );
    const nextBaseFee = Math.max(1, currentL2DepositBaseFeeGwei + baseFeePerGasDelta);
    
    // Gas stipend
    const l1GasSpentForDeposit = 21000 + 40000; // typical deposit transaction cost on L1
    const gasStipendEthWei = l1GasSpentForDeposit * currentL1BaseFeeGwei;
    const requestedGasCostWei = requestedGas * nextBaseFee;
    const remainingToBurnWei = Math.max(0, requestedGasCostWei - gasStipendEthWei);
    const l1GasToBurn = Math.floor(remainingToBurnWei / currentL1BaseFeeGwei);

    return {
      nextBaseFee,
      deltaGas,
      gasStipendEthWei,
      requestedGasCostWei,
      l1GasToBurn,
      isOverTarget: prevBoughtGas > TARGET_RESOURCE_LIMIT,
      isCongested: prevBoughtGas > 15000000,
    };
  }, [prevBoughtGas, currentL2DepositBaseFeeGwei, currentL1BaseFeeGwei, requestedGas]);

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(l2AliasAddress);
    setCopiedAlias(true);
    triggerConfetti();
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#232938] bg-gradient-to-br from-[#10131a] via-[#121626] to-[#0f1118] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0052ff] animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3c8aff]">
              Base Consensus &amp; Execution Specification
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Deposited Transactions (EIP-2718 Type 0x7E)
          </h2>

          <p className="text-sm text-[#8a91a0] max-w-3xl leading-relaxed">
            A deposit is a transaction initiated on Layer 1 that becomes an authoritative transaction on Base (L2). Derived directly from L1 blocks, deposits are included without signatures, buy their L2 gas on L1 through the guaranteed gas fee market, and execute unconditionally before user transactions.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Type Envelope:</span>
              <span className="text-[#3c8aff] font-bold">0x7E (EIP-2718)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Gas Market:</span>
              <span className="text-[#66c800] font-bold">Guaranteed &amp; Non-Refundable</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Security:</span>
              <span className="text-[#ffd12f] font-bold">Address Aliasing (0x1111...1111)</span>
            </div>
            <a
              href="https://docs.base.org/llms.txt"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#0052ff]/15 hover:bg-[#0052ff]/25 border border-[#0052ff]/40 text-[#3c8aff] font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>docs.base.org Deposits Spec</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0c0e15] border border-[#202636] overflow-x-auto text-xs font-mono">
        {[
          { id: 'overview', label: 'Protocol Overview', icon: Layers },
          { id: 'fields', label: 'Type 0x7E RLP Fields', icon: Code2 },
          { id: 'sourcehash', label: 'Source Hash Engine', icon: Hash },
          { id: 'aliasing', label: 'Address Aliasing Tool', icon: ShieldCheck },
          { id: 'gasmarket', label: 'Guaranteed Gas Market', icon: Flame },
          { id: 'l1attributes', label: 'L1 Attributes (0x4200...15)', icon: Cpu },
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

      {/* TAB 1: OVERVIEW & KEY DISTINCTIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 3 Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] space-y-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#0052ff]/15 text-[#3c8aff] flex items-center justify-center border border-[#0052ff]/30 font-bold font-mono">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Derived From Layer 1</h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                Deposit transactions are derived directly from L1 blocks by rollup nodes. Sequencers cannot reorder, delay, or censor user deposits without breaking consensus.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] space-y-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#66c800]/15 text-[#66c800] flex items-center justify-center border border-[#66c800]/30 font-bold font-mono">
                2
              </div>
              <h4 className="text-sm font-bold text-white">No Signatures or Nonces</h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                Authorization is proved by the L1 event log emission itself. No ECDSA signature verification is run on L2, and the transaction envelope has no sender nonce.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] space-y-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#ffd12f]/15 text-[#ffd12f] flex items-center justify-center border border-[#ffd12f]/30 font-bold font-mono">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Guaranteed &amp; Non-Refundable</h4>
              <p className="text-xs text-[#8a91a0] leading-relaxed">
                Gas is bought on L1 before execution via gas burn or stipend. Because the gas fee was already expended on L1, unused L2 gas is not refunded.
              </p>
            </div>
          </div>

          {/* Execution Flow Lifecycle */}
          <div className="p-6 rounded-2xl border border-[#222838] bg-[#0c0e15] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-[#3c8aff]" />
              <span>Unconditional Execution Semantics on Base</span>
            </h3>

            <div className="space-y-3 text-xs text-[#8a91a0] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#22293a] flex items-start gap-3 text-white">
                <span className="font-mono font-bold text-[#66c800] text-sm shrink-0">STEP 1</span>
                <div>
                  <strong className="text-[#66c800]">Unconditional Minting:</strong> Before EVM bytecode executes, the balance of the <code>from</code> account is increased by the <code>mint</code> amount. This step <em>never reverts</em> even if the subsequent transaction call fails.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#22293a] flex items-start gap-3 text-white">
                <span className="font-mono font-bold text-[#3c8aff] text-sm shrink-0">STEP 2</span>
                <div>
                  <strong className="text-[#3c8aff]">Standard EVM Processing:</strong> The transaction is processed like an EIP-1559 transaction, except no base fee or priority fee is charged to the user on L2, and no gas is refunded.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#22293a] flex items-start gap-3 text-white">
                <span className="font-mono font-bold text-[#ffd12f] text-sm shrink-0">STEP 3</span>
                <div>
                  <strong className="text-[#ffd12f]">Non-EVM Error Transformation:</strong> If execution runs into a state-transition failure (such as insufficient balance for <code>value</code> transfer), the world state rolls back to after the minting step, the receipt is marked failed (status <code>0</code>), and the sender's nonce is incremented.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TYPE 0x7E RLP FIELDS */}
      {activeTab === 'fields' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-xl bg-[#0c0e15] border border-[#202636] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-[#0052ff]/20 text-[#3c8aff] font-bold">0x7E</span>
              <span className="text-white font-bold">EIP-2718 Transaction Payload (8 RLP Fields)</span>
            </div>
            <span className="text-[11px] text-[#717886] font-mono">RLP-encoded in sequential order</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {[
              {
                name: 'bytes32 sourceHash',
                type: 'bytes32 (32 bytes)',
                desc: 'Uniquely identifies origin domain and event log (prevents hash collisions without reading L2 nonce state).',
                highlight: 'text-[#3c8aff]',
              },
              {
                name: 'address from',
                type: 'address (20 bytes)',
                desc: 'Sender address on L1. If the caller was a contract, this is masked via address aliasing.',
                highlight: 'text-[#66c800]',
              },
              {
                name: 'address to',
                type: 'address (20 bytes or null)',
                desc: 'Recipient address on L2. Set to null (zero length) if the transaction is creating a new contract.',
                highlight: 'text-[#ffd12f]',
              },
              {
                name: 'uint256 mint',
                type: 'uint256',
                desc: 'ETH value to mint unconditionally to the `from` account balance prior to EVM execution.',
                highlight: 'text-white',
              },
              {
                name: 'uint256 value',
                type: 'uint256',
                desc: 'ETH value transferred from `from` to `to` as part of the transaction call.',
                highlight: 'text-white',
              },
              {
                name: 'uint64 gas',
                type: 'uint64',
                desc: 'Guaranteed gas limit allocated for execution on Base. Must be at least 21,000.',
                highlight: 'text-[#3c8aff]',
              },
              {
                name: 'bool isSystemTx',
                type: 'bool (1 byte)',
                desc: 'Must always be `false`. (Disabled system tx flag reserved for unmetered execution).',
                highlight: 'text-[#fc401f]',
              },
              {
                name: 'bytes data',
                type: 'bytes (variable)',
                desc: 'EVM calldata payload, or contract initialization bytecode if `to` is null.',
                highlight: 'text-[#66c800]',
              },
            ].map((f, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#0f121a] border border-[#1f2433] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${f.highlight}`}>{f.name}</span>
                  <span className="text-[10px] text-[#717886]">{f.type}</span>
                </div>
                <p className="text-[11px] text-[#8a91a0] font-sans leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#121622] border border-[#232938] text-xs text-[#8a91a0] space-y-1">
            <span className="text-white font-bold font-mono">Why 0x7E?</span>
            <p className="leading-relaxed">
              EIP-2718 transaction type identifiers can go up to <code>0x7F</code>. Selecting <code>0x7E</code> (126 in decimal) avoids collision with L1 transaction types while leaving <code>0x7F</code> available for potential variable-length prefix encodings.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: SOURCE HASH ENGINE */}
      {activeTab === 'sourcehash' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#3c8aff]" />
                <span>Deterministic Source Hash Calculator</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-1">
                The <code>sourceHash</code> ensures every deposit has a globally unique transaction hash without requiring an EVM state read of the sender's L2 nonce.
              </p>
            </div>

            {/* Origin Type Selector */}
            <div className="flex rounded-xl bg-[#141824] p-1 border border-[#22293a] max-w-md text-xs font-mono">
              <button
                onClick={() => setSourceType('user')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  sourceType === 'user' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0]'
                }`}
              >
                User Deposit (Domain 0)
              </button>
              <button
                onClick={() => setSourceType('attributes')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  sourceType === 'attributes' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0]'
                }`}
              >
                L1 Attributes (Domain 1)
              </button>
              <button
                onClick={() => setSourceType('upgrade')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  sourceType === 'upgrade' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0]'
                }`}
              >
                Upgrade (Domain 2)
              </button>
            </div>

            {/* Inputs based on domain */}
            <div className="space-y-3 text-xs font-mono">
              {sourceType !== 'upgrade' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[#717886]">L1 Block Hash:</label>
                    <input
                      type="text"
                      value={l1BlockHash}
                      onChange={(e) => setL1BlockHash(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#22293a] text-white text-xs font-mono focus:border-[#0052ff] focus:outline-none"
                    />
                  </div>

                  {sourceType === 'user' ? (
                    <div className="space-y-1">
                      <label className="text-[#717886]">L1 Log Index in Block:</label>
                      <input
                        type="text"
                        value={l1LogIndex}
                        onChange={(e) => setL1LogIndex(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#22293a] text-white text-xs font-mono focus:border-[#0052ff] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[#717886]">Sequence Number (L2 Block Distance in Epoch):</label>
                      <input
                        type="text"
                        value={seqNumber}
                        onChange={(e) => setSeqNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#22293a] text-white text-xs font-mono focus:border-[#0052ff] focus:outline-none"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-[#717886]">Upgrade Intent UTF-8 String:</label>
                  <input
                    type="text"
                    value={upgradeIntent}
                    onChange={(e) => setUpgradeIntent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#22293a] text-white text-xs font-mono focus:border-[#0052ff] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Calculated Source Hash Output */}
            <div className="p-4 rounded-xl bg-[#08090d] border border-[#1b202e] space-y-2 font-mono">
              <div className="text-[10px] uppercase text-[#717886] font-bold flex items-center justify-between">
                <span>Calculated Source Hash (`bytes32`)</span>
                <span className="text-[#3c8aff]">keccak256 domain separated</span>
              </div>
              <div className="text-xs text-[#66c800] font-bold select-all break-all">
                {computedSourceHash}
              </div>
              <div className="text-[10px] text-[#717886] pt-1">
                Formula: <code>keccak256(bytes32({sourceType === 'user' ? 0 : sourceType === 'attributes' ? 1 : 2}), keccak256(...))</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADDRESS ALIASING TOOL */}
      {activeTab === 'aliasing' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#66c800]" />
                <span>Contract Address Aliasing (L1 Contract → L2 Alias)</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-1 leading-relaxed">
                If the caller on L1 is a smart contract, its address is transformed on Base by adding <code>0x1111000000000000000000000000000000001111</code>. This prevents an attacker from deploying a contract at the same address on L1 and L2 with different bytecode to trick L2 protocols.
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <label className="text-[#717886]">Input L1 Contract Address:</label>
              <input
                type="text"
                value={l1ContractInput}
                onChange={(e) => setL1ContractInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#22293a] text-white font-mono text-xs focus:border-[#0052ff] focus:outline-none"
                placeholder="0x..."
              />
            </div>

            {/* Computed Alias Box */}
            <div className="p-4 rounded-xl bg-[#090b10] border border-[#1f2537] space-y-2 font-mono">
              <span className="text-[10px] uppercase text-[#717886] font-bold">
                Computed L2 Sender Alias (`msg.sender` on Base)
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#3c8aff] break-all select-all">
                  {l2AliasAddress}
                </span>
                <button
                  onClick={handleCopyAlias}
                  className="px-2.5 py-1.5 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-white text-xs flex items-center gap-1.5 transition-colors shrink-0 ml-3 cursor-pointer"
                >
                  {copiedAlias ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedAlias ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141824] border border-[#22293a] text-xs text-[#8a91a0] space-y-1">
              <span className="text-white font-bold font-mono">Developer Note: tx.origin == msg.sender</span>
              <p className="leading-relaxed">
                During a deposit transaction, both <code>CALLER</code> and <code>ORIGIN</code> are set to <code>from</code> (the aliased address). Checking <code>tx.origin == msg.sender</code> cannot prove that the caller is an EOA during deposits!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GUARANTEED GAS MARKET */}
      {activeTab === 'gasmarket' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-[#ffd12f]" />
                <span>Guaranteed Gas Market Simulator (OptimismPortal)</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-1">
                An EIP-1559 style fee market enforced on Ethereum L1 that caps guaranteed L2 gas per L1 block, protecting Base nodes from denial-of-service spam.
              </p>
            </div>

            {/* Interactive Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#717886]">Requested L2 Gas:</span>
                  <span className="text-white font-bold">{requestedGas.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="21000"
                  max="15000000"
                  step="50000"
                  value={requestedGas}
                  onChange={(e) => setRequestedGas(Number(e.target.value))}
                  className="w-full accent-[#0052ff]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#717886]">Previous Bought Gas:</span>
                  <span className="text-white font-bold">{prevBoughtGas.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20000000"
                  step="500000"
                  value={prevBoughtGas}
                  onChange={(e) => setPrevBoughtGas(Number(e.target.value))}
                  className="w-full accent-[#0052ff]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#717886]">L1 Base Fee:</span>
                  <span className="text-white font-bold">{currentL1BaseFeeGwei} Gwei</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={currentL1BaseFeeGwei}
                  onChange={(e) => setCurrentL1BaseFeeGwei(Number(e.target.value))}
                  className="w-full accent-[#0052ff]"
                />
              </div>
            </div>

            {/* Calculated Fee Market Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#22293a]">
                <div className="text-[10px] text-[#717886] uppercase">L2 Deposit Base Fee</div>
                <div className="text-base font-bold text-[#66c800] mt-0.5">
                  {gasMarketMetrics.nextBaseFee} Gwei
                </div>
                <div className="text-[10px] text-[#8a91a0] mt-0.5">
                  {gasMarketMetrics.isOverTarget ? '▲ Increasing' : '▼ Decreasing'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#22293a]">
                <div className="text-[10px] text-[#717886] uppercase">Gas Stipend Offset</div>
                <div className="text-base font-bold text-[#3c8aff] mt-0.5">
                  ~61,000 gas
                </div>
                <div className="text-[10px] text-[#8a91a0] mt-0.5">L1 deposit event credit</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#22293a]">
                <div className="text-[10px] text-[#717886] uppercase">L1 Gas to Burn</div>
                <div className="text-base font-bold text-[#ffd12f] mt-0.5">
                  {gasMarketMetrics.l1GasToBurn.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#8a91a0] mt-0.5">Sybil defense burn</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#22293a]">
                <div className="text-[10px] text-[#717886] uppercase">Max Resource Cap</div>
                <div className="text-base font-bold text-white mt-0.5">
                  20,000,000
                </div>
                <div className="text-[10px] text-[#8a91a0] mt-0.5">Target: 2,000,000</div>
              </div>
            </div>

            {/* Griefing Resistance Explanation */}
            <div className="p-4 rounded-xl bg-[#10131a] border border-[#1f2536] text-xs text-[#8a91a0] space-y-1.5">
              <span className="font-bold text-white font-mono">Griefing Attack Mitigation</span>
              <p className="leading-relaxed">
                By setting the elasticity multiplier to 10× (target: 2M, max: 20M), an adversary attempting to frontrun deposits by filling the block with guaranteed gas experiences an exponential cost curve that rapidly becomes economically prohibitive.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: L1 ATTRIBUTES PREDEPLOY */}
      {activeTab === 'l1attributes' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-[#3c8aff]" />
                <span>L1 Attributes Deposited Transaction (`L1Block.sol`)</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-1 leading-relaxed">
                The very first transaction in every Base L2 block is an L1 attributes deposit. It updates the state of the <code>L1Block</code> predeploy (<code>0x4200...15</code>) with block values from Ethereum L1.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#121622] border border-[#202738] space-y-2">
                <div className="text-xs font-bold text-[#66c800]">System Depositor Account</div>
                <div className="text-[11px] text-[#dee1e7] select-all">
                  0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001
                </div>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  An account with no private key that issues the L1 attributes transaction. Allocated 1,000,000 gas limit with 0 ETH cost.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#121622] border border-[#202738] space-y-2">
                <div className="text-xs font-bold text-[#3c8aff]">L1Block Predeploy Address</div>
                <div className="text-[11px] text-[#dee1e7] select-all">
                  0x4200000000000000000000000000000000000015
                </div>
                <p className="text-[11px] text-[#8a91a0] font-sans">
                  Predeploy storing L1 block number, timestamp, basefee, hash, sequenceNumber, batcherHash, overhead, and scalar.
                </p>
              </div>
            </div>

            {/* B20 Security Connection */}
            <div className="p-4 rounded-xl bg-[#0052ff]/10 border border-[#0052ff]/30 text-xs text-[#dee1e7] space-y-1.5">
              <div className="flex items-center gap-2 text-[#3c8aff] font-bold font-mono">
                <Sparkles className="h-4 w-4" />
                <span>RWA Institutional Protection via Deposits</span>
              </div>
              <p className="text-[#8a91a0] leading-relaxed">
                When institutional investors deposit funds or execute cross-domain compliance rebalances from Ethereum, the deposit transaction bypasses sequencer mempools entirely. Guaranteed gas ensures that cap table minting cannot be front-run or censored by MEV searchers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
