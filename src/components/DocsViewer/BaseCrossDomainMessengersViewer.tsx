import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
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
  Code2
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface BaseCrossDomainMessengersViewerProps {
  currentNetwork?: BaseNetwork;
}

export const BaseCrossDomainMessengersViewer: React.FC<BaseCrossDomainMessengersViewerProps> = ({ currentNetwork }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'interface' | 'versioning' | 'simulator' | 'gas' | 'security'>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Addresses
  const L2_CROSS_DOMAIN_MESSENGER = '0x4200000000000000000000000000000000000007';
  const L1_CROSS_DOMAIN_MESSENGER = '0x866E82a600A1414e583f7F13623F1aC5d58b0Afa';
  const L1_OPTIMISM_PORTAL = '0x49048044D57e1C92A77f79988d21Fa8fAF74E97e';
  const L2_MESSAGE_PASSER = '0x4200000000000000000000000000000000000016';

  // Versioning state
  const [selectedVersion, setSelectedVersion] = useState<0 | 1>(1);
  const [inputNonce, setInputNonce] = useState<string>('42');
  const [inputSender, setInputSender] = useState<string>('0x71C83897F023311EcBF69851701A0400A933be9F');
  const [inputTarget, setInputTarget] = useState<string>('0xB20019e07cA8F6A3E147eFbA9D987116e7a18453');
  const [inputValueEth, setInputValueEth] = useState<string>('0.0');
  const [inputGasLimit, setInputGasLimit] = useState<string>('150000');
  const [inputCalldata, setInputCalldata] = useState<string>('0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000005f5e100');

  // Gas overhead calculator state
  const [gasMsgBytes, setGasMsgBytes] = useState<number>(68);
  const [minGasLimit, setMinGasLimit] = useState<number>(100000);

  // Simulator state
  const [simDirection, setSimDirection] = useState<'l1_to_l2' | 'l2_to_l1'>('l1_to_l2');
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulateRelayFailure, setSimulateRelayFailure] = useState<boolean>(false);
  const [simReplayCount, setSimReplayCount] = useState<number>(0);

  // Copy handler
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

  // Packed nonce calculation: version stored in highest 2 bytes (bits 240..255)
  const packedNonceHex = useMemo(() => {
    try {
      const rawNonceNum = BigInt(inputNonce || '0');
      const versionBigInt = BigInt(selectedVersion);
      // (version << 240) | (rawNonceNum & ((1 << 240) - 1))
      const shiftedVersion = versionBigInt << 240n;
      const packed = shiftedVersion | rawNonceNum;
      return '0x' + packed.toString(16).padStart(64, '0');
    } catch {
      return '0x0';
    }
  }, [selectedVersion, inputNonce]);

  // Gas overhead calculation
  // MIN_GAS_CALLDATA_OVERHEAD = 16
  // MIN_GAS_CONSTANT_OVERHEAD = 200,000
  // MIN_GAS_DYNAMIC_OVERHEAD_NUMERATOR = 64
  // MIN_GAS_DYNAMIC_OVERHEAD_DENOMINATOR = 63
  const gasEstimate = useMemo(() => {
    const calldataOverhead = gasMsgBytes * 16;
    const constantOverhead = 200000;
    const dynamicGas = Math.floor((minGasLimit * 64) / 63);
    const totalBaseGas = calldataOverhead + constantOverhead + dynamicGas;
    return {
      calldataOverhead,
      constantOverhead,
      dynamicGas,
      totalBaseGas
    };
  }, [gasMsgBytes, minGasLimit]);

  const MESSENGER_SOLIDITY = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CrossDomainMessenger
 * @notice Specification of the Base cross-domain messenger contracts.
 *         Provides a high-level API for cross-domain messaging, replayability,
 *         and origin sender authentication (xDomainMessageSender).
 *         L2 Predeploy Address: 0x4200000000000000000000000000000000000007
 *         L1 Canonical Address: 0x866E82a600A1414e583f7F13623F1aC5d58b0Afa
 */
interface CrossDomainMessenger {
    event FailedRelayedMessage(bytes32 indexed msgHash);
    event RelayedMessage(bytes32 indexed msgHash);
    event SentMessage(
        address indexed target, 
        address sender, 
        bytes message, 
        uint256 messageNonce, 
        uint256 gasLimit
    );
    event SentMessageExtension1(address indexed sender, uint256 value);

    function MESSAGE_VERSION() external view returns (uint16);
    function MIN_GAS_CALLDATA_OVERHEAD() external view returns (uint64);
    function MIN_GAS_CONSTANT_OVERHEAD() external view returns (uint64);
    function MIN_GAS_DYNAMIC_OVERHEAD_DENOMINATOR() external view returns (uint64);
    function MIN_GAS_DYNAMIC_OVERHEAD_NUMERATOR() external view returns (uint64);
    function OTHER_MESSENGER() external view returns (address);
    function baseGas(bytes memory _message, uint32 _minGasLimit) external pure returns (uint64);
    function failedMessages(bytes32) external view returns (bool);
    function messageNonce() external view returns (uint256);

    /**
     * @notice Relays a cross-domain message. If execution on target reverts,
     *         the message is stored in failedMessages(msgHash) and can be replayed.
     */
    function relayMessage(
        uint256 _nonce,
        address _sender,
        address _target,
        uint256 _value,
        uint256 _minGasLimit,
        bytes memory _message
    ) external payable returns (bytes memory returnData_);

    /**
     * @notice Sends a message to the other domain.
     * @param _target Address of the contract to call on the other domain.
     * @param _message Calldata to forward.
     * @param _minGasLimit Minimum gas limit forwarded to _target.
     */
    function sendMessage(
        address _target, 
        bytes memory _message, 
        uint32 _minGasLimit
    ) external payable;

    function successfulMessages(bytes32) external view returns (bool);

    /**
     * @notice Authenticated sender on origin domain during message execution.
     */
    function xDomainMessageSender() external view returns (address);
}`;

  // Advance simulation
  const handleAdvanceSimulation = () => {
    if (simStep < 3) {
      setIsSimulating(true);
      setTimeout(() => {
        setIsSimulating(false);
        setSimStep(prev => prev + 1);
      }, 700);
    }
  };

  const handleResetSimulation = () => {
    setSimStep(0);
    setIsSimulating(false);
    setSimReplayCount(0);
  };

  const handleReplayFailedMessage = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimReplayCount(prev => prev + 1);
      triggerConfetti();
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER */}
      <div className="rounded-2xl border border-[#222838] bg-gradient-to-br from-[#0e111a] via-[#101420] to-[#0c0e15] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0052ff]/20 text-[#3c8aff] border border-[#0052ff]/40 uppercase tracking-wider">
                Cross-Domain Messaging Protocol
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#66c800]/20 text-[#66c800] border border-[#66c800]/40">
                Predeploy 0x4200...07
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <ArrowLeftRight className="h-6 w-6 text-[#0052ff]" />
              <span>Cross Domain Messengers (L1 ↔ L2)</span>
            </h1>
            <p className="text-xs text-[#8a91a0] max-w-3xl leading-relaxed">
              Specification of the higher-level cross-domain messaging layer on Base. Built on top of <code className="text-[#3c8aff]">OptimismPortal</code> (L1) and <code className="text-[#3c8aff]">L2ToL1MessagePasser</code> (L2), providing sender authentication (<code className="text-white">xDomainMessageSender</code>), versioned nonce packing, replayable execution for failed messages, and backwards-compatible legacy APIs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => handleCopy(L2_CROSS_DOMAIN_MESSENGER, 'l2_messenger')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-white border border-[#252d42] text-xs font-mono transition-colors"
            >
              {copiedAddress === 'l2_messenger' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5 text-[#8a91a0]" />}
              <span>L2 Predeploy: {shortenAddress(L2_CROSS_DOMAIN_MESSENGER)}</span>
            </button>

            <a
              href="https://docs.base.org/specifications/base-protocol/bridging/cross-domain-messengers"
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
            { id: 'overview', label: 'Architecture & Passing', icon: Layers },
            { id: 'interface', label: 'Solidity Interface', icon: FileCode },
            { id: 'versioning', label: 'Message Versioning (Nonce 240-255)', icon: Hash },
            { id: 'simulator', label: 'Interactive Relay & Replay', icon: Zap },
            { id: 'gas', label: 'BaseGas Overhead Formula', icon: Scale },
            { id: 'security', label: 'Security & Sender Authentication', icon: ShieldCheck },
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

      {/* TAB 1: OVERVIEW & ARCHITECTURE */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Architecture Diagram */}
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#0052ff]" />
                  <span>Two-Way Cross-Domain Messaging Topologies</span>
                </h3>
                <p className="text-xs text-[#8a91a0]">
                  How CrossDomainMessenger sits atop lower-level Bedrock primitives to deliver seamless messaging.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* L1 -> L2 Flow */}
              <div className="rounded-xl border border-[#1e2538] bg-[#101420] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#66c800]/20 text-[#66c800] border border-[#66c800]/30 uppercase">
                    Direction: L1 → L2
                  </span>
                  <span className="text-[11px] font-mono text-[#8a91a0]">Automated Derivation</span>
                </div>
                <h4 className="text-sm font-bold text-white">Ethereum (L1) to Base (L2)</h4>
                
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-[#0a0c12] border border-[#202738] flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-[#0052ff]/20 text-[#3c8aff] font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-white">Call sendMessage() on L1</p>
                      <p className="text-[#8a91a0] text-[11px]">Caller specifies target, calldata, and minGasLimit on L1CrossDomainMessenger.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0c12] border border-[#202738] flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-[#0052ff]/20 text-[#3c8aff] font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-white">Deposit Transaction Minted</p>
                      <p className="text-[#8a91a0] text-[11px]">Underneath, L1CrossDomainMessenger calls OptimismPortal, generating an EIP-2718 Type 0x7E deposit.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0c12] border border-[#202738] flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-[#66c800]/20 text-[#66c800] font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-bold text-white">Auto-Executed on Base</p>
                      <p className="text-[#8a91a0] text-[11px]">The user does NOT need to call relayMessage on L2! Rollup nodes execute the deposit automatically with guaranteed execution.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* L2 -> L1 Flow */}
              <div className="rounded-xl border border-[#1e2538] bg-[#101420] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fc401f]/20 text-[#fc401f] border border-[#fc401f]/30 uppercase">
                    Direction: L2 → L1
                  </span>
                  <span className="text-[11px] font-mono text-[#8a91a0]">3-Stage Finalization</span>
                </div>
                <h4 className="text-sm font-bold text-white">Base (L2) to Ethereum (L1)</h4>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-[#0a0c12] border border-[#202738] flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-[#fc401f]/20 text-[#fc401f] font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-white">Initiate on Base (L2)</p>
                      <p className="text-[#8a91a0] text-[11px]">User calls sendMessage() on L2CrossDomainMessenger (0x4200...07), forwarding to L2ToL1MessagePasser.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0c12] border border-[#202738] flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-[#ffd12f]/20 text-[#ffd12f] font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-white">Prove on Ethereum (L1)</p>
                      <p className="text-[#8a91a0] text-[11px]">After L2 state commits to L1, prove the message inclusion on OptimismPortal and wait 7 days for the dispute game.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0c12] border border-[#202738] flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-[#66c800]/20 text-[#66c800] font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-bold text-white">Finalize &amp; Relay on L1</p>
                      <p className="text-[#8a91a0] text-[11px]">Finalize on OptimismPortal, which calls relayMessage() on L1CrossDomainMessenger to execute target calldata.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Canonical Contract Registry */}
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[#3c8aff]" />
              <span>Messenger Contract Endpoints on Base &amp; Ethereum</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">L2CrossDomainMessenger</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0052ff]/20 text-[#3c8aff]">Base (L2)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0a0c12] border border-[#222838] flex items-center justify-between text-xs font-mono">
                  <span className="text-white truncate mr-2">{L2_CROSS_DOMAIN_MESSENGER}</span>
                  <button 
                    onClick={() => handleCopy(L2_CROSS_DOMAIN_MESSENGER, 'l2_addr')} 
                    className="text-[#8a91a0] hover:text-white p-1"
                  >
                    {copiedAddress === 'l2_addr' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8a91a0]">
                  Predeploy contract instantiated at genesis. Routes messages to <code>L2ToL1MessagePasser</code> (0x4200...16) and tracks sent nonces.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">L1CrossDomainMessenger</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#fc401f]/20 text-[#fc401f]">Ethereum (L1)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0a0c12] border border-[#222838] flex items-center justify-between text-xs font-mono">
                  <span className="text-white truncate mr-2">{L1_CROSS_DOMAIN_MESSENGER}</span>
                  <button 
                    onClick={() => handleCopy(L1_CROSS_DOMAIN_MESSENGER, 'l1_addr')} 
                    className="text-[#8a91a0] hover:text-white p-1"
                  >
                    {copiedAddress === 'l1_addr' ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8a91a0]">
                  Canonical L1 bridge messenger deployed behind an upgradable proxy. Routes deposits to <code>OptimismPortal</code> and executes finalized withdrawals.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOLIDITY INTERFACE */}
      {activeTab === 'interface' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-[#0052ff]" />
                  <span>CrossDomainMessenger.sol Formal Interface</span>
                </h3>
                <p className="text-xs text-[#8a91a0]">
                  Core events, view getters, gas constants, message replay, and dispatch entrypoints.
                </p>
              </div>

              <button
                onClick={() => handleCopy(MESSENGER_SOLIDITY, 'solidity_code')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-white border border-[#252d42] text-xs font-mono transition-colors"
              >
                {copiedCode === 'solidity_code' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#66c800]" />
                    <span className="text-[#66c800]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[#8a91a0]" />
                    <span>Copy Interface</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl bg-[#08090d] border border-[#1e2538] p-4 text-xs font-mono text-[#dee1e7] overflow-x-auto">
              <pre>
                <code>{MESSENGER_SOLIDITY}</code>
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1.5">
                <span className="text-[#3c8aff] font-mono font-bold">xDomainMessageSender()</span>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  During execution of a relayed message, callers can query this function to obtain the authenticated msg.sender on the origin domain.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1.5">
                <span className="text-[#ffd12f] font-mono font-bold">failedMessages(bytes32)</span>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  If the target call reverts or runs out of gas, the message hash is permanently committed to <code>failedMessages</code> so it can be replayed safely.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-1.5">
                <span className="text-[#66c800] font-mono font-bold">successfulMessages(bytes32)</span>
                <p className="text-[#8a91a0] text-[11px] leading-relaxed">
                  Tracks hashes of successfully executed cross-domain transactions to prevent re-execution or replay attacks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MESSAGE VERSIONING */}
      {activeTab === 'versioning' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Hash className="h-5 w-5 text-[#ffd12f]" />
                <span>Message Versioning &amp; Nonce Bit-Packing</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Messages are versioned based on the first 2 bytes (bits 240..255) of their <code>uint256</code> nonce: <code className="text-white font-mono">(version &lt;&lt; 240) | nonce</code>. This avoids protocol schema migrations.
              </p>
            </div>

            {/* Version Toggle */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#101420] border border-[#1e2538] w-fit">
              <button
                onClick={() => setSelectedVersion(1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedVersion === 1
                    ? 'bg-[#0052ff] text-white'
                    : 'text-[#8a91a0] hover:text-white'
                }`}
              >
                Message Version 1 (Bedrock Standard)
              </button>
              <button
                onClick={() => setSelectedVersion(0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedVersion === 0
                    ? 'bg-[#ffd12f]/20 text-[#ffd12f] border border-[#ffd12f]/30'
                    : 'text-[#8a91a0] hover:text-white'
                }`}
              >
                Message Version 0 (Legacy Pre-Bedrock)
              </button>
            </div>

            {/* Interactive Nonce Encoder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#3c8aff] uppercase tracking-wider">Input Parameters</h4>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] text-[#8a91a0] block mb-1 font-mono">Raw Sequential Nonce (uint240)</label>
                    <input
                      type="text"
                      value={inputNonce}
                      onChange={(e) => setInputNonce(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-2 rounded-xl bg-[#101420] border border-[#222838] text-white font-mono text-xs focus:outline-none focus:border-[#0052ff]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#8a91a0] block mb-1 font-mono">Origin Sender (_sender)</label>
                    <input
                      type="text"
                      value={inputSender}
                      onChange={(e) => setInputSender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101420] border border-[#222838] text-white font-mono text-xs focus:outline-none focus:border-[#0052ff]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#8a91a0] block mb-1 font-mono">Destination Target (_target)</label>
                    <input
                      type="text"
                      value={inputTarget}
                      onChange={(e) => setInputTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101420] border border-[#222838] text-white font-mono text-xs focus:outline-none focus:border-[#0052ff]"
                    />
                  </div>

                  {selectedVersion === 1 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-[#8a91a0] block mb-1 font-mono">Value (ETH)</label>
                        <input
                          type="text"
                          value={inputValueEth}
                          onChange={(e) => setInputValueEth(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#101420] border border-[#222838] text-white font-mono text-xs focus:outline-none focus:border-[#0052ff]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#8a91a0] block mb-1 font-mono">Min Gas Limit</label>
                        <input
                          type="text"
                          value={inputGasLimit}
                          onChange={(e) => setInputGasLimit(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#101420] border border-[#222838] text-white font-mono text-xs focus:outline-none focus:border-[#0052ff]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-[#8a91a0] block mb-1 font-mono">Payload Calldata (_message)</label>
                    <input
                      type="text"
                      value={inputCalldata}
                      onChange={(e) => setInputCalldata(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101420] border border-[#222838] text-white font-mono text-xs focus:outline-none focus:border-[#0052ff]"
                    />
                  </div>
                </div>
              </div>

              {/* Bit-packing visualization */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#66c800] uppercase tracking-wider">Packed Nonce &amp; ABI Encoding</h4>

                <div className="p-4 rounded-xl bg-[#101420] border border-[#222838] space-y-3">
                  <div className="text-[11px] text-[#8a91a0] flex justify-between">
                    <span>Bits 240..255 (Version):</span>
                    <span className="text-[#ffd12f] font-mono font-bold">0x{selectedVersion.toString(16).padStart(4, '0')} (v{selectedVersion})</span>
                  </div>
                  <div className="text-[11px] text-[#8a91a0] flex justify-between">
                    <span>Bits 0..239 (Nonce):</span>
                    <span className="text-[#3c8aff] font-mono font-bold">#{inputNonce}</span>
                  </div>

                  <div className="pt-2 border-t border-[#1e2538] space-y-1">
                    <span className="text-[10px] text-[#8a91a0] font-mono uppercase">Resulting uint256 Nonce (Hex):</span>
                    <div className="p-2 rounded bg-[#0a0c12] text-[#66c800] font-mono text-[10px] break-all border border-[#1e2538]">
                      {packedNonceHex}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#101420] border border-[#222838] space-y-2">
                  <span className="text-xs font-bold text-white">ABI Signature Encodings</span>
                  {selectedVersion === 1 ? (
                    <div className="p-3 rounded-lg bg-[#08090d] text-[11px] font-mono text-[#dee1e7] border border-[#1e2538] space-y-1">
                      <p className="text-[#3c8aff]">// Version 1 Encoding</p>
                      <p>abi.encodeWithSignature(</p>
                      <p className="text-[#8a91a0] pl-4">"relayMessage(uint256,address,address,uint256,uint256,bytes)",</p>
                      <p className="pl-4">_nonce,      // {packedNonceHex.slice(0, 10)}...</p>
                      <p className="pl-4">_sender,     // {shortenAddress(inputSender)}</p>
                      <p className="pl-4">_target,     // {shortenAddress(inputTarget)}</p>
                      <p className="pl-4">_value,      // {inputValueEth} ETH</p>
                      <p className="pl-4">_gasLimit,   // {inputGasLimit}</p>
                      <p className="pl-4">_data        // {inputCalldata.slice(0, 16)}...</p>
                      <p>);</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-[#08090d] text-[11px] font-mono text-[#dee1e7] border border-[#1e2538] space-y-1">
                      <p className="text-[#ffd12f]">// Version 0 Encoding (Legacy)</p>
                      <p>abi.encodeWithSignature(</p>
                      <p className="text-[#8a91a0] pl-4">"relayMessage(address,address,bytes,uint256)",</p>
                      <p className="pl-4">_target,     // {shortenAddress(inputTarget)}</p>
                      <p className="pl-4">_sender,     // {shortenAddress(inputSender)}</p>
                      <p className="pl-4">_message,    // {inputCalldata.slice(0, 16)}...</p>
                      <p className="pl-4">_messageNonce // {packedNonceHex.slice(0, 10)}...</p>
                      <p>);</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE RELAY & REPLAY SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#3c8aff]" />
                  <span>Cross-Domain Relay &amp; Failed Message Replay Simulator</span>
                </h3>
                <p className="text-xs text-[#8a91a0]">
                  Step through execution, simulate gas exhaustion reverts, and replay failed messages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSimDirection(simDirection === 'l1_to_l2' ? 'l2_to_l1' : 'l1_to_l2');
                    handleResetSimulation();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-white border border-[#252d42] text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 text-[#0052ff]" />
                  <span>Switch: {simDirection === 'l1_to_l2' ? 'L1 → L2' : 'L2 → L1'}</span>
                </button>

                <button
                  onClick={handleResetSimulation}
                  className="px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-[#8a91a0] hover:text-white border border-[#252d42] text-xs font-mono transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Simulation controls */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={simulateRelayFailure}
                    onChange={(e) => setSimulateRelayFailure(e.target.checked)}
                    className="rounded bg-[#0a0c12] border-[#252d42] text-[#0052ff] focus:ring-0"
                  />
                  <span>Simulate Out-Of-Gas Target Failure (Commit to <code>failedMessages</code>)</span>
                </label>
              </div>

              <button
                onClick={handleAdvanceSimulation}
                disabled={simStep >= 3 || isSimulating}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  simStep >= 3
                    ? 'bg-[#181d2c] text-[#717886] cursor-not-allowed'
                    : 'bg-[#0052ff] hover:bg-[#0045d8] text-white shadow-md shadow-[#0052ff]/30'
                }`}
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Relay...</span>
                  </>
                ) : (
                  <>
                    <span>Next Stage ({simStep}/3)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Stages visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className={`p-4 rounded-xl border transition-all ${
                simStep >= 1 ? 'bg-[#0f1422] border-[#0052ff]/50' : 'bg-[#0a0c12] border-[#1e2538] opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#3c8aff] font-bold">STAGE 1</span>
                  {simStep >= 1 && <CheckCircle2 className="h-4 w-4 text-[#66c800]" />}
                </div>
                <h4 className="text-xs font-bold text-white mb-1">
                  {simDirection === 'l1_to_l2' ? 'L1: sendMessage()' : 'L2: sendMessage()'}
                </h4>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  {simDirection === 'l1_to_l2'
                    ? 'L1CrossDomainMessenger emits SentMessage event and pays L2 gas via OptimismPortal deposit.'
                    : 'L2CrossDomainMessenger initiates cross-domain message with L2ToL1MessagePasser.'}
                </p>
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-xl border transition-all ${
                simStep >= 2 ? 'bg-[#0f1422] border-[#0052ff]/50' : 'bg-[#0a0c12] border-[#1e2538] opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#3c8aff] font-bold">STAGE 2</span>
                  {simStep >= 2 && <CheckCircle2 className="h-4 w-4 text-[#66c800]" />}
                </div>
                <h4 className="text-xs font-bold text-white mb-1">
                  {simDirection === 'l1_to_l2' ? 'L2: Deterministic Derivation' : 'L1: Fault Proof & Challenge'}
                </h4>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  {simDirection === 'l1_to_l2'
                    ? 'Rollup nodes automatically derive deposit on Base without manual relayer transaction.'
                    : 'Relayer proves withdrawal on OptimismPortal and satisfies 7-day challenge window.'}
                </p>
              </div>

              {/* Step 3 */}
              <div className={`p-4 rounded-xl border transition-all ${
                simStep >= 3 
                  ? simulateRelayFailure ? 'bg-[#1e1315] border-[#fc401f]/60' : 'bg-[#0f1b14] border-[#66c800]/60'
                  : 'bg-[#0a0c12] border-[#1e2538] opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#3c8aff] font-bold">STAGE 3</span>
                  {simStep >= 3 && (
                    simulateRelayFailure 
                      ? <AlertTriangle className="h-4 w-4 text-[#fc401f]" />
                      : <CheckCircle2 className="h-4 w-4 text-[#66c800]" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-white mb-1">
                  {simDirection === 'l1_to_l2' ? 'L2: relayMessage()' : 'L1: relayMessage()'}
                </h4>
                <p className="text-[11px] text-[#8a91a0] leading-relaxed">
                  {simulateRelayFailure 
                    ? 'Target contract reverted! The message hash is stored in failedMessages(msgHash).' 
                    : 'Target call executed successfully! Recorded in successfulMessages(msgHash).'}
                </p>
              </div>
            </div>

            {/* If relay failed, show replay panel */}
            {simStep >= 3 && simulateRelayFailure && (
              <div className="p-4 rounded-xl bg-[#1c1214] border border-[#fc401f]/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-[#fc401f]" />
                    <span className="text-xs font-bold text-white">
                      Message In <code>failedMessages</code> Mapping (Replay Available)
                    </span>
                  </div>
                  {simReplayCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#66c800]/20 text-[#66c800] border border-[#66c800]/30 font-bold">
                      Replayed {simReplayCount}x Successfully
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#8a91a0] leading-relaxed">
                  Unlike direct calls to <code>OptimismPortal</code> (which fail permanently if reverted), <code>CrossDomainMessenger</code> retains failed messages in EVM storage. Anyone can call <code>relayMessage()</code> with increased gas limit to re-attempt execution without restarting the 7-day challenge period!
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleReplayFailedMessage}
                    disabled={isSimulating}
                    className="px-4 py-2 rounded-xl bg-[#66c800] hover:bg-[#5bb200] text-black text-xs font-bold transition-all shadow-md shadow-[#66c800]/20 flex items-center gap-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>Replay Message with 300,000 Gas</span>
                  </button>

                  <span className="text-[11px] font-mono text-[#8a91a0]">
                    msgHash: 0x9f83...c421
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: GAS OVERHEAD FORMULA */}
      {activeTab === 'gas' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-[#0052ff]" />
                <span>BaseGas Overhead Calculation Formula</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                To guarantee that the messenger contract has sufficient gas to log events, update state, and execute the target call without unexpected out-of-gas errors, the protocol applies a deterministic overhead formula.
              </p>
            </div>

            {/* Formula box */}
            <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-2">
              <span className="text-xs font-mono font-bold text-[#3c8aff]">Solidity baseGas() Implementation:</span>
              <div className="p-3 rounded bg-[#08090d] text-xs font-mono text-[#dee1e7] border border-[#1e2538] overflow-x-auto">
                <code>{`function baseGas(bytes memory _message, uint32 _minGasLimit) public pure returns (uint64) {
    return uint64(
        _message.length * MIN_GAS_CALLDATA_OVERHEAD +       // 16 gas per byte
        MIN_GAS_CONSTANT_OVERHEAD +                         // 200,000 gas
        (_minGasLimit * MIN_GAS_DYNAMIC_OVERHEAD_NUMERATOR) / // 64/63 (EIP-150 63/64 rule compensation)
            MIN_GAS_DYNAMIC_OVERHEAD_DENOMINATOR
    );
}`}</code>
              </div>
            </div>

            {/* Interactive Calculator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Parameters</h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8a91a0]">Calldata Message Length (bytes):</span>
                      <span className="text-white font-mono">{gasMsgBytes} bytes</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="1024"
                      value={gasMsgBytes}
                      onChange={(e) => setGasMsgBytes(Number(e.target.value))}
                      className="w-full accent-[#0052ff]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8a91a0]">Minimum Target Gas Limit (_minGasLimit):</span>
                      <span className="text-white font-mono">{minGasLimit.toLocaleString()} gas</span>
                    </div>
                    <input
                      type="range"
                      min="21000"
                      max="500000"
                      step="5000"
                      value={minGasLimit}
                      onChange={(e) => setMinGasLimit(Number(e.target.value))}
                      className="w-full accent-[#0052ff]"
                    />
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3 text-xs">
                <h4 className="font-bold text-white">Calculated Minimum Gas Allocation</h4>

                <div className="space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between text-[#8a91a0]">
                    <span>Calldata Overhead ({gasMsgBytes} × 16):</span>
                    <span className="text-white">{gasEstimate.calldataOverhead.toLocaleString()} gas</span>
                  </div>
                  <div className="flex justify-between text-[#8a91a0]">
                    <span>Constant Messenger Overhead:</span>
                    <span className="text-white">200,000 gas</span>
                  </div>
                  <div className="flex justify-between text-[#8a91a0]">
                    <span>Dynamic 64/63 EIP-150 Buffer:</span>
                    <span className="text-white">{gasEstimate.dynamicGas.toLocaleString()} gas</span>
                  </div>
                  <div className="pt-2 border-t border-[#1e2538] flex justify-between text-xs font-bold">
                    <span className="text-[#3c8aff]">Total baseGas Required:</span>
                    <span className="text-[#66c800]">{gasEstimate.totalBaseGas.toLocaleString()} gas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY & SENDER AUTHENTICATION */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#66c800]" />
                <span>Security Guarantees &amp; Authentication Patterns</span>
              </h3>
              <p className="text-xs text-[#8a91a0]">
                Implementing robust cross-domain contracts using <code className="text-white">xDomainMessageSender()</code> and understanding deprecated legacy attack surfaces.
              </p>
            </div>

            {/* Pattern 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#0052ff]" />
                  <h4 className="text-xs font-bold text-white">Recommended Receiver Contract Pattern</h4>
                </div>
                <p className="text-xs text-[#8a91a0] leading-relaxed">
                  When receiving cross-domain calls, the target contract must ensure that <code>msg.sender</code> is the legitimate Messenger predeploy, and then verify the origin sender.
                </p>
                <div className="p-3 rounded-lg bg-[#08090d] text-[11px] font-mono text-[#dee1e7] border border-[#1e2538] space-y-1">
                  <p className="text-[#3c8aff]">// In your receiver contract</p>
                  <p>require(msg.sender == MESSENGER_ADDRESS, "Unauthorized");</p>
                  <p>require(</p>
                  <p className="pl-4">ICrossDomainMessenger(msg.sender).xDomainMessageSender() == AUTHORIZED_ORIGIN,</p>
                  <p className="pl-4">"Invalid origin sender"</p>
                  <p>);</p>
                </div>
              </div>

              {/* Backwards compatibility deprecation */}
              <div className="p-4 rounded-xl bg-[#101420] border border-[#1e2538] space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#ffd12f]" />
                  <h4 className="text-xs font-bold text-white">Removed Legacy Features in Bedrock</h4>
                </div>
                <div className="space-y-2 text-xs text-[#8a91a0]">
                  <p>
                    <strong className="text-white">1. blockedMessages Mapping Removed:</strong> Older messenger iterations attempted to support blocking specific messages. This was eliminated because malicious actors could bypass filtering by altering non-essential calldata parameters, and removing it significantly reduces gas on finalized withdrawals.
                  </p>
                  <p>
                    <strong className="text-white">2. relayId &amp; relayedMessages Removed:</strong> Originally conceived to incentivize relayers, this mapping was removed because it was impossible to reliably determine whether the relayed transaction actually achieved application-level success.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
