import React, { useState } from 'react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { B20_SOLIDITY_CODE } from '../../data/mockBaseData';
import { BaseNetwork, TxLogEntry } from '../../types/base';
import { generateRandomAddress, generateTxHash, triggerConfetti } from '../../utils/web3Helper';

interface SolidityCodeViewerProps {
  currentNetwork: BaseNetwork;
  onAddTxLog: (entry: TxLogEntry) => void;
}

export const SolidityCodeViewer: React.FC<SolidityCodeViewerProps> = ({
  currentNetwork,
  onAddTxLog,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'solidity' | 'abi' | 'deploy-cli'>('solidity');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(B20_SOLIDITY_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([B20_SOLIDITY_CODE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BaseB20Asset.sol';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeployDirectly = () => {
    setIsDeploying(true);
    const mockAddr = generateRandomAddress();
    const txHash = generateTxHash();

    setTimeout(() => {
      setDeployedAddress(mockAddr);
      setIsDeploying(false);
      triggerConfetti();

      onAddTxLog({
        id: `tx-sol-deploy-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'EVENT',
        name: 'ContractDeploy',
        detail: `BaseB20Asset.sol compiled & deployed to ${mockAddr}`,
        kind: 'ok',
        hash: txHash,
        blockNumber: 21459600,
        gasUsed: 420800,
        gasFeeUsd: '$0.0052',
        explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
      });
    }, 1200);
  };

  const sampleAbi = [
    {
      "inputs": [
        { "internalType": "string", "name": "_name", "type": "string" },
        { "internalType": "string", "name": "_symbol", "type": "string" },
        { "internalType": "uint8", "name": "_decimals", "type": "uint8" },
        { "internalType": "uint256", "name": "_supplyCap", "type": "uint256" },
        { "internalType": "address", "name": "_admin", "type": "address" }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "uint256", "name": "oldMultiplier", "type": "uint256" },
        { "indexed": false, "internalType": "uint256", "name": "newMultiplier", "type": "uint256" }
      ],
      "name": "MultiplierUpdated",
      "type": "event"
    },
    {
      "inputs": [
        { "internalType": "address[]", "name": "recipients", "type": "address[]" },
        { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
      ],
      "name": "batchMint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "newMultiplier", "type": "uint256" }
      ],
      "name": "updateMultiplier",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-[#0052ff]"></span>
            <span className="text-xs font-mono text-[#3c8aff] uppercase font-bold tracking-wider">
              Smart Contract Architecture
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white">BaseB20Asset.sol</h2>
          <p className="text-xs text-[#8a91a0] mt-1 max-w-xl">
            Clean, modular Solidity contract compatible with Solidity ^0.8.24 and Base L2 opcodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a1d24] hover:bg-[#222733] border border-[#2b303c] text-xs font-semibold text-[#dee1e7] transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#66c800]" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a1d24] hover:bg-[#222733] border border-[#2b303c] text-xs font-semibold text-[#dee1e7] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#3c8aff]" />
            <span>Download .sol</span>
          </button>

          <button
            onClick={handleDeployDirectly}
            disabled={isDeploying}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0045d8] text-xs font-bold text-white shadow-md shadow-[#0052ff]/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isDeploying ? 'Deploying...' : 'Deploy to Base'}</span>
          </button>
        </div>
      </div>

      {/* Deployment Notification */}
      {deployedAddress && (
        <div className="rounded-2xl border border-[#66c800]/30 bg-[#66c800]/10 p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#66c800] text-black flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="text-xs font-bold text-white">Contract Deployed Successfully!</div>
              <div className="text-[11px] font-mono text-[#dee1e7]">Address: {deployedAddress}</div>
            </div>
          </div>
          <a
            href={`${currentNetwork.explorerUrl}/address/${deployedAddress}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-[#66c800] hover:underline"
          >
            <span>View on Basescan</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#232730] pb-2">
        <button
          onClick={() => setActiveTab('solidity')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'solidity'
              ? 'bg-[#0052ff] text-white'
              : 'text-[#8a91a0] hover:text-white bg-[#14161c]'
          }`}
        >
          Solidity Code (.sol)
        </button>
        <button
          onClick={() => setActiveTab('abi')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'abi'
              ? 'bg-[#0052ff] text-white'
              : 'text-[#8a91a0] hover:text-white bg-[#14161c]'
          }`}
        >
          Contract ABI JSON
        </button>
        <button
          onClick={() => setActiveTab('deploy-cli')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'deploy-cli'
              ? 'bg-[#0052ff] text-white'
              : 'text-[#8a91a0] hover:text-white bg-[#14161c]'
          }`}
        >
          Foundry & Hardhat CLI
        </button>
      </div>

      {/* Code Display Area */}
      <div className="rounded-2xl border border-[#232730] bg-[#0c0e12] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#14161c] border-b border-[#232730] text-xs font-mono text-[#717886]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#fc401f]/60"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffd12f]/60"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#66c800]/60"></span>
            <span className="ml-2 text-white font-medium">
              {activeTab === 'solidity' ? 'contracts/BaseB20Asset.sol' : activeTab === 'abi' ? 'BaseB20Asset.json' : 'deploy.sh'}
            </span>
          </div>
          <span>Solidity 0.8.24 · Base L2 EVM</span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[600px] text-xs font-mono leading-relaxed text-[#dee1e7]">
          {activeTab === 'solidity' && (
            <pre>
              <code>{B20_SOLIDITY_CODE}</code>
            </pre>
          )}

          {activeTab === 'abi' && (
            <pre>
              <code>{JSON.stringify(sampleAbi, null, 2)}</code>
            </pre>
          )}

          {activeTab === 'deploy-cli' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#14161c] border border-[#232730]">
                <div className="text-[#3c8aff] font-bold mb-2"># Deploy with Foundry (forge script)</div>
                <div className="text-white">
                  forge create src/BaseB20Asset.sol:BaseB20Asset \<br />
                  &nbsp;&nbsp;--rpc-url https://mainnet.base.org \<br />
                  &nbsp;&nbsp;--private-key $DEPLOYER_KEY \<br />
                  &nbsp;&nbsp;--constructor-args "Example Corp Class A" "EXM" 6 1000000000000 0xYourAdminAddress \<br />
                  &nbsp;&nbsp;--verify --etherscan-api-key $BASESCAN_API_KEY
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#14161c] border border-[#232730]">
                <div className="text-[#66c800] font-bold mb-2"># Deploy with Hardhat Ignition</div>
                <div className="text-white">
                  npx hardhat ignition deploy ./ignition/modules/B20Module.ts --network base
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
