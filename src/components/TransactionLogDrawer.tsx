import React, { useState } from 'react';
import { 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Clock 
} from 'lucide-react';
import { TxLogEntry, BaseNetwork } from '../types/base';
import { shortenAddress } from '../utils/web3Helper';

interface TransactionLogDrawerProps {
  logs: TxLogEntry[];
  onClearLogs: () => void;
  currentNetwork: BaseNetwork;
}

export const TransactionLogDrawer: React.FC<TransactionLogDrawerProps> = ({
  logs,
  onClearLogs,
  currentNetwork,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'EVENT' | 'ERROR' | 'INFO'>('ALL');

  const filteredLogs = logs.filter((l) => {
    if (filter === 'ALL') return true;
    return l.level === filter;
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#232730] bg-[#0c0e12]/95 backdrop-blur-md shadow-2xl transition-all">
      {/* Drawer Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#14161c] border-b border-[#232730]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-xs font-mono font-bold text-white hover:text-[#3c8aff] transition-colors"
          >
            <Terminal className="h-4 w-4 text-[#0052ff]" />
            <span>Base Transaction Event Log</span>
            <span className="rounded-full bg-[#232730] px-2 py-0.2 text-[10px] text-[#dee1e7]">
              {logs.length}
            </span>
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-[#717886]" /> : <ChevronUp className="h-3.5 w-3.5 text-[#717886]" />}
          </button>

          {isOpen && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono">
              {(['ALL', 'EVENT', 'ERROR', 'INFO'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    filter === f
                      ? 'bg-[#0052ff] text-white font-bold'
                      : 'text-[#717886] hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[11px] font-mono text-[#66c800]">
            ● RPC Connected: {currentNetwork.name}
          </span>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              title="Clear event logs"
              className="text-[#717886] hover:text-white p-1 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Drawer Content */}
      {isOpen && (
        <div className="max-h-48 overflow-y-auto px-4 py-2 font-mono text-xs divide-y divide-[#1a1d24]">
          {filteredLogs.length === 0 ? (
            <div className="py-6 text-center text-[#5b616e] text-xs">
              No onchain transaction events recorded yet. Run a step in the B20 Simulator or execute a transfer above.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isErr = log.kind === 'err';
              const isInfo = log.kind === 'info';

              return (
                <div key={log.id} className="py-2 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] text-[#5b616e] flex-shrink-0">
                      {log.timeFormatted}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded flex-shrink-0 ${
                        isErr
                          ? 'bg-[#fc401f]/20 text-[#fc401f]'
                          : isInfo
                          ? 'bg-[#3c8aff]/20 text-[#3c8aff]'
                          : 'bg-[#0052ff]/20 text-[#3c8aff]'
                      }`}
                    >
                      [{log.level}]
                    </span>

                    <span className="font-semibold text-white flex-shrink-0">{log.name}</span>

                    <span className="text-[#8a91a0] truncate text-[11.5px]">{log.detail}</span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-[11px]">
                    {log.gasFeeUsd && (
                      <span className="hidden md:inline text-[#66c800] bg-[#66c800]/10 px-1.5 py-0.2 rounded">
                        {log.gasFeeUsd}
                      </span>
                    )}

                    {log.hash && (
                      <a
                        href={log.explorerUrl || `${currentNetwork.explorerUrl}/tx/${log.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#3c8aff] hover:underline"
                      >
                        <span>{shortenAddress(log.hash, 3)}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
