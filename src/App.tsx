import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { B20FlowSimulator } from './components/B20Studio/B20FlowSimulator';
import { CustomAssetCreator } from './components/B20Studio/CustomAssetCreator';
import { CapTableManager } from './components/B20Studio/CapTableManager';
import { SolidityCodeViewer } from './components/ContractStudio/SolidityCodeViewer';
import { BasePaymasterDemo } from './components/Ecosystem/BasePaymasterDemo';
import { BaseDocsGuides } from './components/DocsViewer/BaseDocsGuides';
import { TransactionLogDrawer } from './components/TransactionLogDrawer';
import { 
  BASE_NETWORKS, 
  INITIAL_ASSET, 
  INITIAL_HOLDERS 
} from './data/mockBaseData';
import { 
  AssetMetadata, 
  BaseNetwork, 
  CapTableHolder, 
  ScenarioFlow, 
  TxLogEntry, 
  WalletAccount 
} from './types/base';
import { generateTxHash, triggerConfetti } from './utils/web3Helper';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('simulator');
  const [currentNetwork, setCurrentNetwork] = useState<BaseNetwork>(
    BASE_NETWORKS['base-vibenet']
  );
  const [asset, setAsset] = useState<AssetMetadata>(INITIAL_ASSET);
  const [holders, setHolders] = useState<CapTableHolder[]>(INITIAL_HOLDERS);

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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
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
          />
        )}
      </main>

      {/* Floating Bottom Drawer for Real-time Transaction Logs */}
      <TransactionLogDrawer
        logs={logs}
        onClearLogs={handleClearLogs}
        currentNetwork={currentNetwork}
      />
    </div>
  );
}
