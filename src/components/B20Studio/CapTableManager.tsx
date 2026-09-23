import React, { useState } from 'react';
import { 
  Users2, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRightLeft, 
  Plus, 
  Percent, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Divide,
  Pause,
  Play
} from 'lucide-react';
import { AssetMetadata, BaseNetwork, CapTableHolder, TxLogEntry } from '../../types/base';
import { formatNumber, generateTxHash, shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface CapTableManagerProps {
  currentNetwork: BaseNetwork;
  asset: AssetMetadata;
  holders: CapTableHolder[];
  setHolders: React.Dispatch<React.SetStateAction<CapTableHolder[]>>;
  onUpdateAsset: (asset: AssetMetadata) => void;
  onAddTxLog: (entry: TxLogEntry) => void;
}

export const CapTableManager: React.FC<CapTableManagerProps> = ({
  currentNetwork,
  asset,
  holders,
  setHolders,
  onUpdateAsset,
  onAddTxLog,
}) => {
  // Transfer tester state
  const [transferFrom, setTransferFrom] = useState(holders[0]?.address || '');
  const [transferTo, setTransferTo] = useState(holders[2]?.address || '');
  const [transferAmount, setTransferAmount] = useState<number>(25);
  const [transferStatus, setTransferStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Corporate Actions
  const [splitRatio, setSplitRatio] = useState<number>(2);
  const [dividendPercent, setDividendPercent] = useState<number>(5);
  const [newHolderName, setNewHolderName] = useState('');
  const [newHolderAddress, setNewHolderAddress] = useState('');
  const [newHolderAmount, setNewHolderAmount] = useState<number>(100);
  const [showAddModal, setShowAddModal] = useState(false);

  // Total supply computation
  const totalRawSupply = holders.reduce((acc, h) => acc + h.rawBalance, 0);
  const totalScaledSupply = totalRawSupply * asset.multiplier;

  const handleToggleAllowlist = (address: string) => {
    setHolders((prev) =>
      prev.map((h) => {
        if (h.address === address) {
          const newStatus = !h.isAllowlisted;
          const txHash = generateTxHash();
          onAddTxLog({
            id: `tx-allowlist-${Date.now()}`,
            timestamp: new Date().toISOString(),
            timeFormatted: new Date().toTimeString().split(' ')[0],
            level: 'EVENT',
            name: 'updateAllowlist',
            detail: `Policy #2: ${h.name} set to ${newStatus ? 'ALLOWED' : 'REVOKED'}`,
            kind: 'ok',
            hash: txHash,
            blockNumber: 21459400,
            gasUsed: 26400,
            gasFeeUsd: '<$0.0002',
            explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
          });
          return { ...h, isAllowlisted: newStatus };
        }
        return h;
      })
    );
  };

  const handleToggleBlock = (address: string) => {
    setHolders((prev) =>
      prev.map((h) => {
        if (h.address === address) {
          const newBlocked = !h.isBlocked;
          const txHash = generateTxHash();
          onAddTxLog({
            id: `tx-block-${Date.now()}`,
            timestamp: new Date().toISOString(),
            timeFormatted: new Date().toTimeString().split(' ')[0],
            level: newBlocked ? 'ERROR' : 'EVENT',
            name: newBlocked ? 'HolderBlocked' : 'HolderUnblocked',
            detail: `${h.name} ${newBlocked ? 'added to sanction blocklist' : 'cleared'}`,
            kind: newBlocked ? 'err' : 'ok',
            hash: txHash,
            blockNumber: 21459405,
            gasUsed: 28100,
            gasFeeUsd: '<$0.0002',
            explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
          });
          return { ...h, isBlocked: newBlocked, isAllowlisted: newBlocked ? false : h.isAllowlisted };
        }
        return h;
      })
    );
  };

  const handleExecuteTransfer = () => {
    setTransferStatus(null);
    const sender = holders.find((h) => h.address === transferFrom);
    const recipient = holders.find((h) => h.address === transferTo);

    if (!sender || !recipient) {
      setTransferStatus({ type: 'error', message: 'Please select valid sender and recipient.' });
      return;
    }

    if (transferFrom === transferTo) {
      setTransferStatus({ type: 'error', message: 'Sender and recipient cannot be identical.' });
      return;
    }

    // 1. Check if transfers are paused
    if (asset.paused || asset.pausedScopes.includes('TRANSFER')) {
      const txHash = generateTxHash();
      onAddTxLog({
        id: `tx-pause-rev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'ERROR',
        name: 'EnforcedPause',
        detail: `Transfer rejected: TRANSFER scope is paused by issuer`,
        kind: 'err',
        hash: txHash,
        explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
      });
      setTransferStatus({
        type: 'error',
        message: 'REVERT: EnforcedPause("TRANSFER"). All secondary transfers are currently halted.',
      });
      return;
    }

    // 2. Check sender allowlist & blocked status
    if (sender.isBlocked || !sender.isAllowlisted) {
      const txHash = generateTxHash();
      onAddTxLog({
        id: `tx-rev-sender-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'ERROR',
        name: 'PolicyForbids',
        detail: `TRANSFER_SENDER rejected: ${sender.name} is not allowlisted or blocked`,
        kind: 'err',
        hash: txHash,
        explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
      });
      setTransferStatus({
        type: 'error',
        message: `REVERT: PolicyForbids("TRANSFER_SENDER", ${shortenAddress(sender.address)}). Sender is not authorized.`,
      });
      return;
    }

    // 3. Check recipient allowlist & blocked status
    if (recipient.isBlocked || !recipient.isAllowlisted) {
      const txHash = generateTxHash();
      onAddTxLog({
        id: `tx-rev-rcpt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'ERROR',
        name: 'PolicyForbids',
        detail: `TRANSFER_RECEIVER rejected: ${recipient.name} is not allowlisted on Policy #${asset.policyId}`,
        kind: 'err',
        hash: txHash,
        explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
      });
      setTransferStatus({
        type: 'error',
        message: `REVERT: PolicyForbids("TRANSFER_RECEIVER", ${shortenAddress(recipient.address)}). Recipient lacks KYC verification.`,
      });
      return;
    }

    // 4. Check balance
    const rawRequired = transferAmount / asset.multiplier;
    if (sender.rawBalance < rawRequired) {
      setTransferStatus({
        type: 'error',
        message: `Insufficient balance. ${sender.name} holds ${formatNumber(sender.rawBalance * asset.multiplier)} ${asset.symbol}.`,
      });
      return;
    }

    // Success! Execute transfer
    setHolders((prev) =>
      prev.map((h) => {
        if (h.address === transferFrom) {
          return { ...h, rawBalance: h.rawBalance - rawRequired };
        }
        if (h.address === transferTo) {
          return { ...h, rawBalance: h.rawBalance + rawRequired };
        }
        return h;
      })
    );

    const txHash = generateTxHash();
    onAddTxLog({
      id: `tx-xfer-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toTimeString().split(' ')[0],
      level: 'EVENT',
      name: 'Transfer',
      detail: `${sender.name} → ${recipient.name} · ${formatNumber(transferAmount)} ${asset.symbol}`,
      kind: 'ok',
      hash: txHash,
      blockNumber: 21459420,
      gasUsed: 31200,
      gasFeeUsd: '<$0.0003',
      explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
    });

    setTransferStatus({
      type: 'success',
      message: `Successfully transferred ${formatNumber(transferAmount)} ${asset.symbol} from ${sender.name} to ${recipient.name}!`,
    });
    triggerConfetti();
  };

  const handleApplyStockSplit = () => {
    const oldMult = asset.multiplier;
    const newMult = oldMult * splitRatio;
    onUpdateAsset({
      ...asset,
      multiplier: newMult,
    });

    const txHash = generateTxHash();
    onAddTxLog({
      id: `tx-split-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toTimeString().split(' ')[0],
      level: 'EVENT',
      name: 'MultiplierUpdated',
      detail: `${oldMult}.0 → ${newMult}.0 WAD (${splitRatio}:1 Forward Split applied)`,
      kind: 'ok',
      hash: txHash,
      gasUsed: 22100,
      gasFeeUsd: '<$0.0002',
      explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
    });
    triggerConfetti();
  };

  const handleApplyDividend = () => {
    const fraction = dividendPercent / 100;
    setHolders((prev) =>
      prev.map((h) => ({
        ...h,
        rawBalance: h.rawBalance + h.rawBalance * fraction,
      }))
    );

    const txHash = generateTxHash();
    onAddTxLog({
      id: `tx-div-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toTimeString().split(' ')[0],
      level: 'EVENT',
      name: 'announceDistribution',
      detail: `${dividendPercent}% Corporate Stock Dividend distributed across all active holders`,
      kind: 'ok',
      hash: txHash,
      gasUsed: 64200,
      gasFeeUsd: '<$0.0008',
      explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
    });
    triggerConfetti();
  };

  const handleToggleGlobalPause = () => {
    const newPaused = !asset.paused;
    onUpdateAsset({
      ...asset,
      paused: newPaused,
      pausedScopes: newPaused ? ['TRANSFER'] : [],
    });

    const txHash = generateTxHash();
    onAddTxLog({
      id: `tx-pause-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toTimeString().split(' ')[0],
      level: newPaused ? 'ERROR' : 'EVENT',
      name: newPaused ? 'Paused("TRANSFER")' : 'Unpaused("TRANSFER")',
      detail: `Emergency pause scope ${newPaused ? 'ACTIVATED' : 'DEACTIVATED'} by Pause Admin`,
      kind: newPaused ? 'err' : 'ok',
      hash: txHash,
      gasUsed: 23400,
      gasFeeUsd: '<$0.0002',
      explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
    });
  };

  const handleAddShareholder = () => {
    if (!newHolderName || !newHolderAddress) return;
    const colors = ['#66c800', '#ffd12f', '#fc401f', '#3c8aff', '#b6f569'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newH: CapTableHolder = {
      name: newHolderName,
      address: newHolderAddress,
      rawBalance: newHolderAmount / asset.multiplier,
      isAllowlisted: true,
      isBlocked: false,
      color: randomColor,
      category: 'Investor',
    };

    setHolders((prev) => [...prev, newH]);
    setShowAddModal(false);
    setNewHolderName('');
    setNewHolderAddress('');
    triggerConfetti();
  };

  return (
    <div className="space-y-6">
      {/* Cap Table Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl">
          <div className="text-xs font-mono font-bold uppercase text-[#717886]">Total Outstanding</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatNumber(totalScaledSupply)} {asset.symbol}
          </div>
          <div className="text-[11px] text-[#8a91a0] mt-0.5">
            Raw units: {formatNumber(totalRawSupply)}
          </div>
        </div>

        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl">
          <div className="text-xs font-mono font-bold uppercase text-[#717886]">Dynamic Multiplier</div>
          <div className="text-2xl font-bold font-mono text-[#66c800] mt-1">
            {asset.multiplier.toFixed(1)} WAD
          </div>
          <div className="text-[11px] text-[#8a91a0] mt-0.5">
            {asset.multiplier === 1 ? 'Standard 1:1 Par' : 'Active Stock Split Ratio'}
          </div>
        </div>

        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl">
          <div className="text-xs font-mono font-bold uppercase text-[#717886]">Compliance Policy</div>
          <div className="text-2xl font-bold font-mono text-[#3c8aff] mt-1">
            Rule #{asset.policyId}
          </div>
          <div className="text-[11px] text-[#8a91a0] mt-0.5">
            Allowlist Gating Active
          </div>
        </div>

        <div className="rounded-2xl border border-[#232730] bg-[#111317] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-bold uppercase text-[#717886]">Circuit Breaker</div>
            <div className={`text-base font-bold mt-1 flex items-center gap-1.5 ${
              asset.paused ? 'text-[#fc401f]' : 'text-[#66c800]'
            }`}>
              <span className={`h-2.5 w-2.5 rounded-full ${asset.paused ? 'bg-[#fc401f] animate-ping' : 'bg-[#66c800]'}`}></span>
              <span>{asset.paused ? 'Transfers PAUSED' : 'Transfers ACTIVE'}</span>
            </div>
          </div>
          <button
            onClick={handleToggleGlobalPause}
            className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
              asset.paused
                ? 'bg-[#66c800]/20 text-[#66c800] hover:bg-[#66c800]/30'
                : 'bg-[#fc401f]/20 text-[#fc401f] hover:bg-[#fc401f]/30'
            }`}
          >
            {asset.paused ? 'Unpause Transfers' : 'Trigger Pause'}
          </button>
        </div>
      </div>

      {/* Main Cap Table & Allowlist Registry */}
      <div className="rounded-2xl border border-[#232730] bg-[#111317] shadow-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between border-b border-[#232730] bg-[#16181e] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users2 className="h-5 w-5 text-[#0052ff]" />
              <span>Capitalization Table & Shareholder Registry</span>
            </h3>
            <p className="text-xs text-[#8a91a0]">
              Real-time shareholder ownership and B20 Allowlist Policy permissions on Base.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white text-xs font-semibold shadow-md shadow-[#0052ff]/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Shareholder</span>
            </button>
          </div>
        </div>

        {/* Share Distribution Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="text-[11px] font-mono text-[#717886] mb-1.5 flex justify-between">
            <span>Ownership Allocation</span>
            <span>100% Allocated</span>
          </div>
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-[#1f222b]">
            {holders.map((h, i) => {
              const pct = totalScaledSupply > 0 ? ((h.rawBalance * asset.multiplier) / totalScaledSupply) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={i}
                  style={{ width: `${pct}%`, backgroundColor: h.color }}
                  title={`${h.name}: ${pct.toFixed(1)}%`}
                  className="h-full transition-all duration-300"
                />
              );
            })}
          </div>
        </div>

        {/* Shareholder Table */}
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#232730] text-[#717886] font-mono text-[11px] uppercase">
                <th className="pb-3 pl-3">Holder / Entity</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Shares ({asset.symbol})</th>
                <th className="pb-3 text-right">% Ownership</th>
                <th className="pb-3 text-center">Policy Allowlist</th>
                <th className="pb-3 text-center">Sanctions / Block</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1f26]">
              {holders.map((holder, idx) => {
                const scaledBal = holder.rawBalance * asset.multiplier;
                const ownershipPct = totalScaledSupply > 0 ? (scaledBal / totalScaledSupply) * 100 : 0;

                return (
                  <tr key={idx} className="hover:bg-[#16181e] transition-colors">
                    <td className="py-3.5 pl-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: holder.color }}
                        ></span>
                        <div>
                          <div className="font-semibold text-white">{holder.name}</div>
                          <div className="font-mono text-[11px] text-[#717886]">
                            {shortenAddress(holder.address, 5)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span className="rounded-md bg-[#1e222c] px-2 py-0.5 text-[10.5px] text-[#b1b7c3] font-medium border border-[#2b303c]">
                        {holder.category}
                      </span>
                    </td>

                    <td className="py-3.5 text-right font-mono">
                      <div className="font-bold text-white">{formatNumber(scaledBal)}</div>
                      {asset.multiplier !== 1 && (
                        <div className="text-[10px] text-[#717886]">Raw: {formatNumber(holder.rawBalance)}</div>
                      )}
                    </td>

                    <td className="py-3.5 text-right font-mono font-semibold text-[#3c8aff]">
                      {ownershipPct.toFixed(1)}%
                    </td>

                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleToggleAllowlist(holder.address)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-colors ${
                          holder.isAllowlisted
                            ? 'bg-[#66c800]/15 text-[#66c800] hover:bg-[#66c800]/25'
                            : 'bg-[#fc401f]/15 text-[#fc401f] hover:bg-[#fc401f]/25'
                        }`}
                      >
                        {holder.isAllowlisted ? (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            <span>Approved</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3 w-3" />
                            <span>Denied</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleToggleBlock(holder.address)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold uppercase transition-colors ${
                          holder.isBlocked
                            ? 'bg-[#fc401f] text-white'
                            : 'bg-[#1c1f26] text-[#717886] hover:text-[#dee1e7]'
                        }`}
                      >
                        {holder.isBlocked ? 'Blocked' : 'Clear'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Utility: Interactive Transfer Tester & Corporate Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Transfer Simulator with Policy Check */}
        <div className="lg:col-span-6 rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#232730] pb-3">
            <ArrowRightLeft className="h-4 w-4 text-[#0052ff]" />
            <h3 className="font-bold text-white text-base">Policy Transfer Tester</h3>
          </div>
          <p className="text-xs text-[#8a91a0]">
            Simulate secondary peer-to-peer transfers with live Base B20 precompile policy gating. (e.g. Try transferring to unapproved Carol).
          </p>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                From (Sender)
              </label>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs text-white focus:border-[#0052ff] focus:outline-none"
              >
                {holders.map((h) => (
                  <option key={h.address} value={h.address}>
                    {h.name} — {formatNumber(h.rawBalance * asset.multiplier)} {asset.symbol} ({h.isAllowlisted ? 'Approved' : 'Unapproved'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                To (Recipient)
              </label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs text-white focus:border-[#0052ff] focus:outline-none"
              >
                {holders.map((h) => (
                  <option key={h.address} value={h.address}>
                    {h.name} ({h.isAllowlisted ? 'Approved on Policy #2' : 'NOT Allowlisted'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                Amount ({asset.symbol})
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
                className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
              />
            </div>

            {transferStatus && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  transferStatus.type === 'success'
                    ? 'border-[#66c800]/40 bg-[#66c800]/10 text-[#66c800]'
                    : 'border-[#fc401f]/40 bg-[#fc401f]/10 text-[#fc401f]'
                }`}
              >
                {transferStatus.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                )}
                <div className="font-mono">{transferStatus.message}</div>
              </div>
            )}

            <button
              onClick={handleExecuteTransfer}
              className="w-full py-3 px-4 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white font-bold text-xs shadow-lg shadow-[#0052ff]/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Test & Execute Transfer on Base</span>
            </button>
          </div>
        </div>

        {/* Right: Corporate Actions (Stock Splits & Dividends) */}
        <div className="lg:col-span-6 rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-[#232730] pb-3">
            <Sliders className="h-4 w-4 text-[#66c800]" />
            <h3 className="font-bold text-white text-base">Onchain Corporate Actions</h3>
          </div>

          {/* Action 1: Stock Split Multiplier */}
          <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-white">Execute Stock Split (WAD Multiplier)</div>
                <p className="text-[11px] text-[#8a91a0]">
                  Scales all balances via WAD multiplier without gas-heavy holder migrations.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-[#66c800] bg-[#66c800]/10 px-2 py-0.5 rounded">
                {splitRatio}:1 Split
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSplitRatio(2)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  splitRatio === 2
                    ? 'border-[#0052ff] bg-[#0052ff]/20 text-[#3c8aff]'
                    : 'border-[#232730] bg-[#14161c] text-[#8a91a0]'
                }`}
              >
                2-for-1
              </button>
              <button
                onClick={() => setSplitRatio(3)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  splitRatio === 3
                    ? 'border-[#0052ff] bg-[#0052ff]/20 text-[#3c8aff]'
                    : 'border-[#232730] bg-[#14161c] text-[#8a91a0]'
                }`}
              >
                3-for-1
              </button>
              <button
                onClick={() => setSplitRatio(5)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  splitRatio === 5
                    ? 'border-[#0052ff] bg-[#0052ff]/20 text-[#3c8aff]'
                    : 'border-[#232730] bg-[#14161c] text-[#8a91a0]'
                }`}
              >
                5-for-1
              </button>
            </div>

            <button
              onClick={handleApplyStockSplit}
              className="w-full py-2 px-3 rounded-lg bg-[#1a1d24] hover:bg-[#222733] border border-[#2b303c] text-xs font-bold text-white transition-colors"
            >
              Apply {splitRatio}x Split Onchain
            </button>
          </div>

          {/* Action 2: Stock Dividend */}
          <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-white">Issue Stock Dividend</div>
                <p className="text-[11px] text-[#8a91a0]">
                  Announces an onchain corporate action and batch mints pro-rata bonus shares.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-[#3c8aff] bg-[#3c8aff]/10 px-2 py-0.5 rounded">
                {dividendPercent}% Dividend
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[3, 5, 10].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDividendPercent(pct)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    dividendPercent === pct
                      ? 'border-[#3c8aff] bg-[#3c8aff]/20 text-white'
                      : 'border-[#232730] bg-[#14161c] text-[#8a91a0]'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>

            <button
              onClick={handleApplyDividend}
              className="w-full py-2 px-3 rounded-lg bg-[#1a1d24] hover:bg-[#222733] border border-[#2b303c] text-xs font-bold text-white transition-colors"
            >
              Announce & Distribute {dividendPercent}% Dividend
            </button>
          </div>
        </div>
      </div>

      {/* Add Shareholder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2b303c] bg-[#14161c] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232730]">
              <h3 className="font-semibold text-base text-white">Add New Shareholder</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#717886] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#dee1e7] font-semibold mb-1">
                  Shareholder / Institution Name
                </label>
                <input
                  type="text"
                  value={newHolderName}
                  onChange={(e) => setNewHolderName(e.target.value)}
                  placeholder="e.g. Coinbase Ventures"
                  className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs text-white focus:border-[#0052ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#dee1e7] font-semibold mb-1">
                  Ethereum / Base Address
                </label>
                <input
                  type="text"
                  value={newHolderAddress}
                  onChange={(e) => setNewHolderAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#dee1e7] font-semibold mb-1">
                  Initial Share Allocation ({asset.symbol})
                </label>
                <input
                  type="number"
                  value={newHolderAmount}
                  onChange={(e) => setNewHolderAmount(Number(e.target.value))}
                  className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#232730] flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#1e222c] hover:bg-[#252a36] text-xs font-semibold text-[#dee1e7]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddShareholder}
                className="flex-1 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-[#0052ff]/20"
              >
                Add to Cap Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
