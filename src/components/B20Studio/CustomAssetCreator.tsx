import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  Layers, 
  Check, 
  ArrowRight, 
  Coins, 
  HelpCircle,
  FileCode2,
  Lock,
  Flame
} from 'lucide-react';
import { PRESET_RWA_TEMPLATES } from '../../data/mockBaseData';
import { AssetMetadata, BaseNetwork, TxLogEntry } from '../../types/base';
import { generateRandomAddress, generateTxHash, triggerConfetti } from '../../utils/web3Helper';

interface CustomAssetCreatorProps {
  currentNetwork: BaseNetwork;
  onAssetCreated: (asset: AssetMetadata) => void;
  onAddTxLog: (entry: TxLogEntry) => void;
}

export const CustomAssetCreator: React.FC<CustomAssetCreatorProps> = ({
  currentNetwork,
  onAssetCreated,
  onAddTxLog,
}) => {
  const [name, setName] = useState('Acme Global Shares');
  const [symbol, setSymbol] = useState('ACME');
  const [decimals, setDecimals] = useState<number>(6);
  const [supplyCap, setSupplyCap] = useState<number>(5000000);
  const [assetId, setAssetId] = useState('ACME-CORP-CLASS-A');
  const [policyType, setPolicyType] = useState<'allowlist' | 'accredited' | 'open'>('allowlist');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState<AssetMetadata | null>(null);

  const applyPreset = (preset: typeof PRESET_RWA_TEMPLATES[0]) => {
    setName(preset.name);
    setSymbol(preset.symbol);
    setDecimals(preset.decimals);
    setSupplyCap(preset.supplyCap);
    setAssetId(preset.assetId);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    const tokenAddress = generateRandomAddress();
    const txHash = generateTxHash();
    const blockNum = 21459200 + Math.floor(Math.random() * 200);

    setTimeout(() => {
      const newAsset: AssetMetadata = {
        name,
        symbol: symbol.toUpperCase(),
        decimals,
        supplyCap,
        currentSupply: 0,
        multiplier: 1.0,
        paused: false,
        pausedScopes: [],
        assetId,
        tokenAddress,
        policyId: 3,
        roles: {
          minter: '0x8453000000000000000000000000000000000001',
          operator: '0x8453000000000000000000000000000000000001',
          metadataAdmin: '0x8453000000000000000000000000000000000001',
          pauseAdmin: '0x8453000000000000000000000000000000000001',
        },
      };

      onAssetCreated(newAsset);
      setDeploymentSuccess(newAsset);
      setIsDeploying(false);
      triggerConfetti();

      // Log event
      onAddTxLog({
        id: `tx-deploy-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'EVENT',
        name: 'createB20',
        detail: `Custom Asset Deployed: ${name} (${symbol.toUpperCase()}) at ${tokenAddress}`,
        kind: 'ok',
        hash: txHash,
        blockNumber: blockNum,
        gasUsed: 142800,
        gasFeeUsd: '$0.0018',
        explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
      });
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full bg-[#0052ff]"></span>
          <span className="text-xs font-mono text-[#3c8aff] uppercase font-bold tracking-wider">
            Tokenized Securities & Asset Configurator
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">Deploy Custom B20 Asset on Base</h2>
        <p className="text-sm text-[#8a91a0] mt-1">
          Mint legally enforceable real-world assets on Base Layer 2. Pre-configured with shared B20 precompiles, ERC-20 interface, and dynamic multiplier support.
        </p>

        {/* Preset Chips */}
        <div className="mt-5 pt-4 border-t border-[#232730]">
          <span className="text-xs font-mono text-[#717886] uppercase font-bold block mb-2.5">
            Quick-start RWA Templates:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESET_RWA_TEMPLATES.map((p) => (
              <button
                key={p.symbol}
                onClick={() => applyPreset(p)}
                className="flex flex-col text-left p-3 rounded-xl bg-[#16181e] hover:bg-[#1f222b] border border-[#232730] hover:border-[#0052ff]/50 transition-all group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-white group-hover:text-[#3c8aff]">
                    {p.symbol}
                  </span>
                  <span className="text-[10px] font-mono text-[#717886]">{p.decimals} dec</span>
                </div>
                <span className="text-[11px] text-[#b1b7c3] mt-1 font-medium truncate">
                  {p.name}
                </span>
                <span className="text-[10px] text-[#717886] mt-0.5">{p.type}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deployment Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border border-[#232730] bg-[#111317] p-6 space-y-5 shadow-xl">
          <h3 className="text-base font-bold text-white border-b border-[#232730] pb-3 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#0052ff]" />
            <span>Asset Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1.5">
                Asset Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp Class A"
                className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs text-white placeholder-[#5b616e] focus:border-[#0052ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1.5">
                Token Symbol (Ticker)
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. ACME"
                className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-[#5b616e] focus:border-[#0052ff] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1.5">
                Precision Decimals
              </label>
              <select
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value))}
                className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
              >
                <option value={6}>6 Decimals (Standard for Equities & USD-backed RWAs)</option>
                <option value={8}>8 Decimals (Standard for Commodities & Bullion)</option>
                <option value={18}>18 Decimals (Standard ERC-20 Cryptographic precision)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1.5">
                Technical Issuance Ceiling (Supply Cap)
              </label>
              <input
                type="number"
                value={supplyCap}
                onChange={(e) => setSupplyCap(Number(e.target.value))}
                className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#dee1e7] mb-1.5">
              Legal Metadata Identifier (`asset-id`)
            </label>
            <input
              type="text"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="e.g. CUSIP, ISIN, or Legal Entity Asset Key"
              className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-[#66c800] placeholder-[#5b616e] focus:border-[#0052ff] focus:outline-none"
            />
            <p className="text-[11px] text-[#717886] mt-1">
              Stored directly in the onchain B20 metadata table for cross-referencing legal filings.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#dee1e7] mb-2">
              Compliance Policy Registry Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'allowlist', label: 'Allowlist Policy #2', desc: 'Transfer restricted to verified KYC holders' },
                { id: 'accredited', label: 'Accredited Tier', desc: 'Reg D 506(c) qualified investors only' },
                { id: 'open', label: 'Unrestricted ERC-20', desc: 'Permissionless secondary peer transfers' },
              ].map((pol) => (
                <button
                  type="button"
                  key={pol.id}
                  onClick={() => setPolicyType(pol.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    policyType === pol.id
                      ? 'border-[#0052ff] bg-[#0052ff]/10 text-white'
                      : 'border-[#232730] bg-[#0e1014] text-[#8a91a0] hover:border-[#3e4554]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{pol.label}</span>
                    {policyType === pol.id && <Check className="h-3.5 w-3.5 text-[#0052ff]" />}
                  </div>
                  <p className="text-[10.5px] text-[#717886] mt-1">{pol.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white font-bold text-sm shadow-xl shadow-[#0052ff]/25 transition-all disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Deploying B20 Asset to Base...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Deploy B20 Asset Token to Base</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Info Box */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#717886]">
              Standard Architecture
            </h4>

            <div className="space-y-3 text-xs text-[#b1b7c3]">
              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#232730] space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#66c800]" />
                  <span>ERC-20 Surface</span>
                </div>
                <p className="text-[11px] text-[#8a91a0]">
                  Full compatibility with Coinbase Wallet, Uniswap, and institutional custodians.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#232730] space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-[#3c8aff]" />
                  <span>Base L2 Gas Efficiency</span>
                </div>
                <p className="text-[11px] text-[#8a91a0]">
                  Batch-mint to 500 holders for under $0.10 total gas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1014] border border-[#232730] space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#ffd12f]" />
                  <span>Policy Gate Registry</span>
                </div>
                <p className="text-[11px] text-[#8a91a0]">
                  Reverts unapproved transfers via Base precompiles before gas is wasted.
                </p>
              </div>
            </div>
          </div>

          {/* Success Banner if newly created */}
          {deploymentSuccess && (
            <div className="rounded-2xl border border-[#66c800]/40 bg-[#66c800]/10 p-5 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-[#66c800] font-bold text-sm">
                <Check className="h-4 w-4" />
                <span>Asset Successfully Deployed!</span>
              </div>
              <p className="text-xs text-[#dee1e7]">
                <strong>{deploymentSuccess.name} ({deploymentSuccess.symbol})</strong> is now live on {currentNetwork.name}.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#8a91a0] break-all bg-[#0a0b0d] p-2.5 rounded-lg border border-[#232730]">
                Contract: {deploymentSuccess.tokenAddress}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
