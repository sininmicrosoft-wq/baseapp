import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  ArrowDownUp, 
  ExternalLink, 
  Droplet, 
  Search, 
  Copy, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  Workflow, 
  X, 
  ChevronRight, 
  Command, 
  FileCode, 
  Wallet, 
  KeyRound,
  Share2,
  Settings,
  Layers,
  Users,
  Compass,
  Globe,
  Radio,
  BookOpen,
  Cpu,
  Package,
  ArrowLeftRight,
  TrendingUp,
  Vault,
  ArrowDownCircle,
  ArrowUpCircle,
  MessageSquareCode,
  Boxes,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { BaseNetwork, WalletAccount, AssetMetadata } from '../../types/base';
import { BASE_NETWORKS } from '../../data/mockBaseData';
import { triggerConfetti, shortenAddress } from '../../utils/web3Helper';

interface QuickActionsMenuProps {
  currentNetwork: BaseNetwork;
  wallet: WalletAccount;
  onOpenBridgeStatus: () => void;
  onRequestFaucet: () => void;
  onSelectTab: (tabId: string) => void;
  onQuickConnect?: () => void;
  contractAddress?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onOpenShareState?: () => void;
  onChangeNetwork?: (network: BaseNetwork) => void;
  asset?: AssetMetadata;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  currentNetwork,
  wallet,
  onOpenBridgeStatus,
  onRequestFaucet,
  onSelectTab,
  onQuickConnect,
  contractAddress = '0xB20019e07cA8F6A3E147eFbA9D987116e7a18453',
  isOpen: propIsOpen,
  onClose,
  onOpen,
  onOpenShareState,
  onChangeNetwork,
  asset,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;

  const handleToggleOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      if (onOpen) onOpen();
      setInternalOpen(true);
    } else {
      if (onClose) onClose();
      setInternalOpen(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'tabs' | 'actions' | 'network'>('all');
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [faucetPending, setFaucetPending] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleToggleOpen(!isOpen);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleToggleOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleFaucetTap = () => {
    setFaucetPending(true);
    onRequestFaucet();
    triggerConfetti();
    setTimeout(() => {
      setFaucetPending(false);
      handleToggleOpen(false);
    }, 600);
  };

  const handleOpenExplorer = () => {
    handleToggleOpen(false);
    if (currentNetwork.explorerUrl) {
      window.open(currentNetwork.explorerUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://basescan.org/address/${contractAddress}`, '_blank', 'noopener,noreferrer');
    }
  };

  // All Command Palette Items
  const allCommands = [
    // --- CATEGORY: TABS NAVIGATION ---
    {
      id: 'tab-miniapp',
      title: 'Mini App Mode',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Farcaster Frames v2, mobile viewport & passkey interaction',
      icon: Smartphone,
      iconColor: 'text-[#a855f7]',
      iconBg: 'bg-[#a855f7]/15 border border-[#a855f7]/30',
      badge: 'Frames v2',
      badgeColor: 'bg-[#a855f7]/20 text-[#a855f7]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('miniapp');
      },
    },
    {
      id: 'tab-simulator',
      title: 'B20 Flow Simulator',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Asset lifecycle, stock split rebase multiplier & allowlist governance',
      icon: Layers,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: 'Core Engine',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('simulator');
      },
    },
    {
      id: 'tab-workshop',
      title: 'Asset Creator Workshop',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Design new Tokenized Equity, Sovereign Debt, or Real Estate RWA',
      icon: Compass,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: 'Deploy RWA',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('workshop');
      },
    },
    {
      id: 'tab-captable',
      title: 'Cap Table Manager',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Inspect shareholder holdings, KYC/AML approval & category weights',
      icon: Users,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: 'Shareholders',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('captable');
      },
    },
    {
      id: 'tab-contracts',
      title: 'Solidity Contracts & Security Scan',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'View Diamond facets, B20PolicyRegistry & run 10-rule automated scan',
      icon: FileCode,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: 'Solidity 0.8.28',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('contracts');
      },
    },
    {
      id: 'tab-paymaster',
      title: 'Gasless Paymaster Demo',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Test ERC-4337 sponsored transfers with Passkeys & zero gas cost',
      icon: Zap,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: 'Zero Gas',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('paymaster');
      },
    },
    {
      id: 'tab-guides',
      title: 'Protocol Guides & Derivation Pipeline',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: '8-stage Rollup node architecture, specifications & Base documentation',
      icon: BookOpen,
      iconColor: 'text-[#dee1e7]',
      iconBg: 'bg-white/10 border border-white/20',
      badge: 'Docs',
      badgeColor: 'bg-white/10 text-white',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-predeploys',
      title: 'Base Genesis Predeploys (0x4200...)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: '21 genesis system contracts: WETH9, L2StandardBridge, EAS, GasPriceOracle, L1Block',
      icon: Cpu,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: 'Genesis 0x4200',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-preinstalls',
      title: 'Base Genesis Preinstalls (Utilities & Safe)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: '14 third-party genesis utilities: SafeL2, Multicall3, Permit2, EntryPoint v0.7, CreateX',
      icon: Package,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: 'Preinstalls',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-defi',
      title: 'Integrate DeFi on Base (0x, Lending, Earn)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Interactive simulations for swaps, lending markets, collateral borrowing, and ERC-4626 vaults',
      icon: ArrowLeftRight,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: 'DeFi Demo',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-bridges',
      title: 'Standard Bridges (L1 ↔ L2 Specification)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'StandardBridge.sol, L2StandardBridge (0x4200...10), and CrossDomainMessenger mechanics',
      icon: ArrowDownUp,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: 'Bridges Spec',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-deposits',
      title: 'Deposited Transactions & Guaranteed Gas (Type 0x7E)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'EIP-2718 Type 0x7E, address aliasing, sourceHash derivation, and EIP-1559 gas market',
      icon: ArrowDownCircle,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: 'Type 0x7E',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-withdrawals',
      title: 'Withdrawals & Fault Proofs (3-Step Flow)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'L2ToL1MessagePasser, OptimismPortal, 7-day challenge window, and dispute games',
      icon: ArrowUpCircle,
      iconColor: 'text-[#fc401f]',
      iconBg: 'bg-[#fc401f]/15 border border-[#fc401f]/30',
      badge: '3-Step Flow',
      badgeColor: 'bg-[#fc401f]/20 text-[#fc401f]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-messengers',
      title: 'Cross Domain Messengers (L1 ↔ L2)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Higher-level messaging API, xDomainMessageSender, replayable execution, and nonce version packing',
      icon: MessageSquareCode,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: '0x4200...07',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-batcher',
      title: 'Batcher (Batch Submitter) Specification',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'L2 to L1 DA pipeline, EIP-4844 blob frames, Brotli compression, and Holocene invariants',
      icon: Boxes,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: 'L1 DA',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-proofs',
      title: 'Azul Proof System (TEE + ZK Provers)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Proposer, Challenger, Registrar, AWS Nitro TEE, and permissionless ZK dispute games',
      icon: ShieldCheck,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: 'Azul Proofs',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-challenger',
      title: 'Challenger Specification (Dispute Pipeline)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'AggregateVerifier games, output root recomputation, nullify/challenge, and DelayedWETH',
      icon: AlertTriangle,
      iconColor: 'text-[#fc401f]',
      iconBg: 'bg-[#fc401f]/15 border border-[#fc401f]/30',
      badge: 'Challenger',
      badgeColor: 'bg-[#fc401f]/20 text-[#fc401f]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-proposer',
      title: 'Proposer Specification (Checkpoint Pipeline)',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Deterministic parent recovery, AWS Nitro TEE journal, and DisputeGameFactory.createWithInitData',
      icon: Zap,
      iconColor: 'text-[#0052ff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: 'Proposer',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'tab-config',
      title: 'Settings & App Configuration',
      category: 'tabs' as const,
      categoryLabel: 'Navigation',
      subtitle: 'Manage custom RPC endpoints, contract addresses, and system diagnostics',
      icon: Settings,
      iconColor: 'text-[#dee1e7]',
      iconBg: 'bg-white/10 border border-white/20',
      badge: 'Settings',
      badgeColor: 'bg-white/10 text-white',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('config');
      },
    },

    // --- CATEGORY: QUICK ACTIONS ---
    {
      id: 'action-share-state',
      title: 'Share State Snapshot',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Generate high-res 1200x675 HTML5 canvas image of RWA metrics & cap table',
      icon: Share2,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: 'Canvas HD',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        if (onOpenShareState) {
          onOpenShareState();
        }
      },
    },
    {
      id: 'action-faucet',
      title: 'Request Faucet Gas Drop (+0.5 ETH)',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: `Instant gas drop to active wallet ${shortenAddress(wallet.address)}`,
      icon: Droplet,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: '+0.5 ETH',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: handleFaucetTap,
    },
    {
      id: 'action-bridge',
      title: 'Check Bridge Status (L1 ↔ L2)',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Inspect OptimismPortal, DisputeGameFactory & 7-day challenge status',
      icon: ArrowDownUp,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: 'L1 ↔ L2',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        onOpenBridgeStatus();
      },
    },
    {
      id: 'action-wallet',
      title: wallet.isConnected ? 'Manage Connected Wallet' : 'Quick Connect Wallet',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: wallet.isConnected
        ? `${shortenAddress(wallet.address)} · ${wallet.isSmartWallet ? 'Passkey Smart Wallet' : 'Injected Wallet'}`
        : 'Connect Base Smart Wallet with biometric Passkeys or Browser Extension',
      icon: wallet.isConnected ? Wallet : KeyRound,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: wallet.isConnected ? 'Connected' : '1-Click',
      badgeColor: wallet.isConnected ? 'bg-[#66c800]/20 text-[#66c800]' : 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        if (onQuickConnect) {
          onQuickConnect();
        }
      },
    },
    {
      id: 'action-copy-contract',
      title: 'Copy B20 Token Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: `Clipboard: ${contractAddress}`,
      icon: Copy,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: copiedContract ? 'Copied!' : 'Copy',
      badgeColor: copiedContract ? 'bg-[#66c800]/20 text-[#66c800]' : 'bg-white/10 text-white',
      action: handleCopyContract,
    },
    {
      id: 'action-copy-wallet',
      title: 'Copy Active Wallet Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: `Clipboard: ${wallet.address}`,
      icon: Copy,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: copiedWallet ? 'Copied!' : 'Copy',
      badgeColor: copiedWallet ? 'bg-[#66c800]/20 text-[#66c800]' : 'bg-white/10 text-white',
      action: handleCopyWallet,
    },
    {
      id: 'action-copy-weth',
      title: 'Copy WETH9 Predeploy Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Deterministic 0x4200000000000000000000000000000000000006',
      icon: Copy,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: 'WETH9',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        navigator.clipboard.writeText('0x4200000000000000000000000000000000000006');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-eas',
      title: 'Copy EAS Attestation Predeploy Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Deterministic 0x4200000000000000000000000000000000000021',
      icon: Copy,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: 'EAS',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        navigator.clipboard.writeText('0x4200000000000000000000000000000000000021');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-multicall3',
      title: 'Copy Multicall3 Preinstall Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Deterministic 0xcA11bde05977b3631167028862bE2a173976CA11',
      icon: Copy,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: 'Multicall3',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        navigator.clipboard.writeText('0xcA11bde05977b3631167028862bE2a173976CA11');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-safel2',
      title: 'Copy SafeL2 Multisig Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Deterministic 0xfb1bffC9d739B8D520DaF37dF666da4C687191EA',
      icon: Copy,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: 'SafeL2',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        navigator.clipboard.writeText('0xfb1bffC9d739B8D520DaF37dF666da4C687191EA');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-entrypoint',
      title: 'Copy ERC-4337 v0.7.0 EntryPoint',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Deterministic 0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      icon: Copy,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: 'EntryPoint v0.7',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: () => {
        navigator.clipboard.writeText('0x0000000071727De22E5E9d8BAf0edAc6f37da032');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-permit2',
      title: 'Copy Permit2 Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Deterministic 0x000000000022D473030F116dDEE9F6B43aC78BA3',
      icon: Copy,
      iconColor: 'text-[#dee1e7]',
      iconBg: 'bg-white/10 border border-white/20',
      badge: 'Permit2',
      badgeColor: 'bg-white/10 text-white',
      action: () => {
        navigator.clipboard.writeText('0x000000000022D473030F116dDEE9F6B43aC78BA3');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-l2standardbridge',
      title: 'Copy L2StandardBridge Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Canonical predeploy 0x4200000000000000000000000000000000000010',
      icon: Copy,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: '0x4200...10',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        navigator.clipboard.writeText('0x4200000000000000000000000000000000000010');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-l2tol1messagepasser',
      title: 'Copy L2ToL1MessagePasser Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Withdrawal initiator predeploy 0x4200000000000000000000000000000000000016',
      icon: Copy,
      iconColor: 'text-[#fc401f]',
      iconBg: 'bg-[#fc401f]/15 border border-[#fc401f]/30',
      badge: '0x4200...16',
      badgeColor: 'bg-[#fc401f]/20 text-[#fc401f]',
      action: () => {
        navigator.clipboard.writeText('0x4200000000000000000000000000000000000016');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-l2crossdomainmessenger',
      title: 'Copy L2CrossDomainMessenger Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Higher-level messaging predeploy 0x4200000000000000000000000000000000000007',
      icon: Copy,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: '0x4200...07',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        navigator.clipboard.writeText('0x4200000000000000000000000000000000000007');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-batcher-inbox',
      title: 'Copy Batcher Inbox Address (EOA)',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Designated EOA 0xFf00000000000000000000000000000000008453 for Base L1 blob DA',
      icon: Copy,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: '0xFf...8453',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: () => {
        navigator.clipboard.writeText('0xFf00000000000000000000000000000000008453');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-dispute-factory',
      title: 'Copy DisputeGameFactory Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Azul Dispute Game Factory 0x43edB88C4B80fDD2AdFF2412A7BebF9dF42cB40e on Ethereum L1',
      icon: Copy,
      iconColor: 'text-[#0052ff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: '0x43ed...B40e',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        navigator.clipboard.writeText('0x43edB88C4B80fDD2AdFF2412A7BebF9dF42cB40e');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-anchor-registry',
      title: 'Copy AnchorStateRegistry Address',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'AnchorStateRegistry 0x12d6a7B20235C1F033504838612140b2A676E46a tracking canonical game anchors',
      icon: Copy,
      iconColor: 'text-[#fc401f]',
      iconBg: 'bg-[#fc401f]/15 border border-[#fc401f]/30',
      badge: '0x12d6...E46a',
      badgeColor: 'bg-[#fc401f]/20 text-[#fc401f]',
      action: () => {
        navigator.clipboard.writeText('0x12d6a7B20235C1F033504838612140b2A676E46a');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-copy-delayed-weth',
      title: 'Copy DelayedWETH Address (Bonds)',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'DelayedWETH 0x5C246d5E4929D37e8c3F17b20464f1696F158F89 for Challenger bond escrows & claims',
      icon: DollarSign,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: '0x5C24...8F89',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        navigator.clipboard.writeText('0x5C246d5E4929D37e8c3F17b20464f1696F158F89');
        triggerConfetti();
        handleToggleOpen(false);
      },
    },
    {
      id: 'action-address-aliasing',
      title: 'Address Aliasing Formula (0x1111...1111)',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Calculate (L1 Contract Address + 0x1111...1111) % 2^160 for L2 deposit safety',
      icon: ShieldCheck,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: 'Aliasing',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'action-defi-trade',
      title: 'Simulate 0x Swap Route',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Request 0x quote (1,000 USDC -> 0.397 WETH) with AllowanceHolder approval',
      icon: ArrowLeftRight,
      iconColor: 'text-[#3c8aff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: '0x Swap',
      badgeColor: 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'action-defi-lend',
      title: 'Simulate USDC Lending Supply',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'Supply 1,000 USDC at 4.2% variable APY with 30-day interest accrual',
      icon: TrendingUp,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: 'Lend USDC',
      badgeColor: 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'action-defi-earn',
      title: 'Simulate ERC-4626 Vault Deposit',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: 'One-click deposit into tokenized yield vault with share price appreciation',
      icon: Vault,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: 'ERC-4626',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: () => {
        handleToggleOpen(false);
        onSelectTab('guides');
      },
    },
    {
      id: 'action-explorer',
      title: 'Open Basescan Explorer',
      category: 'actions' as const,
      categoryLabel: 'Quick Actions',
      subtitle: `Explore contracts and rollup transactions on ${currentNetwork.name}`,
      icon: ExternalLink,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: 'Basescan',
      badgeColor: 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: handleOpenExplorer,
    },

    // --- CATEGORY: NETWORK ---
    {
      id: 'net-vibenet',
      title: 'Switch to Base Vibenet',
      category: 'network' as const,
      categoryLabel: 'Network',
      subtitle: 'Chain ID: 84538453 · 1.0s fast blocks · B20 Devnet',
      icon: Globe,
      iconColor: 'text-[#0052ff]',
      iconBg: 'bg-[#0052ff]/15 border border-[#0052ff]/30',
      badge: currentNetwork.id === 'base-vibenet' ? 'Active' : 'Devnet',
      badgeColor: currentNetwork.id === 'base-vibenet' ? 'bg-[#66c800]/20 text-[#66c800]' : 'bg-[#0052ff]/20 text-[#3c8aff]',
      action: () => {
        if (onChangeNetwork && BASE_NETWORKS['base-vibenet']) {
          onChangeNetwork(BASE_NETWORKS['base-vibenet']);
        }
        handleToggleOpen(false);
      },
    },
    {
      id: 'net-sepolia',
      title: 'Switch to Base Sepolia',
      category: 'network' as const,
      categoryLabel: 'Network',
      subtitle: 'Chain ID: 84532 · 2.0s blocks · Public Testnet',
      icon: Radio,
      iconColor: 'text-[#ffd12f]',
      iconBg: 'bg-[#ffd12f]/15 border border-[#ffd12f]/30',
      badge: currentNetwork.id === 'base-sepolia' ? 'Active' : 'Testnet',
      badgeColor: currentNetwork.id === 'base-sepolia' ? 'bg-[#66c800]/20 text-[#66c800]' : 'bg-[#ffd12f]/20 text-[#ffd12f]',
      action: () => {
        if (onChangeNetwork && BASE_NETWORKS['base-sepolia']) {
          onChangeNetwork(BASE_NETWORKS['base-sepolia']);
        }
        handleToggleOpen(false);
      },
    },
    {
      id: 'net-mainnet',
      title: 'Switch to Base Mainnet',
      category: 'network' as const,
      categoryLabel: 'Network',
      subtitle: 'Chain ID: 8453 · 2.0s blocks · Production Rollup',
      icon: ShieldCheck,
      iconColor: 'text-[#66c800]',
      iconBg: 'bg-[#66c800]/15 border border-[#66c800]/30',
      badge: currentNetwork.id === 'base-mainnet' ? 'Active' : 'Mainnet',
      badgeColor: currentNetwork.id === 'base-mainnet' ? 'bg-[#66c800]/20 text-[#66c800]' : 'bg-[#66c800]/20 text-[#66c800]',
      action: () => {
        if (onChangeNetwork && BASE_NETWORKS['base-mainnet']) {
          onChangeNetwork(BASE_NETWORKS['base-mainnet']);
        }
        handleToggleOpen(false);
      },
    },
  ];

  // Filtering
  const filteredCommands = allCommands.filter((cmd) => {
    const matchesCategory = activeCategory === 'all' || cmd.category === activeCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.categoryLabel.toLowerCase().includes(q) ||
      cmd.badge.toLowerCase().includes(q)
    );
  });

  // Keyboard navigation inside filtered list
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyNav = (e: KeyboardEvent) => {
      if (filteredCommands.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (Fixed Bottom-Right) */}
      <div className="fixed bottom-14 right-4 sm:right-6 z-40 flex items-center gap-2">
        <button
          onClick={() => handleToggleOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0052ff] to-[#0042d0] text-white shadow-xl shadow-[#0052ff]/30 hover:shadow-2xl hover:shadow-[#0052ff]/50 hover:scale-[1.03] transition-all border border-[#3c8aff]/40 focus:outline-none"
          title="Command Palette (Ctrl+K)"
        >
          <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center font-bold">
            <Command className="h-4 w-4 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <span className="text-xs font-bold font-sans tracking-wide">Command Palette</span>
          
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/30 text-white/90 border border-white/20">
            Ctrl+K
          </kbd>

          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#66c800]"></span>
          </span>
        </button>
      </div>

      {/* FULL COMMAND PALETTE MODAL (Centered, Spotlight-style) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => handleToggleOpen(false)}
        >
          <div 
            className="w-full max-w-2xl max-h-[85vh] rounded-3xl border border-[#262c3d] bg-[#0d0f15]/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(0,82,255,0.18)] flex flex-col text-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Search Input Box */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-[#1f2433] bg-[#12151f]">
              <Search className="h-5 w-5 text-[#3c8aff] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands, navigate tabs, or run quick actions..."
                className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-[#687285] focus:outline-none font-medium"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#1c2130] text-[#8a91a0] border border-[#2b3245]">
                  ESC to close
                </kbd>
                <button
                  onClick={() => handleToggleOpen(false)}
                  className="p-1 rounded-lg text-[#8a91a0] hover:text-white hover:bg-[#1f2535] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter Category Tabs & Quick Chips */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-[#0f121a] border-b border-[#1a1e2b] gap-2 overflow-x-auto text-xs">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeCategory === 'all'
                      ? 'bg-[#0052ff] text-white shadow-sm'
                      : 'text-[#8a91a0] hover:text-white hover:bg-[#181c27]'
                  }`}
                >
                  All ({allCommands.length})
                </button>
                <button
                  onClick={() => setActiveCategory('tabs')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeCategory === 'tabs'
                      ? 'bg-[#0052ff] text-white shadow-sm'
                      : 'text-[#8a91a0] hover:text-white hover:bg-[#181c27]'
                  }`}
                >
                  Tabs Navigation (8)
                </button>
                <button
                  onClick={() => setActiveCategory('actions')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeCategory === 'actions'
                      ? 'bg-[#0052ff] text-white shadow-sm'
                      : 'text-[#8a91a0] hover:text-white hover:bg-[#181c27]'
                  }`}
                >
                  Quick Actions (7)
                </button>
                <button
                  onClick={() => setActiveCategory('network')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeCategory === 'network'
                      ? 'bg-[#0052ff] text-white shadow-sm'
                      : 'text-[#8a91a0] hover:text-white hover:bg-[#181c27]'
                  }`}
                >
                  Network (3)
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#717886] shrink-0">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[#181c27] text-white text-[10px]">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[#181c27] text-white text-[10px]">↵</kbd> select
                </span>
              </div>
            </div>

            {/* Quick Copy Chips Row */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-[#0a0c10] border-b border-[#181c27] text-xs font-mono">
              <button
                onClick={handleCopyContract}
                className="px-3 py-2 rounded-xl bg-[#11141c] border border-[#1e2330] hover:border-[#0052ff]/50 text-left transition-all flex items-center justify-between group"
                title="Click to copy B20 Token Address"
              >
                <div className="truncate">
                  <div className="text-[9px] text-[#717886] uppercase font-bold">B20 Token Address</div>
                  <div className="text-[11px] text-white font-bold truncate group-hover:text-[#3c8aff]">
                    {shortenAddress(contractAddress, 6)}
                  </div>
                </div>
                {copiedContract ? (
                  <Check className="h-3.5 w-3.5 text-[#66c800] shrink-0" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[#717886] group-hover:text-white shrink-0" />
                )}
              </button>

              <button
                onClick={handleCopyWallet}
                className="px-3 py-2 rounded-xl bg-[#11141c] border border-[#1e2330] hover:border-[#0052ff]/50 text-left transition-all flex items-center justify-between group"
                title="Click to copy Connected Wallet Address"
              >
                <div className="truncate">
                  <div className="text-[9px] text-[#717886] uppercase font-bold">
                    {wallet.isConnected ? 'Connected Wallet' : 'Wallet Address'}
                  </div>
                  <div className="text-[11px] text-white font-bold truncate group-hover:text-[#3c8aff]">
                    {shortenAddress(wallet.address, 6)}
                  </div>
                </div>
                {copiedWallet ? (
                  <Check className="h-3.5 w-3.5 text-[#66c800] shrink-0" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[#717886] group-hover:text-white shrink-0" />
                )}
              </button>
            </div>

            {/* Scrollable Command List */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 max-h-[50vh] min-h-[220px]"
            >
              {filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = selectedIndex === idx;

                return (
                  <button
                    key={cmd.id}
                    data-index={idx}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl text-left transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#0052ff]/20 border border-[#0052ff]/60 shadow-lg shadow-[#0052ff]/10 text-white'
                        : 'bg-[#11141c]/60 hover:bg-[#141824] border border-[#1b202e] text-[#c5cad6]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-xl ${cmd.iconBg} ${cmd.iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs sm:text-sm truncate ${isSelected ? 'text-white' : 'text-[#f0f2f5]'}`}>
                            {cmd.title}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${cmd.badgeColor} shrink-0`}>
                            {cmd.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8a91a0] truncate mt-0.5">
                          {cmd.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {isSelected ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0052ff] text-[10px] font-mono font-bold text-white shadow-sm">
                          <span>Enter</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-[#5f687a] uppercase">
                          {cmd.categoryLabel}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredCommands.length === 0 && (
                <div className="text-center py-12 text-[#8a91a0]">
                  <Command className="h-8 w-8 mx-auto mb-2 text-[#464f61]" />
                  <p className="text-xs font-semibold">No commands found matching &quot;{searchQuery}&quot;</p>
                  <p className="text-[11px] text-[#636c7e] mt-1">Try searching for Faucet, Bridge, Share, Mini App, or Contracts</p>
                </div>
              )}
            </div>

            {/* Footer with network & quick status */}
            <div className="px-4 py-2.5 bg-[#0a0c10] border-t border-[#181c27] flex items-center justify-between text-[11px] font-mono text-[#8a91a0]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#66c800] shadow-[0_0_6px_#66c800]"></span>
                <span className="text-white font-medium">{currentNetwork.name}</span>
                <span className="text-[#687285] hidden sm:inline">(Chain ID: {currentNetwork.chainId})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#66c800] font-bold">Gas &lt; $0.001</span>
                <span className="text-[#687285]">|</span>
                <span className="text-[#3c8aff]">Base L2</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
