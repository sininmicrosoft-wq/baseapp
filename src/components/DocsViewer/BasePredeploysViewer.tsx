import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Filter, 
  FileCode, 
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  ArrowUpRight
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { shortenAddress } from '../../utils/web3Helper';

export interface PredeployContract {
  name: string;
  address: string;
  introduced: 'Legacy' | 'Bedrock' | 'Ecotone' | 'Isthmus';
  deprecated: boolean;
  proxied: boolean;
  summary: string;
  githubUrl?: string;
  specDetails: string;
  useCaseForB20?: string;
}

export const BASE_PREDEPLOYS: PredeployContract[] = [
  {
    name: 'WETH9',
    address: '0x4200000000000000000000000000000000000006',
    introduced: 'Legacy',
    deprecated: false,
    proxied: false,
    summary: 'Standard Wrapped Ether implementation on Base deployed at a deterministic address.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/2b1c99b39744579cc226077d356ae9e5f162db4a/packages/contracts-bedrock/src/vendor/WETH9.sol',
    specDetails: 'Placed as a predeploy at genesis so that WETH is accessible at the identical address across all OP Stack and Base networks without needing proxy indirection.',
    useCaseForB20: 'Ideal for quoting secondary market settlement pairs and automated dividend distributions against wrapped native asset reserves.'
  },
  {
    name: 'L2CrossDomainMessenger',
    address: '0x4200000000000000000000000000000000000007',
    introduced: 'Legacy',
    deprecated: false,
    proxied: true,
    summary: 'Higher-level messaging API for cross-domain calls between Ethereum L1 and Base L2.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/L2CrossDomainMessenger.sol',
    specDetails: 'Prevents replay attacks by mapping relayed messages and guarantees replayability if L1 to L2 execution initially reverts. Serializes calls through relayMessage and sendMessage.',
    useCaseForB20: 'Cross-chain governance synchronization: relay offchain legal entity cap table votes on L1 down to Base L2 policy registries.'
  },
  {
    name: 'L2StandardBridge',
    address: '0x4200000000000000000000000000000000000010',
    introduced: 'Legacy',
    deprecated: false,
    proxied: true,
    summary: 'Standard bridge for deposits and withdrawals of ETH and ERC20 tokens between L1 and L2.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/L2StandardBridge.sol',
    specDetails: 'Mints tokens on L2 upon L1 lock confirmations, and burns tokens on L2 before sending a release message to L1StandardBridge.',
    useCaseForB20: 'Enables bridging institutional stablecoins (USDC/EURC) to fund subscription tranches for tokenized asset issuances.'
  },
  {
    name: 'GasPriceOracle',
    address: '0x420000000000000000000000000000000000000F',
    introduced: 'Legacy',
    deprecated: false,
    proxied: true,
    summary: 'Calculates the L1 DA submission and L2 execution fee components for transactions.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/GasPriceOracle.sol',
    specDetails: 'Exposes getL1Fee(bytes) which calculates post-Ecotone blobBaseFeeScalar and baseFeeScalar parameters pushed down by SystemConfig on L1. Decimals are fixed to 6.',
    useCaseForB20: 'Provides sub-cent fee estimation before executing high-volume batched shareholder dividend distributions or cap table splits.'
  },
  {
    name: 'L1Block',
    address: '0x4200000000000000000000000000000000000015',
    introduced: 'Bedrock',
    deprecated: false,
    proxied: true,
    summary: 'Maintains L1 block context (number, timestamp, basefee, hash, sequence number) on L2.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/L1Block.sol',
    specDetails: 'Introduced in Bedrock to allow smart contracts on Base to access canonical Ethereum L1 block context directly without needing external oracle feeds.',
    useCaseForB20: 'Synchronizes legal snapshot timestamps against canonical Ethereum block heights to prevent retroactive front-running of quarterly dividends.'
  },
  {
    name: 'L2ToL1MessagePasser',
    address: '0x4200000000000000000000000000000000000016',
    introduced: 'Bedrock',
    deprecated: false,
    proxied: true,
    summary: 'Core contract storing cryptographic commitments for all L2 to L1 withdrawals.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/L2ToL1MessagePasser.sol',
    specDetails: 'Accumulates withdrawn ETH and stores withdrawal hashes in sentMessages. Users prove storage inclusion against this contract on L1 during finalization. Exposes burn() to retire L2 supply.',
    useCaseForB20: 'Anchors audit trail withdrawal proofs when tokenized proceeds are settled back to treasury accounts on L1.'
  },
  {
    name: 'EAS (Ethereum Attestation Service)',
    address: '0x4200000000000000000000000000000000000021',
    introduced: 'Bedrock',
    deprecated: false,
    proxied: true,
    summary: 'Native onchain attestation protocol for identity, credentials, and verification on Base.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/tree/develop/packages/contracts-bedrock/src/vendor/eas',
    specDetails: 'Predeployed directly on Base genesis to eliminate gas deployment overhead and provide standardized attestation verification across all dApps.',
    useCaseForB20: 'Integrates with B20PolicyRegistry to verify KYC/AML accredited investor credentials attested by licensed verifiers without storing PII onchain.'
  },
  {
    name: 'SchemaRegistry',
    address: '0x4200000000000000000000000000000000000020',
    introduced: 'Bedrock',
    deprecated: false,
    proxied: true,
    summary: 'Global schema registry for defining attestation data formats consumed by EAS.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/vendor/eas/SchemaRegistry.sol',
    specDetails: 'Stores canonical schema definitions and resolvers that define what attributes an EAS attestation contains.',
    useCaseForB20: 'Defines canonical Regulation D, Regulation S, and Qualified Purchaser schemas checked by B20 transfer compliance hooks.'
  },
  {
    name: 'BeaconBlockRoot',
    address: '0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02',
    introduced: 'Ecotone',
    deprecated: false,
    proxied: false,
    summary: 'EIP-4788 accumulator providing trust-minimized access to Ethereum consensus beacon block roots.',
    specDetails: 'Specified in EIP-4788 and introduced in the Ecotone network upgrade. Allows verification of consensus state proofs directly on EVM without trusted intermediaries.',
    useCaseForB20: 'Enables zero-knowledge and trustless proof of offchain validator reserves or staking yield rates.'
  },
  {
    name: 'OperatorFeeVault',
    address: '0x420000000000000000000000000000000000001B',
    introduced: 'Isthmus',
    deprecated: false,
    proxied: true,
    summary: 'Receives operator fee shares on L2 introduced in the Isthmus network upgrade.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/OperatorFeeVault.sol',
    specDetails: 'Accumulates designated operator protocol fees before allowing automated withdrawal to designated immutable recipient addresses on L1.',
    useCaseForB20: 'Protocol revenue segregation and compliance reporting.'
  },
  {
    name: 'SequencerFeeVault',
    address: '0x4200000000000000000000000000000000000011',
    introduced: 'Legacy',
    deprecated: false,
    proxied: true,
    summary: 'Accumulates priority fees (tips) from transactions and equals block.coinbase.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/SequencerFeeVault.sol',
    specDetails: 'Holds sequencer priority transaction fees until reaching minimum withdrawal threshold, whereupon it can be withdrawn to an immutable L1 recipient.',
    useCaseForB20: 'Reference point for network priority fees.'
  },
  {
    name: 'BaseFeeVault',
    address: '0x4200000000000000000000000000000000000019',
    introduced: 'Bedrock',
    deprecated: false,
    proxied: true,
    summary: 'Receives Base execution base fees on L2 (which are not burned like on L1).',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/BaseFeeVault.sol',
    specDetails: 'Unlike Ethereum L1 EIP-1559 where base fee is burned, Base accumulates base fees into this contract to be withdrawn to L1.',
    useCaseForB20: 'Ecosystem economic monitoring and fee traceability.'
  },
  {
    name: 'L1FeeVault',
    address: '0x420000000000000000000000000000000000001a',
    introduced: 'Bedrock',
    deprecated: false,
    proxied: true,
    summary: 'Receives the L1 data availability fee portion collected from L2 transactions.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/L1FeeVault.sol',
    specDetails: 'Reimbursement pool for batch posting and blob data availability expenses incurred on Ethereum L1 by the Base batch submitter.',
    useCaseForB20: 'Network cost efficiency analysis.'
  },
  {
    name: 'OptimismMintableERC20Factory',
    address: '0x4200000000000000000000000000000000000012',
    introduced: 'Legacy',
    deprecated: false,
    proxied: true,
    summary: 'Factory for creating StandardBridge-compatible remote ERC20 contracts on Base.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/universal/OptimismMintableERC20Factory.sol',
    specDetails: 'Creates permissionless bridge representations of L1 ERC20 tokens that interface with L2StandardBridge mint and burn hooks.',
    useCaseForB20: 'Rapidly bridges collateral assets into Base for atomic settlement.'
  },
  {
    name: 'OptimismMintableERC721Factory',
    address: '0x4200000000000000000000000000000000000017',
    introduced: 'Bedrock',
    deprecated: false,
    proxied: true,
    summary: 'Factory for creating StandardBridge-compatible remote NFT contracts on Base.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/OptimismMintableERC721Factory.sol',
    specDetails: 'Permits deploying remote ERC721 contracts that can be deposited and withdrawn across L1 and L2 via L2ERC721Bridge.',
    useCaseForB20: 'Tokenizes non-fungible institutional mortgage deeds and debt tranches.'
  },
  {
    name: 'L2ERC721Bridge',
    address: '0x4200000000000000000000000000000000000014',
    introduced: 'Legacy',
    deprecated: false,
    proxied: true,
    summary: 'Bridge for transferring NFTs between Ethereum L1 and Base L2.',
    specDetails: 'Coordinates with L1ERC721Bridge using the CrossDomainMessenger transport to preserve NFT provenance and ownership across domains.',
    useCaseForB20: 'Transfers institutional deed certifications between L1 custody and L2 operational contracts.'
  },
  {
    name: 'ProxyAdmin',
    address: '0x4200000000000000000000000000000000000018',
    introduced: 'Bedrock',
    deprecated: false,
    proxied: true,
    summary: 'Owner and manager of all proxy contracts set at the predeploy addresses.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/universal/ProxyAdmin.sol',
    specDetails: 'Governed by the Base / OP Stack upgrade multi-sig, with authority to upgrade implementation contracts across the 0x4200... address space.',
    useCaseForB20: 'Security architecture reference for governance multi-sig management.'
  },
  {
    name: 'L1BlockNumber',
    address: '0x4200000000000000000000000000000000000013',
    introduced: 'Legacy',
    deprecated: true,
    proxied: true,
    summary: 'Legacy contract returning last known L1 block number. Deprecated in favor of L1Block.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/legacy/L1BlockNumber.sol',
    specDetails: 'Retained for backwards compatibility by delegating to L1Block under the hood. Developers should call L1Block directly.',
    useCaseForB20: 'Historical compatibility note.'
  },
  {
    name: 'DeployerWhitelist',
    address: '0x4200000000000000000000000000000000000002',
    introduced: 'Legacy',
    deprecated: true,
    proxied: true,
    summary: 'Legacy whitelist previously used during initial phases to restrict contract deployers.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/legacy/DeployerWhitelist.sol',
    specDetails: 'Arbitrary contract deployment is permanently enabled on Base. This contract is no longer in the CREATE/CREATE2 codepath and should not be used.',
    useCaseForB20: 'Historical reference.'
  },
  {
    name: 'LegacyERC20ETH',
    address: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
    introduced: 'Legacy',
    deprecated: true,
    proxied: false,
    summary: 'Legacy ERC20 representation of Ether before Bedrock. All ether migrated to native ETH.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/a4524ac152b4c9e8eb80beadc9cd772b96243aa2/packages/contracts-bedrock/src/legacy/LegacyERC20ETH.sol',
    specDetails: 'Lives at the special address 0xDeadDeAd... without a proxy. Stateful methods revert after Bedrock as all Ether is native on Base.',
    useCaseForB20: 'Historical reference.'
  },
  {
    name: 'LegacyMessagePasser',
    address: '0x4200000000000000000000000000000000000000',
    introduced: 'Legacy',
    deprecated: true,
    proxied: true,
    summary: 'Legacy withdrawal commitment store prior to Bedrock. Replaced by L2ToL1MessagePasser.',
    githubUrl: 'https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/legacy/LegacyMessagePasser.sol',
    specDetails: 'Kept only to permit alternative bridges to read historical storage slots. Calling it is a no-op; all modern withdrawals use L2ToL1MessagePasser.',
    useCaseForB20: 'Historical reference.'
  },
];

interface BasePredeploysViewerProps {
  currentNetwork?: BaseNetwork;
}

export const BasePredeploysViewer: React.FC<BasePredeploysViewerProps> = ({ currentNetwork }) => {
  const [search, setSearch] = useState('');
  const [filterVersion, setFilterVersion] = useState<'All' | 'Legacy' | 'Bedrock' | 'Ecotone' | 'Isthmus'>('All');
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [expandedContract, setExpandedContract] = useState<string | null>('WETH9');

  const filtered = BASE_PREDEPLOYS.filter((p) => {
    if (!showDeprecated && p.deprecated) return false;
    if (filterVersion !== 'All' && p.introduced !== filterVersion) return false;
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
      <div className="rounded-3xl border border-[#232938] bg-gradient-to-br from-[#10131a] via-[#121622] to-[#0f1118] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0052ff] animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3c8aff]">
              Genesis State Architecture · Prefix 0x4200...
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Base Predeployed Smart Contracts
          </h2>
          
          <p className="text-sm text-[#8a91a0] max-w-3xl leading-relaxed">
            Predeploys exist on Base at predetermined addresses in the genesis state. Unlike precompiles which execute native host code outside the EVM, predeploys run directly inside the EVM, enabling full compatibility with Hardhat/Foundry network forks, multi-client implementations, and verifiable upgrade paths.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Predeploy Namespace:</span>
              <span className="text-[#3c8aff] font-bold">0x4200...xxx</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">First 2048 Slots:</span>
              <span className="text-[#66c800] font-bold">ProxyAdmin Governed</span>
            </div>
            <a
              href="https://docs.base.org/llms.txt"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#0052ff]/15 hover:bg-[#0052ff]/25 border border-[#0052ff]/40 text-[#3c8aff] font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>docs.base.org Spec</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
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
            placeholder="Search predeploys (WETH, Gas, EAS...)"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141824] border border-[#242c3d] text-xs text-white placeholder-[#687285] focus:border-[#0052ff] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs">
          {(['All', 'Bedrock', 'Legacy', 'Ecotone', 'Isthmus'] as const).map((ver) => (
            <button
              key={ver}
              onClick={() => setFilterVersion(ver)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                filterVersion === ver
                  ? 'bg-[#0052ff] text-white shadow-sm'
                  : 'bg-[#141824] text-[#8a91a0] hover:text-white border border-[#242c3d]'
              }`}
            >
              {ver}
            </button>
          ))}

          <button
            onClick={() => setShowDeprecated(!showDeprecated)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5 border ${
              showDeprecated
                ? 'bg-[#fc401f]/15 text-[#fc401f] border-[#fc401f]/30'
                : 'bg-[#141824] text-[#717886] border-[#242c3d] hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Deprecated ({BASE_PREDEPLOYS.filter((p) => p.deprecated).length})</span>
          </button>
        </div>
      </div>

      {/* Predeploys Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const isExpanded = expandedContract === item.name;
          return (
            <div
              key={item.name}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                item.deprecated
                  ? 'border-[#2d2125] bg-[#120f12]/80 opacity-80'
                  : 'border-[#222838] bg-[#0f121a] hover:border-[#0052ff]/40 shadow-xl'
              }`}
            >
              <div className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white font-mono">{item.name}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#0052ff]/15 text-[#3c8aff] border border-[#0052ff]/30">
                        {item.introduced}
                      </span>
                      {item.proxied ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#66c800]/15 text-[#66c800] border border-[#66c800]/30">
                          Proxied
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#ffd12f]/15 text-[#ffd12f] border border-[#ffd12f]/30">
                          Non-proxied
                        </span>
                      )}
                      {item.deprecated && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#fc401f]/15 text-[#fc401f] border border-[#fc401f]/30">
                          Deprecated
                        </span>
                      )}
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

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="space-y-2.5 pt-2 border-t border-[#1b202e] text-xs animate-fadeIn">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#717886] font-mono">
                        Protocol Specification
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
                    <FileCode className="h-3 w-3" />
                    <span>View GitHub Sol</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-[#0e1118] border border-[#202636] text-[#8a91a0]">
          <Cpu className="h-8 w-8 mx-auto mb-2 text-[#464f61]" />
          <p className="text-xs font-semibold">No predeploys found matching &quot;{search}&quot;</p>
          <p className="text-[11px] text-[#636c7e] mt-1">Try clearing your filters or enabling deprecated contracts</p>
        </div>
      )}
    </div>
  );
};
