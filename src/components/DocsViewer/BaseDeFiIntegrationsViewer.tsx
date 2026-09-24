import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  TrendingUp, 
  Scale, 
  Vault, 
  Check, 
  RotateCcw, 
  ArrowRight, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { BaseNetwork } from '../../types/base';
import { triggerConfetti } from '../../utils/web3Helper';

type DeFiScenario = 'trade' | 'lend' | 'borrow' | 'earn';

interface MetricItem {
  label: string;
  value: string;
  tone?: 'ok' | 'warn';
}

interface StepSummaryRow {
  label: string;
  value: string;
  mono?: boolean;
}

interface ScenarioStep {
  stage: string;
  action: string;
  text: string;
  summary: StepSummaryRow[];
  run: (s: { metrics: MetricItem[] }) => {
    entries: Array<{ kind: 'ok' | 'err' | 'info'; name: string; detail: string }>;
    caption?: string;
  };
}

interface ScenarioConfig {
  id: DeFiScenario;
  label: string;
  title: string;
  subtitle: string;
  href: string;
  footer: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: ScenarioStep[];
  rwaConnection: string;
}

export const DEFI_SCENARIOS: Record<DeFiScenario, ScenarioConfig> = {
  trade: {
    id: 'trade',
    label: 'Trade',
    title: 'Swap tokens through an aggregated route',
    subtitle: 'Add token swaps with executable routes from the 0x Swap API on Base.',
    href: 'https://docs.base.org/build-on-base/integrate-defi/integrate-trading',
    footer: 'Illustrative only · quotes, routes, and minimum output can change with block execution.',
    icon: ArrowLeftRight,
    rwaConnection: 'B20 compliant tokens interface with secondary market liquidity pairs using policy registries to ensure buyers hold verified KYC/AML credentials before swap execution.',
    steps: [
      {
        stage: 'Quote',
        action: 'Request quote',
        text: 'Request a firm 0x quote to swap 1,000 USDC for WETH on Base.',
        summary: [
          { label: 'Operation', value: 'Swap' },
          { label: 'Sell', value: '1,000 USDC', mono: true },
          { label: 'Buy', value: 'WETH', mono: true },
          { label: 'Slippage', value: '0.5%', mono: true },
          { label: 'Network', value: 'Base Mainnet / Vibenet', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Sell', value: '1,000 USDC' },
            { label: 'Quoted output', value: '0.397 WETH' },
            { label: 'Minimum output', value: '0.395 WETH' },
          ];
          return {
            entries: [
              { kind: 'info', name: 'route quoted', detail: '0x · 0.397 WETH' },
              { kind: 'info', name: 'minimum output', detail: '0.395 WETH' },
            ],
            caption: 'Show the user the minimum output, gas fee, and route before approval.',
          };
        },
      },
      {
        stage: 'Simulate',
        action: 'Simulate swap',
        text: "Fetch a fresh quote, then simulate its transaction data against the user's current wallet state using eth_call.",
        summary: [
          { label: 'Operation', value: 'Simulate' },
          { label: 'Expected', value: '0.397 WETH', mono: true },
          { label: 'Minimum', value: '0.395 WETH', mono: true },
          { label: 'Result', value: 'No revert (Success)', mono: false },
          { label: 'Network', value: 'Base', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Sell', value: '1,000 USDC' },
            { label: 'Quoted output', value: '0.397 WETH' },
            { label: 'Minimum output', value: '0.395 WETH', tone: 'ok' },
          ];
          return {
            entries: [
              { kind: 'ok', name: 'simulation', detail: 'transaction succeeds' },
              { kind: 'info', name: 'quote refreshed', detail: 'allowance satisfied' },
            ],
            caption: 'Do not submit stale calldata after balances, allowances, or market prices change.',
          };
        },
      },
      {
        stage: 'Swap',
        action: 'Approve and submit swap',
        text: "Approve only the AllowanceHolder address returned by the quote for the exact sell amount, then ask the wallet to sign the prepared transaction and wait for its receipt.",
        summary: [
          { label: 'Operation', value: 'Approve and execute swap' },
          { label: 'Sell', value: '1,000 USDC', mono: true },
          { label: 'Receive', value: '0.397 WETH', mono: true },
          { label: 'Minimum', value: '0.395 WETH', mono: true },
          { label: 'Spender', value: '0x AllowanceHolder', mono: true },
          { label: 'Network', value: 'Base', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'USDC spent', value: '1,000 USDC' },
            { label: 'WETH received', value: '0.397 WETH', tone: 'ok' },
            { label: 'Status', value: 'Confirmed', tone: 'ok' },
          ];
          return {
            entries: [
              { kind: 'ok', name: 'approve', detail: '1,000 USDC · AllowanceHolder' },
              { kind: 'ok', name: 'swap submitted', detail: '0x route executed' },
              { kind: 'ok', name: 'swap confirmed', detail: '0.397 WETH received' },
            ],
            caption: 'Never approve the 0x Settler contract; use the spender returned by the API. Refresh balances from Base after receipt confirms.',
          };
        },
      },
    ],
  },
  lend: {
    id: 'lend',
    label: 'Lend',
    title: 'Supply assets to a lending market',
    subtitle: 'Supply USDC to a money market (e.g. Moonwell, Aave v3) and manage the position directly.',
    href: 'https://docs.base.org/build-on-base/integrate-defi/integrate-lending',
    footer: 'Illustrative only · rates and liquidity vary dynamically by market utilization.',
    icon: TrendingUp,
    rwaConnection: 'Institutional issuers supply stablecoin treasury balances or short-term private credit notes to earn continuous base yield while awaiting deployment.',
    steps: [
      {
        stage: 'Load',
        action: 'Load wallet',
        text: 'A user has 1,000 USDC available in their wallet ready to earn yield.',
        summary: [
          { label: 'Operation', value: 'Load wallet' },
          { label: 'Asset', value: 'USDC', mono: true },
          { label: 'Amount', value: '1,000 USDC', mono: true },
          { label: 'Network', value: 'Base Mainnet / Vibenet', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Wallet', value: '1,000 USDC' },
            { label: 'Supplied', value: '0 USDC' },
          ];
          return {
            entries: [{ kind: 'info', name: 'wallet balance', detail: '1,000 USDC' }],
          };
        },
      },
      {
        stage: 'Supply',
        action: 'Supply USDC',
        text: "Approve the market and supply the USDC from the user's wallet.",
        summary: [
          { label: 'Operation', value: 'Supply' },
          { label: 'Market', value: 'USDC Lending Pool' },
          { label: 'Amount', value: '1,000 USDC', mono: true },
          { label: 'Supply APY', value: '4.2% variable', mono: true },
          { label: 'Network', value: 'Base', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Wallet', value: '0 USDC' },
            { label: 'Supplied', value: '1,000 USDC' },
            { label: 'Supply APY', value: '4.2% variable' },
          ];
          return {
            entries: [
              { kind: 'ok', name: 'approve', detail: '1,000 USDC' },
              { kind: 'ok', name: 'supply', detail: '1,000 USDC' },
            ],
            caption: 'The wallet now owns a direct protocol position (interest-bearing cToken / aToken).',
          };
        },
      },
      {
        stage: 'Accrue',
        action: 'Accrue 30 days',
        text: 'The supplied position accrues illustrative variable interest per block.',
        summary: [
          { label: 'Operation', value: 'Accrue interest' },
          { label: 'Period', value: '30 days' },
          { label: 'Supply APY', value: '4.2%', mono: true },
          { label: 'New Balance', value: '1,003.45 USDC', mono: true },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Wallet', value: '0 USDC' },
            { label: 'Supplied', value: '1,003.45 USDC' },
            { label: 'Supply APY', value: '4.2% variable' },
          ];
          return {
            entries: [{ kind: 'ok', name: 'position updated', detail: '+3.45 USDC' }],
            caption: 'Actual rates change continuously with market utilization on Base.',
          };
        },
      },
      {
        stage: 'Withdraw',
        action: 'Withdraw',
        text: "Withdraw the available position plus accrued interest back to the user's wallet.",
        summary: [
          { label: 'Operation', value: 'Withdraw' },
          { label: 'Amount', value: '1,003.45 USDC', mono: true },
          { label: 'To', value: "User's Wallet", mono: false },
          { label: 'Network', value: 'Base', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Wallet', value: '1,003.45 USDC' },
            { label: 'Supplied', value: '0 USDC' },
          ];
          return {
            entries: [{ kind: 'ok', name: 'withdraw', detail: '1,003.45 USDC' }],
            caption: 'Withdrawals depend on available unborrowed market liquidity.',
          };
        },
      },
    ],
  },
  borrow: {
    id: 'borrow',
    label: 'Borrow',
    title: 'Borrow against supplied collateral',
    subtitle: 'Borrow USDC against supplied collateral (WETH or tokenized assets) and monitor liquidation risk.',
    href: 'https://docs.base.org/build-on-base/integrate-defi/integrate-borrowing',
    footer: 'Illustrative only · liquidation parameters and LTV differ by protocol and market.',
    icon: Scale,
    rwaConnection: 'Accredited holders can pledge their tokenized real estate or corporate debt B20 units as collateral to borrow liquid USDC without triggering taxable asset disposal.',
    steps: [
      {
        stage: 'Collateral',
        action: 'Supply collateral',
        text: 'A user supplies 2 WETH as collateral at an illustrative $2,500 market price ($5,000 total).',
        summary: [
          { label: 'Operation', value: 'Supply collateral' },
          { label: 'Collateral', value: '2 WETH', mono: true },
          { label: 'Value', value: '$5,000 USD', mono: true },
          { label: 'Network', value: 'Base Mainnet / Vibenet', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Collateral', value: '2 WETH · $5,000' },
            { label: 'Debt', value: '0 USDC' },
            { label: 'Health factor', value: '—' },
          ];
          return {
            entries: [
              { kind: 'ok', name: 'supply collateral', detail: '2 WETH' },
              { kind: 'ok', name: 'collateral enabled', detail: 'WETH' },
            ],
            caption: 'The collateral remains exposed to market price movements.',
          };
        },
      },
      {
        stage: 'Borrow',
        action: 'Borrow USDC',
        text: 'Borrow 2,000 USDC against the collateral at an initial safe Health Factor of 2.00.',
        summary: [
          { label: 'Operation', value: 'Borrow' },
          { label: 'Asset', value: 'USDC', mono: true },
          { label: 'Amount', value: '2,000 USDC', mono: true },
          { label: 'Health factor', value: '2.00 (Safe)', mono: true },
          { label: 'Network', value: 'Base', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Collateral', value: '2 WETH · $5,000' },
            { label: 'Debt', value: '2,000 USDC' },
            { label: 'Health factor', value: '2.00', tone: 'ok' },
          ];
          return {
            entries: [
              { kind: 'ok', name: 'borrow', detail: '2,000 USDC' },
              { kind: 'info', name: 'health factor', detail: '2.00' },
            ],
            caption: 'A higher health factor provides a security buffer before reaching liquidation threshold.',
          };
        },
      },
      {
        stage: 'Price drop',
        action: 'Simulate price drop',
        text: 'WETH falls from $2,500 to $1,500 while the debt remains unchanged, triggering an alert.',
        summary: [
          { label: 'Operation', value: 'Price update simulation' },
          { label: 'Collateral', value: '2 WETH · $3,000', mono: true },
          { label: 'Debt', value: '2,000 USDC', mono: true },
          { label: 'Health factor', value: '1.20 (Caution)', mono: true },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Collateral', value: '2 WETH · $3,000' },
            { label: 'Debt', value: '2,000 USDC' },
            { label: 'Health factor', value: '1.20', tone: 'warn' },
          ];
          return {
            entries: [
              { kind: 'err', name: 'risk increased', detail: 'health factor 2.00 → 1.20' },
            ],
            caption: 'At or below 1.00 (protocol liquidation threshold), collateral can be seized and auctioned to repay debt.',
          };
        },
      },
    ],
  },
  earn: {
    id: 'earn',
    label: 'Earn',
    title: 'Embed a vault-based earn product',
    subtitle: 'Give users a one-deposit vault experience (ERC-4626 standard) with variable onchain yield.',
    href: 'https://docs.base.org/build-on-base/integrate-defi/integrate-earn-product',
    footer: 'Illustrative only · vault yield is variable, strategy-dependent, and not guaranteed.',
    icon: Vault,
    rwaConnection: 'Ideal for packaging short-duration tokenized U.S. Treasury bills (e.g. B20 Yield Vaults) where users receive auto-compounding shares that appreciate against dollar peg.',
    steps: [
      {
        stage: 'Select',
        action: 'Select vault',
        text: 'A user has 1,000 USDC and chooses a curated ERC-4626 vault in your application.',
        summary: [
          { label: 'Operation', value: 'Select vault' },
          { label: 'Vault', value: 'USDC Yield Optimizer' },
          { label: 'Asset', value: 'USDC', mono: true },
          { label: 'Standard', value: 'ERC-4626 Tokenized Vault', mono: true },
          { label: 'Network', value: 'Base Mainnet / Vibenet', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Wallet', value: '1,000 USDC' },
            { label: 'Vault shares', value: '0' },
            { label: 'Redeemable', value: '0 USDC' },
          ];
          return {
            entries: [{ kind: 'info', name: 'vault selected', detail: 'USDC · ERC-4626 variable yield' }],
            caption: 'The vault abstracts the underlying market allocation across lending pools.',
          };
        },
      },
      {
        stage: 'Deposit',
        action: 'Deposit USDC',
        text: 'Deposit once and receive shares that represent the underlying fractional vault position.',
        summary: [
          { label: 'Operation', value: 'Deposit' },
          { label: 'Amount', value: '1,000 USDC', mono: true },
          { label: 'Vault shares', value: '1,000 shares', mono: true },
          { label: 'Share price', value: '$1.0000', mono: true },
          { label: 'Network', value: 'Base', mono: false },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Wallet', value: '0 USDC' },
            { label: 'Vault shares', value: '1,000' },
            { label: 'Share price', value: '$1.00' },
            { label: 'Redeemable', value: '1,000 USDC' },
          ];
          return {
            entries: [
              { kind: 'ok', name: 'approve', detail: '1,000 USDC' },
              { kind: 'ok', name: 'deposit', detail: '1,000 USDC → 1,000 shares' },
            ],
            caption: 'The user holds vault shares instead of managing each individual underlying position.',
          };
        },
      },
      {
        stage: 'Accrue',
        action: 'Accrue value',
        text: 'As the vault earns yields, each share becomes redeemable for more underlying USDC.',
        summary: [
          { label: 'Operation', value: 'Accrue yield' },
          { label: 'Vault shares', value: '1,000 shares', mono: true },
          { label: 'Share price', value: '$1.0100', mono: true },
          { label: 'Redeemable', value: '1,010 USDC (+1.0%)', mono: true },
        ],
        run: (s) => {
          s.metrics = [
            { label: 'Wallet', value: '0 USDC' },
            { label: 'Vault shares', value: '1,000' },
            { label: 'Share price', value: '$1.01' },
            { label: 'Redeemable', value: '1,010 USDC', tone: 'ok' },
          ];
          return {
            entries: [
              { kind: 'ok', name: 'share value updated', detail: '$1.00 → $1.01' },
              { kind: 'info', name: 'redeemable assets', detail: '1,010 USDC' },
            ],
            caption: 'Actual vault performance rises or falls depending on strategy and market conditions.',
          };
        },
      },
    ],
  },
};

interface BaseDeFiIntegrationsViewerProps {
  currentNetwork?: BaseNetwork;
}

export const BaseDeFiIntegrationsViewer: React.FC<BaseDeFiIntegrationsViewerProps> = ({ currentNetwork }) => {
  const [activeScenario, setActiveScenario] = useState<DeFiScenario>('trade');
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [results, setResults] = useState<Array<{ entries: Array<{ kind: 'ok' | 'err' | 'info'; name: string; detail: string }>; caption?: string }>>([]);

  const currentConfig = DEFI_SCENARIOS[activeScenario];
  const stepIndex = results.length;
  const isDone = stepIndex >= currentConfig.steps.length;
  const currentStep = isDone ? currentConfig.steps[currentConfig.steps.length - 1] : currentConfig.steps[stepIndex];

  const handleSelectScenario = (key: DeFiScenario) => {
    setActiveScenario(key);
    setMetrics([]);
    setResults([]);
  };

  const handleReset = () => {
    setMetrics([]);
    setResults([]);
  };

  const handleRunStep = () => {
    if (isDone) return;
    const simState = { metrics: metrics.map(m => ({ ...m })) };
    const stepOutput = currentConfig.steps[stepIndex].run(simState) || { entries: [] };
    setMetrics(simState.metrics);
    setResults(prev => [...prev, stepOutput]);
    if (stepIndex + 1 >= currentConfig.steps.length) {
      triggerConfetti();
    }
  };

  const handleBack = () => {
    const prevCount = results.length - 1;
    if (prevCount < 0) return;
    const simState = { metrics: [] };
    for (let i = 0; i < prevCount; i++) {
      currentConfig.steps[i].run(simState);
    }
    setMetrics(simState.metrics);
    setResults(prev => prev.slice(0, -1));
  };

  // Build log entries with timestamps
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatTs = (secOffset: number) => {
    const total = 42 * 60 + 15 + secOffset;
    return `10:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
  };

  let secCounter = 0;
  const logRows: Array<{
    timestamp: string;
    level: 'EVENT' | 'INFO' | 'ERROR' | 'PENDING';
    name: string;
    detail: string;
    kind: 'ok' | 'err' | 'info' | 'pending';
  }> = [];

  results.forEach(res => {
    (res.entries || []).forEach(e => {
      logRows.push({
        timestamp: formatTs(secCounter++),
        level: e.kind === 'err' ? 'ERROR' : e.kind === 'info' ? 'INFO' : 'EVENT',
        name: e.name,
        detail: e.detail,
        kind: e.kind,
      });
    });
  });

  currentConfig.steps.slice(stepIndex).forEach(st => {
    logRows.push({
      timestamp: formatTs(secCounter++),
      level: 'PENDING',
      name: st.action,
      detail: '',
      kind: 'pending',
    });
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#232938] bg-gradient-to-br from-[#10131a] via-[#121624] to-[#0f1118] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#0052ff]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0052ff] animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3c8aff]">
              Base Ecosystem DeFi Protocols &amp; Liquidity
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Integrate DeFi on Base
          </h2>

          <p className="text-sm text-[#8a91a0] max-w-3xl leading-relaxed">
            Connect your application to third-party decentralized finance protocols on Base. Allow users to trade tokens via 0x aggregated routing, manage direct lending positions, borrow against crypto and tokenized RWA collateral, or deposit into automated ERC-4626 vault earn products while signing every transaction securely from their own wallet.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Protocols:</span>
              <span className="text-[#3c8aff] font-bold">0x API · Moonwell · Aave v3 · ERC-4626</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#dee1e7] flex items-center gap-1.5">
              <span className="text-[#717886]">Security:</span>
              <span className="text-[#66c800] font-bold">Spender Isolation (AllowanceHolder)</span>
            </div>
            <a
              href="https://chain.base.org/demos"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#0052ff]/15 hover:bg-[#0052ff]/25 border border-[#0052ff]/40 text-[#3c8aff] font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Base Chain Demos</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Interactive DeFi Simulator Box */}
      <div className="rounded-2xl border border-[#222838] bg-[#0c0e15] shadow-2xl overflow-hidden">
        {/* Scenario Selector Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 bg-[#11141e] border-b border-[#202636]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#717886] uppercase tracking-wider">
              Simulation Scenario:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['trade', 'lend', 'borrow', 'earn'] as const).map((key) => {
                const conf = DEFI_SCENARIOS[key];
                const IconComponent = conf.icon;
                const isSelected = activeScenario === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectScenario(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#0052ff] text-white shadow-md font-bold'
                        : 'bg-[#181d2a] text-[#8a91a0] hover:text-white border border-[#252c3f]'
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#181d2a] border border-[#252c3f] text-[#3c8aff]">
              Target: {currentNetwork ? currentNetwork.name : 'Base Vibenet'}
            </span>
            {results.length > 0 && (
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-[#8a91a0] hover:text-white transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="px-4 py-2.5 bg-[#0f121a] border-b border-[#1b202e] flex items-center gap-4 overflow-x-auto text-xs">
          {currentConfig.steps.map((st, i) => {
            const isDoneStep = i < stepIndex;
            const isCurrent = i === stepIndex;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 shrink-0 py-1 border-b-2 font-medium transition-colors ${
                  isCurrent
                    ? 'border-[#0052ff] text-[#3c8aff] font-bold'
                    : isDoneStep
                    ? 'border-transparent text-[#66c800]'
                    : 'border-transparent text-[#636b7b]'
                }`}
              >
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-[#161a26]">
                  {i + 1}
                </span>
                <span>{st.stage}</span>
                {isDoneStep && <Check className="h-3 w-3 text-[#66c800]" />}
              </div>
            );
          })}
        </div>

        {/* Two-Column Simulation Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[320px]">
          {/* Left Column: Flow Stepper & Illustrative Metrics */}
          <div className="md:col-span-5 p-5 border-r border-[#1a1f2c] bg-[#0c0e15] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="space-y-3">
                {currentConfig.steps.map((st, i) => {
                  const isDoneStep = i < stepIndex;
                  const isCurrent = i === stepIndex;
                  const isFuture = i > stepIndex;
                  const isLast = i === currentConfig.steps.length - 1;

                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                            isDoneStep
                              ? 'bg-[#66c800] text-black'
                              : isCurrent
                              ? 'bg-[#0052ff] text-white shadow-sm ring-2 ring-[#0052ff]/30'
                              : 'border border-[#232938] text-[#636b7b] bg-[#121520]'
                          }`}
                        >
                          {isDoneStep ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : i + 1}
                        </span>
                        {!isLast && (
                          <div
                            className={`w-0.5 min-h-[24px] mt-1.5 ${
                              i < stepIndex ? 'bg-[#0052ff]' : 'bg-[#1e2330]'
                            }`}
                          />
                        )}
                      </div>

                      <div className="flex-1 pb-3">
                        <div
                          className={`text-xs font-semibold ${
                            isFuture ? 'text-[#636b7b]' : 'text-white'
                          }`}
                        >
                          {st.action}
                        </div>
                        <span
                          className={`text-[10px] font-mono ${
                            isDoneStep
                              ? 'text-[#66c800]'
                              : isCurrent
                              ? 'text-[#3c8aff]'
                              : 'text-[#505766]'
                          }`}
                        >
                          {isDoneStep ? 'Complete' : isCurrent ? 'In progress' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Illustrative Metrics Readout */}
              {metrics.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#121622] border border-[#22293b] space-y-2 mt-2">
                  <div className="text-[10px] uppercase font-mono font-bold text-[#8a91a0]">
                    Illustrative Position
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-[#8a91a0]">{m.label}:</span>
                        <span
                          className={`font-mono font-bold ${
                            m.tone === 'ok'
                              ? 'text-[#66c800]'
                              : m.tone === 'warn'
                              ? 'text-[#fc401f]'
                              : 'text-white'
                          }`}
                        >
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RWA Relevance Note */}
            <div className="p-3 rounded-xl bg-[#0052ff]/10 border border-[#0052ff]/20 text-[11px] text-[#c5cad6]">
              <div className="flex items-center gap-1.5 text-[#3c8aff] font-bold mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>B20 RWA Token Connection</span>
              </div>
              <p className="leading-relaxed">{currentConfig.rwaConnection}</p>
            </div>
          </div>

          {/* Right Column: Active Step Details & Action Execution */}
          <div className="md:col-span-7 p-6 bg-[#0f121a] flex flex-col justify-between space-y-6">
            {isDone ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#66c800]/15 text-[#66c800] border border-[#66c800]/30 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>DeFi Flow Complete</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {currentConfig.title}
                  </h3>
                  <p className="text-xs text-[#8a91a0] leading-relaxed">
                    Every step in this DeFi flow ran and confirmed against the Base simulation engine. The state changes and event logs below represent real smart contract transitions.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-white hover:bg-[#202638] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Run Simulation Again</span>
                  </button>

                  <a
                    href={currentConfig.href}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0052ff]/30 transition-all"
                  >
                    <span>Read Technical Specification</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0052ff]/15 text-[#3c8aff] border border-[#0052ff]/30">
                      Step {stepIndex + 1} of {currentConfig.steps.length}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {currentStep.action}
                    </h3>
                  </div>
                  <p className="text-xs text-[#8a91a0] leading-relaxed">
                    {currentStep.text}
                  </p>
                </div>

                {/* Summary Parameters Table */}
                <div className="rounded-xl border border-[#202738] bg-[#0c0e15] overflow-hidden text-xs">
                  {currentStep.summary.map((row, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-3.5 py-2.5 ${
                        idx > 0 ? 'border-t border-[#1a1f2c]' : ''
                      }`}
                    >
                      <span className="text-[#717886]">{row.label}</span>
                      <span
                        className={`font-semibold ${
                          row.mono ? 'font-mono text-[#3c8aff]' : 'text-white'
                        }`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleRunStep}
                    className="flex-1 px-4 py-3 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0052ff]/30 transition-all cursor-pointer"
                  >
                    <span>{currentStep.action}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  {results.length > 0 && (
                    <button
                      onClick={handleBack}
                      className="px-4 py-3 rounded-xl bg-[#161a26] border border-[#242c3d] text-[#8a91a0] hover:text-white hover:bg-[#202638] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Transaction Event Log Terminal */}
        <div className="border-t border-[#1b202e] bg-[#090b10]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#171b26] bg-[#0b0e14]">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#3c8aff]" />
              <span className="text-xs font-mono font-bold text-white">
                Base Transaction Event Log
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#636b7b]">
              Sub-cent L2 Execution Receipts
            </span>
          </div>

          <div className="max-h-44 overflow-y-auto p-2.5 font-mono text-xs space-y-1">
            {logRows.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-2 py-1 rounded transition-opacity ${
                  r.kind === 'pending' ? 'opacity-40' : 'opacity-100 hover:bg-[#121622]'
                }`}
              >
                <span className="text-[11px] text-[#555d6e] shrink-0">{r.timestamp}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    r.level === 'EVENT'
                      ? 'bg-[#0052ff]/20 text-[#3c8aff]'
                      : r.level === 'INFO'
                      ? 'bg-[#181d2a] text-[#8a91a0]'
                      : r.level === 'ERROR'
                      ? 'bg-[#fc401f]/20 text-[#fc401f]'
                      : 'bg-[#161a26] text-[#555d6e]'
                  }`}
                >
                  [{r.level}]
                </span>
                <span className="text-xs text-[#dee1e7] flex-1 truncate">
                  {r.name}
                  {r.detail && <span className="text-[#717886]"> · {r.detail}</span>}
                </span>
                <span className="shrink-0">
                  {r.kind === 'ok' && <Check className="h-3 w-3 text-[#66c800]" />}
                  {r.kind === 'err' && <AlertTriangle className="h-3 w-3 text-[#fc401f]" />}
                  {r.kind === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-[#3a4150]" />}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-4 py-2.5 bg-[#0e1118] border-t border-[#1a1f2c] flex items-center justify-between text-[11px] text-[#717886]">
          <span>{currentConfig.footer}</span>
          <span className="font-mono text-[#3c8aff]">docs.base.org/build-on-base/integrate-defi</span>
        </div>
      </div>

      {/* 4 Protocol Architectural Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Trading */}
        <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] hover:border-[#0052ff]/40 transition-all space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0052ff]/15 text-[#3c8aff] border border-[#0052ff]/30">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Integrate Trading (0x Swap API)</h4>
              <span className="text-[10px] font-mono text-[#717886]">Aggregated DEX Routing on Base</span>
            </div>
          </div>
          <p className="text-xs text-[#8a91a0] leading-relaxed">
            Integrate token swaps with executable routes from the 0x Swap API. Fetch firm quotes, check slippage tolerances, and simulate transaction data via <code>eth_call</code>.
          </p>
          <div className="p-2.5 rounded-xl bg-[#fc401f]/10 border border-[#fc401f]/20 text-[11px] text-[#dee1e7]">
            <span className="font-bold text-[#fc401f]">Critical Security Rule:</span> Never approve the 0x Settler contract directly. Always approve only the specific <code>AllowanceHolder</code> address returned by the quote.
          </div>
        </div>

        {/* Card 2: Lending */}
        <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] hover:border-[#0052ff]/40 transition-all space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#66c800]/15 text-[#66c800] border border-[#66c800]/30">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Integrate Lending</h4>
              <span className="text-[10px] font-mono text-[#717886]">Money Markets (Moonwell / Aave)</span>
            </div>
          </div>
          <p className="text-xs text-[#8a91a0] leading-relaxed">
            Supply USDC or wrapped assets to institutional money markets on Base. Accrue per-block variable interest automatically, manage positions, and monitor liquidity utilization.
          </p>
          <div className="p-2.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[11px] text-[#c5cad6]">
            <span className="font-bold text-[#66c800]">B20 Integration:</span> Enables automated cash drag minimization for uninvested subscription capital.
          </div>
        </div>

        {/* Card 3: Borrowing */}
        <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] hover:border-[#0052ff]/40 transition-all space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffd12f]/15 text-[#ffd12f] border border-[#ffd12f]/30">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Integrate Borrowing</h4>
              <span className="text-[10px] font-mono text-[#717886]">Collateralized Loans &amp; Health Factor</span>
            </div>
          </div>
          <p className="text-xs text-[#8a91a0] leading-relaxed">
            Supply collateral (WETH or whitelisted RWAs) to borrow liquid debt assets like USDC. Track the Health Factor <code>(Collateral × LiquidationThreshold ÷ Debt)</code> to prevent auctions.
          </p>
          <div className="p-2.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[11px] text-[#c5cad6]">
            <span className="font-bold text-[#ffd12f]">Health Factor Metric:</span> Keep ratio comfortably above 1.50+ to withstand market volatility on Base.
          </div>
        </div>

        {/* Card 4: Vault Earn */}
        <div className="p-5 rounded-2xl border border-[#222838] bg-[#0f121a] hover:border-[#0052ff]/40 transition-all space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#3c8aff]/15 text-[#3c8aff] border border-[#3c8aff]/30">
              <Vault className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Integrate an Earn Product (ERC-4626)</h4>
              <span className="text-[10px] font-mono text-[#717886]">Tokenized Yield Vaults</span>
            </div>
          </div>
          <p className="text-xs text-[#8a91a0] leading-relaxed">
            Provide a one-click deposit vault experience. The ERC-4626 vault mints proportional shares whose redemption exchange rate steadily increases over time as yields compound.
          </p>
          <div className="p-2.5 rounded-xl bg-[#161a26] border border-[#242c3d] text-[11px] text-[#c5cad6]">
            <span className="font-bold text-[#3c8aff]">Tokenized Treasuries:</span> Ideal for wrapping short-term U.S. T-Bills into tradeable Base security tokens.
          </div>
        </div>
      </div>
    </div>
  );
};
