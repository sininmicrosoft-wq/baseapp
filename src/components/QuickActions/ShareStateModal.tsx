import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  PieChart,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { AssetMetadata, CapTableHolder, BaseNetwork } from '../../types/base';
import { formatNumber, shortenAddress, triggerConfetti } from '../../utils/web3Helper';

interface ShareStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetMetadata;
  holders: CapTableHolder[];
  currentNetwork: BaseNetwork;
  autoPromptDownload?: boolean;
}

export const ShareStateModal: React.FC<ShareStateModalProps> = ({
  isOpen,
  onClose,
  asset,
  holders,
  currentNetwork,
  autoPromptDownload = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Render canvas snapshot of asset metrics and cap table
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use 1200x675 (16:9 ratio, standard high-definition social card)
    const width = 1200;
    const height = 675;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#090b10');
    bgGradient.addColorStop(0.5, '#0e121a');
    bgGradient.addColorStop(1, '#080a0f');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Glows
    // Top-left Base Blue Glow
    const glow1 = ctx.createRadialGradient(250, 150, 10, 250, 150, 450);
    glow1.addColorStop(0, 'rgba(0, 82, 255, 0.18)');
    glow1.addColorStop(1, 'rgba(0, 82, 255, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    // Bottom-right Cyan Glow
    const glow2 = ctx.createRadialGradient(1000, 520, 10, 1000, 520, 450);
    glow2.addColorStop(0, 'rgba(60, 138, 255, 0.14)');
    glow2.addColorStop(1, 'rgba(60, 138, 255, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    // 3. Subtle Background Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 4. Outer Border & Frame
    ctx.strokeStyle = '#232838';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Top Header Accent Line (Base Blue)
    const accentGrad = ctx.createLinearGradient(20, 20, width - 20, 20);
    accentGrad.addColorStop(0, '#0052ff');
    accentGrad.addColorStop(0.5, '#3c8aff');
    accentGrad.addColorStop(1, '#66c800');
    ctx.strokeStyle = accentGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(width - 20, 20);
    ctx.stroke();

    // 5. Header Elements
    // Base Logo circle
    ctx.fillStyle = '#0052ff';
    ctx.beginPath();
    ctx.arc(65, 68, 20, 0, Math.PI * 2);
    ctx.fill();

    // White center emblem
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(57, 60, 16, 16);

    // Brand Title
    ctx.font = 'bold 13px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#3c8aff';
    ctx.fillText('BASE B20 STUDIO · STATE SNAPSHOT', 100, 60);

    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Real World Asset Metrics & Cap Table', 100, 85);

    // Right Header: Network & Timestamp
    const networkText = `${currentNetwork.name} · Chain ID: ${currentNetwork.chainId}`;
    ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    const netWidth = ctx.measureText(networkText).width;

    // Network Pill Background
    ctx.fillStyle = 'rgba(0, 82, 255, 0.15)';
    ctx.strokeStyle = 'rgba(60, 138, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width - netWidth - 85, 48, netWidth + 35, 28, 8);
    ctx.fill();
    ctx.stroke();

    // Network status green dot
    ctx.fillStyle = '#66c800';
    ctx.beginPath();
    ctx.arc(width - netWidth - 70, 62, 4, 0, Math.PI * 2);
    ctx.fill();

    // Network text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(networkText, width - netWidth - 58, 66);

    // Timestamp text below
    const timeStr = `Snapshot: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`;
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#717886';
    const timeWidth = ctx.measureText(timeStr).width;
    ctx.fillText(timeStr, width - timeWidth - 50, 92);

    // 6. LEFT COLUMN: Asset Metrics Card (x: 48, y: 120, w: 490, h: 470)
    const card1X = 48;
    const card1Y = 120;
    const card1W = 500;
    const card1H = 475;

    ctx.fillStyle = 'rgba(19, 23, 33, 0.85)';
    ctx.strokeStyle = '#232838';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(card1X, card1Y, card1W, card1H, 16);
    ctx.fill();
    ctx.stroke();

    // Card Header
    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#3c8aff';
    ctx.fillText('ASSET SPECIFICATION', card1X + 24, card1Y + 36);

    // Asset Name & Symbol
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(asset.name, card1X + 24, card1Y + 70);

    // Symbol Pill
    ctx.font = 'bold 13px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    const symText = `$${asset.symbol}`;
    const symWidth = ctx.measureText(symText).width;
    ctx.fillStyle = 'rgba(0, 82, 255, 0.25)';
    ctx.strokeStyle = '#0052ff';
    ctx.beginPath();
    ctx.roundRect(card1X + 24, card1Y + 84, symWidth + 20, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3c8aff';
    ctx.fillText(symText, card1X + 34, card1Y + 101);

    // Contract Address
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#8a91a0';
    ctx.fillText(`Contract: ${asset.tokenAddress}`, card1X + symWidth + 56, card1Y + 101);

    // Divider
    ctx.strokeStyle = '#1e2433';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(card1X + 24, card1Y + 124);
    ctx.lineTo(card1X + card1W - 24, card1Y + 124);
    ctx.stroke();

    // 4 Key Metrics Tiles (2x2)
    const tileW = 216;
    const tileH = 82;
    const metrics = [
      {
        label: 'SCALED TOTAL SUPPLY',
        value: `${formatNumber(asset.currentSupply * asset.multiplier)} ${asset.symbol}`,
        sub: `Raw: ${formatNumber(asset.currentSupply)} units`,
        color: '#ffffff',
      },
      {
        label: 'GLOBAL SUPPLY CAP',
        value: `${formatNumber(asset.supplyCap)} ${asset.symbol}`,
        sub: `${((asset.currentSupply / asset.supplyCap) * 100).toFixed(2)}% Minted`,
        color: '#3c8aff',
      },
      {
        label: 'REBASE MULTIPLIER (WAD)',
        value: `${asset.multiplier.toFixed(4)}x`,
        sub: `Multiplier Index: 1e18 scale`,
        color: '#66c800',
      },
      {
        label: 'TRADING & TRANSFERS',
        value: asset.paused ? 'PAUSED' : 'ACTIVE',
        sub: asset.paused ? 'Transfers Restricted' : 'Reg D Compliance Enforced',
        color: asset.paused ? '#fc401f' : '#66c800',
      },
    ];

    metrics.forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const tx = card1X + 24 + col * (tileW + 20);
      const ty = card1Y + 144 + row * (tileH + 16);

      ctx.fillStyle = '#12151e';
      ctx.strokeStyle = '#22283a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tileW, tileH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 9.5px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
      ctx.fillStyle = '#717886';
      ctx.fillText(m.label, tx + 14, ty + 24);

      ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
      ctx.fillStyle = m.color;
      ctx.fillText(m.value, tx + 14, ty + 48);

      ctx.font = '10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#8a91a0';
      ctx.fillText(m.sub, tx + 14, ty + 68);
    });

    // Compliance & Infrastructure Banner inside left card
    const bannerY = card1Y + 348;
    ctx.fillStyle = 'rgba(0, 82, 255, 0.08)';
    ctx.strokeStyle = 'rgba(0, 82, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(card1X + 24, bannerY, card1W - 48, 100, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#3c8aff';
    ctx.fillText('ON-CHAIN COMPLIANCE & RULE STATUS', card1X + 40, bannerY + 28);

    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#dee1e7';
    ctx.fillText('• ERC-20 Backward Compatible with ERC-3643 Permissioned Hooks', card1X + 40, bannerY + 50);
    ctx.fillText('• Policy Registry ID #2: Enforces Identity KYC / AML Allowlist', card1X + 40, bannerY + 70);
    ctx.fillText('• Base L2 Paymaster: Gasless ERC-4337 transfers sponsored', card1X + 40, bannerY + 90);

    // 7. RIGHT COLUMN: Cap Table Distribution (x: 574, y: 120, w: 578, h: 475)
    const card2X = 574;
    const card2Y = 120;
    const card2W = 578;
    const card2H = 475;

    ctx.fillStyle = 'rgba(19, 23, 33, 0.85)';
    ctx.strokeStyle = '#232838';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(card2X, card2Y, card2W, card2H, 16);
    ctx.fill();
    ctx.stroke();

    // Cap Table Header
    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#66c800';
    ctx.fillText('EQUITY & TOKEN DISTRIBUTION', card2X + 24, card2Y + 36);

    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Cap Table Ownership', card2X + 24, card2Y + 66);

    const totalRaw = holders.reduce((acc, h) => acc + h.rawBalance, 0) || 1;
    const activeHolders = holders.filter((h) => h.rawBalance > 0);

    // Donut Chart Drawing
    const donutX = card2X + 115;
    const donutY = card2Y + 190;
    const outerR = 75;
    const innerR = 48;

    let startAngle = -Math.PI / 2;

    holders.forEach((holder) => {
      const share = holder.rawBalance / totalRaw;
      if (share <= 0) return;

      const sliceAngle = share * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.fillStyle = holder.color || '#3c8aff';
      ctx.beginPath();
      ctx.arc(donutX, donutY, outerR, startAngle, endAngle);
      ctx.arc(donutX, donutY, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      // Thin separation gap
      ctx.strokeStyle = '#131721';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      startAngle = endAngle;
    });

    // Donut Center Text
    ctx.font = 'bold 20px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#ffffff';
    const countText = `${activeHolders.length}`;
    const countW = ctx.measureText(countText).width;
    ctx.fillText(countText, donutX - countW / 2, donutY + 2);

    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#8a91a0';
    const subHolders = 'Holders';
    const subW = ctx.measureText(subHolders).width;
    ctx.fillText(subHolders, donutX - subW / 2, donutY + 18);

    // Cap Table Legend List (Right side of Donut)
    const listX = card2X + 225;
    let listY = card2Y + 110;

    holders.slice(0, 5).forEach((holder) => {
      const percentage = ((holder.rawBalance / totalRaw) * 100).toFixed(1);
      const scaledBal = holder.rawBalance * asset.multiplier;

      // Color swatch pill
      ctx.fillStyle = holder.color || '#3c8aff';
      ctx.beginPath();
      ctx.roundRect(listX, listY + 3, 10, 10, 3);
      ctx.fill();

      // Holder name
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(holder.name, listX + 18, listY + 13);

      // Percentage & Category
      ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
      ctx.fillStyle = holder.color || '#3c8aff';
      ctx.fillText(`${percentage}%`, listX + card2W - 225 - 55, listY + 13);

      // Address & Balance subtext
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
      ctx.fillStyle = '#8a91a0';
      ctx.fillText(
        `${shortenAddress(holder.address, 4)} · ${formatNumber(scaledBal)} ${asset.symbol}`,
        listX + 18,
        listY + 28
      );

      // Category Pill
      const catText = holder.category.toUpperCase();
      ctx.font = 'bold 8px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
      const catW = ctx.measureText(catText).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(listX + card2W - 225 - 55 - catW - 14, listY + 2, catW + 10, 15, 4);
      ctx.fill();
      ctx.fillStyle = '#b1b7c3';
      ctx.fillText(catText, listX + card2W - 225 - 55 - catW - 9, listY + 13);

      // Line divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(listX, listY + 36);
      ctx.lineTo(card2X + card2W - 24, listY + 36);
      ctx.stroke();

      listY += 46;
    });

    // Cap Table Footer Summary Box
    const sumBoxY = card2Y + 365;
    ctx.fillStyle = '#12151e';
    ctx.strokeStyle = '#22283a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(card2X + 24, sumBoxY, card2W - 48, 85, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#b1b7c3';
    ctx.fillText('CONCENTRATION & GOVERNANCE', card2X + 40, sumBoxY + 26);

    const founderHolding = holders.find((h) => h.category === 'Founder')?.rawBalance || 0;
    const founderPct = ((founderHolding / totalRaw) * 100).toFixed(1);

    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#8a91a0';
    ctx.fillText(`• Founder Retained Equity: ${founderPct}% (${formatNumber(founderHolding * asset.multiplier)} ${asset.symbol})`, card2X + 40, sumBoxY + 48);
    ctx.fillText(`• Institutional / Angel Shares: ${(100 - parseFloat(founderPct)).toFixed(1)}% allocated across ${holders.length - 1} entities`, card2X + 40, sumBoxY + 68);

    // 8. Bottom Footer
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
    ctx.fillStyle = '#565f72';
    ctx.fillText('Verified on Base L2 · EVM Bytecode & Storage Compliant · Base B20 Standard', 50, height - 35);

    const genText = 'Generated by Base B20 Studio · https://base.org';
    const genW = ctx.measureText(genText).width;
    ctx.fillText(genText, width - genW - 50, height - 35);

    // Generate output Data URL
    const url = canvas.toDataURL('image/png');
    setDataUrl(url);
    setIsGenerating(false);
  }, [asset, holders, currentNetwork]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const filename = `base-rwa-${asset.symbol.toLowerCase()}-state-${new Date().toISOString().substring(0, 10)}.png`;
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess(true);
      triggerConfetti();
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Error downloading canvas image', err);
    }
  }, [asset.symbol]);

  useEffect(() => {
    if (isOpen) {
      // Delay slightly for modal mounting transition
      const timer = setTimeout(() => {
        renderCanvas();
        if (autoPromptDownload) {
          setTimeout(() => {
            handleDownload();
          }, 200);
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, renderCanvas, autoPromptDownload, handleDownload]);

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2000);
        } catch {
          // Fallback to downloading
          handleDownload();
        }
      });
    } catch {
      handleDownload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0e1117] border border-[#262c3a] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#141722] border-b border-[#232730]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#0052ff]/15 border border-[#0052ff]/30 flex items-center justify-center text-[#3c8aff]">
              <Share2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Share State Snapshot</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#66c800]/15 text-[#66c800] border border-[#66c800]/30">
                  HTML5 Canvas
                </span>
              </div>
              <p className="text-xs text-[#8a91a0]">
                High-resolution export of current RWA asset metrics and cap table distribution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8a91a0] hover:text-white hover:bg-[#1f2430] transition-colors"
            title="Close Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Image Preview Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Hidden Canvas (Render Source) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Rendered Preview Card */}
          <div className="relative rounded-xl border border-[#262c3a] bg-[#08090d] p-2 overflow-hidden shadow-inner group">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="RWA State & Cap Table Snapshot"
                className="w-full h-auto rounded-lg object-contain shadow-2xl border border-white/5"
              />
            ) : (
              <div className="h-72 flex flex-col items-center justify-center gap-3 text-[#8a91a0]">
                <RefreshCw className="h-6 w-6 animate-spin text-[#3c8aff]" />
                <span className="text-xs font-mono">Generating high-definition snapshot...</span>
              </div>
            )}

            {/* Quick resolution badge overlay */}
            <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#dee1e7] flex items-center gap-1.5 shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-[#66c800]"></span>
              <span>1200 × 675 HD (16:9) · PNG</span>
            </div>
          </div>

          {/* Snapshot Summary Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[#12151e] border border-[#222838]">
              <div className="text-[10px] text-[#717886] font-mono uppercase">Asset</div>
              <div className="text-white font-bold truncate mt-0.5">{asset.name}</div>
              <div className="text-[#3c8aff] font-mono text-[11px]">${asset.symbol}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#12151e] border border-[#222838]">
              <div className="text-[10px] text-[#717886] font-mono uppercase">Total Supply</div>
              <div className="text-white font-bold font-mono mt-0.5">
                {formatNumber(asset.currentSupply * asset.multiplier)}
              </div>
              <div className="text-[#66c800] font-mono text-[11px]">{asset.multiplier.toFixed(4)}x WAD</div>
            </div>
            <div className="p-3 rounded-xl bg-[#12151e] border border-[#222838]">
              <div className="text-[10px] text-[#717886] font-mono uppercase">Cap Table</div>
              <div className="text-white font-bold mt-0.5">{holders.length} Registered</div>
              <div className="text-[#ffd12f] font-mono text-[11px]">Donut Ownership Map</div>
            </div>
            <div className="p-3 rounded-xl bg-[#12151e] border border-[#222838]">
              <div className="text-[10px] text-[#717886] font-mono uppercase">Network</div>
              <div className="text-white font-bold mt-0.5 truncate">{currentNetwork.name}</div>
              <div className="text-[#8a91a0] font-mono text-[11px]">Chain ID: {currentNetwork.chainId}</div>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-[#66c800]/15 border border-[#66c800]/30 text-xs text-[#66c800] flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span className="font-semibold">Snapshot downloaded successfully to your computer!</span>
              </div>
              <span className="text-[10px] font-mono">PNG file</span>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#141722] border-t border-[#232730]">
          <div className="flex items-center gap-2 text-xs text-[#8a91a0]">
            <Sparkles className="h-4 w-4 text-[#ffd12f]" />
            <span>Ready for sharing to Farcaster, Twitter, Discord, or investor decks</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={renderCanvas}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-[#1a1d26] hover:bg-[#232733] border border-[#2d3342] text-xs font-semibold text-[#dee1e7] transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Re-draw canvas"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin text-[#3c8aff]' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              className="px-4 py-2 rounded-xl bg-[#1a1d26] hover:bg-[#232733] border border-[#2d3342] text-xs font-semibold text-[#dee1e7] transition-all flex items-center gap-1.5 active:scale-95"
              title="Copy PNG image to clipboard"
            >
              {copiedImage ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#66c800]" />
                  <span className="text-[#66c800]">Copied Image!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0048e0] text-white text-xs font-bold shadow-lg shadow-[#0052ff]/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Download Snapshot (.png)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
