import React, { useState } from 'react';
import { Command } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { B20FlowSimulator } from './components/B20Studio/B20FlowSimulator';
import { CustomAssetCreator } from './components/B20Studio/CustomAssetCreator';
import { CapTableManager } from './components/B20Studio/CapTableManager';
import { SolidityCodeViewer } from './components/ContractStudio/SolidityCodeViewer';
import { BasePaymasterDemo } from './components/Ecosystem/BasePaymasterDemo';
import { BaseDocsGuides } from './components/DocsViewer/BaseDocsGuides';
import { AppConfigManager } from './components/Config/AppConfigManager';
import { BaseMiniAppView } from './components/MiniApp/BaseMiniAppView';
import { TransactionLogDrawer } from './components/TransactionLogDrawer';
import { QuickActionsMenu } from './components/QuickActions/QuickActionsMenu';
import { QuickActionsSidebar } from './components/QuickActions/QuickActionsSidebar';
import { BridgeStatusModal } from './components/QuickActions/BridgeStatusModal';
import { ShareStateModal } from './components/QuickActions/ShareStateModal';
import { WalletConnectModal } from './components/Wallet/WalletConnectModal';
import { 
  BASE_NETWORKS, 
  INITIAL_ASSET, 
  INITIAL_HOLDERS,
  DEFAULT_APP_CONFIG
} from './data/mockBaseData';
import { 
  AssetMetadata, 
  BaseNetwork, 
  CapTableHolder, 
  ScenarioFlow, 
  TxLogEntry, 
  WalletAccount,
  AppConfig
} from './types/base';
import { generateTxHash, triggerConfetti } from './utils/web3Helper';
import { detectMiniAppContext } from './utils/miniAppHelper';

export default function App() {
  const miniAppContext = detectMiniAppContext();
  const [activeTab, setActiveTab] = useState<string>(
    miniAppContext.isInMiniApp ? 'miniapp' : 'miniapp'
  );
  const [currentNetwork, setCurrentNetwork] = useState<BaseNetwork>(
    BASE_NETWORKS['base-vibenet']
  );
  const [asset, setAsset] = useState<AssetMetadata>(INITIAL_ASSET);
  const [holders, setHolders] = useState<CapTableHolder[]>(INITIAL_HOLDERS);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Application & Network Configuration
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem('base_app_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved config from localStorage', e);
    }
    return DEFAULT_APP_CONFIG;
  });

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('base_app_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save config to localStorage', e);
    }
  };

  const handleUpdateNetworkRpc = (networkId: string, newRpc: string) => {
    if (BASE_NETWORKS[networkId]) {
      BASE_NETWORKS[networkId].rpcUrl = newRpc;
    }
    setCurrentNetwork((prev) => {
      if (prev.id === networkId) {
        return { ...prev, rpcUrl: newRpc };
      }
      return prev;
    });
  };

  const handleImportState = (
    newAsset: AssetMetadata,
    newHolders: CapTableHolder[],
    newConfig?: AppConfig
  ) => {
    setAsset(newAsset);
    setHolders(newHolders);
    if (newConfig) {
      handleSaveConfig(newConfig);
    }
  };

  // Connected Wallet State
  const [wallet, setWallet] = useState<WalletAccount>({
    address: '0x8453B20d826a57E88aDb34589d8F07C647a196e7',
    isConnected: true,
    isSmartWallet: true,
    passkeyName: 'TouchID / FaceID Passkey',
    balanceEth: 1.54,
    balanceToken: 600,
    networkId: 'base-vibenet',
  });

  // Transaction Logs
  const [logs, setLogs] = useState<TxLogEntry[]>([
    {
      id: 'tx-genesis-1',
      timestamp: new Date().toISOString(),
      timeFormatted: '10:42:11',
      level: 'INFO',
      name: 'NetworkGenesis',
      detail: 'Base Vibenet (Chain ID: 84538453) B20 Precompile Activated',
      kind: 'info',
    },
    {
      id: 'tx-genesis-2',
      timestamp: new Date().toISOString(),
      timeFormatted: '10:42:12',
      level: 'EVENT',
      name: 'createB20',
      detail: 'ASSET · EXM · 0xB20019e07cA8F6A3E147eFbA9D987116e7a18453 (6 Decimals)',
      kind: 'ok',
      hash: '0x3a4b9c8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
      blockNumber: 21458901,
      gasUsed: 21000,
      gasFeeUsd: '<$0.0001',
    },
  ]);

  const handleAddTxLog = (entry: TxLogEntry) => {
    setLogs((prev) => [entry, ...prev]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleFaucetClaim = () => {
    setWallet((prev) => ({
      ...prev,
      balanceEth: prev.balanceEth + 0.5,
    }));
    const txHash = generateTxHash();
    handleAddTxLog({
      id: `faucet-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toTimeString().split(' ')[0],
      level: 'EVENT',
      name: 'BaseFaucetDispense',
      detail: `0.50 Base ETH sent to ${wallet.address}`,
      kind: 'ok',
      hash: txHash,
      gasFeeUsd: '$0.00',
    });
  };

  const handleUpdateGlobalBalances = (
    newBalances: Record<string, number>,
    newMultiplier: number
  ) => {
    setHolders((prev) =>
      prev.map((h) => {
        const raw = newBalances[h.name.split(' ')[0]];
        if (raw !== undefined) {
          return { ...h, rawBalance: raw };
        }
        return h;
      })
    );
    setAsset((prev) => ({
      ...prev,
      multiplier: newMultiplier,
    }));
  };

  const handleSelectSimulatorFlow = (flowId: ScenarioFlow) => {
    setActiveTab('simulator');
    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const userHolder = holders.find(
    (h) => h.address.toLowerCase() === wallet.address.toLowerCase() || h.name.includes('Alice')
  );
  const userTokenBalance = (userHolder ? userHolder.rawBalance : 0) * asset.multiplier;

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-[#f0f2f5] flex flex-col font-sans pb-36">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentNetwork={currentNetwork}
        setCurrentNetwork={setCurrentNetwork}
        wallet={wallet}
        setWallet={setWallet}
        onFaucetClaim={handleFaucetClaim}
        tokenSymbol={asset.symbol}
        userTokenBalance={userTokenBalance}
        asset={asset}
        holders={holders}
        logs={logs}
        onSelectSimulatorFlow={handleSelectSimulatorFlow}
        onOpenConnectWallet={() => setIsWalletModalOpen(true)}
      />

      {/* Persistent Left Vertical Quick Actions Sidebar (Glassmorphism) */}
      <QuickActionsSidebar
        currentNetwork={currentNetwork}
        activeTab={activeTab}
        wallet={wallet}
        asset={asset}
        holders={holders}
        rpcUrl={config.rpcUrls[currentNetwork.id] || currentNetwork.rpcUrl}
        onQuickConnect={() => setIsWalletModalOpen(true)}
        onOpenBridgeStatus={() => setIsBridgeModalOpen(true)}
        onRequestFaucet={handleFaucetClaim}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onOpenShareState={() => setIsShareModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:pl-20 py-6 sm:py-8">
        {/* Surfaced directly in Main View: Global Command Palette Quick Trigger Bar */}
        <div 
          onClick={() => setIsCommandPaletteOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsCommandPaletteOpen(true); }}
          className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#11141d]/90 via-[#141824]/90 to-[#11141d]/90 backdrop-blur-xl border border-[#232938] hover:border-[#0052ff]/50 shadow-xl shadow-black/40 hover:shadow-[#0052ff]/10 transition-all duration-300 cursor-pointer group"
          title="Open Global Command Palette (Ctrl+K)"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-[#0052ff]/15 border border-[#0052ff]/30 text-[#3c8aff] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#0052ff]/25 transition-all shrink-0">
              <Command className="h-4 w-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#3c8aff] transition-colors">
                  Command Palette
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#0052ff]/20 text-[#3c8aff] border border-[#0052ff]/30">
                  Global
                </span>
              </div>
              <p className="text-[11px] text-[#8a91a0] truncate mt-0.5">
                Quickly navigate tabs or run actions: Faucet, Bridge, Share Snapshot, Mini App, Paymaster...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1a1d26] border border-[#2a3040] text-[11px] font-mono text-[#dee1e7] shadow-inner group-hover:border-[#0052ff]/40 transition-colors">
              <span className="font-semibold text-white">Ctrl</span>
              <span className="text-[#717886]">+</span>
              <span className="font-semibold text-white">K</span>
            </div>
            <span className="text-[11px] text-[#717886] font-mono hidden md:inline">or ⌘K</span>
          </div>
        </div>
        {activeTab === 'miniapp' && (
          <BaseMiniAppView
            currentNetwork={currentNetwork}
            asset={asset}
            holders={holders}
            wallet={wallet}
            config={config}
            onAddTxLog={handleAddTxLog}
            onUpdateBalances={handleUpdateGlobalBalances}
            onFaucetClaim={handleFaucetClaim}
            isEmbeddedSimulator={true}
          />
        )}

        {activeTab === 'simulator' && (
          <B20FlowSimulator
            currentNetwork={currentNetwork}
            onAddTxLog={handleAddTxLog}
            onUpdateGlobalAssetBalances={handleUpdateGlobalBalances}
          />
        )}

        {activeTab === 'workshop' && (
          <CustomAssetCreator
            currentNetwork={currentNetwork}
            onAssetCreated={(newAsset) => {
              setAsset(newAsset);
              setActiveTab('captable');
            }}
            onAddTxLog={handleAddTxLog}
          />
        )}

        {activeTab === 'captable' && (
          <CapTableManager
            currentNetwork={currentNetwork}
            asset={asset}
            holders={holders}
            setHolders={setHolders}
            onUpdateAsset={setAsset}
            onAddTxLog={handleAddTxLog}
          />
        )}

        {activeTab === 'contracts' && (
          <SolidityCodeViewer
            currentNetwork={currentNetwork}
            onAddTxLog={handleAddTxLog}
          />
        )}

        {activeTab === 'paymaster' && (
          <BasePaymasterDemo
            currentNetwork={currentNetwork}
            wallet={wallet}
            onAddTxLog={handleAddTxLog}
          />
        )}

        {activeTab === 'guides' && (
          <BaseDocsGuides
            onSelectSimulatorFlow={handleSelectSimulatorFlow}
            currentNetwork={currentNetwork}
          />
        )}

        {activeTab === 'config' && (
          <AppConfigManager
            config={config}
            onSaveConfig={handleSaveConfig}
            currentNetwork={currentNetwork}
            onUpdateNetworkRpc={handleUpdateNetworkRpc}
            asset={asset}
            holders={holders}
            onImportState={handleImportState}
            onAddTxLog={handleAddTxLog}
          />
        )}
      </main>

      {/* Floating Bottom Drawer for Real-time Transaction Logs */}
      <TransactionLogDrawer
        logs={logs}
        onClearLogs={handleClearLogs}
        currentNetwork={currentNetwork}
      />

      {/* Floating Quick Actions Menu / Command Palette (Ctrl+K) */}
      <QuickActionsMenu
        currentNetwork={currentNetwork}
        wallet={wallet}
        onOpenBridgeStatus={() => setIsBridgeModalOpen(true)}
        onRequestFaucet={handleFaucetClaim}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onQuickConnect={() => setIsWalletModalOpen(true)}
        contractAddress={asset.tokenAddress}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpen={() => setIsCommandPaletteOpen(true)}
        onOpenShareState={() => setIsShareModalOpen(true)}
        onChangeNetwork={(net) => setCurrentNetwork(net)}
        asset={asset}
      />

      {/* Share State Canvas Snapshot Modal */}
      <ShareStateModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        asset={asset}
        holders={holders}
        currentNetwork={currentNetwork}
        autoPromptDownload={true}
      />

      {/* Bridge Health & Status Modal */}
      <BridgeStatusModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        currentNetwork={currentNetwork}
        onAddTxLog={handleAddTxLog}
      />

      {/* Wallet Connection Flow Modal (accessible directly via Quick Actions Rail without navigating to Settings) */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        currentNetwork={currentNetwork}
        wallet={wallet}
        setWallet={setWallet}
        onAddTxLog={handleAddTxLog}
      />
    </div>
  );
}
