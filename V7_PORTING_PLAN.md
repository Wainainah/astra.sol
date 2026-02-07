# V7 Complete Porting Plan

**Goal:** Absolute feature parity with V6, with only the 92/8 split removed.

---

## PHASE 1: Image System (Token Creation) - 2 files

**Priority:** CRITICAL - Blocks token creation

### Files to Port:
1. `components/create/ImageCropper.tsx` - Crop images to square
2. `components/create/ImageUpload.tsx` - Upload with preview

### V7 Changes:
- Remove: None (pure feature port)
- Keep: All functionality

---

## PHASE 2: Jupiter Integration (Post-Grad Trading) - 2 files

**Priority:** CRITICAL - Blocks post-graduation trading

### Files to Port:
1. `components/trade/JupiterPlugin.tsx` - Jupiter DEX embed
2. `hooks/useJupiterSwap.ts` - Jupiter swap logic

### V7 Changes:
- Remove: None
- Keep: All Jupiter integration

---

## PHASE 3: Claim System (Token Claims) - 5 files

**Priority:** CRITICAL - Blocks token claiming

### Files to Port:
1. `components/token/ClaimButton.tsx` - Claim tokens CTA
2. `hooks/useClaim.ts` - Claim tokens hook
3. `hooks/useClaimVesting.ts` - Claim vesting hook
4. `hooks/useClaimableItems.ts` - Check claimable positions
5. `components/profile/ClaimableSection.tsx` - Claimable list

### V7 Changes:
- Update: Claim calculation (proportional distribution, not 1:1)
- Remove: Locked/unlocked distinction in claim flow
- Simplified: All shares convert proportionally to 800M tokens

---

## PHASE 4: Profile Components - 10 files

**Priority:** CRITICAL - Profile page broken

### Files to Port:
1. `app/profile/page.tsx` - Profile page
2. `components/profile/CreatedTokensList.tsx` - Created tokens
3. `components/profile/VestingProgress.tsx` - Vesting status
4. `components/profile/VestingValueCard.tsx` - Vesting value
5. `components/profile/VaultStats.tsx` - Vault/LP stats
6. `components/profile/HoldingsList.tsx` - Holdings list
7. `components/profile/ProfileSkeleton.tsx` - Loading state
8. `hooks/useCreatorVesting.ts` - Vesting calculations
9. `hooks/useVestingValue.ts` - Vesting value calc
10. `hooks/useCreateToken.ts` - Create token hook

### V7 Changes:
- Simplified: HoldingsList (no locked/unlocked columns)
- Updated: VestingProgress (only creator seed vests)
- Keep: All other functionality

---

## PHASE 5: Action Buttons - 8 files

**Priority:** HIGH - Core actions missing

### Files to Port:
1. `components/token/GraduateButton.tsx` - Graduate launch
2. `components/token/RefundButton.tsx` - Claim refund
3. `components/token/PokeButton.tsx` - Collect vault yield
4. `components/token/RefundStatus.tsx` - Refund status display
5. `hooks/useGraduate.ts` - Graduate hook
6. `hooks/useRefund.ts` - Refund hook
7. `hooks/useRefundStatus.ts` - Check refund status
8. `hooks/usePoke.ts` - Poke vault hook

### V7 Changes:
- Update: GraduateButton (check off-chain gates, not just cap)
- Remove: None
- Keep: All functionality

---

## PHASE 6: Comments System - 5 files

**Priority:** MEDIUM - Social features

### Files to Port:
1. `components/token/CommentSection.tsx` - Comments container
2. `components/token/CommentInput.tsx` - Write comment
3. `components/token/CommentCard.tsx` - Display comment
4. `components/token/EmptyCommentsState.tsx` - No comments UI
5. `app/api/comments/route.ts` - Comments API

### V7 Changes:
- Remove: None
- Keep: All functionality

---

## PHASE 7: Charts & Visualization - 4 files

**Priority:** MEDIUM - Visual polish

### Files to Port:
1. `components/token/BondingCurveChart.tsx` - Price history chart
2. `components/token/TokenChartWrapper.tsx` - Chart container
3. `components/token/ActivityFeed.tsx` - Transaction feed
4. `components/token/GraduationCelebration.tsx` - Confetti animation

### V7 Changes:
- Update: BondingCurveChart (X-axis: Market Cap instead of Shares)
- Update: Chart data source (market cap instead of share count)
- Keep: All other functionality

---

## PHASE 8: UI/UX Components - 15 files

**Priority:** MEDIUM - UX polish

### Files to Port:
1. `components/layout/SearchModal.tsx` - Global search
2. `components/ui/TransactionModal.tsx` - TX status modal
3. `components/ui/ErrorBoundary.tsx` - Error handling
4. `components/ui/status-badge.tsx` - Token status UI
5. `components/ui/price-display.tsx` - Format prices
6. `components/ui/count-up.tsx` - Animated numbers
7. `components/ui/blockies-avatar.tsx` - Generate avatars
8. `components/ui/share-button.tsx` - Share token
9. `components/ui/watchlist-button.tsx` - Save favorites
10. `components/ui/avatar.tsx` - Avatar component
11. `components/ui/avatar-upload.tsx` - Profile image upload
12. `components/ui/popover.tsx` - Popover component
13. `components/ui/command.tsx` - Command palette
14. `components/ui/collapsible.tsx` - Collapsible sections
15. `components/ui/form.tsx` - Form components

### V7 Changes:
- Remove: None
- Keep: All functionality

---

## PHASE 9: User Profile Features - 6 files

**Priority:** MEDIUM - User experience

### Files to Port:
1. `app/api/users/[address]/profile/route.ts` - Profile API
2. `components/ui/profile-setup-modal.tsx` - New user onboarding
3. `components/ui/profile-edit-button.tsx` - Edit profile
4. `components/ui/username-input.tsx` - Username validation
5. `hooks/useWatchlist.ts` - Favorites system
6. `app/api/auth/authenticate/route.ts` - Auth API

### V7 Changes:
- Remove: None
- Keep: All functionality

---

## PHASE 10: Final Integration & Polish - 10 files

**Priority:** LOW - Nice to have

### Files to Port:
1. `hooks/useUnifiedTrade.ts` - Combined trade hook
2. `components/token/TokenDetail.tsx` - Complete detail page
3. `components/token/EmptyHoldingsState.tsx` - Empty holdings
4. `components/token/EmptyTokensState.tsx` - Empty tokens
5. `components/create/CreateSuccessModal.tsx` - Success modal
6. `components/create/CreateTokenForm.tsx` - Full create form
7. `components/create/FormProgress.tsx` - Form progress
8. `components/create/TokenCreatedModal.tsx` - Created modal
9. `components/create/SeedStep.tsx` - Seed step (simplified)
10. `components/portfolio/PortfolioSkeleton.tsx` - Loading states

### V7 Changes:
- Simplified: SeedStep (no 92/8 explanation needed)
- Updated: TokenDetail (market cap focus)
- Keep: All other functionality

---

## FILE COUNT

| Phase | Files | Priority |
|-------|-------|----------|
| 1. Image System | 2 | CRITICAL |
| 2. Jupiter | 2 | CRITICAL |
| 3. Claim System | 5 | CRITICAL |
| 4. Profile | 10 | CRITICAL |
| 5. Action Buttons | 8 | HIGH |
| 6. Comments | 5 | MEDIUM |
| 7. Charts | 4 | MEDIUM |
| 8. UI/UX | 15 | MEDIUM |
| 9. User Profile | 6 | MEDIUM |
| 10. Final Polish | 10 | LOW |
| **TOTAL** | **67** | |

---

## ESTIMATED TIME

- Phases 1-4 (Critical): ~2-3 hours
- Phases 5-7 (High/Medium): ~2 hours
- Phases 8-10 (Polish): ~1-2 hours
- **Total: 5-7 hours**

---

## SUCCESS CRITERIA

✅ User can create token with image cropper
✅ User can trade post-graduation via Jupiter
✅ User can claim tokens (proportional distribution)
✅ User can view profile with vesting/claims/holdings
✅ User can graduate launch (checking off-chain gates)
✅ User can claim refunds
✅ User can collect vault yield (poke)
✅ Comments work
✅ Charts display correctly
✅ Search works
✅ All V6 features work (minus 92/8 split)
