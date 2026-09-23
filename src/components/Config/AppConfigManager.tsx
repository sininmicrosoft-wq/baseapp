import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Globe, 
  Cpu, 
  Flame, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  Sliders, 
  Zap, 
  Activity, 
  FileJson,
  Save,
  Check,
  Radio,
  Server
} from 'lucide-react';
import { AppConfig, BaseNetwork, AssetMetadata, CapTableHolder, TxLogEntry } from '../../types/base';
import { BASE_NETWORKS, DEFAULT_APP_CONFIG } from '../../data/mockBaseData';
import { triggerConfetti } from '../../utils/web3Helper';

interface AppConfigManagerProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  currentNetwork: BaseNetwork;
  onUpdateNetworkRpc: (networkId: string, newRpc: string) => void;
  asset: AssetMetadata;
  holders: CapTableHolder[];
  onImportState: (asset: AssetMetadata, holders: CapTableHolder[], config?: AppConfig) => void;
  onAddTxLog: (entry: TxLogEntry) => void;
}

export const AppConfigManager: React.FC<AppConfigManagerProps> = ({
  config,
  onSaveConfig,
  currentNetwork,
  onUpdateNetworkRpc,
  asset,
  holders,
  onImportState,
  onAddTxLog,
}) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [activeSubTab, setActiveSubTab] = useState<'network' | 'contracts' | 'gas' | 'backup' | 'env'>('network');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pingLatencies, setPingLatencies] = useState<Record<string, number | null>>({});
  const [isPinging, setIsPinging] = useState<Record<string, boolean>>({});
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onSaveConfig(localConfig);
    // Also update current active network RPC if modified
    if (localConfig.rpcUrls[currentNetwork.id]) {
      onUpdateNetworkRpc(currentNetwork.id, localConfig.rpcUrls[currentNetwork.id]);
    }
    setSaveSuccess(true);
    triggerConfetti();

    onAddTxLog({
      id: `config-save-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toTimeString().split(' ')[0],
      level: 'INFO',
      name: 'ConfigUpdated',
      detail: 'Application configuration & network settings saved to local persistence.',
      kind: 'ok',
    });

    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all network and application configurations to default values?')) {
      setLocalConfig(DEFAULT_APP_CONFIG);
      onSaveConfig(DEFAULT_APP_CONFIG);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const testRpcPing = async (netId: string, url: string) => {
    setIsPinging(prev => ({ ...prev, [netId]: true }));
    const startTime = performance.now();
    try {
      // Simulate RPC ping or lightweight head probe
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 80) + 40));
      const latency = Math.round(performance.now() - startTime);
      setPingLatencies(prev => ({ ...prev, [netId]: latency }));
    } catch {
      setPingLatencies(prev => ({ ...prev, [netId]: null }));
    } finally {
      setIsPinging(prev => ({ ...prev, [netId]: false }));
    }
  };

  const handleExportJson = () => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      applet: 'Base App - B20 Asset & RWA Studio',
      appletId: '2923e636-36f0-439f-9f93-26738b369695',
      config: localConfig,
      asset,
      holders,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `base-app-config-${asset.symbol.toLowerCase()}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      if (!parsed.asset || !parsed.holders) {
        throw new Error('Invalid configuration format: Missing "asset" or "holders" definitions.');
      }

      if (parsed.config) {
        setLocalConfig(parsed.config);
        onSaveConfig(parsed.config);
      }

      onImportState(parsed.asset, parsed.holders, parsed.config);
      setImportSuccess(true);
      triggerConfetti();

      onAddTxLog({
        id: `config-import-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'EVENT',
        name: 'ConfigStateImported',
        detail: `Successfully restored state for asset ${parsed.asset.symbol} (${parsed.holders.length} holders).`,
        kind: 'ok',
      });

      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON file.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  const loadSampleRwaConfig = (type: 'ustb' | 're') => {
    if (type === 'ustb') {
      const ustbAsset: AssetMetadata = {
        name: 'Base US Treasury 3M Yield',
        symbol: 'bUSTB',
        decimals: 6,
        supplyCap: 50000000,
        currentSupply: 5000000,
        multiplier: 1.05,
        paused: false,
        pausedScopes: [],
        assetId: 'US-T-BILL-Q3-2026',
        tokenAddress: '0xB200000000000000000000000000000000000099',
        policyId: 3,
        roles: {
          minter: '0x8453000000000000000000000000000000000001',
          operator: '0x8453000000000000000000000000000000000001',
          metadataAdmin: '0x8453000000000000000000000000000000000001',
          pauseAdmin: '0x8453000000000000000000000000000000000001',
        },
      };

      const ustbHolders: CapTableHolder[] = [
        {
          name: 'Apex Institutional Fund',
          address: '0x1111111111111111111111111111111111111111',
          rawBalance: 3000000,
          isAllowlisted: true,
          isBlocked: false,
          color: '#0052ff',
          category: 'Investor',
        },
        {
          name: 'Circle Treasury Reserve',
          address: '0x2222222222222222222222222222222222222222',
          rawBalance: 1500000,
          isAllowlisted: true,
          isBlocked: false,
          color: '#66c800',
          category: 'Treasury',
        },
        {
          name: 'Liquidity Pool (Aerodrome)',
          address: '0x3333333333333333333333333333333333333333',
          rawBalance: 500000,
          isAllowlisted: true,
          isBlocked: false,
          color: '#ffd12f',
          category: 'Public',
        },
      ];

      onImportState(ustbAsset, ustbHolders);
      setImportSuccess(true);
      triggerConfetti();
      setTimeout(() => setImportSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-5 w-5 text-[#0052ff]" />
            <span className="text-xs font-mono font-bold uppercase text-[#3c8aff]">
              App Configuration & Node Manager
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white">Application Settings & Parameters</h2>
          <p className="text-xs text-[#8a91a0] mt-1 max-w-2xl">
            Configure Base RPC endpoints, custom node providers, deployed B20 smart contract addresses, gas sponsorship policies, and import/export full RWA cap-table states.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetToDefaults}
            className="px-3 py-2 rounded-xl bg-[#191c24] hover:bg-[#222733] border border-[#2b303c] text-xs font-medium text-[#dee1e7] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#8a91a0]" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#0052ff]/25 transition-all"
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subtabs Header */}
      <div className="flex items-center gap-2 border-b border-[#232730] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('network')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            activeSubTab === 'network'
              ? 'bg-[#0052ff] text-white shadow-sm font-semibold'
              : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>RPC & Networks</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            activeSubTab === 'contracts'
              ? 'bg-[#0052ff] text-white shadow-sm font-semibold'
              : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Contract Deployments</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            activeSubTab === 'gas'
              ? 'bg-[#0052ff] text-white shadow-sm font-semibold'
              : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
          }`}
        >
          <Flame className="h-4 w-4" />
          <span>Gas & Paymaster</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            activeSubTab === 'backup'
              ? 'bg-[#0052ff] text-white shadow-sm font-semibold'
              : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
          }`}
        >
          <FileJson className="h-4 w-4" />
          <span>Backup & State Import/Export</span>
        </button>

        <button
          onClick={() => setActiveSubTab('env')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            activeSubTab === 'env'
              ? 'bg-[#0052ff] text-white shadow-sm font-semibold'
              : 'text-[#8a91a0] hover:text-white hover:bg-[#16181f]'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Diagnostics & Specs</span>
        </button>
      </div>

      {/* SUBTAB 1: RPC & Networks */}
      {activeSubTab === 'network' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#0052ff]" />
                <span>Base Network RPC Endpoints</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-0.5">
                Customize RPC node endpoints for Base Mainnet, Sepolia Testnet, and Vibenet (B20 Devnet). Enter dedicated provider URLs (Alchemy, Infura, QuickNode) for production reliability.
              </p>
            </div>

            <div className="space-y-4">
              {/* Base Mainnet */}
              <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0052ff]"></span>
                    <span className="text-xs font-bold text-white">Base Mainnet (Chain ID 8453)</span>
                    {currentNetwork.id === 'base-mainnet' && (
                      <span className="text-[10px] bg-[#0052ff]/20 text-[#3c8aff] px-1.5 py-0.2 rounded font-mono font-bold">
                        Active Network
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => testRpcPing('base-mainnet', localConfig.rpcUrls['base-mainnet'])}
                    disabled={isPinging['base-mainnet']}
                    className="text-xs font-mono text-[#3c8aff] hover:underline flex items-center gap-1"
                  >
                    <Activity className={`h-3 w-3 ${isPinging['base-mainnet'] ? 'animate-spin' : ''}`} />
                    <span>
                      {pingLatencies['base-mainnet'] !== undefined
                        ? `${pingLatencies['base-mainnet']}ms`
                        : 'Ping RPC'}
                    </span>
                  </button>
                </div>
                <input
                  type="text"
                  value={localConfig.rpcUrls['base-mainnet']}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      rpcUrls: { ...prev.rpcUrls, 'base-mainnet': e.target.value },
                    }))
                  }
                  className="w-full rounded-lg bg-[#14161c] border border-[#232730] px-3 py-2 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                  placeholder="https://mainnet.base.org or https://base-mainnet.g.alchemy.com/v2/..."
                />
              </div>

              {/* Base Sepolia */}
              <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3c8aff]"></span>
                    <span className="text-xs font-bold text-white">Base Sepolia Testnet (Chain ID 84532)</span>
                    {currentNetwork.id === 'base-sepolia' && (
                      <span className="text-[10px] bg-[#0052ff]/20 text-[#3c8aff] px-1.5 py-0.2 rounded font-mono font-bold">
                        Active Network
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => testRpcPing('base-sepolia', localConfig.rpcUrls['base-sepolia'])}
                    disabled={isPinging['base-sepolia']}
                    className="text-xs font-mono text-[#3c8aff] hover:underline flex items-center gap-1"
                  >
                    <Activity className={`h-3 w-3 ${isPinging['base-sepolia'] ? 'animate-spin' : ''}`} />
                    <span>
                      {pingLatencies['base-sepolia'] !== undefined
                        ? `${pingLatencies['base-sepolia']}ms`
                        : 'Ping RPC'}
                    </span>
                  </button>
                </div>
                <input
                  type="text"
                  value={localConfig.rpcUrls['base-sepolia']}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      rpcUrls: { ...prev.rpcUrls, 'base-sepolia': e.target.value },
                    }))
                  }
                  className="w-full rounded-lg bg-[#14161c] border border-[#232730] px-3 py-2 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                  placeholder="https://sepolia.base.org"
                />
              </div>

              {/* Base Vibenet (B20 Devnet) */}
              <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#66c800]"></span>
                    <span className="text-xs font-bold text-white">Base Vibenet (B20 Devnet · Chain ID 84538453)</span>
                    {currentNetwork.id === 'base-vibenet' && (
                      <span className="text-[10px] bg-[#66c800]/20 text-[#66c800] px-1.5 py-0.2 rounded font-mono font-bold">
                        Active Network
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => testRpcPing('base-vibenet', localConfig.rpcUrls['base-vibenet'])}
                    disabled={isPinging['base-vibenet']}
                    className="text-xs font-mono text-[#66c800] hover:underline flex items-center gap-1"
                  >
                    <Activity className={`h-3 w-3 ${isPinging['base-vibenet'] ? 'animate-spin' : ''}`} />
                    <span>
                      {pingLatencies['base-vibenet'] !== undefined
                        ? `${pingLatencies['base-vibenet']}ms`
                        : 'Ping RPC'}
                    </span>
                  </button>
                </div>
                <input
                  type="text"
                  value={localConfig.rpcUrls['base-vibenet']}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      rpcUrls: { ...prev.rpcUrls, 'base-vibenet': e.target.value },
                    }))
                  }
                  className="w-full rounded-lg bg-[#14161c] border border-[#232730] px-3 py-2 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                  placeholder="https://api.vibes.base.org/api/vibenet/account/rpc"
                />
              </div>

              {/* Custom / Local Anvil Node */}
              <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffd12f]"></span>
                    <span className="text-xs font-bold text-white">Custom / Local Foundry Anvil Node</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#717886]">Chain ID: {localConfig.customChainId}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={localConfig.rpcUrls['custom'] || ''}
                    onChange={(e) =>
                      setLocalConfig(prev => ({
                        ...prev,
                        rpcUrls: { ...prev.rpcUrls, custom: e.target.value },
                      }))
                    }
                    className="md:col-span-2 rounded-lg bg-[#14161c] border border-[#232730] px-3 py-2 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                    placeholder="http://127.0.0.1:8545"
                  />
                  <input
                    type="number"
                    value={localConfig.customChainId}
                    onChange={(e) =>
                      setLocalConfig(prev => ({
                        ...prev,
                        customChainId: Number(e.target.value),
                      }))
                    }
                    className="rounded-lg bg-[#14161c] border border-[#232730] px-3 py-2 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                    placeholder="Chain ID (e.g. 31337)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Contract Deployments */}
      {activeSubTab === 'contracts' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#0052ff]" />
                <span>Base Smart Contract Registries</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-0.5">
                Target addresses for the Base B20 Asset Factory and Policy Registry precompiles. Override these when deploying to custom testnets or private Base chains.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                  B20 Asset Factory Address
                </label>
                <input
                  type="text"
                  value={localConfig.contracts.b20Factory}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      contracts: { ...prev.contracts, b20Factory: e.target.value },
                    }))
                  }
                  className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                />
                <p className="text-[11px] text-[#717886] mt-1">
                  Responsible for deploying `BaseB20Asset` instances and registering compliance rules.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                  Policy Registry Precompile Address
                </label>
                <input
                  type="text"
                  value={localConfig.contracts.policyRegistry}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      contracts: { ...prev.contracts, policyRegistry: e.target.value },
                    }))
                  }
                  className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                />
                <p className="text-[11px] text-[#717886] mt-1">
                  Evaluates `isAllowed(policyId, scope, account)` during minting, burning, and secondary transfers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                  Base Paymaster Endpoint (ERC-4337 / EIP-7677)
                </label>
                <input
                  type="text"
                  value={localConfig.contracts.paymasterEndpoint}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      contracts: { ...prev.contracts, paymasterEndpoint: e.target.value },
                    }))
                  }
                  className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                />
                <p className="text-[11px] text-[#717886] mt-1">
                  Coinbase Developer Platform or Pimlico Paymaster RPC endpoint for gas sponsorship.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                  Basescan API Key (Optional Verification)
                </label>
                <input
                  type="password"
                  value={localConfig.contracts.basescanApiKey}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      contracts: { ...prev.contracts, basescanApiKey: e.target.value },
                    }))
                  }
                  placeholder="Enter Basescan API key for automated source code verification..."
                  className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Gas & Paymaster */}
      {activeSubTab === 'gas' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-[#ffd12f]" />
                <span>Gas & Paymaster Sponsorship Policies</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-0.5">
                Configure transaction fee limits, priority gas fee levels, and ERC-4337 UserOperation sponsorship.
              </p>
            </div>

            <div className="space-y-4">
              {/* Preset selection */}
              <div>
                <label className="block text-xs font-semibold text-[#dee1e7] mb-2">
                  Gas Priority Strategy
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'standard', title: 'Standard', gwei: '0.001 Gwei', desc: 'Typical Base L2 block' },
                    { id: 'fast', title: 'Fast Priority', gwei: '0.003 Gwei', desc: 'Prioritize next block' },
                    { id: 'instant', title: 'Instant (High-yield)', gwei: '0.006 Gwei', desc: 'Guaranteed inclusion' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() =>
                        setLocalConfig(prev => ({
                          ...prev,
                          gasSettings: {
                            ...prev.gasSettings,
                            gasPreset: preset.id as any,
                            customGwei: preset.id === 'standard' ? 0.001 : preset.id === 'fast' ? 0.003 : 0.006,
                          },
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        localConfig.gasSettings.gasPreset === preset.id
                          ? 'border-[#0052ff] bg-[#0052ff]/10 text-white'
                          : 'border-[#232730] bg-[#0e1014] text-[#8a91a0] hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{preset.title}</div>
                      <div className="font-mono text-[11px] text-[#66c800]">{preset.gwei}</div>
                      <div className="text-[10px] text-[#717886] mt-1">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paymaster Auto-sponsor Toggle */}
              <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#66c800]" />
                    <span>Automatic Paymaster Sponsorship (Gasless)</span>
                  </div>
                  <p className="text-[11px] text-[#8a91a0] mt-0.5">
                    When active, UserOperations generated by passkey smart wallets are subsidized at $0.00.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localConfig.gasSettings.autoSponsorGas}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      gasSettings: { ...prev.gasSettings, autoSponsorGas: e.target.checked },
                    }))
                  }
                  className="h-5 w-5 accent-[#0052ff] rounded cursor-pointer"
                />
              </div>

              {/* Sponsorship Cap */}
              <div>
                <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                  Monthly Protocol Sponsorship Budget ($ USD)
                </label>
                <input
                  type="number"
                  value={localConfig.gasSettings.maxSponsorCapUsd}
                  onChange={(e) =>
                    setLocalConfig(prev => ({
                      ...prev,
                      gasSettings: { ...prev.gasSettings, maxSponsorCapUsd: Number(e.target.value) },
                    }))
                  }
                  className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                />
                <p className="text-[11px] text-[#717886] mt-1">
                  At an average $0.0002 gas fee on Base, a $50 monthly budget covers ~250,000 user transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Backup & Import/Export */}
      {activeSubTab === 'backup' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileJson className="h-4 w-4 text-[#0052ff]" />
                <span>RWA State Backup & JSON Sync</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-0.5">
                Export current cap-table distribution, multiplier, allowlist policies, and network configs to a portable JSON file.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Box */}
              <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <Download className="h-4 w-4 text-[#3c8aff]" />
                    <span>Export Application State</span>
                  </div>
                  <p className="text-xs text-[#8a91a0] mt-1">
                    Download complete snapshot containing {holders.length} holders, asset `{asset.symbol}`, and custom RPC configurations.
                  </p>
                </div>
                <button
                  onClick={handleExportJson}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#191c24] hover:bg-[#202530] text-white text-xs font-bold border border-[#2b303c] transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4 text-[#3c8aff]" />
                  <span>Download .json Backup</span>
                </button>
              </div>

              {/* Sample Templates */}
              <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <Zap className="h-4 w-4 text-[#ffd12f]" />
                    <span>Quick Institutional Templates</span>
                  </div>
                  <p className="text-xs text-[#8a91a0] mt-1">
                    Instantly load verified institutional configurations into the B20 simulator.
                  </p>
                </div>
                <button
                  onClick={() => loadSampleRwaConfig('ustb')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#191c24] hover:bg-[#202530] text-white text-xs font-bold border border-[#2b303c] transition-colors flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="h-4 w-4 text-[#ffd12f]" />
                  <span>Load bUSTB (US Treasury 3M Yield)</span>
                </button>
              </div>
            </div>

            {/* Import Box */}
            <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Upload className="h-4 w-4 text-[#66c800]" />
                  <span>Import JSON Configuration</span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#3c8aff] hover:underline"
                >
                  Choose file from disk
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <textarea
                rows={5}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='Paste JSON config here or load file from disk...'
                className="w-full rounded-xl bg-[#14161c] border border-[#232730] p-3 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
              />

              {importError && (
                <div className="p-3 rounded-xl bg-[#fc401f]/10 border border-[#fc401f]/30 text-xs text-[#fc401f] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 rounded-xl bg-[#66c800]/10 border border-[#66c800]/30 text-xs text-[#66c800] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>Configuration imported and applied successfully!</span>
                </div>
              )}

              <button
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#66c800] hover:bg-[#57ac00] text-black text-xs font-bold shadow-lg shadow-[#66c800]/20 transition-all disabled:opacity-50"
              >
                Apply Imported State
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Diagnostics & Specs */}
      {activeSubTab === 'env' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Server className="h-4 w-4 text-[#0052ff]" />
                <span>Runtime Environment & Base Node Diagnostics</span>
              </h3>
              <p className="text-xs text-[#8a91a0] mt-0.5">
                Verified environment specifications for Google AI Studio Cloud Run deployment.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-[#1c1f26]">
                  <tr>
                    <td className="py-2.5 text-[#717886] font-medium">AI Studio Applet ID</td>
                    <td className="py-2.5 text-right font-mono text-white">2923e636-36f0-439f-9f93-26738b369695</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#717886] font-medium">Base EVM Execution Environment</td>
                    <td className="py-2.5 text-right font-mono text-[#66c800]">Cancun Ready (EIP-4844 Active)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#717886] font-medium">Standard Precompile Target</td>
                    <td className="py-2.5 text-right font-mono text-[#3c8aff]">B20 Asset Standard Specification</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#717886] font-medium">Account Abstraction Standard</td>
                    <td className="py-2.5 text-right font-mono text-[#ffd12f]">ERC-4337 & EIP-7677 Paymasters</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[#717886] font-medium">Local Storage Persistence</td>
                    <td className="py-2.5 text-right font-mono text-[#66c800]">Active (Synchronized)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6L12 2z" />
    </svg>
  );
}
