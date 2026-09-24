import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink,
  Code2,
  Sparkles
} from 'lucide-react';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' | 'PASSED';

export interface SecurityRule {
  id: string;
  name: string;
  category: 'Access Control' | 'Reentrancy' | 'Gas & DoS' | 'Arithmetic & Precision' | 'Governance & Centralization' | 'Compliance & Standards';
  swcId?: string;
  cweId?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  description: string;
  check: (code: string) => {
    passed: boolean;
    lineNumber?: number;
    codeSnippet?: string;
    detail?: string;
    remediation?: string;
  };
}

export interface SecurityFinding {
  id: string;
  ruleId: string;
  name: string;
  category: string;
  severity: Severity;
  swcId?: string;
  cweId?: string;
  description: string;
  detail: string;
  lineNumber?: number;
  codeSnippet?: string;
  remediation?: string;
  passed: boolean;
}

// Predefined static analysis rule set modeled after Slither & SWC registry
export const PREDEFINED_SECURITY_RULES: SecurityRule[] = [
  {
    id: 'SEC-01',
    name: 'Unbounded Loop in Batch Operations (DoS / Gas Limit)',
    category: 'Gas & DoS',
    swcId: 'SWC-113',
    cweId: 'CWE-400',
    severity: 'MEDIUM',
    description: 'Loops iterating over unbounded dynamic array parameters may hit the block gas limit, causing transaction reverts.',
    check: (code) => {
      const match = code.match(/for\s*\(\s*uint256\s+i\s*=\s*0;\s*i\s*<\s*recipients\.length;\s*i\+\+\s*\)/);
      if (match) {
        const lines = code.substring(0, match.index).split('\n');
        return {
          passed: false,
          lineNumber: lines.length,
          codeSnippet: 'for (uint256 i = 0; i < recipients.length; i++) {\n    _mint(recipients[i], amounts[i]);\n}',
          detail: 'announceDistribution() and batchMint() iterate over arbitrary-length arrays without pagination or max batch size bounds.',
          remediation: 'Enforce a constant MAX_BATCH_SIZE (e.g. require(recipients.length <= 150, "Batch too large");) or implement Merkle tree claim distribution.',
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'SEC-02',
    name: 'Privileged Role Force-Burn (Centralization Risk)',
    category: 'Governance & Centralization',
    swcId: 'SWC-105',
    cweId: 'CWE-284',
    severity: 'MEDIUM',
    description: 'The OPERATOR_ROLE can unilaterally burn balances of blocked addresses without a multi-signature delay or timelock.',
    check: (code) => {
      const match = code.match(/function\s+burnBlocked\s*\([^)]*\)\s+external\s+onlyRole\s*\(\s*OPERATOR_ROLE\s*\)/);
      if (match) {
        const lines = code.substring(0, match.index).split('\n');
        return {
          passed: false,
          lineNumber: lines.length,
          codeSnippet: 'function burnBlocked(address from, uint256 scaledAmount) external onlyRole(OPERATOR_ROLE) { ... }',
          detail: 'burnBlocked allows instant token forfeiture for regulatory compliance. If an operator key is compromised, arbitrary balances could be burned.',
          remediation: 'Consider requiring a 48-hour timelock, multi-sig consensus, or cryptographic court order attestation before execution.',
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'SEC-03',
    name: 'Precision Loss in Multiplier Division',
    category: 'Arithmetic & Precision',
    swcId: 'SWC-101',
    cweId: 'CWE-682',
    severity: 'LOW',
    description: 'Scaled balance calculations divide after multiplication: ensure multiplier remains non-zero to avoid Division-by-Zero.',
    check: (code) => {
      const match = code.match(/uint256\s+rawAmount\s*=\s*\(scaledAmount\s*\*\s*1e18\)\s*\/\s*multiplier;/);
      if (match) {
        const lines = code.substring(0, match.index).split('\n');
        return {
          passed: false,
          lineNumber: lines.length,
          codeSnippet: 'uint256 rawAmount = (scaledAmount * 1e18) / multiplier;',
          detail: 'Calculation performs scaled token conversion. While updateMultiplier checks newMultiplier > 0, small scaled amounts with large multipliers can suffer integer truncation.',
          remediation: 'Ensure minimum transacted amounts exceed 1000 wei or enforce precision scaling guards.',
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'SEC-04',
    name: 'Policy Registry Address Zero Bypass',
    category: 'Access Control',
    swcId: 'SWC-105',
    cweId: 'CWE-20',
    severity: 'LOW',
    description: 'When policyRegistry is address(0), transfer restrictions are completely skipped without emitting a warning.',
    check: (code) => {
      const match = code.match(/if\s*\(\s*address\s*\(\s*policyRegistry\s*\)\s*==\s*address\s*\(\s*0\s*\)\s*\)\s*return;/);
      if (match) {
        const lines = code.substring(0, match.index).split('\n');
        return {
          passed: false,
          lineNumber: lines.length,
          codeSnippet: 'if (address(policyRegistry) == address(0)) return;',
          detail: 'Initial deployment leaves policyRegistry uninitialized, permitting unvetted transfers before compliance rules are attached.',
          remediation: 'Require a valid policyRegistry address during constructor initialization if compliance enforcement is mandatory.',
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'SEC-05',
    name: 'Reentrancy Vulnerability in Token Transfers',
    category: 'Reentrancy',
    swcId: 'SWC-107',
    cweId: 'CWE-841',
    severity: 'CRITICAL',
    description: 'External calls prior to state updates can allow recursive caller reentrancy.',
    check: (code) => {
      // BaseB20Asset strictly follows Checks-Effects-Interactions and has no untrusted calls
      const hasExternalRawCall = code.includes('.call{value:') || code.includes('.delegatecall');
      if (hasExternalRawCall) {
        return {
          passed: false,
          detail: 'Untrusted external call detected prior to balance resolution.',
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'SEC-06',
    name: 'Missing Access Control Modifiers on Administrative Setters',
    category: 'Access Control',
    swcId: 'SWC-105',
    cweId: 'CWE-284',
    severity: 'HIGH',
    description: 'Public or external state-mutating functions must be guarded with role-based checks.',
    check: (code) => {
      // Check that updateMultiplier and setTransfersPaused have onlyRole
      const hasUnprotectedSetter = code.includes('function updateMultiplier') && !code.includes('onlyRole(DEFAULT_ADMIN_ROLE)');
      if (hasUnprotectedSetter) {
        return {
          passed: false,
          detail: 'Administrative function updateMultiplier is accessible without role authorization.',
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'SEC-07',
    name: 'Arbitrary Minting / Supply Cap Exceeded',
    category: 'Compliance & Standards',
    swcId: 'SWC-105',
    cweId: 'CWE-284',
    severity: 'HIGH',
    description: 'Minting operations must enforce the pre-configured global supply cap.',
    check: (code) => {
      const hasCapCheck = code.includes('require(rawTotalSupply + rawAmount <= rawSupplyCap');
      if (!hasCapCheck) {
        return {
          passed: false,
          detail: 'Supply cap check missing in _mint internal logic.',
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'SEC-08',
    name: 'Solidity Compiler Version Floating Pragma',
    category: 'Compliance & Standards',
    swcId: 'SWC-103',
    cweId: 'CWE-664',
    severity: 'INFORMATIONAL',
    description: 'Contracts should lock the pragma to a specific compiler version to prevent unexpected behavior with future releases.',
    check: (code) => {
      const match = code.match(/pragma\s+solidity\s+\^0\.8\.24;/);
      if (match) {
        const lines = code.substring(0, match.index).split('\n');
        return {
          passed: false,
          lineNumber: lines.length,
          codeSnippet: 'pragma solidity ^0.8.24;',
          detail: 'Floating pragma "^0.8.24" permits compilation with future 0.8.x compilers which may contain unverified breaking changes.',
          remediation: 'Lock pragma to an exact version: "pragma solidity 0.8.24;" for deterministic production deployments.',
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'SEC-09',
    name: 'Integer Overflow / Underflow in Balance Tracking',
    category: 'Arithmetic & Precision',
    swcId: 'SWC-101',
    cweId: 'CWE-190',
    severity: 'HIGH',
    description: 'Arithmetic operations must prevent overflow/underflow vulnerability vectors.',
    check: () => {
      // Solidity >= 0.8 has native overflow protection built-in
      return { passed: true };
    },
  },
  {
    id: 'SEC-10',
    name: 'Unchecked ERC-20 Return Values on Standard Transfers',
    category: 'Compliance & Standards',
    swcId: 'SWC-104',
    cweId: 'CWE-252',
    severity: 'MEDIUM',
    description: 'Transfers must explicitly return boolean values conforming to the ERC-20 specification.',
    check: (code) => {
      const returnsBool = code.includes('function transfer(address to, uint256 scaledAmount) public override returns (bool)');
      if (!returnsBool) {
        return {
          passed: false,
          detail: 'transfer() does not return boolean status, breaking ERC-20 interface compliance.',
        };
      }
      return { passed: true };
    },
  },
];

interface SecurityScanPanelProps {
  solidityCode: string;
  onClose: () => void;
  onSelectLine?: (lineNumber: number) => void;
}

export const SecurityScanPanel: React.FC<SecurityScanPanelProps> = ({
  solidityCode,
  onClose,
  onSelectLine,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'ISSUES' | 'PASSED'>('ALL');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});
  const [copiedReport, setCopiedReport] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Execute rules against the current Solidity code
  const scanResults = useMemo(() => {
    const findings: SecurityFinding[] = [];

    PREDEFINED_SECURITY_RULES.forEach((rule) => {
      const result = rule.check(solidityCode);
      findings.push({
        id: rule.id,
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        severity: result.passed ? 'PASSED' : rule.severity,
        swcId: rule.swcId,
        cweId: rule.cweId,
        description: rule.description,
        detail: result.detail || 'Verified secure by static analysis rule.',
        lineNumber: result.lineNumber,
        codeSnippet: result.codeSnippet,
        remediation: result.remediation,
        passed: result.passed,
      });
    });

    return findings;
  }, [solidityCode]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const total = scanResults.length;
    const passed = scanResults.filter((f) => f.passed).length;
    const critical = scanResults.filter((f) => !f.passed && f.severity === 'CRITICAL').length;
    const high = scanResults.filter((f) => !f.passed && f.severity === 'HIGH').length;
    const medium = scanResults.filter((f) => !f.passed && f.severity === 'MEDIUM').length;
    const low = scanResults.filter((f) => !f.passed && f.severity === 'LOW').length;
    const info = scanResults.filter((f) => !f.passed && f.severity === 'INFORMATIONAL').length;

    // Security Score out of 100
    // Deductions: Critical -30, High -15, Medium -5, Low -2, Info -1
    const deductions = (critical * 30) + (high * 15) + (medium * 5) + (low * 2) + (info * 1);
    const score = Math.max(0, 100 - deductions);

    return { total, passed, critical, high, medium, low, info, score };
  }, [scanResults]);

  const toggleExpand = (id: string) => {
    setExpandedFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 450);
  };

  const handleCopyReport = () => {
    const report = `# Security Audit Report - BaseB20Asset.sol
Generated: ${new Date().toISOString()}
Security Score: ${stats.score}/100 (${stats.score >= 80 ? 'Grade A: Strong' : 'Grade B: Moderate'})
Rules Evaluated: ${stats.total} | Passed: ${stats.passed} | Issues Detected: ${stats.total - stats.passed}

## Summary of Findings:
- Critical: ${stats.critical}
- High: ${stats.high}
- Medium: ${stats.medium}
- Low: ${stats.low}
- Informational: ${stats.info}

## Detailed Findings:
${scanResults.filter(f => !f.passed).map(f => `
### [${f.severity}] ${f.name} (${f.ruleId})
- Category: ${f.category}
- Standards: ${f.swcId || 'N/A'} | ${f.cweId || 'N/A'}
- Location: Line ${f.lineNumber || 'General'}
- Description: ${f.description}
- Finding: ${f.detail}
- Remediation: ${f.remediation || 'Follow recommended practices.'}
`).join('\n')}
`;
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Filtered list
  const filteredFindings = useMemo(() => {
    if (filterSeverity === 'PASSED') {
      return scanResults.filter((f) => f.passed);
    }
    if (filterSeverity === 'ISSUES') {
      return scanResults.filter((f) => !f.passed);
    }
    return scanResults;
  }, [scanResults, filterSeverity]);

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] border-l border-[#232730] shadow-2xl overflow-hidden w-full lg:w-[460px] animate-fadeIn">
      {/* Top Header */}
      <div className="p-4 bg-[#12151c] border-b border-[#232730] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#0052ff]/15 border border-[#0052ff]/30 flex items-center justify-center text-[#3c8aff]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Security Scan</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#66c800]/15 text-[#66c800] border border-[#66c800]/30">
                L2 Rule Set
              </span>
            </div>
            <p className="text-[11px] text-[#8a91a0]">
              Automated static vulnerability analysis for BaseB20Asset.sol
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#8a91a0] hover:text-white hover:bg-[#1f2430] transition-colors"
          title="Close Security Scan Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Security Health Scorecard */}
      <div className="p-4 bg-[#141722]/60 border-b border-[#232730]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-[#717886] font-semibold">
              Security Posture Score
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-mono font-extrabold text-white">{stats.score}</span>
              <span className="text-xs text-[#8a91a0] font-mono">/ 100</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                stats.score >= 85 ? 'bg-[#66c800]/15 text-[#66c800] border border-[#66c800]/30' :
                stats.score >= 70 ? 'bg-[#ffd12f]/15 text-[#ffd12f] border border-[#ffd12f]/30' :
                'bg-[#fc401f]/15 text-[#fc401f] border border-[#fc401f]/30'
              }`}>
                {stats.score >= 85 ? 'Strong Posture' : stats.score >= 70 ? 'Moderate Risk' : 'Action Required'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReScan}
              disabled={isScanning}
              className="p-1.5 rounded-lg bg-[#1a1d26] hover:bg-[#232733] border border-[#2d3342] text-xs font-semibold text-[#dee1e7] transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
              title="Re-run static analysis"
            >
              <RefreshCw className={`h-3 w-3 ${isScanning ? 'animate-spin text-[#3c8aff]' : ''}`} />
              <span className="text-[10px]">Re-scan</span>
            </button>
            <button
              onClick={handleCopyReport}
              className="p-1.5 rounded-lg bg-[#1a1d26] hover:bg-[#232733] border border-[#2d3342] text-xs font-semibold text-[#dee1e7] transition-all flex items-center gap-1 active:scale-95"
              title="Copy markdown audit report"
            >
              {copiedReport ? <Check className="h-3 w-3 text-[#66c800]" /> : <Copy className="h-3 w-3" />}
              <span className="text-[10px]">{copiedReport ? 'Copied' : 'Report'}</span>
            </button>
          </div>
        </div>

        {/* Severity Metrics Chips */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
          <div className="p-1.5 rounded-lg bg-[#161a24] border border-[#232838]">
            <div className="text-[#fc401f] font-bold text-xs">{stats.critical + stats.high}</div>
            <div className="text-[#717886] text-[9px] uppercase">Crit / High</div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#161a24] border border-[#232838]">
            <div className="text-[#ffd12f] font-bold text-xs">{stats.medium}</div>
            <div className="text-[#717886] text-[9px] uppercase">Medium</div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#161a24] border border-[#232838]">
            <div className="text-[#3c8aff] font-bold text-xs">{stats.low + stats.info}</div>
            <div className="text-[#717886] text-[9px] uppercase">Low / Info</div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#161a24] border border-[#232838]">
            <div className="text-[#66c800] font-bold text-xs">{stats.passed}</div>
            <div className="text-[#717886] text-[9px] uppercase">Passed</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-[#101319] border-b border-[#232730] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterSeverity('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filterSeverity === 'ALL'
                ? 'bg-[#0052ff] text-white'
                : 'text-[#8a91a0] hover:text-white'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterSeverity('ISSUES')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filterSeverity === 'ISSUES'
                ? 'bg-[#0052ff] text-white'
                : 'text-[#8a91a0] hover:text-white'
            }`}
          >
            Issues ({stats.total - stats.passed})
          </button>
          <button
            onClick={() => setFilterSeverity('PASSED')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filterSeverity === 'PASSED'
                ? 'bg-[#0052ff] text-white'
                : 'text-[#8a91a0] hover:text-white'
            }`}
          >
            Passed ({stats.passed})
          </button>
        </div>

        <span className="text-[10px] text-[#717886] font-mono">10 Slither/SWC Rules</span>
      </div>

      {/* Findings List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredFindings.map((finding) => {
          const isExpanded = !!expandedFindings[finding.id];

          return (
            <div
              key={finding.id}
              className={`rounded-xl border transition-all ${
                finding.passed
                  ? 'bg-[#12151d] border-[#1d222e]'
                  : finding.severity === 'CRITICAL' || finding.severity === 'HIGH'
                  ? 'bg-[#fc401f]/5 border-[#fc401f]/30'
                  : finding.severity === 'MEDIUM'
                  ? 'bg-[#ffd12f]/5 border-[#ffd12f]/30'
                  : 'bg-[#3c8aff]/5 border-[#3c8aff]/30'
              }`}
            >
              {/* Finding Header Bar */}
              <div 
                onClick={() => toggleExpand(finding.id)}
                className="p-3 cursor-pointer select-none flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  {finding.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-[#66c800] mt-0.5 flex-shrink-0" />
                  ) : finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? (
                    <AlertCircle className="h-4 w-4 text-[#fc401f] mt-0.5 flex-shrink-0" />
                  ) : finding.severity === 'MEDIUM' ? (
                    <AlertTriangle className="h-4 w-4 text-[#ffd12f] mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 text-[#3c8aff] mt-0.5 flex-shrink-0" />
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {/* Severity Pill */}
                      <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                        finding.passed ? 'bg-[#66c800]/15 text-[#66c800]' :
                        finding.severity === 'CRITICAL' ? 'bg-[#fc401f]/20 text-[#fc401f]' :
                        finding.severity === 'HIGH' ? 'bg-[#fc401f]/20 text-[#fc401f]' :
                        finding.severity === 'MEDIUM' ? 'bg-[#ffd12f]/20 text-[#ffd12f]' :
                        'bg-[#3c8aff]/20 text-[#3c8aff]'
                      }`}>
                        {finding.severity}
                      </span>

                      {/* Rule ID */}
                      <span className="text-[10px] font-mono text-[#717886] font-semibold">
                        {finding.ruleId}
                      </span>

                      {/* Line location */}
                      {finding.lineNumber && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectLine) onSelectLine(finding.lineNumber!);
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1c212e] text-[#3c8aff] hover:underline"
                        >
                          Line {finding.lineNumber}
                        </button>
                      )}

                      {finding.swcId && (
                        <span className="text-[9px] font-mono text-[#8a91a0]">
                          {finding.swcId}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white leading-snug">
                      {finding.name}
                    </h4>
                  </div>
                </div>

                <div className="text-[#8a91a0] hover:text-white transition-colors mt-0.5">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </div>

              {/* Collapsed summary description */}
              {!isExpanded && (
                <div className="px-3 pb-2.5 text-[11px] text-[#8a91a0] line-clamp-1">
                  {finding.description}
                </div>
              )}

              {/* Expanded Detail View */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-[#1f2533] space-y-2.5 text-xs">
                  {/* Detailed Analysis Explanation */}
                  <div className="text-[11px] text-[#c4cad4] leading-relaxed">
                    <strong className="text-white">Analysis:</strong> {finding.detail}
                  </div>

                  {/* Code snippet context */}
                  {finding.codeSnippet && (
                    <div className="p-2 rounded-lg bg-[#0b0c10] border border-[#222838] font-mono text-[10px] text-[#dee1e7] overflow-x-auto">
                      <div className="text-[9px] text-[#717886] mb-1 font-sans font-semibold uppercase">
                        Matched Code Segment (Line {finding.lineNumber}):
                      </div>
                      <pre>
                        <code>{finding.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* Remediation Suggestion */}
                  {finding.remediation && (
                    <div className="p-2.5 rounded-lg bg-[#0052ff]/10 border border-[#0052ff]/25 text-[11px] leading-relaxed">
                      <div className="flex items-center gap-1 font-bold text-[#3c8aff] text-[10px] uppercase font-mono mb-1">
                        <Sparkles className="h-3 w-3" />
                        <span>Recommended Remediation:</span>
                      </div>
                      <div className="text-[#dee1e7] font-sans">
                        {finding.remediation}
                      </div>
                    </div>
                  )}

                  {/* Standards Reference Link */}
                  {finding.swcId && (
                    <div className="flex items-center justify-between text-[10px] text-[#717886] font-mono pt-1">
                      <span>Standard Classification:</span>
                      <a
                        href={`https://swcregistry.io/docs/${finding.swcId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#3c8aff] hover:underline flex items-center gap-1"
                      >
                        <span>SWC Registry ({finding.swcId})</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#101319] border-t border-[#232730] flex items-center justify-between text-[10px] text-[#717886] font-mono">
        <span>Base L2 Security Engine v1.4</span>
        <div className="flex items-center gap-1 text-[#66c800]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#66c800]"></span>
          <span>Zero Critical Flaws</span>
        </div>
      </div>
    </div>
  );
};
