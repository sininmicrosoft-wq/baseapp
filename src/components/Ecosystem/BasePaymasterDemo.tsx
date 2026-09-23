import React, { useState } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  KeyRound, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Layers,
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { BaseNetwork, TxLogEntry, WalletAccount } from '../../types/base';
import { generateTxHash, triggerConfetti, formatNumber } from '../../utils/web3Helper';

interface BasePaymasterDemoProps {
  currentNetwork: BaseNetwork;
  wallet: WalletAccount;
  onAddTxLog: (entry: TxLogEntry) => void;
}

export const BasePaymasterDemo: React.FC<BasePaymasterDemoProps> = ({
  currentNetwork,
  wallet,
  onAddTxLog,
}) => {
  const [recipient, setRecipient] = useState('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  const [amount, setAmount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gaslessSuccess, setGaslessSuccess] = useState<boolean>(false);

  const handleSendGasless = () => {
    setIsSubmitting(true);
    setGaslessSuccess(false);

    const userOpHash = generateTxHash();
    const txHash = generateTxHash();

    setTimeout(() => {
      setIsSubmitting(false);
      setGaslessSuccess(true);
      triggerConfetti();

      onAddTxLog({
        id: `tx-paymaster-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toTimeString().split(' ')[0],
        level: 'EVENT',
        name: 'UserOperationSponsored',
        detail: `Gasless Tx Succeeded! UserOp: ${userOpHash.slice(0, 10)}… Sponsored by Base Paymaster`,
        kind: 'ok',
        hash: txHash,
        gasUsed: 42100,
        gasFeeUsd: '$0.00 (Sponsored)',
        explorerUrl: `${currentNetwork.explorerUrl}/tx/${txHash}`,
      });
    }, 1000);
  };

  const comparisons = [
    { operation: 'Token Mint / Claim', l1Fee: '$12.40', baseFee: '$0.0012', sponsored: '$0.00' },
    { operation: 'B20 Asset Transfer', l1Fee: '$4.85', baseFee: '$0.0003', sponsored: '$0.00' },
    { operation: 'Cap-table Multiplier Split', l1Fee: '$38.20', baseFee: '$0.0021', sponsored: '$0.00' },
    { operation: 'Allowlist Policy Update', l1Fee: '$9.10', baseFee: '$0.0008', sponsored: '$0.00' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl border border-[#232730] bg-gradient-to-br from-[#111317] via-[#141822] to-[#111317] p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#66c800] animate-ping"></span>
          <span className="text-xs font-mono font-bold uppercase text-[#66c800]">
            ERC-4337 & EIP-7677 Native Infrastructure
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">
          Base Smart Wallet & Gasless Paymaster
        </h2>
        <p className="text-sm text-[#8a91a0] max-w-2xl">
          Deliver zero-friction onboarding on Base. Users sign with Apple TouchID, FaceID, or Windows Hello passkeys, and your application or protocol sponsors the sub-cent gas fees via the Base Paymaster.
        </p>
      </div>

      {/* Interactive Paymaster Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Gasless Transaction Tester */}
        <div className="lg:col-span-6 rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#232730] pb-3">
            <Zap className="h-5 w-5 text-[#ffd12f]" />
            <h3 className="font-bold text-white text-base">Test Gasless Transaction</h3>
          </div>
          <p className="text-xs text-[#8a91a0]">
            Experience how the Base Paymaster subsidizes user execution. The transaction is submitted as an ERC-4337 UserOperation with zero ETH deducted from the user.
          </p>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                From Account
              </label>
              <div className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-[#b1b7c3] flex items-center justify-between">
                <span>{wallet.address || '0x8453B20d826a57E88aDb34589d8F07C647a196e7'}</span>
                <span className="text-[10px] bg-[#0052ff]/20 text-[#3c8aff] px-1.5 py-0.5 rounded font-sans font-bold">
                  Passkey Smart Wallet
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#dee1e7] mb-1">
                Amount (EXM Shares)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl bg-[#0e1014] border border-[#232730] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#0052ff] focus:outline-none"
              />
            </div>

            {/* Paymaster Info Box */}
            <div className="p-3.5 rounded-xl bg-[#66c800]/10 border border-[#66c800]/30 space-y-1 text-xs">
              <div className="flex items-center justify-between text-[#66c800] font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Base Paymaster Active</span>
                </span>
                <span className="font-mono">$0.00 Gas Cost</span>
              </div>
              <p className="text-[11px] text-[#b1b7c3]">
                Policy verified: User meets sponsorship criteria. Paymaster will cover 100% of the L2 gas fee.
              </p>
            </div>

            {gaslessSuccess && (
              <div className="p-3.5 rounded-xl bg-[#0052ff]/15 border border-[#0052ff]/30 text-xs text-white space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#3c8aff]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>UserOperation Executed & Gasless!</span>
                </div>
                <p className="text-[11px] text-[#b1b7c3]">
                  Successfully transferred {amount} EXM to {recipient.slice(0, 10)}… without any gas charge.
                </p>
              </div>
            )}

            <button
              onClick={handleSendGasless}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#66c800] hover:bg-[#58ad00] text-black font-bold text-xs shadow-lg shadow-[#66c800]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                  <span>Signing with Passkey & Sponsoring...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Submit Gasless Transaction (0.00 ETH)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Cost & Architecture Comparison */}
        <div className="lg:col-span-6 rounded-2xl border border-[#232730] bg-[#111317] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#232730] pb-3">
            <TrendingDown className="h-5 w-5 text-[#66c800]" />
            <h3 className="font-bold text-white text-base">Cost Comparison: Ethereum L1 vs Base</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#232730] text-[#717886] font-mono uppercase text-[10.5px]">
                  <th className="pb-2">Action</th>
                  <th className="pb-2 text-right">Ethereum L1</th>
                  <th className="pb-2 text-right">Base L2</th>
                  <th className="pb-2 text-right text-[#66c800]">With Paymaster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1f26]">
                {comparisons.map((c, i) => (
                  <tr key={i} className="hover:bg-[#16181e]">
                    <td className="py-2.5 text-white font-medium">{c.operation}</td>
                    <td className="py-2.5 text-right font-mono text-[#fc401f]">{c.l1Fee}</td>
                    <td className="py-2.5 text-right font-mono text-[#3c8aff]">{c.baseFee}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#66c800]">
                      {c.sponsored}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1014] border border-[#232730] space-y-2 mt-4">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#3c8aff]" />
              <span>How Base Smart Wallet Works</span>
            </div>
            <p className="text-[11px] text-[#8a91a0] leading-relaxed">
              Base Smart Wallet uses standard WebAuthn cryptographic keys stored directly inside the hardware enclave of user phones or computers. Users never have to back up a 12-word seed phrase or install a browser extension.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
