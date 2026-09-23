import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ExternalLink, 
  Copy, 
  Sliders, 
  Building2,
  Sparkles,
  ShieldAlert,
  PieChart,
  Percent,
  PauseCircle,
  Clock
} from 'lucide-react';
import { B20_SCENARIO_FLOWS } from '../../data/mockBaseData';
import { ScenarioFlow, FlowConfig, TxLogEntry, BaseNetwork } from '../../types/base';
import { formatNumber, generateTxHash, triggerConfetti } from '../../utils/web3Helper';

interface FlowSimulatorProps {
  currentNetwork: BaseNetwork;
  onAddTxLog: (entry: TxLogEntry) => void;
  onUpdateGlobalAssetBalances?: (balances: Record<string, number>, multiplier: number) => void;
}

export const B20FlowSimulator: React.FC<FlowSimulatorProps> = ({
  currentNetwork,
  onAddTxLog,
  onUpdateGlobalAssetBalances,
}) => {
  const [selectedFlowId, setSelectedFlowId] = useState<ScenarioFlow>('create');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Simulation state
  const [simBalances, setSimBalances] = useState<Record<string, number>>({
    Alice: 0,
    Bob: 0,
    Carol: 0,
  });
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [blockedHolder, setBlockedHolder] = useState<string | null>(null);
  const [pausedScope, setPausedScope] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const activeFlow: FlowConfig = 
    B20_SCENARIO_FLOWS.find((f) => f.id === selectedFlowId) || B20_SCENARIO_FLOWS[0];

  const isDone = stepIndex >= activeFlow.steps.length;
  const currentStep = isDone ? activeFlow.steps[activeFlow.steps.length - 1] : activeFlow.steps[stepIndex];

  const resetFlow = (newFlowId?: ScenarioFlow) => {
    const targetFlow = newFlowId || selectedFlowId;
    if (newFlowId) {
      setSelectedFlowId(newFlowId);
    }
    setStepIndex(0);
    setCompletedSteps([]);
    setActionError(null);
    setIsBusy(false);

    // Initial state based on flow
    if (targetFlow === 'create') {
      setSimBalances({ Alice: 0, Bob: 0, Carol: 0 });
      setMultiplier(1.0);
      setBlockedHolder(null);
      setPausedScope(null);
    } else if (targetFlow === 'issue') {
      setSimBalances({ Alice: 0, Bob: 0, Carol: 0 });
      setMultiplier(1.0);
      setBlockedHolder(null);
      setPausedScope(null);
    } else if (targetFlow === 'restrict') {
      setSimBalances({ Alice: 0, Bob: 0, Carol: 0 });
      setMultiplier(1.0);
      setBlockedHolder(null);
      setPausedScope(null);
    } else if (targetFlow === 'cancel') {
      setSimBalances({ Bob: 100 });
      setMultiplier(1.0);
      setBlockedHolder(null);
      setPausedScope(null);
    } else if (targetFlow === 'dividend') {
      setSimBalances({ Alice: 600, Bob: 400 });
      setMultiplier(1.0);
      setBlockedHolder(null);
      setPausedScope(null);
    } else if (targetFlow === 'split') {
      setSimBalances({ Alice: 100, Bob: 50 });
      setMultiplier(1.0);
      setBlockedHolder(null);
      setPausedScope(null);
    } else if (targetFlow === 'pause') {
      setSimBalances({ Alice: 100, Bob: 0 });
      setMultiplier(1.0);
      setBlockedHolder(null);
      setPausedScope(null);
    }
  };

  const handleRunStep = () => {
    if (isDone || isBusy) return;
    setIsBusy(true);
    setActionError(null);

    const now = new Date();
    const timeFormatted = now.toTimeString().split(' ')[0];
    const txHash = generateTxHash();
    const blockNum = 21458900 + Math.floor(Math.random() * 500);

    setTimeout(() => {
      let logStatus: 'ok' | 'err' | 'info' = 'ok';
      let logName = currentStep.action;
      let logDetail = '';
      const updatedBalances = { ...simBalances };
      let newMultiplier = multiplier;

      // Handle step logic per flow
      if (selectedFlowId === 'create') {
        if (stepIndex === 0) {
          logName = 'createB20';
          logDetail = 'ASSET · EXM · 0xB200…e7a1 (Decimals: 6)';
        } else if (stepIndex === 1) {
          logName = 'grantRole';
          logDetail = 'MINT, OPERATOR, METADATA → Issuer · SupplyCap: 1,000,000 EXM';
        } else if (stepIndex === 2) {
          logName = 'ExtraMetadataUpdated';
          logDetail = 'asset-id → "EXAMPLE-CLASS-A"';
          triggerConfetti();
        }
      } else if (selectedFlowId === 'issue') {
        if (stepIndex === 0) {
          logName = 'updateAllowlist';
          logDetail = 'Allowlist Policy #2: Authorized Alice & Bob';
        } else if (stepIndex === 1) {
          updatedBalances.Alice = 600;
          updatedBalances.Bob = 400;
          logName = 'batchMint';
          logDetail = '2 recipients · 1,000 EXM (Alice: 600, Bob: 400)';
          triggerConfetti();
        }
      } else if (selectedFlowId === 'restrict') {
        if (stepIndex === 0) {
          logName = 'PolicyCreated';
          logDetail = '#2 · ALLOWLIST bound to MINT_RECEIVER, TRANSFER_SENDER, TRANSFER_RECEIVER';
        } else if (stepIndex === 1) {
          updatedBalances.Alice = 100;
          logName = 'Transfer';
          logDetail = '0x0 → Alice · 100 EXM (Minted)';
        } else if (stepIndex === 2) {
          // Expected revert!
          logStatus = 'err';
          logName = 'PolicyForbids';
          logDetail = 'TRANSFER_RECEIVER · Carol (Carol is not allowlisted)';
          setActionError('REVERT: PolicyForbids("TRANSFER_RECEIVER", 0x1Db3439...Carol). Transfer aborted.');
        }
      } else if (selectedFlowId === 'cancel') {
        if (stepIndex === 0) {
          updatedBalances.Bob = 100;
          logName = 'Transfer';
          logDetail = '0x0 → Bob · 100 EXM';
        } else if (stepIndex === 1) {
          setBlockedHolder('Bob');
          logStatus = 'err';
          logName = 'AllowlistUpdated';
          logDetail = 'Bob removed from allowlist · TRANSFER_SENDER blocked';
        } else if (stepIndex === 2) {
          updatedBalances.Bob = 0;
          logName = 'burnBlocked';
          logDetail = 'Bob · 100 EXM destroyed to 0x0';
          triggerConfetti();
        }
      } else if (selectedFlowId === 'dividend') {
        if (stepIndex === 0) {
          updatedBalances.Alice = 600;
          updatedBalances.Bob = 400;
          logStatus = 'info';
          logName = 'Record Date Snapshot';
          logDetail = 'Alice: 600 EXM · Bob: 400 EXM · Total: 1,000 EXM';
        } else if (stepIndex === 1) {
          updatedBalances.Alice += 30;
          updatedBalances.Bob += 20;
          logName = 'announceDistribution';
          logDetail = 'DIV-2026-Q3: 5% Stock Dividend (Alice +30, Bob +20)';
          triggerConfetti();
        }
      } else if (selectedFlowId === 'split') {
        if (stepIndex === 0) {
          updatedBalances.Alice = 100;
          updatedBalances.Bob = 50;
          logStatus = 'info';
          logName = 'multiplier()';
          logDetail = '1.0 WAD (Raw: Alice 100, Bob 50)';
        } else if (stepIndex === 1) {
          newMultiplier = 2.0;
          setMultiplier(2.0);
          logName = 'MultiplierUpdated';
          logDetail = '1.0 → 2.0 WAD · Displayed: Alice 200 EXM, Bob 100 EXM';
          triggerConfetti();
        }
      } else if (selectedFlowId === 'pause') {
        if (stepIndex === 0) {
          updatedBalances.Alice = 100;
          logName = 'Transfer';
          logDetail = '0x0 → Alice · 100 EXM';
        } else if (stepIndex === 1) {
          setPausedScope('TRANSFER');
          logName = 'Paused';
          logDetail = 'TRANSFER scope halted (Circuit breaker engaged)';
        } else if (stepIndex === 2) {
          logStatus = 'err';
          logName = 'EnforcedPause';
          logDetail = 'TRANSFER rejected by paused precompile';
          setActionError('REVERT: EnforcedPause("TRANSFER"). Transfers are paused.');
        } else if (stepIndex === 3) {
          updatedBalances.Bob = 25;
          logName = 'Transfer';
          logDetail = '0x0 → Bob · 25 EXM (Minted while transfers remain paused)';
          triggerConfetti();
        }
      }

      setSimBalances(updatedBalances);
      setCompletedSteps((prev) => [...prev, stepIndex]);
      setStepIndex((prev) => prev + 1);
      setIsBusy(false);

      // Add to event log
      onAddTxLog({
        id: `tx-${Date.now()}-${Math.random()}`,
        timestamp: now.toISOString(),
        timeFormatted,
        level: logStatus === 'err' ? 'ERROR' : logStatus === 'info' ? 'INFO' : 'EVENT',
        name: logName,
        detail: logDetail,
        kind: logStatus,
        hash: txHash,
        blockNumber: blockNum,
        gasUsed: Math.floor(21000 + Math.random() * 25000),
        gasFeeUsd: '<$0.0003',
        explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
      });

      if (onUpdateGlobalAssetBalances) {
        onUpdateGlobalAssetBalances(updatedBalances, newMultiplier);
      }
    }, 600);
  };

  const handleStepBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
      setCompletedSteps((prev) => prev.filter((i) => i < stepIndex - 1));
      setActionError(null);
    }
  };

  const holderKeys = Object.keys(simBalances);

  const getHolderDotColor = (name: string) => {
    if (name.includes('Alice')) return '#66c800';
    if (name.includes('Bob')) return '#ffd12f';
    if (name.includes('Carol')) return '#fc401f';
    return '#0052ff';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-[#232730] bg-gradient-to-r from-[#111317] via-[#14171f] to-[#111317] p-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0052ff] animate-ping"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#3c8aff]">
              Official Base B20 Standard Implementation
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            B20 Real-World Asset (RWA) Engine
          </h1>
          <p className="text-sm text-[#8a91a0] max-w-2xl">
            Represent and operate tokenized securities, corporate equity, and credit assets on Base with native ERC-20 compatibility, dynamic WAD multipliers, and integrated policy registries.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 rounded-xl bg-[#0a0b0d] border border-[#232730] px-3.5 py-2 text-xs font-mono text-[#dee1e7]">
            <span className="text-[#717886]">Mode:</span>
            <span className="text-[#66c800] font-bold">Interactive Vibenet Sandbox</span>
          </div>
          <button
            onClick={() => resetFlow()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1d24] hover:bg-[#222733] border border-[#2b303c] text-xs font-medium text-[#dee1e7] transition-colors w-full sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#8a91a0]" />
            <span>Reset Flow</span>
          </button>
        </div>
      </div>

      {/* Scenario Selector Pills */}
      <div className="rounded-2xl border border-[#232730] bg-[#111317] p-2 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-[11px] font-mono font-bold text-[#717886] uppercase tracking-wider px-3">
            Scenarios:
          </span>
          {B20_SCENARIO_FLOWS.map((flow) => {
            const isSelected = flow.id === selectedFlowId;
            return (
              <button
                key={flow.id}
                onClick={() => resetFlow(flow.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#0052ff] text-white shadow-lg shadow-[#0052ff]/30 font-semibold'
                    : 'bg-[#16181e] text-[#8a91a0] hover:text-white hover:bg-[#1f222b] border border-[#232730]'
                }`}
              >
                <span>{flow.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#232730] text-[#717886]'
                }`}>
                  {flow.steps.length} Steps
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Flow Box (split rail) */}
      <div className="rounded-2xl border border-[#232730] bg-[#111317] overflow-hidden shadow-2xl">
        {/* Scenario Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#232730] bg-[#16181e] px-6 py-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white">{activeFlow.title}</h2>
              <span className="rounded-md bg-[#0052ff]/15 px-2 py-0.5 text-[11px] font-bold text-[#3c8aff] border border-[#0052ff]/30 font-mono">
                {activeFlow.badge}
              </span>
            </div>
            <p className="text-xs text-[#8a91a0] mt-0.5">{activeFlow.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#717886]">Progress:</span>
            <span className="font-mono text-xs font-bold text-[#66c800]">
              {stepIndex} / {activeFlow.steps.length}
            </span>
          </div>
        </div>

        {/* Step Progression Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex border-b border-[#232730] bg-[#0e1014] px-4 py-2 gap-2">
          {activeFlow.steps.map((st, i) => {
            const isFinished = i < stepIndex;
            const isCurrent = i === stepIndex;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-[#0052ff]/15 text-[#3c8aff] border border-[#0052ff]/40 font-semibold'
                    : isFinished
                    ? 'text-[#66c800] bg-[#66c800]/5'
                    : 'text-[#5b616e]'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono font-bold ${
                  isFinished
                    ? 'bg-[#66c800] text-black'
                    : isCurrent
                    ? 'bg-[#0052ff] text-white'
                    : 'bg-[#232730] text-[#717886]'
                }`}>
                  {isFinished ? '✓' : i + 1}
                </span>
                <span className="truncate">{st.stage}</span>
              </div>
            );
          })}
        </div>

        {/* Split Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#232730]">
          {/* Left Rail: Steps & Real-Time Cap Table */}
          <div className="lg:col-span-5 p-6 space-y-6 bg-[#111317]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#717886] mb-4 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Execution Timeline</span>
              </h3>

              <div className="space-y-4">
                {activeFlow.steps.map((st, i) => {
                  const isDoneStep = i < stepIndex;
                  const isNow = i === stepIndex;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-mono font-bold transition-all ${
                            isDoneStep
                              ? 'bg-[#66c800] text-black shadow-sm'
                              : isNow
                              ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/40 ring-2 ring-[#0052ff]/30'
                              : 'bg-[#1c1f26] text-[#717886] border border-[#2b303c]'
                          }`}
                        >
                          {isDoneStep ? '✓' : i + 1}
                        </div>
                        {i < activeFlow.steps.length - 1 && (
                          <div
                            className={`h-10 w-0.5 my-1 ${
                              i < stepIndex ? 'bg-[#0052ff]' : 'bg-[#232730]'
                            }`}
                          ></div>
                        )}
                      </div>

                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${
                              isNow
                                ? 'text-white font-semibold'
                                : isDoneStep
                                ? 'text-[#dee1e7]'
                                : 'text-[#717886]'
                            }`}
                          >
                            {st.action}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              isDoneStep
                                ? 'bg-[#66c800]/15 text-[#66c800]'
                                : isNow
                                ? 'bg-[#0052ff]/20 text-[#3c8aff]'
                                : 'bg-[#1c1f26] text-[#717886]'
                            }`}
                          >
                            {isDoneStep ? 'Complete' : isNow ? 'Ready' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-[#8a91a0] mt-1">{st.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real-time Cap Table Snapshot */}
            <div className="border-t border-[#232730] pt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#717886] flex items-center gap-1.5">
                  <PieChart className="h-3.5 w-3.5 text-[#3c8aff]" />
                  <span>Onchain Holder Balances</span>
                </span>
                {multiplier !== 1 && (
                  <span className="text-[11px] font-mono font-bold bg-[#66c800]/15 text-[#66c800] px-2 py-0.5 rounded-md">
                    {multiplier}x Split Applied
                  </span>
                )}
              </div>

              <div className="space-y-2 rounded-xl bg-[#0a0b0d] p-3 border border-[#232730]">
                {holderKeys.map((holder) => {
                  const rawBal = simBalances[holder] || 0;
                  const displayBal = rawBal * multiplier;
                  const isBlocked = blockedHolder === holder;
                  const isPaused = pausedScope === 'TRANSFER' && holder === 'Alice';

                  return (
                    <div
                      key={holder}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#14161c] border border-[#1e222c] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: getHolderDotColor(holder) }}
                        ></span>
                        <span className="font-medium text-white">{holder}</span>
                        {isBlocked && (
                          <span className="bg-[#fc401f]/20 text-[#fc401f] text-[9px] font-bold px-1.5 py-0.2 rounded border border-[#fc401f]/30 uppercase">
                            Blocked
                          </span>
                        )}
                        {isPaused && (
                          <span className="bg-[#ffd12f]/20 text-[#ffd12f] text-[9px] font-bold px-1.5 py-0.2 rounded border border-[#ffd12f]/30 uppercase">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-bold text-[#f0f2f5]">
                          {formatNumber(displayBal)} EXM
                        </div>
                        {multiplier !== 1 && (
                          <div className="text-[10px] text-[#717886]">
                            Raw: {formatNumber(rawBal)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Action Box: Parameter Inspector & Execute Button */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-6 bg-[#14161c]">
            {isDone ? (
              <div className="py-8 text-center space-y-4 my-auto">
                <div className="h-16 w-16 rounded-full bg-[#66c800]/15 text-[#66c800] mx-auto flex items-center justify-center border border-[#66c800]/30 shadow-lg shadow-[#66c800]/10">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Scenario Complete</h3>
                  <p className="text-sm text-[#8a91a0] max-w-md mx-auto mt-1">
                    Successfully verified and executed all onchain transactions for <strong className="text-white">{activeFlow.title}</strong> on Base.
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => resetFlow()}
                    className="px-5 py-2.5 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-white font-semibold text-xs shadow-md shadow-[#0052ff]/20 transition-all"
                  >
                    Run Scenario Again
                  </button>
                  <button
                    onClick={() => {
                      const nextOrder: ScenarioFlow[] = ['create', 'issue', 'restrict', 'cancel', 'dividend', 'split', 'pause'];
                      const currentIdx = nextOrder.indexOf(selectedFlowId);
                      const nextFlow = nextOrder[(currentIdx + 1) % nextOrder.length];
                      resetFlow(nextFlow);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#1e222c] hover:bg-[#252a36] text-[#dee1e7] font-semibold text-xs border border-[#2b303c] transition-colors"
                  >
                    Next Flow →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#3c8aff] uppercase tracking-wider">
                      Step {stepIndex + 1} of {activeFlow.steps.length}
                    </span>
                    <span className="text-[#5b616e]">·</span>
                    <span className="text-xs text-[#8a91a0]">{currentStep.stage} Phase</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">{currentStep.action}</h3>
                  <p className="text-sm text-[#b1b7c3] mt-2 leading-relaxed">{currentStep.text}</p>
                </div>

                {/* Parameter Table */}
                <div className="rounded-xl border border-[#232730] bg-[#0e1014] overflow-hidden">
                  <div className="border-b border-[#232730] px-4 py-2 bg-[#16181e] text-[11px] font-mono font-semibold uppercase text-[#717886] flex justify-between">
                    <span>Parameter</span>
                    <span>Onchain Value</span>
                  </div>
                  <div className="divide-y divide-[#1c1f26]">
                    {currentStep.summary.map(([key, val], idx) => {
                      const isObj = typeof val === 'object' && val !== null;
                      const valueText = isObj ? (val as any).v : val;
                      const isMono = isObj ? (val as any).mono : false;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-4 py-2.5 text-xs"
                        >
                          <span className="text-[#8a91a0] font-medium">{key}</span>
                          <span
                            className={`text-right font-semibold text-white ${
                              isMono ? 'font-mono text-[#66c800]' : ''
                            }`}
                          >
                            {valueText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Caption / Explainer */}
                {currentStep.caption && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#0052ff]/10 border border-[#0052ff]/25 text-xs text-[#b1b7c3]">
                    <Info className="h-4 w-4 text-[#3c8aff] flex-shrink-0 mt-0.5" />
                    <p>{currentStep.caption}</p>
                  </div>
                )}

                {/* Error Banner if step reverted */}
                {actionError && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#fc401f]/15 border border-[#fc401f]/30 text-xs text-[#fc401f]">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Expected Policy / Precompile Revert</div>
                      <p className="mt-0.5 font-mono text-[11px]">{actionError}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleRunStep}
                    disabled={isBusy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-[#0052ff]/25 transition-all disabled:opacity-50"
                  >
                    {isBusy ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        <span>Submitting to Base...</span>
                      </>
                    ) : (
                      <>
                        <span>{currentStep.action}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {stepIndex > 0 && (
                    <button
                      onClick={handleStepBack}
                      disabled={isBusy}
                      className="px-4 py-3 rounded-xl bg-[#1e222c] hover:bg-[#252a36] text-[#dee1e7] text-xs font-semibold border border-[#2b303c] transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Bottom standard note */}
            <div className="pt-4 border-t border-[#232730] flex items-center justify-between text-[11px] text-[#717886]">
              <span>{activeFlow.erc20Note}</span>
              <span className="font-mono text-[#3c8aff]">Base Vibenet (84538453)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
