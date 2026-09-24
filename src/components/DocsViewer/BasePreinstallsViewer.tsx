import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowUpRight,
  Shield,
  Key,
  Boxes,
  Zap,
  CheckCircle2,
  FileCode2,
  AlertCircle
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress, triggerConfetti } from '../../utils/web3Helper';

export interface PreinstallContract {
  name: string;
  address: string;
  category: 'safe' | 'erc4337' | 'deployer' | 'approval';
  categoryLabel: string;
  summary: string;
  githubUrl?: string;
  specDetails: string;
  useCaseForB20?: string;
  keyFeatures: string[];
}

export const BASE_PREINSTALLS: PreinstallContract[] = [
  {
    name: 'Safe (Gnosis Safe v1.3.0)',
    address: '0x69f4D1788e39c87893C980c06EdF4b7f686e2938',
    category: 'safe',
    categoryLabel: 'Safe Multisig',
    summary: 'Multisignature wallet with support for ERC-191 signed message confirmations. Omits event emissions to optimize L1/L2 gas consumption.',
    githubUrl: 'https://github.com/safe-global/safe-contracts/blob/v1.3.0/contracts/GnosisSafe.sol',
    specDetails: 'Standard Gnosis Safe v1.3.0 singleton. Optimized for minimum execution gas by skipping event emissions. For indexed setups where indexing nodes monitor event logs, SafeL2 is used instead.',
    useCaseForB20: 'Institutional treasury custody: require M-of-N executive signatures for high-value asset issuances and compliance policy changes.',
    keyFeatures: ['ERC-191 offchain signatures', 'Gas optimized (no events)', 'M-of-N threshold rules', 'DelegateCall modules']
  },
  {
    name: 'SafeL2 (Gnosis Safe L2 v1.3.0)',
    address: '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA',
    category: 'safe',
    categoryLabel: 'Safe Multisig',
    summary: 'Multisignature wallet with ERC-191 message confirmations that explicitly emits receipt events for L2 indexing and subgraph tracking.',
    githubUrl: 'https://github.com/safe-global/safe-contracts/blob/v1.3.0/contracts/GnosisSafeL2.sol',
    specDetails: 'Identical security logic to Safe singleton, but includes execution event logs. Recommended on Base L2 because L2 gas costs are so low (~0.001 Gwei) that event transparency outweighs minimal calldata savings.',
    useCaseForB20: 'Regulated asset administrative multisig with complete indexable onchain audit logs for audit and compliance reporting.',
    keyFeatures: ['Emits execution events', 'L2 indexer friendly', 'Base subgraphs support', 'Deterministic singleton']
  },
  {
    name: 'MultiSend',
    address: '0x998739BFdAAdde7C933B942a68053933098f9EDa',
    category: 'safe',
    categoryLabel: 'Safe Multisig',
    summary: 'Batches multiple transactions into a single atomic transaction through delegatecall execution.',
    githubUrl: 'https://github.com/safe-global/safe-contracts/blob/v1.3.0/contracts/libraries/MultiSend.sol',
    specDetails: 'Allows a Safe or caller to execute a series of delegatecalls or regular calls atomically. If any bundled transaction reverts, the entire batch reverts.',
    useCaseForB20: 'Batch minting and allowlist enrollment: atomically register 100 accredited investors and distribute their subscribed equity tokens in one single transaction.',
    keyFeatures: ['Atomic batch execution', 'DelegateCall capable', 'Zero intermediate state leaks', 'Safe native integration']
  },
  {
    name: 'MultiSendCallOnly',
    address: '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
    category: 'safe',
    categoryLabel: 'Safe Multisig',
    summary: 'Batches multiple transactions into one atomic payload restricted strictly to CALL operations (no delegatecalls).',
    githubUrl: 'https://github.com/safe-global/safe-contracts/blob/v1.3.0/contracts/libraries/MultiSendCallOnly.sol',
    specDetails: 'Restricted variant of MultiSend that forbids DELEGATECALL. Prevents malicious payload modifications to the calling contract storage during batching.',
    useCaseForB20: 'Executing batch dividend payouts and yield distributions across multiple investor wallets safely without touching storage execution context.',
    keyFeatures: ['CALL-only isolation', 'No DELEGATECALL risk', 'Reentrancy protection', 'Safe batch execution']
  },
  {
    name: 'SafeSingletonFactory',
    address: '0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7',
    category: 'safe',
    categoryLabel: 'Safe Multisig',
    summary: 'Deterministic deployment factory for Safe-related contracts, deployed via pre-signed transactions that include EIP-155 Chain ID.',
    githubUrl: 'https://github.com/safe-global/safe-singleton-factory/blob/v1.0.17/source/deterministic-deployment-proxy.yul',
    specDetails: 'Solves the issue where legacy pre-signed deployment transactions without a chain ID are rejected by modern EVM networks like Base. Signed by the Safe key to guarantee identical factory address on Base.',
    useCaseForB20: 'Guarantees that custom Safe governance modules and multi-sig policies deploy to identical addresses on Base Vibenet, Sepolia, and Mainnet.',
    keyFeatures: ['EIP-155 replay protection', 'Cross-chain address parity', 'Yul optimized bytecode', 'Deterministic deployment']
  },
  {
    name: 'Multicall3',
    address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    category: 'deployer',
    categoryLabel: 'Utilities & Tooling',
    summary: 'Aggregates multiple read calls into a single RPC query, and executes multiple state-changing calls in a single transaction.',
    githubUrl: 'https://github.com/mds1/multicall/blob/v3.1.0/src/Multicall3.sol',
    specDetails: 'The universal EVM aggregation utility. Exposes aggregate3 and aggregate3Value with granular failure handling (allowFailure flag), block timestamp, and basefee retrieval.',
    useCaseForB20: 'Powers the B20 Cap Table Manager to fetch 500+ investor balances and allowlist credentials in a single round-trip RPC call (<100ms on Base).',
    keyFeatures: ['allowFailure granular checks', 'Batch RPC aggregation', 'Gas and latency reduction', 'Universal EVM address']
  },
  {
    name: 'Create2Deployer',
    address: '0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2',
    category: 'deployer',
    categoryLabel: 'Deterministic Factories',
    summary: 'Solidity wrapper around the CREATE2 opcode for deterministic deployment with address pre-computation.',
    githubUrl: 'https://github.com/mdehoog/create2deployer/blob/69b9a8e112b15f9257ce8c62b70a09914e7be29c/contracts/Create2Deployer.sol',
    specDetails: 'Deployed at genesis on Canyon activation. Provides computeAddress(bytes32 salt, bytes32 codeHash) and deploy(uint256 value, bytes32 salt, bytes code). Also supports ERC1820 implementer deployments.',
    useCaseForB20: 'Deploy B20 Policy Registries and Diamond Facets to pre-calculated addresses before funding or announcing the asset launch.',
    keyFeatures: ['Pre-computes destination address', 'CREATE2 opcode wrapper', 'ERC-1820 implementer helper', 'Canyon genesis deployed']
  },
  {
    name: 'CreateX',
    address: '0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed',
    category: 'deployer',
    categoryLabel: 'Deterministic Factories',
    summary: 'Next-generation deployment factory supporting CREATE, CREATE2, and CREATE3 with built-in sender and chain ID salt protection.',
    githubUrl: 'https://github.com/pcaversaccio/createx/blob/main/src/CreateX.sol',
    specDetails: 'Bytecode keccak256 hash: 0xbd8a7ea8cfca7b4e5f5041d7d4b17bc317c5ce42cfbc42066a00cf26b43eb53f. Protects against front-running and cross-chain address squatting by packing sender address and chain ID into salt.',
    useCaseForB20: 'Securely deploys custom B20 security tokens with cross-chain salt protection, ensuring identical token addresses across OP Stack rollups.',
    keyFeatures: ['CREATE3 deployment support', 'Sender salt protection', 'ChainID front-running guard', 'Immutable bytecode hash']
  },
  {
    name: "Arachnid's Deterministic Deployment Proxy",
    address: '0x4e59b44847b379578588920cA78FbF26c0B4956C',
    category: 'deployer',
    categoryLabel: 'Deterministic Factories',
    summary: 'Classic Nick Johnson (Arachnid) keyless deployment proxy using one-time transaction signature for cross-chain address synchronization.',
    githubUrl: 'https://github.com/Arachnid/deterministic-deployment-proxy/blob/v1.0.0/source/deterministic-deployment-proxy.yul',
    specDetails: 'Deployed via a one-time presigned transaction without a known private key. Ensures identical bytecode deployed with the same salt produces the identical contract address across any EVM chain.',
    useCaseForB20: 'Deploying immutable verification oracle contracts that must exist at the identical address on Ethereum L1 and Base L2.',
    keyFeatures: ['Keyless pre-signed deployment', 'True multi-chain address parity', 'Gas independent address derivation', 'Yul implementation']
  },
  {
    name: 'Permit2',
    address: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    category: 'approval',
    categoryLabel: 'Token Approvals & Meta-Tx',
    summary: 'Uniswap next-generation token approval & signature transfer system that eliminates standard infinite ERC-20 allowances.',
    githubUrl: 'https://github.com/Uniswap/permit2/blob/0x000000000022D473030F116dDEE9F6B43aC78BA3/src/Permit2.sol',
    specDetails: 'Shares a single canonical address across all EVMs. Provides signature-based allowance transfers (permitTransferFrom), expiring permissions, and nonces to protect user token balances.',
    useCaseForB20: 'Allows secondary market trading and dividend reinvestment for B20 tokens with gasless EIP-712 signatures without requiring repeated approve() transactions.',
    keyFeatures: ['EIP-712 signature approvals', 'Expiring token permissions', 'Batch signature transfers', 'Zero infinite approval exposure']
  },
  {
    name: 'ERC-4337 v0.7.0 EntryPoint',
    address: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    category: 'erc4337',
    categoryLabel: 'Account Abstraction',
    summary: 'Canonical EntryPoint contract for ERC-4337 v0.7.0 UserOperation validation, fee sponsorship, and bundled execution.',
    githubUrl: 'https://github.com/eth-infinitism/account-abstraction/blob/v0.7.0/contracts/core/EntryPoint.sol',
    specDetails: 'The core hub of Account Abstraction v0.7.0 on Base. Validates PackedUserOperation structs, enforces Paymaster gas limits, and executes account actions. Optimized for Base Smart Wallet passkeys.',
    useCaseForB20: 'Underpins Base Smart Wallet passkeys and the B20 Paymaster demo: allows accredited investors to sign transfers with FaceID/TouchID with zero gas fees.',
    keyFeatures: ['PackedUserOperation format', 'ERC-4337 v0.7.0 standard', 'Base Smart Wallet core', 'Gasless Paymaster sponsor hook']
  },
  {
    name: 'ERC-4337 v0.7.0 SenderCreator',
    address: '0xEFC2c1444eBCC4Db75e7613d20C6a62fF67A167C',
    category: 'erc4337',
    categoryLabel: 'Account Abstraction',
    summary: 'Auxiliary contract for EntryPoint v0.7.0 to execute userOp.initCode deployments from a neutral sender address.',
    githubUrl: 'https://github.com/eth-infinitism/account-abstraction/blob/v0.7.0/contracts/core/SenderCreator.sol',
    specDetails: 'Provides clean address separation when deploying counterfactual smart contract wallets during their very first transaction so that msg.sender is not the EntryPoint itself.',
    useCaseForB20: 'Deploys first-time investor Base Smart Wallets seamlessly in the same bundle as their initial B20 share purchase.',
    keyFeatures: ['Counterfactual wallet deployment', 'EntryPoint v0.7.0 auxiliary', 'Clean msg.sender isolation', 'One-step onboarding']
  },
  {
    name: 'ERC-4337 v0.6.0 EntryPoint',
    address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    category: 'erc4337',
    categoryLabel: 'Account Abstraction',
    summary: 'Canonical EntryPoint contract for ERC-4337 v0.6.0 UserOperations. Retained for backwards compatibility with legacy smart accounts.',
    githubUrl: 'https://github.com/eth-infinitism/account-abstraction/blob/v0.6.0/contracts/core/EntryPoint.sol',
    specDetails: 'Validates legacy UserOperation structs. Widely supported across early account abstraction infrastructure (Biconomy, ZeroDev v1, Stackup).',
    useCaseForB20: 'Backwards-compatible support for legacy ERC-4337 institutional smart account bundlers.',
    keyFeatures: ['v0.6.0 UserOperation standard', 'Legacy bundler compatibility', 'Ecosystem compatibility', 'Deterministic address']
  },
  {
    name: 'ERC-4337 v0.6.0 SenderCreator',
    address: '0x7fc98430eaedbb6070b35b39d798725049088348',
    category: 'erc4337',
    categoryLabel: 'Account Abstraction',
    summary: 'Auxiliary contract for EntryPoint v0.6.0 to execute userOp.initCode deployments from a neutral sender address.',
    githubUrl: 'https://github.com/eth-infinitism/account-abstraction/blob/v0.6.0/contracts/core/SenderCreator.sol',
    specDetails: 'Helper contract for EntryPoint v0.6.0 to call userOp.initCode from a neutral address that is explicitly not EntryPoint itself.',
    useCaseForB20: 'Counterfactual wallet deployment for v0.6.0 smart wallets.',
    keyFeatures: ['v0.6.0 EntryPoint helper', 'Deterministic address', 'Clean wallet factory calling', 'Legacy support']
  },
];

interface BasePreinstallsViewerProps {
  currentNetwork?: BaseNetwork;
}

export const BasePreinstallsViewer: React.FC<BasePreinstallsViewerProps> = ({ currentNetwork }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'safe' | 'erc4337' | 'deployer' | 'approval'>('all');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [expandedContract, setExpandedContract] = useState<string | null>('SafeL2 (Gnosis Safe L2 v1.3.0)');

  const filtered = BASE_PREINSTALLS.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        (p.useCaseForB20 && p.useCaseForB20.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    triggerConfetti();
    setTimeout(() => setCopiedAddress(null), 1800);
  };

  const getExplorerUrl = (address: string) => {
    if (currentNetwork?.explorerUrl) {
      return `${currentNetwork.explorerUrl}/address/${address}`;
    }
    return `https://basescan.org/address/${address}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="rounded-3xl border border-[#232938] bg-gradient-to-br from-[#10131a] via-[#131726] to-[#0f1118] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#66c800] animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#66c800]">
              Genesis Utility Tooling · Third-Party EVM Preinstalls
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Base Preinstalled Smart Contracts
          </h2>
          
          <p className="text-sm text-[#8a91a0] max-w-3xl leading-relaxed">
            Preinstalled smart contracts exist on Base at predetermined addresses in the genesis state for maximum developer convenience. Unlike system predeploys (which handle core OP Stack rollups and L1 messaging), preinstalls are widely adopted utility contracts created by third parties (Safe, Uniswap Permit2, ERC-4337 EntryPoints, Multicall3, CreateX) that run directly in the EVM.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Scope:</span>
              <span className="text-[#3c8aff] font-bold">14 Genesis Utilities</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Execution:</span>
              <span className="text-[#66c800] font-bold">Native EVM (No Precompile)</span>
            </div>
            <a
              href="https://docs.base.org/llms.txt"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#0052ff]/15 hover:bg-[#0052ff]/25 border border-[#0052ff]/40 text-[#3c8aff] font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>docs.base.org Preinstalls Spec</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Difference Warning Box */}
      <div className="p-4 rounded-2xl bg-[#ffd12f]/10 border border-[#ffd12f]/30 flex items-start gap-3 text-xs text-[#dee1e7]">
        <AlertCircle className="h-5 w-5 text-[#ffd12f] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-[#ffd12f] uppercase tracking-wide text-[11px] font-mono">
            Predeploys vs Preinstalls Security Model
          </div>
          <p className="text-[#c5cad6] leading-relaxed">
            <strong>Predeploys</strong> (e.g. <code>0x4200...xxx</code>) are core protocol infrastructure maintained by Base &amp; the OP Stack, governed by <code>ProxyAdmin</code>. In contrast, <strong>Preinstalls</strong> are third-party utility standards (Safe, Multicall3, Permit2, EntryPoint) placed in genesis for frictionless developer experience without requiring custom deployment gas. They do not share the same system upgrade guarantees as predeploys.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#0e1118] border border-[#202636]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717886]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search preinstalls (Safe, Multicall, Permit2, ERC-4337)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141824] border border-[#242c3d] text-xs text-white placeholder-[#687285] focus:border-[#0052ff] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: 'All (14)' },
            { id: 'safe', label: 'Safe Multisig (5)' },
            { id: 'erc4337', label: 'ERC-4337 AA (4)' },
            { id: 'deployer', label: 'Deployers (4)' },
            { id: 'approval', label: 'Permit2 (1)' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-[#0052ff] text-white shadow-sm'
                  : 'bg-[#141824] text-[#8a91a0] hover:text-white border border-[#242c3d]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preinstalls Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const isExpanded = expandedContract === item.name;
          return (
            <div
              key={item.name}
              className="rounded-2xl border border-[#222838] bg-[#0f121a] hover:border-[#0052ff]/40 shadow-xl transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white font-mono">{item.name}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#0052ff]/15 text-[#3c8aff] border border-[#0052ff]/30">
                        {item.categoryLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[#8a91a0] mt-1.5 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                </div>

                {/* Deterministic Address Box */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#090b10] border border-[#1b202e] font-mono text-xs">
                  <span className="text-[#3c8aff] font-semibold truncate select-all">
                    {item.address}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => handleCopy(item.address)}
                      className="p-1.5 rounded-lg text-[#8a91a0] hover:text-white hover:bg-[#181d2a] transition-colors"
                      title="Copy Address"
                    >
                      {copiedAddress === item.address ? (
                        <Check className="h-3.5 w-3.5 text-[#66c800]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <a
                      href={getExplorerUrl(item.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-[#8a91a0] hover:text-white hover:bg-[#181d2a] transition-colors"
                      title="Open on Basescan"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Key Features Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.keyFeatures.map((feat, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#161a26] border border-[#242c3d] text-[10px] font-mono text-[#c5cad6] flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3 text-[#66c800]" />
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="space-y-2.5 pt-2 border-t border-[#1b202e] text-xs animate-fadeIn">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#717886] font-mono">
                        Technical Specification
                      </span>
                      <p className="text-[#dee1e7] mt-0.5 leading-relaxed">
                        {item.specDetails}
                      </p>
                    </div>

                    {item.useCaseForB20 && (
                      <div className="p-2.5 rounded-xl bg-[#0052ff]/10 border border-[#0052ff]/20">
                        <div className="flex items-center gap-1.5 text-[#3c8aff] font-bold text-[11px]">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Relevance to B20 RWA & Tokenized Securities</span>
                        </div>
                        <p className="text-[11px] text-[#c5cad6] mt-1 leading-normal">
                          {item.useCaseForB20}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="px-5 py-3 bg-[#0a0c12] border-t border-[#1a1f2c] flex items-center justify-between text-xs">
                <button
                  onClick={() => setExpandedContract(isExpanded ? null : item.name)}
                  className="flex items-center gap-1 text-[#8a91a0] hover:text-white font-medium transition-colors"
                >
                  <span>{isExpanded ? 'Hide Specs' : 'Read Specs & B20 Role'}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {item.githubUrl && (
                  <a
                    href={item.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#3c8aff] hover:underline font-mono text-[11px]"
                  >
                    <FileCode2 className="h-3 w-3" />
                    <span>View Contract Source</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-[#0e1118] border border-[#202636] text-[#8a91a0]">
          <Package className="h-8 w-8 mx-auto mb-2 text-[#464f61]" />
          <p className="text-xs font-semibold">No preinstalled contracts found matching &quot;{search}&quot;</p>
          <p className="text-[11px] text-[#636c7e] mt-1">Try clearing your search query or choosing another category</p>
        </div>
      )}
    </div>
  );
};
