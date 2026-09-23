import { BaseNetwork, AssetMetadata, CapTableHolder, FlowConfig } from '../types/base';

export const BASE_NETWORKS: Record<string, BaseNetwork> = {
  'base-mainnet': {
    id: 'base-mainnet',
    name: 'Base Mainnet',
    chainId: 8453,
    currency: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    blockTime: '2.0s',
    isTestnet: false,
    status: 'operational',
  },
  'base-sepolia': {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    currency: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    blockTime: '2.0s',
    isTestnet: true,
    status: 'operational',
  },
  'base-vibenet': {
    id: 'base-vibenet',
    name: 'Base Vibenet (B20 Devnet)',
    chainId: 84538453,
    currency: 'ETH',
    rpcUrl: 'https://api.vibes.base.org/api/vibenet/account/rpc',
    explorerUrl: 'https://basescan.org',
    blockTime: '1.0s',
    isTestnet: true,
    status: 'operational',
  },
};

export const INITIAL_HOLDERS: CapTableHolder[] = [
  {
    name: 'Alice (Co-Founder)',
    address: '0x3cA1f8E5C4197B4fF8e404bA3587b10f2D897A49',
    rawBalance: 600,
    isAllowlisted: true,
    isBlocked: false,
    color: '#66c800',
    category: 'Founder',
  },
  {
    name: 'Bob (Angel Investor)',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    rawBalance: 400,
    isAllowlisted: true,
    isBlocked: false,
    color: '#ffd12f',
    category: 'Investor',
  },
  {
    name: 'Carol (Retail Waitlist)',
    address: '0x1Db3439a222C519ab44711147714ef04dBA87A38',
    rawBalance: 0,
    isAllowlisted: false,
    isBlocked: false,
    color: '#fc401f',
    category: 'Public',
  },
  {
    name: 'Issuer Treasury',
    address: '0x8453000000000000000000000000000000000001',
    rawBalance: 0,
    isAllowlisted: true,
    isBlocked: false,
    color: '#0052ff',
    category: 'Treasury',
  },
];

export const INITIAL_ASSET: AssetMetadata = {
  name: 'Example Corp Class A',
  symbol: 'EXM',
  decimals: 6,
  supplyCap: 1_000_000,
  currentSupply: 1000,
  multiplier: 1.0,
  paused: false,
  pausedScopes: [],
  assetId: 'EXAMPLE-CLASS-A',
  tokenAddress: '0xB20019e07cA8F6A3E147eFbA9D987116e7a18453',
  policyId: 2,
  roles: {
    minter: '0x8453000000000000000000000000000000000001',
    operator: '0x8453000000000000000000000000000000000001',
    metadataAdmin: '0x8453000000000000000000000000000000000001',
    pauseAdmin: '0x8453000000000000000000000000000000000001',
  },
};

export const PRESET_RWA_TEMPLATES = [
  {
    name: 'Example Corp Class A',
    symbol: 'EXM',
    type: 'Tokenized Equity',
    decimals: 6,
    supplyCap: 1000000,
    assetId: 'EXAMPLE-CLASS-A',
    description: 'Corporate share token with dynamic multiplier for stock splits and SEC Reg D compliance allowlist.',
  },
  {
    name: 'Base US Treasury 3M Yield',
    symbol: 'bUSTB',
    type: 'Sovereign Debt / Fixed Income',
    decimals: 6,
    supplyCap: 50000000,
    assetId: 'US-T-BILL-Q3-2026',
    description: 'Short-term US government debt backing with automated yield distributions and institutional allowlists.',
  },
  {
    name: '432 Park Ave Commercial Tier 1',
    symbol: 'MHTN',
    type: 'Commercial Real Estate',
    decimals: 6,
    supplyCap: 250000,
    assetId: 'NYC-RE-432-PRK',
    description: 'Fractionalized high-yield Manhattan trophy commercial asset with rental cashflow dividend announcements.',
  },
  {
    name: 'Swiss Vault Physical Gold Bar',
    symbol: 'GLD20',
    type: 'Allocated Commodity',
    decimals: 8,
    supplyCap: 100000,
    assetId: 'GLD-ZURICH-VAULT-9999',
    description: '1 token = 1 gram of 99.99% pure physical bullion stored in Swiss vaults with real-time audit IDs.',
  },
];

export const B20_SCENARIO_FLOWS: FlowConfig[] = [
  {
    id: 'create',
    label: 'Create',
    title: 'Create a stock token',
    badge: 'Standard Setup',
    erc20Note: 'B20 supplies a shared Asset standard instead of a custom token contract.',
    description: 'Define a tokenized share class with six-decimal precision, technical issuance ceiling, issuer roles, and metadata identifier.',
    steps: [
      {
        stage: 'Create',
        action: 'Create EXM Token',
        text: 'Define Example Corp Class A with six-decimal share precision via the native Base B20 Asset factory.',
        summary: [
          ['Operation', 'createB20'],
          ['Symbol', 'EXM'],
          ['Decimals', { v: '6', mono: true }],
          ['Standard', 'B20 Asset (ERC-20 compatible)'],
          ['Network', 'Base Vibenet (84538453)'],
        ],
        caption: 'The factory creates an ERC-20-compatible B20 Asset token with minimal deployment overhead on Base.',
      },
      {
        stage: 'Controls',
        action: 'Apply Issuer Controls',
        text: 'Set issuer roles and an enforceable supply ceiling in the same atomic transaction.',
        summary: [
          ['Operation', 'configureAssetControls'],
          ['Roles', 'MINT_ROLE, OPERATOR_ROLE, METADATA_ROLE'],
          ['Supply Cap', { v: '1,000,000 EXM', mono: true }],
          ['Target', 'Issuer Contract'],
        ],
        caption: 'The technical ceiling strictly bounds onchain token supply according to authorized board minutes.',
      },
      {
        stage: 'Identify',
        action: 'Add Legal Identifier',
        text: 'Attach an issuer-defined metadata identifier for regulatory integration and legal entity records.',
        summary: [
          ['Operation', 'updateAssetMetadata'],
          ['Field', { v: 'asset-id', mono: true }],
          ['Value', { v: '"EXAMPLE-CLASS-A"', mono: true }],
          ['Storage', 'Onchain Base Metadata Table'],
        ],
        caption: 'B20 stores the issuer-defined legal identifier without relying on fragile off-chain pinners.',
      },
    ],
  },
  {
    id: 'issue',
    label: 'Issue',
    title: 'Issue shares to approved holders',
    badge: 'Cap-Table Distribution',
    erc20Note: 'The Asset variant batches a cap-table distribution into one cost-effective transaction.',
    description: 'Add initial verified holders (Alice & Bob) to the compliance allowlist and batch mint initial authorized shares.',
    steps: [
      {
        stage: 'Approve',
        action: 'Approve Qualified Holders',
        text: 'Alice and Bob complete investor onboarding and are approved to hold Example Corp shares on the Policy Registry.',
        summary: [
          ['Operation', 'updateAllowlist'],
          ['Recipients', 'Alice, Bob'],
          ['Policy Type', 'Rule #2 (ALLOWLIST)'],
          ['Status', 'Approved for MINT & TRANSFER'],
        ],
        caption: 'The unified policy governs both primary issuance and secondary peer transfers.',
      },
      {
        stage: 'Issue',
        action: 'Batch Mint 1,000 Shares',
        text: 'Distribute 600 shares to Alice and 400 shares to Bob in an atomic multicall.',
        summary: [
          ['Operation', 'batchMint'],
          ['Distribution', 'Alice: 600 EXM, Bob: 400 EXM'],
          ['Total Minted', { v: '1,000 EXM', mono: true }],
          ['Gas on Base', { v: '<$0.002 (L2 sub-cent)', mono: true }],
        ],
        caption: 'One atomic batch records the complete initial capitalization table.',
      },
    ],
  },
  {
    id: 'restrict',
    label: 'Restrict',
    title: 'Keep shares with eligible holders',
    badge: 'Compliance Gating',
    erc20Note: 'The shared Policy Registry gates issuance and transfers without a custom contract hook.',
    description: 'Demonstrate how unapproved accounts (Carol) are blocked from receiving shares via precompile reverts.',
    steps: [
      {
        stage: 'Policy',
        action: 'Bind Policy Scopes',
        text: 'Verify Alice and Bob are active on Policy #2, then bind the policy to MINT, SENDER, and RECEIVER scopes.',
        summary: [
          ['Operation', 'createPolicy & bindScopes'],
          ['Policy', 'Registry #2 · ALLOWLIST'],
          ['Enforced Scopes', 'MINT_RECEIVER, TRANSFER_SENDER, TRANSFER_RECEIVER'],
          ['Verified', 'Alice, Bob'],
        ],
        caption: 'Accounts are denied by default until explicitly authorized by the compliance administrator.',
      },
      {
        stage: 'Issue',
        action: 'Issue 100 Shares to Alice',
        text: 'Issue 100 shares to verified holder Alice.',
        summary: [
          ['Operation', 'mint'],
          ['Recipient', 'Alice'],
          ['Amount', { v: '100 EXM', mono: true }],
          ['Policy Check', 'PASSED (Alice is whitelisted)'],
        ],
        caption: 'Alice successfully receives 100 shares.',
      },
      {
        stage: 'Enforce',
        action: 'Attempt Transfer to Carol',
        text: 'Alice attempts to transfer 20 shares to unverified user Carol. Observe the atomic rejection.',
        summary: [
          ['Operation', 'transfer(to: Carol, amount: 20)'],
          ['From', 'Alice (Approved)'],
          ['To', 'Carol (Not on allowlist)'],
          ['Expected Result', { v: 'REVERT: PolicyForbids', mono: true }],
        ],
        caption: 'Carol cannot receive shares until KYC verification is confirmed and she is granted allowlist clearance.',
      },
    ],
  },
  {
    id: 'cancel',
    label: 'Cancel',
    title: 'Cancel shares from a blocked holder',
    badge: 'Court / Sanction Action',
    erc20Note: 'B20 exposes a dedicated burn path for a holder denied by the sender policy.',
    description: 'If a holder violates shareholder agreements or is sanctioned, cancel their shares directly to 0x0.',
    steps: [
      {
        stage: 'Fund',
        action: 'Establish Bob Position',
        text: 'Bob holds 100 EXM and is currently in good standing.',
        summary: [
          ['Operation', 'mint'],
          ['Holder', 'Bob'],
          ['Balance', { v: '100 EXM', mono: true }],
          ['Standing', 'Active / Eligible'],
        ],
        caption: 'Bob begins with an active verified position.',
      },
      {
        stage: 'Block',
        action: 'Revoke Bob Eligibility',
        text: 'Remove Bob from the shareholder allowlist due to regulatory enforcement or compliance breach.',
        summary: [
          ['Operation', 'updateAllowlist(Bob, allowed: false)'],
          ['Holder', 'Bob'],
          ['Status', 'Blocked / Non-compliant'],
          ['Transfer Ability', 'REVOKED (TRANSFER_SENDER)'],
        ],
        caption: 'Bob is denied by the token transfer sender policy.',
      },
      {
        stage: 'Cancel',
        action: 'Execute burnBlocked',
        text: 'Cancel and burn the 100 blocked shares; shares are destroyed rather than seized into company treasury.',
        summary: [
          ['Operation', 'burnBlocked'],
          ['Target', 'Bob'],
          ['Amount', { v: '100 EXM', mono: true }],
          ['Destination', { v: '0x0000...0000 (Burned)', mono: true }],
        ],
        caption: 'Total outstanding shares are reduced atomically onchain.',
      },
    ],
  },
  {
    id: 'dividend',
    label: 'Dividend',
    title: 'Announce a stock dividend',
    badge: 'Corporate Action',
    erc20Note: 'B20 brackets the share distribution with an onchain description and URI.',
    description: 'Issue a 5% stock dividend to current shareholders with tamper-proof onchain corporate action announcements.',
    steps: [
      {
        stage: 'Record',
        action: 'Record Date Snapshot',
        text: 'Determine holder baseline on record date: Alice holds 600 shares and Bob holds 400 shares (1,000 outstanding).',
        summary: [
          ['Operation', 'Snapshot / Record Date'],
          ['Alice Balance', { v: '600 EXM (60%)', mono: true }],
          ['Bob Balance', { v: '400 EXM (40%)', mono: true }],
          ['Total Outstanding', { v: '1,000 EXM', mono: true }],
        ],
        caption: 'The record date establishes shareholder entitlement for the 5% dividend distribution.',
      },
      {
        stage: 'Announce',
        action: 'Publish Announcement & Batch Mint',
        text: 'Publish the corporate notice onchain and distribute 30 shares to Alice and 20 shares to Bob in one transaction.',
        summary: [
          ['Operation', 'announceDistribution'],
          ['Action ID', { v: 'DIV-2026-Q3', mono: true }],
          ['Description', '5% Annual Stock Dividend'],
          ['Distributed', { v: '50 EXM (30 to Alice, 20 to Bob)', mono: true }],
          ['Audit URI', 'ipfs://bafybeicorp/dividend-resolution-2026'],
        ],
        caption: 'This issues additional equity units into investor accounts without requiring manual claim procedures.',
      },
    ],
  },
  {
    id: 'split',
    label: 'Split',
    title: 'Run a 2-for-1 stock split',
    badge: 'WAD Multiplier',
    erc20Note: 'The Asset multiplier changes displayed balances without migrating holders.',
    description: 'Execute a board-approved 2-for-1 stock split using Base B20 WAD multipliers in a single zero-gas-migration call.',
    steps: [
      {
        stage: 'Load',
        action: 'Check Initial Multiplier',
        text: 'Verify Alice holds 100 raw shares and Bob holds 50. Multiplier is currently 1.0 WAD (1e18).',
        summary: [
          ['Operation', 'multiplier()'],
          ['Current Multiplier', { v: '1.0 WAD (1.000000000000000000)', mono: true }],
          ['Alice Displayed', { v: '100 EXM', mono: true }],
          ['Bob Displayed', { v: '50 EXM', mono: true }],
        ],
        caption: 'At 1.0 WAD multiplier, raw storage balances and displayed balances are identical.',
      },
      {
        stage: 'Split',
        action: 'Apply 2.0 WAD Multiplier',
        text: 'Update multiplier to 2.0 WAD. All holder balances double instantly without executing thousands of individual transfers!',
        summary: [
          ['Operation', 'updateMultiplier'],
          ['New Multiplier', { v: '2.0 WAD (2e18)', mono: true }],
          ['Alice New Balance', { v: '200 EXM (Doubled)', mono: true }],
          ['Bob New Balance', { v: '100 EXM (Doubled)', mono: true }],
          ['Total Gas Spent', { v: '21,432 gas (~$0.0001 on Base)', mono: true }],
        ],
        caption: 'Displayed balances double instantly across all DEXs, wallets, and custodians with zero cap-table migration overhead.',
      },
    ],
  },
  {
    id: 'pause',
    label: 'Pause',
    title: 'Pause transfers during an incident',
    badge: 'Granular Circuit Breaker',
    erc20Note: 'B20 separates transfer, mint, and burn pause controls.',
    description: 'Halt secondary transfers during an investigation while keeping minting and redemption operations active.',
    steps: [
      {
        stage: 'Fund',
        action: 'Load Initial State',
        text: 'Alice holds 100 EXM before any circuit breaker or maintenance window is initiated.',
        summary: [
          ['Operation', 'checkState'],
          ['Alice Balance', { v: '100 EXM', mono: true }],
          ['Transfer Status', 'ACTIVE (Unpaused)'],
        ],
        caption: 'Baseline trading condition before incident containment.',
      },
      {
        stage: 'Pause',
        action: 'Pause TRANSFER Scope Only',
        text: 'Circuit breaker triggered: pause TRANSFER scope. Note that MINT and BURN scopes remain active!',
        summary: [
          ['Operation', 'setTransfersPaused(true)'],
          ['Scope Paused', { v: 'TRANSFER', mono: true }],
          ['Scope Active', { v: 'MINT, BURN (Operational)', mono: true }],
          ['Network', 'Base Vibenet'],
        ],
        caption: 'Granular pausing isolates market risk without paralyzing primary issuance or regulatory redemptions.',
      },
      {
        stage: 'Enforce',
        action: 'Alice Transfer Fails with EnforcedPause',
        text: 'Alice tries to transfer 10 shares to Bob. The transaction is instantly reverted.',
        summary: [
          ['Operation', 'transfer(Bob, 10)'],
          ['From', 'Alice'],
          ['Expected Revert', { v: 'EnforcedPause("TRANSFER")', mono: true }],
          ['State', 'Protected / Halted'],
        ],
        caption: 'The precompile rejects the transfer while circuit breaker is engaged.',
      },
      {
        stage: 'Issue',
        action: 'Issuer Still Issues 25 Shares to Bob',
        text: 'Demonstrating independence: the issuer mints 25 authorized shares to Bob even while transfers are frozen.',
        summary: [
          ['Operation', 'mint(Bob, 25)'],
          ['Status', { v: 'SUCCESSFUL (Mint scope unpaused)', mono: true }],
          ['Bob New Balance', { v: '25 EXM', mono: true }],
        ],
        caption: 'Orthogonal pause controls prevent collateral damage to scheduled company operations.',
      },
    ],
  },
];

export const B20_SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BaseB20Asset
 * @notice Official implementation of the Base B20 Asset Standard for Real-World Assets.
 * Configurable precision, dynamic WAD multiplier, policy allowlists, and granular pause.
 * Deployed natively on Base (Chain ID 8453 / 84532 / 84538453).
 */

interface IPolicyRegistry {
    enum Scope { MINT_RECEIVER, TRANSFER_SENDER, TRANSFER_RECEIVER, BURN_SENDER }
    function isAllowed(uint256 policyId, Scope scope, address account) external view returns (bool);
}

contract BaseB20Asset {
    // --- ERC-20 Metadata ---
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public supplyCap;
    uint256 public rawTotalSupply;

    // --- B20 Multiplier (1.0 WAD = 1e18) ---
    uint256 public multiplier = 1e18;

    // --- Balances (Stored in raw units) ---
    mapping(address => uint256) private _rawBalances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // --- Extra Metadata ---
    mapping(string => string) private _extraMetadata;

    // --- Roles & Permissions ---
    bytes32 public constant MINT_ROLE = keccak256("MINT_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant METADATA_ROLE = keccak256("METADATA_ROLE");
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    mapping(bytes32 => mapping(address => bool)) public hasRole;

    // --- Policy Registry ---
    IPolicyRegistry public policyRegistry;
    mapping(uint8 => uint256) public policyScopes; // Scope -> policyId

    // --- Granular Pause ---
    bool public transfersPaused;
    bool public mintingPaused;
    bool public burningPaused;

    // --- Events ---
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MultiplierUpdated(uint256 oldMultiplier, uint256 newMultiplier);
    event SupplyCapUpdated(uint256 newCap);
    event ExtraMetadataUpdated(string indexed key, string value);
    event Announcement(string id, string description, string uri);
    event EndAnnouncement(string id);
    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);
    event PolicyScopeUpdated(uint8 indexed scope, uint256 policyId);
    event Paused(string scope);
    event Unpaused(string scope);

    // --- Custom Errors ---
    error PolicyForbids(string scope, address account);
    error EnforcedPause(string scope);
    error SupplyCapExceeded(uint256 requested, uint256 cap);
    error Unauthorized();

    modifier onlyRole(bytes32 role) {
        if (!hasRole[role][msg.sender]) revert Unauthorized();
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _supplyCap,
        address _admin
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        supplyCap = _supplyCap;

        hasRole[MINT_ROLE][_admin] = true;
        hasRole[OPERATOR_ROLE][_admin] = true;
        hasRole[METADATA_ROLE][_admin] = true;
        hasRole[PAUSE_ROLE][_admin] = true;
    }

    // --- Multiplier & Scaled Balance Queries ---
    function totalSupply() public view returns (uint256) {
        return (rawTotalSupply * multiplier) / 1e18;
    }

    function balanceOf(address account) public view returns (uint256) {
        return (_rawBalances[account] * multiplier) / 1e18;
    }

    function rawBalanceOf(address account) external view returns (uint256) {
        return _rawBalances[account];
    }

    // --- Multiplier Update (Stock Splits) ---
    function updateMultiplier(uint256 newMultiplier) external onlyRole(OPERATOR_ROLE) {
        require(newMultiplier > 0, "Multiplier must be positive");
        emit MultiplierUpdated(multiplier, newMultiplier);
        multiplier = newMultiplier;
    }

    // --- Minting & Cap-table Issuance ---
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyRole(MINT_ROLE) {
        if (mintingPaused) revert EnforcedPause("MINT");
        require(recipients.length == amounts.length, "Length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }

    function _mint(address to, uint256 scaledAmount) internal {
        uint256 rawAmount = (scaledAmount * 1e18) / multiplier;
        if (rawTotalSupply + rawAmount > supplyCap) revert SupplyCapExceeded(rawTotalSupply + rawAmount, supplyCap);

        // Policy Check
        uint256 policyId = policyScopes[uint8(IPolicyRegistry.Scope.MINT_RECEIVER)];
        if (policyId > 0 && address(policyRegistry) != address(0)) {
            if (!policyRegistry.isAllowed(policyId, IPolicyRegistry.Scope.MINT_RECEIVER, to)) {
                revert PolicyForbids("MINT_RECEIVER", to);
            }
        }

        rawTotalSupply += rawAmount;
        _rawBalances[to] += rawAmount;
        emit Transfer(address(0), to, scaledAmount);
    }

    // --- Transfer with Policy Compliance ---
    function transfer(address to, uint256 scaledAmount) external returns (bool) {
        if (transfersPaused) revert EnforcedPause("TRANSFER");

        // Verify sender and receiver policies
        _checkTransferPolicy(msg.sender, to);

        uint256 rawAmount = (scaledAmount * 1e18) / multiplier;
        require(_rawBalances[msg.sender] >= rawAmount, "Insufficient balance");

        _rawBalances[msg.sender] -= rawAmount;
        _rawBalances[to] += rawAmount;
        emit Transfer(msg.sender, to, scaledAmount);
        return true;
    }

    function _checkTransferPolicy(address from, address to) internal view {
        if (address(policyRegistry) == address(0)) return;

        uint256 senderPolicy = policyScopes[uint8(IPolicyRegistry.Scope.TRANSFER_SENDER)];
        if (senderPolicy > 0 && !policyRegistry.isAllowed(senderPolicy, IPolicyRegistry.Scope.TRANSFER_SENDER, from)) {
            revert PolicyForbids("TRANSFER_SENDER", from);
        }

        uint256 receiverPolicy = policyScopes[uint8(IPolicyRegistry.Scope.TRANSFER_RECEIVER)];
        if (receiverPolicy > 0 && !policyRegistry.isAllowed(receiverPolicy, IPolicyRegistry.Scope.TRANSFER_RECEIVER, to)) {
            revert PolicyForbids("TRANSFER_RECEIVER", to);
        }
    }

    // --- Burn Blocked Units (Court/Sanctions enforcement) ---
    function burnBlocked(address from, uint256 scaledAmount) external onlyRole(OPERATOR_ROLE) {
        uint256 rawAmount = (scaledAmount * 1e18) / multiplier;
        require(_rawBalances[from] >= rawAmount, "Insufficient balance");

        _rawBalances[from] -= rawAmount;
        rawTotalSupply -= rawAmount;
        emit Transfer(from, address(0), scaledAmount);
    }

    // --- Corporate Announcements (Dividends) ---
    function announceDistribution(
        string calldata id,
        string calldata description,
        string calldata uri,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyRole(OPERATOR_ROLE) {
        emit Announcement(id, description, uri);
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
        emit EndAnnouncement(id);
    }

    // --- Granular Pause Controls ---
    function setTransfersPaused(bool paused) external onlyRole(PAUSE_ROLE) {
        transfersPaused = paused;
        if (paused) emit Paused("TRANSFER"); else emit Unpaused("TRANSFER");
    }
}
`;
