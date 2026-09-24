import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Send, 
  PlusCircle, 
  GitBranch, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Smartphone, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  QrCode, 
  RefreshCw,
  Share2,
  Lock,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { 
  AssetMetadata, 
  BaseNetwork, 
  CapTableHolder, 
  TxLogEntry, 
  WalletAccount,
  AppConfig 
} from '../../types/base';
import { generateTxHash, triggerConfetti, formatNumber, shortenAddress } from '../../utils/web3Helper';
import { notifyMiniAppReady, detectMiniAppContext } from '../../utils/miniAppHelper';
import { RwaPriceVolumeChart } from './RwaPriceVolumeChart';
import { GasPriceEstimator, GasTierId } from './GasPriceEstimator';

interface BaseMiniAppViewProps {
  currentNetwork: BaseNetwork;
  asset: AssetMetadata;
  holders: CapTableHolder[];
  wallet: WalletAccount;
  config: AppConfig;
  onAddTxLog: (entry: TxLogEntry) => void;
  onUpdateBalances: (newBalances: Record<string, number>, newMultiplier: number) => void;
  onFaucetClaim: () => void;
  isEmbeddedSimulator?: boolean;
}

export const BaseMiniAppView: React.FC<BaseMiniAppViewProps> = ({
  currentNetwork,
  asset,
  holders,
  wallet,
  config,
  onAddTxLog,
  onUpdateBalances,
  onFaucetClaim,
  isEmbeddedSimulator = false,
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'send' | 'compliance' | 'activity'>('portfolio');
  const [recipient, setRecipient] = useState<string>('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'); // Bob
  const [transferAmount, setTransferAmount] = useState<number>(25);
  const [selectedGasTier, setSelectedGasTier] = useState<GasTierId>('standard');
  const [isSending, setIsSending] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [checkAddress, setCheckAddress] = useState('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  const [deviceModel, setDeviceModel] = useState<'iphone' | 'compact' | 'borderless'>('iphone');

  useEffect(() => {
    notifyMiniAppReady();
  }, []);

  const userHolder = holders.find(
    (h) => h.address.toLowerCase() === wallet.address.toLowerCase() || h.name.includes('Alice')
  );
  const rawBal = userHolder ? userHolder.rawBalance : 500;
  const userBalance = rawBal * asset.multiplier;
  const estimatedValuationUsd = userBalance * 100; // $100 nominal per share

  const handleGaslessSend = () => {
    if (transferAmount <= 0) return;
    setIsSending(true);
    setTransferSuccess(null);

    const userOpHash = generateTxHash();
    const txHash = generateTxHash();

    setTimeout(() => {
      setIsSending(false);
      setTransferSuccess(`Sent ${transferAmount} ${asset.symbol} via Base Paymaster!`);
      triggerConfetti();

      // Deduct sender balance and add to recipient in simulator
      const recipientHolder = holders.find(
        (h) => h.address.toLowerCase() === recipient.toLowerCase() || h.name.includes('Bob')
      );
      const recipientName = recipientHolder ? recipientHolder.name.split(' ')[0] : 'Bob';
      const senderName = userHolder ? userHolder.name.split(' ')[0] : 'Alice';

      const updatedBalances: Record<string, number> = {
        [senderName]: Math.max(0, rawBal - transferAmount),
        [recipientName]: (recipientHolder ? recipientHolder.rawBalance : 300) + transferAmount,
      };
      onUpdateBalances(updatedBalances, asset.multiplier);

      onAddTxLog({
        id: `tx-miniapp-send-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'EVENT',
        name: 'transfer (Gasless)',
        detail: `MiniApp: Transferred ${transferAmount} ${asset.symbol} to ${shortenAddress(recipient)}. Gas fee (${selectedGasTier} tier) covered by Base Paymaster.`,
        kind: 'ok',
        hash: txHash,
        gasUsed: 38500,
        gasFeeUsd: '$0.00 (Sponsored)',
        explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
      });
    }, 1200);
  };

  const handleQuickMint = () => {
    const senderName = userHolder ? userHolder.name.split(' ')[0] : 'Alice';
    const mintAmount = 50;
    const txHash = generateTxHash();

    onUpdateBalances(
      { [senderName]: rawBal + mintAmount },
      asset.multiplier
    );
    triggerConfetti();

    onAddTxLog({
      id: `tx-miniapp-mint-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toTimeString().split(' ')[0],
      level: 'EVENT',
      name: 'batchMint',
      detail: `MiniApp: Minted +${mintAmount} ${asset.symbol} to ${wallet.address}`,
      kind: 'ok',
      hash: txHash,
      gasFeeUsd: '<$0.0001',
      explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
    });
  };

  const handleCopyMiniAppUrl = () => {
    const miniappUrl = `${window.location.origin}${window.location.pathname}?miniapp=true`;
    navigator.clipboard.writeText(miniappUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Mini App Interior Body Content
  const renderMiniAppContent = () => (
    <div className="flex flex-col h-full bg-[#090a0d] text-white select-none overflow-y-auto">
      {/* Mini App Top Header */}
      <div className="sticky top-0 z-20 bg-[#0e1015]/90 backdrop-blur-md px-4 py-3 border-b border-[#1f232b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#0052ff] flex items-center justify-center text-white font-bold text-xs shadow-md shadow-[#0052ff]/40">
            B20
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-xs text-white">{asset.name}</span>
              <span className="text-[10px] bg-[#0052ff]/20 text-[#3c8aff] font-mono px-1 rounded">
                {asset.symbol}
              </span>
            </div>
            <span className="text-[10px] text-[#66c800] flex items-center gap-1 mt-0.5 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#66c800] animate-pulse"></span>
              Base L2 ({currentNetwork.name})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dynamic Live Gas Estimator Badge */}
          <GasPriceEstimator
            currentNetwork={currentNetwork}
            compact={true}
            selectedTier={selectedGasTier}
            onSelectTier={(tier) => {
              setSelectedGasTier(tier);
              setActiveTab('send');
            }}
          />

          <button
            onClick={handleCopyMiniAppUrl}
            title="Share / Copy Mini App Link"
            className="p-1.5 rounded-lg bg-[#191c24] hover:bg-[#222733] text-[#8a91a0] hover:text-white transition-colors"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
          <div className="px-2 py-1 rounded-lg bg-[#14161d] border border-[#232730] flex items-center gap-1.5 text-[10px] font-mono text-[#dee1e7]">
            <Fingerprint className="h-3.5 w-3.5 text-[#0052ff]" />
            <span>{shortenAddress(wallet.address, 3)}</span>
          </div>
        </div>
      </div>

      {/* Main Mini App Scrollable Body */}
      <div className="flex-1 p-4 space-y-4">
        {/* Sub-tab Pills inside Mini App */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#12141a] border border-[#1f232b] text-[11px] font-medium text-[#8a91a0]">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'portfolio' ? 'bg-[#0052ff] text-white font-bold shadow' : 'hover:text-white'
            }`}
          >
            Holding
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'send' ? 'bg-[#0052ff] text-white font-bold shadow' : 'hover:text-white'
            }`}
          >
            Send
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'compliance' ? 'bg-[#0052ff] text-white font-bold shadow' : 'hover:text-white'
            }`}
          >
            Check
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'activity' ? 'bg-[#0052ff] text-white font-bold shadow' : 'hover:text-white'
            }`}
          >
            Actions
          </button>
        </div>

        {/* TAB 1: PORTFOLIO */}
        {activeTab === 'portfolio' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Primary Balance Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121520] via-[#0f121a] to-[#121520] border border-[#262c3a] shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#0052ff]/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between text-[#8a91a0] text-xs">
                <span className="font-medium">Total Tokenized Holdings</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#66c800]/15 text-[#66c800] font-bold">
                  {asset.multiplier.toFixed(2)}x WAD Split
                </span>
              </div>

              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    {formatNumber(userBalance)}
                  </span>
                  <span className="text-sm font-bold text-[#3c8aff] font-mono">
                    {asset.symbol}
                  </span>
                </div>
                <div className="text-xs text-[#8a91a0] mt-0.5">
                  ≈ ${formatNumber(estimatedValuationUsd)} USD · 6 Decimals
                </div>
              </div>

              {/* Compliance & Paymaster Pills */}
              <div className="mt-4 pt-3 border-t border-[#1f2430] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-[#66c800] font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Allowlist Verified</span>
                </div>
                <div className="flex items-center gap-1 text-[#ffd12f] font-mono">
                  <Zap className="h-3.5 w-3.5 fill-[#ffd12f]" />
                  <span>Gasless Paymaster</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('send')}
                className="p-3 rounded-xl bg-[#0052ff] hover:bg-[#0048e0] text-white flex items-center justify-center gap-2 text-xs font-bold shadow-md shadow-[#0052ff]/20 transition-transform active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Gasless Send</span>
              </button>

              <button
                onClick={handleQuickMint}
                className="p-3 rounded-xl bg-[#171a22] hover:bg-[#202532] border border-[#282d3b] text-white flex items-center justify-center gap-2 text-xs font-bold transition-transform active:scale-95"
              >
                <PlusCircle className="h-3.5 w-3.5 text-[#66c800]" />
                <span>Mint +50 {asset.symbol}</span>
              </button>
            </div>

            {/* Recharts Area Chart: Historical Token Price & Daily Volume Trends */}
            <RwaPriceVolumeChart asset={asset} userBalance={userBalance} />

            {/* Asset Metadata Sheet */}
            <div className="p-3 rounded-xl bg-[#111319] border border-[#1f232b] space-y-2 text-xs">
              <div className="text-[11px] font-bold text-[#717886] uppercase font-mono">
                Asset Specification
              </div>
              <div className="flex justify-between items-center text-[#dee1e7]">
                <span className="text-[#8a91a0]">Legal Asset Identifier:</span>
                <span className="font-mono text-[11px] text-white">{asset.assetId}</span>
              </div>
              <div className="flex justify-between items-center text-[#dee1e7]">
                <span className="text-[#8a91a0]">Token Address:</span>
                <span className="font-mono text-[11px] text-[#3c8aff]">
                  {shortenAddress(asset.tokenAddress, 4)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#dee1e7]">
                <span className="text-[#8a91a0]">Issuance Cap:</span>
                <span className="font-mono text-[11px]">
                  {formatNumber(asset.supplyCap)} {asset.symbol}
                </span>
              </div>
            </div>

            {/* Faucet Dispense */}
            <div className="p-3 rounded-xl bg-[#111319] border border-[#1f232b] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Need Testnet ETH?</div>
                <div className="text-[10px] text-[#8a91a0]">Base Sepolia & Vibenet Faucet</div>
              </div>
              <button
                onClick={onFaucetClaim}
                className="px-2.5 py-1.5 rounded-lg bg-[#1a1e28] hover:bg-[#242a38] text-xs font-bold text-[#66c800] border border-[#2b3345] transition-colors flex items-center gap-1"
              >
                <Coins className="h-3.5 w-3.5" />
                <span>Dispense</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: GASLESS SEND */}
        {activeTab === 'send' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="text-xs text-[#8a91a0]">
              Send units instantly. Gas fees are sponsored by the Base Paymaster and signed via TouchID/FaceID passkeys.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#b1b7c3] mb-1">
                  Recipient
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setRecipient('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-mono border text-left truncate transition-colors ${
                      recipient === '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
                        ? 'border-[#0052ff] bg-[#0052ff]/10 text-white'
                        : 'border-[#232730] bg-[#12141a] text-[#8a91a0]'
                    }`}
                  >
                    Bob (Approved)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipient('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-mono border text-left truncate transition-colors ${
                      recipient === '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
                        ? 'border-[#0052ff] bg-[#0052ff]/10 text-white'
                        : 'border-[#232730] bg-[#12141a] text-[#8a91a0]'
                    }`}
                  >
                    Carol (Protocol)
                  </button>
                </div>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x recipient address"
                  className="w-full rounded-xl bg-[#12141a] border border-[#232730] p-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-[#b1b7c3]">
                    Amount ({asset.symbol})
                  </label>
                  <span className="text-[10px] text-[#8a91a0] font-mono">
                    Max: {formatNumber(userBalance)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#12141a] border border-[#232730] p-2.5 text-sm font-mono text-white focus:border-[#0052ff] focus:outline-none pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setTransferAmount(Math.min(userBalance, 100))}
                    className="absolute right-2 top-2 px-2 py-0.5 rounded bg-[#1e232f] text-[10px] font-mono text-[#3c8aff] font-bold"
                  >
                    100 Max
                  </button>
                </div>
              </div>

              {/* Dynamic Gas Price Estimator & Congestion Suggestion */}
              <GasPriceEstimator
                currentNetwork={currentNetwork}
                selectedTier={selectedGasTier}
                onSelectTier={(tier) => setSelectedGasTier(tier)}
              />

              {/* Paymaster Sponsorship Card */}
              <div className="p-3 rounded-xl bg-[#66c800]/10 border border-[#66c800]/25 text-xs text-[#dee1e7] space-y-1">
                <div className="flex items-center justify-between text-[#66c800] font-bold">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Base Paymaster Sponsored ({selectedGasTier.toUpperCase()})</span>
                  </div>
                  <span className="font-mono">$0.00 Gas</span>
                </div>
                <p className="text-[10px] text-[#8a91a0]">
                  UserOp signature generated via Passkey. The Base Paymaster fully covers your selected {selectedGasTier} tier transaction fee. Zero ETH deducted from your account.
                </p>
              </div>

              {transferSuccess && (
                <div className="p-3 rounded-xl bg-[#0052ff]/15 border border-[#0052ff]/30 text-xs text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#3c8aff] flex-shrink-0" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGaslessSend}
                disabled={isSending || transferAmount <= 0}
                className="w-full py-3 rounded-xl bg-[#0052ff] hover:bg-[#0048e0] text-white font-bold text-xs shadow-lg shadow-[#0052ff]/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Signing with Passkey...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Sign Gasless Transfer (0.00 ETH)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLIANCE CHECKER */}
        {activeTab === 'compliance' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="text-xs text-[#8a91a0]">
              Verify whether an address is authorized under Policy #{asset.policyId} before attempting transfers.
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#b1b7c3] mb-1">
                Check Address
              </label>
              <input
                type="text"
                value={checkAddress}
                onChange={(e) => setCheckAddress(e.target.value)}
                className="w-full rounded-xl bg-[#12141a] border border-[#232730] p-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
              />
            </div>

            {/* Simulation Result */}
            {(() => {
              const targetHolder = holders.find(
                (h) => h.address.toLowerCase() === checkAddress.toLowerCase()
              );
              const isAllowed = targetHolder ? targetHolder.isAllowlisted && !targetHolder.isBlocked : true;
              const isSanctioned = targetHolder ? targetHolder.isBlocked : false;

              return (
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isSanctioned
                    ? 'bg-[#fc401f]/10 border-[#fc401f]/30 text-[#fc401f]'
                    : isAllowed
                    ? 'bg-[#66c800]/10 border-[#66c800]/30 text-[#66c800]'
                    : 'bg-[#ffd12f]/10 border-[#ffd12f]/30 text-[#ffd12f]'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {isSanctioned ? (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <span>TRANSFER BLOCKED (Sanctioned Account)</span>
                      </>
                    ) : isAllowed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>ELIGIBLE (Scope: TRANSFER_RECEIVER Allowed)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <span>UNVERIFIED (Requires Allowlist Approval)</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-[#dee1e7]">
                    {isSanctioned
                      ? 'Address is blocked by compliance policy. Calling transfer will revert with PolicyForbids(scope, account).'
                      : isAllowed
                      ? 'Address has verified KYC/AML credentials. Tokens may be received without disruption.'
                      : 'Address is missing the required policy scope authorization.'}
                  </p>
                </div>
              );
            })()}

            <div className="p-3 rounded-xl bg-[#111319] border border-[#1f232b] text-xs space-y-1.5 text-[#8a91a0]">
              <div className="font-bold text-white text-[11px]">Enforced Compliance Rules:</div>
              <div className="flex items-center gap-1 text-[11px]">
                <Check className="h-3 w-3 text-[#66c800]" />
                <span>Scope 1: MINT_RECEIVER (Allowlist required)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <Check className="h-3 w-3 text-[#66c800]" />
                <span>Scope 2: TRANSFER_RECEIVER (Allowlist required)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <Check className="h-3 w-3 text-[#66c800]" />
                <span>Scope 3: TRANSFER_SENDER (Anti-Sanctions)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIONS / SPLITS */}
        {activeTab === 'activity' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="text-xs text-[#8a91a0]">
              MiniApp corporate actions and onchain multipliers for {asset.name}.
            </div>

            {/* Split Action */}
            <div className="p-3.5 rounded-xl bg-[#111319] border border-[#1f232b] space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-[#3c8aff]" />
                  <span>Execute 2-for-1 Stock Split</span>
                </div>
                <span className="text-[10px] font-mono text-[#66c800] bg-[#66c800]/10 px-1.5 py-0.5 rounded">
                  Current: {asset.multiplier.toFixed(2)}x
                </span>
              </div>
              <p className="text-[11px] text-[#8a91a0]">
                Updates the WAD multiplier from {asset.multiplier.toFixed(1)}x to {(asset.multiplier * 2).toFixed(1)}x across all holders in one single, constant-gas tx.
              </p>
              <button
                onClick={() => {
                  const newMult = asset.multiplier * 2;
                  onUpdateBalances({}, newMult);
                  triggerConfetti();
                  onAddTxLog({
                    id: `tx-split-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    timeFormatted: new Date().toTimeString().split(' ')[0],
                    level: 'EVENT',
                    name: 'updateMultiplier',
                    detail: `MiniApp: Multiplier updated to ${newMult.toFixed(2)} WAD`,
                    kind: 'ok',
                    gasFeeUsd: '$0.0003',
                  });
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#1c212c] hover:bg-[#252c3b] border border-[#2e374a] text-xs font-bold text-[#3c8aff] transition-colors"
              >
                Trigger 2-for-1 Split
              </button>
            </div>

            {/* Explorer link */}
            <a
              href={`${currentNetwork.explorerUrl}/address/${asset.tokenAddress}`}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-xl bg-[#111319] border border-[#1f232b] flex items-center justify-between text-xs text-[#dee1e7] hover:border-[#0052ff] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-[#3c8aff]" />
                <span>View Asset on Basescan</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#717886]" />
            </a>
          </div>
        )}
      </div>

      {/* Mini App Bottom Status Bar */}
      <div className="bg-[#0b0d12] border-t border-[#1a1d24] px-4 py-2 flex items-center justify-between text-[10px] font-mono text-[#717886]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#66c800]"></span>
          <span>Farcaster MiniApp / Base Frame v2</span>
        </div>
        <span>Gas: 0.001 Gwei</span>
      </div>
    </div>
  );

  // If already running directly inside a mobile viewport or iframe miniapp, render directly
  if (!isEmbeddedSimulator) {
    return (
      <div className="w-full max-w-md mx-auto min-h-[680px] rounded-2xl border border-[#232730] shadow-2xl overflow-hidden">
        {renderMiniAppContent()}
      </div>
    );
  }

  // Interactive Simulator Device Frame Preview (with iPhone/Pixel shell, notch, status bar)
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Device Toolbar Controls */}
      <div className="rounded-2xl border border-[#232730] bg-[#111317] p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-[#0052ff]" />
          <div>
            <h3 className="font-bold text-white text-sm">Farcaster & Base Mini App Simulator</h3>
            <p className="text-[11px] text-[#8a91a0]">
              Test how your B20 Asset runs inside mobile Warpcast frames and Base Smart Wallet webviews.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-[#0e1014] border border-[#232730] text-xs font-mono">
            <button
              onClick={() => setDeviceModel('iphone')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                deviceModel === 'iphone' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              iPhone Frame
            </button>
            <button
              onClick={() => setDeviceModel('compact')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                deviceModel === 'compact' ? 'bg-[#0052ff] text-white font-bold' : 'text-[#8a91a0] hover:text-white'
              }`}
            >
              Compact
            </button>
          </div>

          <button
            onClick={handleCopyMiniAppUrl}
            className="px-3 py-1.5 rounded-xl bg-[#191c24] hover:bg-[#202530] text-white text-xs font-medium border border-[#2b303c] transition-colors flex items-center gap-1.5"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#66c800]" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-[#3c8aff]" />
                <span>Share Mini App</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Centered Device Mockup */}
      <div className="flex justify-center items-center py-4">
        {deviceModel === 'iphone' ? (
          /* Realistic iPhone 15 Pro Frame */
          <div className="relative w-[380px] h-[780px] bg-[#1a1b22] rounded-[52px] p-3 shadow-2xl border-4 border-[#2d313d] ring-1 ring-white/10 flex flex-col">
            {/* Dynamic Island / Speaker */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30 flex items-center justify-between px-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#111] ring-1 ring-white/20"></div>
              <div className="h-2 w-2 rounded-full bg-[#0052ff] animate-pulse"></div>
            </div>

            {/* Inner Phone Screen */}
            <div className="w-full h-full rounded-[42px] overflow-hidden flex flex-col bg-[#090a0d] border border-[#16181f] pt-8">
              {renderMiniAppContent()}
            </div>

            {/* Home Indicator Bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full"></div>
          </div>
        ) : (
          /* Clean Borderless Mini App Card */
          <div className="w-[390px] h-[700px] rounded-3xl border border-[#232730] shadow-2xl overflow-hidden bg-[#090a0d]">
            {renderMiniAppContent()}
          </div>
        )}
      </div>
    </div>
  );
};
