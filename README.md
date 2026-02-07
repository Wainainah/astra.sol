# Astra Protocol V7

A complete rewrite of Astra Protocol with USD-based economics, simplified state model, and cleaner architecture.

## What's New in V7

### USD-Based Economics
- All monetary values configured in USD, converted to SOL at runtime using Pyth price feed
- Graduation target: $42,000 USD market cap (instead of SOL-based share cap)
- Buy presets: $5, $10, $25, $50, $100, $250 USD

### Simplified State Model
- **No 92/8 split** - All shares are 100% unlocked (only creator seed vesting remains)
- Removed locked/unlocked position complexity
- Cleaner database schema and contract state

### Dynamic Share Issuance
- No share cap - shares are minted dynamically as users buy
- Proportional token distribution at graduation: tokens = (userShares / totalShares) * 800M
- Early buyers get more tokens per share

### Graduation Gates (Off-Chain)
- Minimum 100 unique holders
- Maximum 10% concentration (no single holder >10%)
- Market cap threshold ($42K USD) checked on-chain

## Project Structure

```
astra-v7/
├── contracts/          # Rust/Anchor smart contracts
│   └── programs/astra/
│       ├── src/
│       │   ├── constants.rs       # Protocol configuration
│       │   ├── curve.rs           # Bonding curve math
│       │   ├── errors.rs          # Custom errors
│       │   ├── events.rs          # Anchor events
│       │   ├── lib.rs             # Program entrypoint
│       │   └── instructions/      # All 15 instructions
│       └── Cargo.toml
├── frontend/           # Next.js 14 + TypeScript
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── api/               # API routes
│   │   │   ├── create/            # Token creation
│   │   │   ├── portfolio/         # Portfolio tracking
│   │   │   ├── token/             # Token detail page
│   │   │   └── profile/           # User profile
│   │   ├── components/            # React components
│   │   │   ├── trade/             # Buy/Sell forms
│   │   │   ├── token/             # Token cards, holders
│   │   │   ├── portfolio/         # Holdings, P&L
│   │   │   └── ui/                # Shadcn/ui components
│   │   ├── hooks/                 # React Query hooks
│   │   ├── lib/                   # Utilities, curve math
│   │   └── db/                    # Drizzle ORM schema
│   ├── public/
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Rust + Cargo
- Anchor CLI
- Solana CLI
- PostgreSQL (or Neon)

### 1. Copy to New Repository

```bash
# Copy the astra-v7 folder to your new repo
cp -r /path/to/astra-v7 /path/to/new-repo/
cd /path/to/new-repo/astra-v7
```

### 2. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Contract dependencies
cd ../contracts
anchor build
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Database
DATABASE_URL="postgres://user:pass@host/db"

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Program ID (update after deployment)
NEXT_PUBLIC_PROGRAM_ID=BONDcYHM1Ai7aXf6r7dDw4E9hrVvr5A72WBaWEAgNFGQ

# Pyth Oracle
NEXT_PUBLIC_PYTH_SOL_USD=7UV2aKwAbE5YUsFUpZgnN36xeaDc3EZM6iGLCgsHaNkA

# IPFS/Image Upload
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt

# Optional: Analytics, Sentry, etc.
```

### 4. Database Setup

```bash
cd frontend

# Generate migration
npm run db:generate

# Run migration
npm run db:migrate

# (Optional) Seed data
npm run db:seed
```

### 5. Deploy Contracts

```bash
cd contracts

# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Update program ID in:
# - Anchor.toml
# - frontend/.env.local
```

### 6. Run Frontend

```bash
cd frontend
npm run dev
```

## Key Features

### Trading
- **Buy Form**: USD-based presets, real-time quote, slippage protection
- **Sell Form**: "Leave money on table" UX - shows unrealized gains
- **Trade Panel**: Tabs for buying, selling, and Jupiter swap (post-graduation)

### Portfolio
- Real-time P&L tracking
- Position summaries with unrealized gains
- Transaction history with filters

### Token Pages
- Bonding curve progress (market cap visualization)
- Graduation gates status (holders, concentration)
- Top holders list with concentration warnings
- Comment section (Appwrite backend)

### Graduation
- Off-chain cron job checks gates
- On-chain graduation creates Raydium pool
- Proportional token distribution
- Creator vesting begins (42 days linear)

## Architecture Notes

### Curve Math
Quadratic bonding curve: `price = (slope * shares^2) / scale`
- Slope: 781,250
- Scale: 1,000,000,000,000
- Mirrors Solana contract math exactly

### Sell UX Pattern
Users see "paper gains" (position value on curve) but selling only returns proportional SOL (basis). This creates psychological pressure to hold until graduation to realize full value.

### Graduation Flow
1. Market cap approaches $42K → emits `ReadyToGraduate` event
2. Cron job checks off-chain gates (holders, concentration)
3. Operator calls `graduate()` once all gates pass
4. Contract distributes tokens proportionally
5. Creates Raydium pool with 200M tokens + SOL

## API Routes

- `GET /api/tokens` - List all tokens
- `GET /api/tokens/[address]` - Token details
- `GET /api/portfolio/[wallet]` - Portfolio data
- `POST /api/cron/graduate-check` - Cron graduation check
- `POST /api/webhooks/helius` - Helius transaction webhooks

## Testing

```bash
# Contract tests
cd contracts
anchor test

# Frontend tests
cd frontend
npm test
```

## Deployment Checklist

- [ ] Deploy contracts to mainnet
- [ ] Update program ID in all configs
- [ ] Set up Neon PostgreSQL
- [ ] Configure Pinata for IPFS
- [ ] Set up Helius webhooks
- [ ] Configure Vercel deployment
- [ ] Test buy/sell flows
- [ ] Test graduation flow
- [ ] Test token claiming
- [ ] Test Jupiter swaps

## Migration from V6

V7 removes the 92/8 locked/unlocked complexity:
- V6 positions had locked/unlocked shares
- V7 positions have just `shares` (all unlocked) + `lockedShares` (creator seed only)
- V6 graduation was share-cap based
- V7 graduation is market-cap based ($42K USD)

No migration needed - V7 is a fresh deployment with new program ID.

## License

MIT
