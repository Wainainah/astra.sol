# Astra Protocol V7 Frontend

A complete rewrite of the Astra Protocol frontend with V7 architecture.

## V7 Key Changes

### Removed
- ❌ 92/8 locked/unlocked split
- ❌ 800M share cap
- ❌ Complex locked/unlocked basis tracking

### Added
- ✅ USD-based graduation ($42K market cap)
- ✅ Dynamic share issuance (no cap)
- ✅ "Paper gains" tracking (position value on curve)
- ✅ "Leave money on table" sell warnings
- ✅ Off-chain graduation gates (100 holders, 10% max concentration)
- ✅ Market cap progress tracking

## Architecture

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── create/            # Create token page
│   │   ├── portfolio/         # Portfolio page
│   │   ├── token/[address]/   # Token detail page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── create/            # Token creation components
│   │   ├── layout/            # Header, Sidebar
│   │   ├── portfolio/         # Portfolio components
│   │   ├── token/             # Token display components
│   │   ├── trade/             # Buy/Sell forms
│   │   └── ui/                # shadcn/ui components
│   ├── db/
│   │   ├── schema.ts          # V7 database schema
│   │   └── index.ts           # Database connection
│   ├── hooks/
│   │   ├── useBuy.ts          # Buy functionality
│   │   ├── useSell.ts         # Sell with warnings
│   │   ├── usePositionValue.ts # Position calculations
│   │   ├── useTokenPrice.ts   # Price data
│   │   └── useGraduationGates.ts # Gate checking
│   └── lib/
│       ├── api-types.ts       # TypeScript types
│       ├── constants.ts       # V7 constants
│       ├── curve.ts           # Bonding curve math
│       ├── graduation-gates.ts # Gate logic
│       └── utils.ts           # Utilities
```

## Key Features

### Position Value Tracking
```typescript
// Calculate real-time position value
const { positionValue, unrealizedGain, roiPercent } = usePositionValue({
  position,
  launch,
  solPriceUsd
});
```

### Sell Warnings
```typescript
// Warn users about leaving gains behind
const warning = getSellWarning(
  sharesToSell,
  userShares,
  userBasis,
  currentTotalShares,
  solPriceUsd
);
// Returns: severity, title, message, leavingBehindUsd
```

### Graduation Gates
```typescript
// Check graduation eligibility
const gates = checkGraduationGates(launch, holders);
// Returns: canGraduate, blockingReasons[], progress for each gate
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Solana
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PROGRAM_ID=...

# APIs
HELIUS_API_KEY=...
COINGECKO_API_KEY=...
```

## Development

```bash
# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:migrate

# Run dev server
npm run dev

# Build for production
npm run build
```

## V7 vs V6 Comparison

| Feature | V6 | V7 |
|---------|-----|-----|
| Share Split | 92% locked / 8% unlocked | 100% unlocked |
| Share Cap | 800M shares | No cap (market cap based) |
| Graduation | 800M shares | $42K USD market cap |
| Sell Return | Proportional basis | Proportional basis (same) |
| Position Display | Locked + Unlocked columns | Single shares + paper gains |
| Progress Bar | To 800M shares | To $42K market cap |

## Deployment

1. Configure environment variables
2. Run database migrations
3. Deploy to Vercel
4. Configure webhooks
5. Setup cron jobs

## License

MIT
