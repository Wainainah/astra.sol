# Astra Protocol V7 - AI Agent Guide

> **Last Updated**: February 2026  
> **Project**: Astra Protocol V7 - Token Launchpad with Bonding Curves on Solana

---

## Project Overview

Astra Protocol V7 is a complete rewrite of a token launchpad platform on Solana, featuring USD-based economics, simplified state model, and cleaner architecture. It enables users to create and trade tokens on a bonding curve before graduating to a Raydium AMM pool.

### Key Differentiators from V6
- **USD-Based Economics**: All monetary values configured in USD, converted to SOL at runtime using Pyth price feed
- **Simplified State Model**: Removed the 92/8 locked/unlocked split - all shares are 100% unlocked
- **Dynamic Share Issuance**: No share cap - shares minted dynamically as users buy
- **Market Cap Graduation**: Graduate at $42,000 USD market cap (not share count)
- **Graduation Gates**: Off-chain checks for minimum 100 holders and max 10% concentration

---

## Technology Stack

### Smart Contracts (`/contracts/`)
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Anchor | 0.32.1 |
| Language | Rust | Edition 2021 |
| Oracle | Pyth Network | 0.5.0 |

### Frontend (`/frontend/`)
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 14.2.0 |
| Language | TypeScript | 5.3.3 |
| Styling | Tailwind CSS | 3.4.1 |
| UI Components | shadcn/ui | Latest |
| State Management | Zustand | 4.5.2 |
| Data Fetching | TanStack Query | 5.28.0 |
| ORM | Drizzle ORM | 0.30.0 |
| Database | PostgreSQL (Neon) | Serverless |

### External Integrations
- **Wallet**: Solana Wallet Adapter (@solana/wallet-adapter-react)
- **DEX**: Jupiter Aggregator (post-graduation trading)
- **Storage**: Pinata (IPFS) or Cloudflare R2
- **Comments**: Appwrite
- **RPC/Webhooks**: Helius
- **Price Feed**: Pyth Network

### Cron Scripts (`/scripts/cron/`)
- TypeScript/Node.js scripts for automated tasks
- GitHub Actions scheduled workflows

---

## Project Structure

```
astra.sol/
├── contracts/                    # Rust/Anchor smart contracts
│   ├── Anchor.toml              # Anchor configuration
│   ├── Cargo.toml               # Workspace manifest
│   └── programs/astra/
│       ├── Cargo.toml           # Program manifest
│       └── src/
│           ├── lib.rs           # Program entrypoint & IDL
│           ├── constants.rs     # Protocol configuration
│           ├── curve.rs         # Bonding curve math
│           ├── errors.rs        # Custom error codes
│           ├── events.rs        # Anchor events
│           ├── instructions/    # 15 instruction handlers
│           │   ├── buy.rs
│           │   ├── sell.rs
│           │   ├── create_launch.rs
│           │   ├── graduate.rs
│           │   ├── force_graduate.rs
│           │   ├── claim_tokens.rs
│           │   ├── claim_vesting.rs
│           │   ├── claim_creator_fees.rs
│           │   ├── claim_refund.rs
│           │   ├── enable_refund.rs
│           │   ├── push_refund.rs
│           │   ├── close_launch.rs
│           │   ├── poke.rs
│           │   └── initialize.rs
│           └── state/           # Account state definitions
│               ├── config.rs
│               ├── launch.rs
│               ├── position.rs
│               ├── vault.rs
│               └── creator_stats.rs
│
├── frontend/                     # Next.js 14 application
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── api/             # API routes (portfolio, tokens, webhooks)
│   │   │   ├── create/          # Token creation page
│   │   │   ├── portfolio/       # Portfolio tracking page
│   │   │   ├── token/[address]/ # Token detail page
│   │   │   └── profile/         # User profile page
│   │   ├── components/
│   │   │   ├── create/          # ImageCropper, ImageUpload, forms
│   │   │   ├── layout/          # Header, Sidebar, SearchModal
│   │   │   ├── portfolio/       # HoldingsTable, PortfolioSummary
│   │   │   ├── profile/         # Vesting, Claims, Holdings components
│   │   │   ├── providers/       # SolanaProvider, AuthProvider, ThemeProvider
│   │   │   ├── token/           # Trade, Charts, Comments, Gates
│   │   │   ├── trade/           # BuyForm, SellForm, JupiterPlugin
│   │   │   └── ui/              # shadcn/ui primitive components
│   │   ├── db/
│   │   │   ├── schema.ts        # Drizzle ORM schema (V7 simplified)
│   │   │   └── index.ts         # Database connection
│   │   ├── hooks/               # React Query hooks for on-chain actions
│   │   │   ├── useBuy.ts
│   │   │   ├── useSell.ts
│   │   │   ├── useClaim.ts
│   │   │   ├── usePositionValue.ts
│   │   │   ├── useTokenPrice.ts
│   │   │   ├── useGraduationGates.ts
│   │   │   └── ... (17 total hooks)
│   │   ├── lib/
│   │   │   ├── api-types.ts     # TypeScript type definitions
│   │   │   ├── constants.ts     # V7 constants (mirror on-chain)
│   │   │   ├── curve.ts         # Bonding curve math (mirror on-chain)
│   │   │   ├── graduation-gates.ts  # Gate checking logic
│   │   │   ├── jupiter.ts       # Jupiter API wrapper
│   │   │   ├── appwrite.ts      # Appwrite client for comments
│   │   │   └── utils.ts         # Utility functions
│   │   ├── services/
│   │   │   └── comments.ts      # Comments API service
│   │   └── types/
│   │       └── jupiter.d.ts     # Jupiter type definitions
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── .env.example
│
├── scripts/cron/                 # Automated cron scripts
│   ├── update-sol-price.ts      # Update SOL/USD price
│   ├── migrate-tokens.ts        # Process token claims
│   ├── sweep-fees.ts            # Collect protocol fees
│   ├── enable-refunds.ts        # Enable refund mode
│   ├── process-refunds.ts       # Process refund queue
│   ├── package.json
│   └── tsconfig.json
│
└── .github/workflows/            # CI/CD workflows
    ├── cron-migrate.yml         # Token migration cron
    ├── cron-sweep.yml           # Fee sweep cron
    ├── cron-refund-enable.yml   # Refund enable cron
    ├── cron-refund-process.yml  # Refund processing cron
    └── update-sol-price.yml     # Price update cron
```

---

## Build and Development Commands

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Database commands
npm run db:generate    # Generate migrations
npm run db:migrate     # Run migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio
npm run db:seed        # Seed database
```

### Smart Contracts

```bash
cd contracts

# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test

# Update program ID (after deployment)
# 1. Update Anchor.toml
# 2. Update lib.rs declare_id! macro
# 3. Update frontend .env.local
```

### Cron Scripts

```bash
cd scripts/cron

# Install dependencies
npm install

# Run individual scripts
npm run update-sol-price
npm run migrate-tokens
npm run sweep-fees
npm run enable-refunds
npm run process-refunds
```

---

## Key Constants and Configuration

### On-Chain Constants (Rust)
| Constant | Value | Description |
|----------|-------|-------------|
| `GRADUATION_MARKET_CAP_USD` | 42,000 | USD market cap for graduation |
| `MIN_SEED_USD` | 40 | Minimum creator seed in USD |
| `MAX_SEED_USD` | 20,000 | Maximum creator seed in USD |
| `TOKENS_FOR_HOLDERS` | 800M | Tokens distributed to share holders |
| `TOKENS_FOR_LP` | 200M | Tokens for Raydium LP |
| `VESTING_DURATION_SECONDS` | 3,628,800 | 42 days in seconds |
| `LAUNCH_DURATION_SECONDS` | 604,800 | 7 days in seconds |
| `CURVE_SLOPE` | 781,250 | Bonding curve slope |
| `CURVE_SCALE` | 1T | Bonding curve scale |
| `TOTAL_FEE_BPS` | 100 | 1% total fee |

### Frontend Constants (TypeScript)
Located in `frontend/src/lib/constants.ts` - mirrors on-chain values for calculations.

### Environment Variables
Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SOLANA_NETWORK` - devnet or mainnet-beta
- `NEXT_PUBLIC_RPC_ENDPOINT` - Solana RPC endpoint
- `NEXT_PUBLIC_PROGRAM_ID` - Deployed program ID
- `NEXT_PUBLIC_PYTH_SOL_USD` - Pyth SOL/USD price feed
- `NEXT_PUBLIC_PINATA_JWT` - Pinata IPFS JWT
- `APPWRITE_API_KEY` - Appwrite API key
- `HELIUS_API_KEY` - Helius API key

---

## Code Style Guidelines

### TypeScript/React
- **Strict TypeScript**: All files must be fully typed (no `any`)
- **Functional Components**: Use function declarations, not arrow functions
- **Hooks Naming**: `use[Action][Subject]` (e.g., `useBuy`, `useTokenPrice`)
- **Component Naming**: PascalCase for components, camelCase for utilities
- **Imports**: Use path aliases (`@/components`, `@/lib`, `@/hooks`)
- **State Management**: Zustand for global state, React Query for server state

### Rust
- **Naming**: snake_case for functions/variables, PascalCase for types
- **Comments**: Document all public functions with `///`
- **Errors**: Use custom error types from `errors.rs`
- **Safety**: All math operations checked for overflow

### Database Schema Conventions
- Use `astra_sol` PostgreSQL schema namespace
- Table names: plural, snake_case
- Column names: camelCase in TS, snake_case in DB
- Indexes on foreign keys and frequently queried fields
- Use `bigint` with `{ mode: "bigint" }` for large numbers

---

## Testing Instructions

### Pre-Deployment Testing Checklist
- [ ] Can create token with image cropping
- [ ] Can buy shares with USD presets
- [ ] Position value updates correctly
- [ ] Sell warning shows "leaving money on table"
- [ ] Can trade post-graduation via Jupiter
- [ ] Can claim tokens (proportional distribution)
- [ ] Can claim vesting (creator only)
- [ ] Graduation gates checked off-chain
- [ ] Comments work (Appwrite)
- [ ] Portfolio shows paper gains correctly
- [ ] Profile loads with all sections
- [ ] Search works across tokens

### Contract Testing
```bash
cd contracts
anchor test
```

### Frontend Testing
```bash
cd frontend
npm run type-check  # Ensure no TypeScript errors
npm run lint        # Check for linting issues
```

---

## Security Considerations

### Smart Contract Security
- **Pyth Oracle**: All USD values converted using verified price feed
- **Authority Checks**: Sensitive operations require operator/authority signatures
- **Math Safety**: Overflow checks enabled in release builds
- **Refund Guarantee**: Users can always claim refund after 7 days if launch fails
- **Anti-Rug**: Creator shares vest over 42 days

### Frontend Security
- **Wallet Security**: Never store private keys, only use wallet adapter
- **CORS**: API routes configured with proper CORS headers
- **Secrets**: All sensitive keys in server-side environment variables only
- **Webhooks**: Helius webhooks validated with secret

### Cron Job Security
- **CRON_SECRET**: API routes require secret header for cron jobs
- **Concurrency**: GitHub Actions workflows use concurrency controls
- **Notifications**: Slack notifications on failure

---

## Architecture Notes

### Bonding Curve Math
Quadratic bonding curve formula:
```
price = (slope * shares^2) / scale
```

- **Slope**: 781,250
- **Scale**: 1,000,000,000,000 (1T)
- Price increases quadratically as shares are issued

### Graduation Flow
1. Market cap approaches $42K → emits `ReadyToGraduate` event
2. Cron job checks off-chain gates (100+ holders, <10% concentration)
3. Operator calls `graduate()` once gates pass
4. Contract distributes 800M tokens proportionally to share holders
5. Creates Raydium pool with 200M tokens + SOL

### Sell UX Pattern
Users see "paper gains" (position value on curve) but selling returns only proportional SOL (basis). This creates psychological pressure to hold until graduation to realize full value via token claims.

### Database Indexing Strategy
- `launches`: indexed by creator, graduated status, refund_mode, created_at
- `positions`: composite PK (launchAddress, userAddress), indexed individually
- `transactions`: indexed by launch, user, type, block_time
- `users`: indexed by username (unique)

---

## Deployment Process

### 1. Contract Deployment
```bash
cd contracts
anchor build
anchor deploy --provider.cluster mainnet
# Update program ID in Anchor.toml and lib.rs
```

### 2. Database Setup
```bash
cd frontend
npm run db:generate
npm run db:migrate
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and fill in all required variables.

### 4. Vercel Deployment
- Connect GitHub repository to Vercel
- Configure environment variables
- Deploy with `next.config.js` standalone output

### 5. Helius Webhooks
Configure webhook to POST to `/api/webhooks/helius` for transaction indexing.

### 6. GitHub Actions Secrets
Required secrets for cron workflows:
- `RPC_URL`
- `PROGRAM_ID`
- `DATABASE_URL`
- `PROTOCOL_FEE_KEY`
- `SLACK_WEBHOOK_URL`

---

## Migration from V6

V7 is a fresh deployment with breaking changes:
- **No 92/8 split** → All shares 100% unlocked
- **Share cap removed** → Dynamic issuance
- **Graduation criteria** → $42K USD + off-chain gates
- **Position structure** → Simplified (shares + solBasis only)
- **Token distribution** → Proportional (shares/total * 800M)

No migration path from V6 - V7 uses new program ID.

---

## Common Issues and Solutions

### "Cannot find module" errors
Ensure path aliases in `tsconfig.json` match imports:
```json
"paths": {
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"]
}
```

### BigInt serialization errors
Use string serialization for BigInt values in API responses:
```typescript
JSON.stringify({ value: bigintValue.toString() })
```

### Wallet adapter connection issues
Ensure `next.config.js` webpack config includes:
```javascript
if (!isServer) {
  config.resolve.fallback = { fs: false, net: false, tls: false };
}
```

---

## Resources

- **Anchor Framework**: https://www.anchor-lang.com/
- **Solana Documentation**: https://docs.solana.com/
- **Pyth Network**: https://docs.pyth.network/
- **Jupiter API**: https://docs.jup.ag/
- **Helius Documentation**: https://docs.helius.xyz/
- **Next.js App Router**: https://nextjs.org/docs/app
- **Drizzle ORM**: https://orm.drizzle.team/
- **shadcn/ui**: https://ui.shadcn.com/
