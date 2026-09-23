export type NetworkId = 'base-mainnet' | 'base-sepolia' | 'base-vibenet';

export interface BaseNetwork {
  id: NetworkId;
  name: string;
  chainId: number;
  currency: string;
  rpcUrl: string;
  explorerUrl: string;
  blockTime: string;
  isTestnet: boolean;
  status: 'operational' | 'congested' | 'degraded';
}

export interface AssetMetadata {
  name: string;
  symbol: string;
  decimals: number;
  supplyCap: number;
  currentSupply: number;
  multiplier: number; // in WAD (1.0 = 10^18)
  paused: boolean;
  pausedScopes: ('TRANSFER' | 'MINT' | 'BURN')[];
  assetId: string; // e.g. "EXAMPLE-CLASS-A"
  tokenAddress: string;
  policyId: number;
  roles: {
    minter: string;
    operator: string;
    metadataAdmin: string;
    pauseAdmin: string;
  };
}

export interface CapTableHolder {
  name: string;
  address: string;
  rawBalance: number;
  isAllowlisted: boolean;
  isBlocked: boolean;
  color: string;
  category: 'Founder' | 'Investor' | 'Employee' | 'Treasury' | 'Public';
}

export type ScenarioFlow = 
  | 'create'
  | 'issue'
  | 'restrict'
  | 'cancel'
  | 'dividend'
  | 'split'
  | 'pause';

export interface FlowStep {
  stage: string;
  action: string;
  text: string;
  summary: [string, string | { v: string; mono?: boolean }][];
  caption?: string;
}

export interface FlowConfig {
  id: ScenarioFlow;
  label: string;
  title: string;
  badge: string;
  erc20Note: string;
  description: string;
  steps: FlowStep[];
}

export interface TxLogEntry {
  id: string;
  timestamp: string;
  timeFormatted: string;
  level: 'EVENT' | 'INFO' | 'ERROR' | 'PENDING';
  name: string;
  detail: string;
  kind: 'ok' | 'err' | 'info' | 'pending';
  hash?: string;
  blockNumber?: number;
  gasUsed?: number;
  gasFeeUsd?: string;
  explorerUrl?: string;
}

export interface WalletAccount {
  address: string;
  isConnected: boolean;
  isSmartWallet: boolean;
  passkeyName?: string;
  balanceEth: number;
  balanceToken: number;
  networkId: NetworkId;
}
