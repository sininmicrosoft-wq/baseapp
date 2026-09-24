import React, { useState } from 'react';
import { 
  BookOpen, 
  Building2, 
  BarChart3, 
  UserCheck, 
  UserX, 
  Megaphone, 
  GitBranch, 
  PauseCircle, 
  ArrowRight, 
  ExternalLink,
  Code2,
  Copy,
  Check,
  Network,
  Layers,
  Cpu,
  Package,
  ArrowLeftRight
} from 'lucide-react';
import { ScenarioFlow, BaseNetwork } from '../../types/base';
import { BaseProtocolOverview } from './BaseProtocolOverview';
import { BasePredeploysViewer } from './BasePredeploysViewer';
import { BasePreinstallsViewer } from './BasePreinstallsViewer';
import { BaseDeFiIntegrationsViewer } from './BaseDeFiIntegrationsViewer';

interface BaseDocsGuidesProps {
  onSelectSimulatorFlow: (flowId: ScenarioFlow) => void;
  currentNetwork?: BaseNetwork;
}

export const BaseDocsGuides: React.FC<BaseDocsGuidesProps> = ({
  onSelectSimulatorFlow,
  currentNetwork,
}) => {
  const [activeSection, setActiveSection] = useState<'protocol' | 'predeploys' | 'preinstalls' | 'defi' | 'b20'>('protocol');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const guides = [
    {
      id: 'create' as ScenarioFlow,
      title: 'Create an Asset Token',
      icon: Building2,
      desc: 'Configure a B20 Asset token for one class of units with configurable precision and legal metadata.',
      code: `// Deploy B20 Asset using viem on Base
const hash = await walletClient.writeContract({
  address: B20_FACTORY_ADDRESS,
  abi: B20_FACTORY_ABI,
  functionName: 'createB20',
  args: ['Example Corp Class A', 'EXM', 6, 1_000_000n * 10n**6n],
});`,
    },
    {
      id: 'issue' as ScenarioFlow,
      title: 'Issue Units to Holders',
      icon: BarChart3,
      desc: 'Distribute units to multiple approved holders in one atomic, gas-efficient multicall.',
      code: `// Batch mint to approved holders
await tokenContract.write.batchMint([
  [aliceAddress, bobAddress],
  [600n * 10n**6n, 400n * 10n**6n],
]);`,
    },
    {
      id: 'restrict' as ScenarioFlow,
      title: 'Restrict Eligible Holders',
      icon: UserCheck,
      desc: 'Gate issuance and secondary transfers with a shared onchain allowlist policy registry.',
      code: `// Bind Allowlist Policy #2 to transfer scopes
await tokenContract.write.bindPolicyScope([
  Scope.TRANSFER_RECEIVER,
  2n // Policy ID
]);`,
    },
    {
      id: 'cancel' as ScenarioFlow,
      title: 'Cancel Blocked Units',
      icon: UserX,
      desc: 'Burn units after a holder is denied by the sender policy or subjected to court orders.',
      code: `// Burn blocked non-compliant units
await tokenContract.write.burnBlocked([
  sanctionedAddress,
  100n * 10n**6n
]);`,
    },
    {
      id: 'dividend' as ScenarioFlow,
      title: 'Announce a Distribution',
      icon: Megaphone,
      desc: 'Publish an onchain corporate notice and distribute additional shares or yields.',
      code: `// Announce onchain corporate stock dividend
await tokenContract.write.announceDistribution([
  'DIV-2026-Q3',
  '5% Annual Corporate Stock Dividend',
  'ipfs://bafybeicorp/dividend-resolution-2026',
  [aliceAddress, bobAddress],
  [30n * 10n**6n, 20n * 10n**6n]
]);`,
    },
    {
      id: 'split' as ScenarioFlow,
      title: 'Apply a Multiplier',
      icon: GitBranch,
      desc: 'Update displayed balances for stock splits (e.g. 2-for-1) without migrating holder accounts.',
      code: `// Update WAD multiplier (2.0 WAD = 2 * 10^18)
await tokenContract.write.updateMultiplier([
  2n * 10n**18n
]);`,
    },
    {
      id: 'pause' as ScenarioFlow,
      title: 'Pause Transfers',
      icon: PauseCircle,
      desc: 'Halt transfers during an investigation or market closed hours while minting stays available.',
      code: `// Pause secondary transfers only
await tokenContract.write.setTransfersPaused([true]);`,
    },
  ];

  const handleCopyCode = (index: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Section Navigator */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-1.5 rounded-2xl bg-[#0e1014] border border-[#232730]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('protocol')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSection === 'protocol'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
            }`}
          >
            <Network className="h-4 w-4" />
            <span>Base Chain Protocol Architecture</span>
          </button>

          <button
            onClick={() => setActiveSection('predeploys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSection === 'predeploys'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>Base Genesis Predeploys</span>
          </button>

          <button
            onClick={() => setActiveSection('preinstalls')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSection === 'preinstalls'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Base Genesis Preinstalls</span>
          </button>

          <button
            onClick={() => setActiveSection('defi')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSection === 'defi'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Integrate DeFi</span>
          </button>

          <button
            onClick={() => setActiveSection('b20')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSection === 'b20'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/30'
                : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>B20 Asset Integration Recipes</span>
          </button>
        </div>

        <a
          href="https://docs.base.org/llms.txt"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14161d] text-[#8a91a0] hover:text-white text-xs font-mono border border-[#232730] transition-colors"
        >
          <span>docs.base.org/llms.txt</span>
          <ExternalLink className="h-3 w-3 text-[#3c8aff]" />
        </a>
      </div>

      {/* SECTION 1: PROTOCOL ARCHITECTURE */}
      {activeSection === 'protocol' && <BaseProtocolOverview currentNetwork={currentNetwork} />}

      {/* SECTION 2: BASE PREDEPLOYED SYSTEM CONTRACTS */}
      {activeSection === 'predeploys' && <BasePredeploysViewer currentNetwork={currentNetwork} />}

      {/* SECTION 3: BASE PREINSTALLED UTILITY CONTRACTS */}
      {activeSection === 'preinstalls' && <BasePreinstallsViewer currentNetwork={currentNetwork} />}

      {/* SECTION 4: INTEGRATE DEFI (0X, LENDING, BORROWING, EARN) */}
      {activeSection === 'defi' && <BaseDeFiIntegrationsViewer currentNetwork={currentNetwork} />}

      {/* SECTION 5: B20 ASSET RECIPES */}
      {activeSection === 'b20' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#0052ff]" />
              <span className="text-xs font-mono font-bold uppercase text-[#3c8aff]">
                Base Developer Documentation
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">B20 Asset Integration Guides</h2>
            <p className="text-sm text-[#8a91a0] max-w-2xl">
              Complete guides for tokenizing securities, real estate, and fixed income on Base. Explore code snippets and jump directly into the interactive simulator.
            </p>
          </div>

          {/* Guide Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guides.map((guide, idx) => {
              const Icon = guide.icon;
              return (
                <div
                  key={guide.id}
                  className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-4 hover:border-[#0052ff]/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#0052ff]/10 text-[#0052ff] flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-base text-white">{guide.title}</h3>
                      </div>
                    </div>

                    <p className="text-xs text-[#8a91a0] leading-relaxed">{guide.desc}</p>
                  </div>

                  {/* Code Snippet */}
                  <div className="relative rounded-xl bg-[#0a0b0d] border border-[#232730] p-3 text-[11px] font-mono text-[#dee1e7] overflow-x-auto">
                    <button
                      onClick={() => handleCopyCode(idx, guide.code)}
                      className="absolute right-2 top-2 p-1.5 rounded-lg bg-[#1a1d24] text-[#8a91a0] hover:text-white transition-colors"
                      title="Copy snippet"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3 w-3 text-[#66c800]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <pre>
                      <code>{guide.code}</code>
                    </pre>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-2 border-t border-[#232730] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#717886]">
                      Base Chain ID: 8453
                    </span>
                    <button
                      onClick={() => onSelectSimulatorFlow(guide.id)}
                      className="flex items-center gap-1 text-xs font-bold text-[#3c8aff] hover:text-[#0052ff] transition-colors"
                    >
                      <span>Test in Simulator</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
