use crate::constants::{CURVE_SCALE, CURVE_SLOPE};
use crate::errors::AstraError;
use anchor_lang::prelude::*;

/// Calculate cost in lamports to buy `shares_out` given `current_supply`
///
/// Uses quadratic bonding curve formula:
/// Cost = (CURVE_SLOPE / 2) × (S_new² - S_current²) / CURVE_SCALE
///
/// V7 NOTE: No share cap - curve continues indefinitely until USD market cap
/// target is reached. Share supply is dynamic based on SOL price at graduation.
///
/// # Arguments
/// * `shares_out` - Number of shares to buy
/// * `current_supply` - Current total shares issued
///
/// # Returns
/// * Cost in lamports
///
/// # Errors
/// * `MathOverflow` - If calculation overflows
pub fn buy_quote(shares_out: u64, current_supply: u64) -> Result<u64> {
    if shares_out == 0 {
        return Ok(0);
    }

    let s_current = current_supply as u128;
    let s_new = s_current
        .checked_add(shares_out as u128)
        .ok_or(AstraError::MathOverflow)?;

    // Cost = (slope / 2) * (s_new^2 - s_current^2) / scale
    let s_new_sq = s_new.checked_mul(s_new).ok_or(AstraError::MathOverflow)?;
    let s_curr_sq = s_current
        .checked_mul(s_current)
        .ok_or(AstraError::MathOverflow)?;

    let delta_sq = s_new_sq
        .checked_sub(s_curr_sq)
        .ok_or(AstraError::MathOverflow)?;

    // (slope * delta_sq) / (2 * scale)
    let numerator = CURVE_SLOPE
        .checked_mul(delta_sq)
        .ok_or(AstraError::MathOverflow)?;
    let denominator = 2u128
        .checked_mul(CURVE_SCALE)
        .ok_or(AstraError::MathOverflow)?;

    let cost = numerator
        .checked_div(denominator)
        .ok_or(AstraError::MathOverflow)?;

    // Safety check for u64 conversion
    if cost > u64::MAX as u128 {
        return Err(AstraError::MathOverflow.into());
    }

    Ok(cost as u64)
}

/// Calculate shares received for `sol_amount` given `current_supply`
///
/// Inversion of buy_quote formula:
/// s_new = sqrt( (2 * cost * scale / slope) + s_current^2 )
/// shares = s_new - s_current
///
/// V7 NOTE: No maximum - returns however many shares the SOL amount buys.
/// Early buyers get more shares per SOL, late buyers get fewer.
///
/// # Arguments
/// * `sol_amount` - Amount of SOL to spend (in lamports)
/// * `current_supply` - Current total shares issued
///
/// # Returns
/// * Number of shares received
///
/// # Errors
/// * `MathOverflow` - If calculation overflows
pub fn buy_return(sol_amount: u64, current_supply: u64) -> Result<u64> {
    if sol_amount == 0 {
        return Ok(0);
    }

    let cost = sol_amount as u128;
    let s_current = current_supply as u128;

    // s_new = sqrt( (2 * cost * scale / slope) + s_current^2 )
    let t1 = 2u128.checked_mul(cost).ok_or(AstraError::MathOverflow)?;
    let t2 = t1
        .checked_mul(CURVE_SCALE)
        .ok_or(AstraError::MathOverflow)?;
    let term1 = t2
        .checked_div(CURVE_SLOPE)
        .ok_or(AstraError::MathOverflow)?;

    let s_curr_sq = s_current
        .checked_mul(s_current)
        .ok_or(AstraError::MathOverflow)?;
    let inside_sqrt = term1
        .checked_add(s_curr_sq)
        .ok_or(AstraError::MathOverflow)?;

    let s_new = integer_sqrt(inside_sqrt);

    let shares = s_new
        .checked_sub(s_current)
        .ok_or(AstraError::MathOverflow)?;

    // Safe conversion since we checked bounds above
    let shares_u64 = shares.try_into().map_err(|_| AstraError::MathOverflow)?;

    Ok(shares_u64)
}

/// Calculate refund amount for selling shares
///
/// Proportional refund based on user's basis:
/// refund = shares_to_sell * user_basis / user_total_shares
///
/// This ensures users can only recover their original investment proportionally,
/// not capture any "paper gains" from the bonding curve price appreciation.
/// To realize gains, users must hold until graduation.
///
/// # Arguments
/// * `shares_to_sell` - Number of shares to sell
/// * `user_shares` - User's total shares
/// * `user_basis` - User's total SOL deposited (in lamports)
///
/// # Returns
/// * Refund amount in lamports
///
/// # Errors
/// * `MathOverflow` - If calculation overflows
/// * `InvalidCalculation` - If user has no shares
pub fn sell_return(shares_to_sell: u64, user_shares: u64, user_basis: u64) -> Result<u64> {
    if shares_to_sell == 0 {
        return Ok(0);
    }

    if user_shares == 0 {
        return Err(AstraError::InvalidCalculation.into());
    }

    // refund = shares_to_sell * user_basis / user_shares
    let refund_u128 = (shares_to_sell as u128)
        .checked_mul(user_basis as u128)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(user_shares as u128)
        .ok_or(AstraError::MathOverflow)?;

    // Safety check for u64 conversion
    if refund_u128 > u64::MAX as u128 {
        return Err(AstraError::MathOverflow.into());
    }

    Ok(refund_u128 as u64)
}

/// Integer square root using Newton's method with overflow-safe initial guess
///
/// # Arguments
/// * `n` - Number to find square root of
///
/// # Returns
/// * Integer square root (floor value)
fn integer_sqrt(n: u128) -> u128 {
    if n < 2 {
        return n;
    }

    // Start with a better initial guess using bit manipulation
    // This prevents overflow when n is close to u128::MAX
    let shift = (128 - n.leading_zeros() + 1) / 2;
    let mut x = 1u128 << shift;

    loop {
        let y = (x + n / x) / 2;
        if y >= x {
            return x;
        }
        x = y;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_buy_quote_zero_shares() {
        assert_eq!(buy_quote(0, 0).unwrap(), 0);
        assert_eq!(buy_quote(0, 1_000_000).unwrap(), 0);
    }

    #[test]
    fn test_buy_return_zero_sol() {
        assert_eq!(buy_return(0, 0).unwrap(), 0);
        assert_eq!(buy_return(0, 1_000_000).unwrap(), 0);
    }

    #[test]
    fn test_buy_and_sell_symmetry() {
        // Buy 1M shares from 0 supply
        let cost = buy_quote(1_000_000, 0).unwrap();
        // Selling those shares should return the cost
        let refund = sell_return(1_000_000, 1_000_000, cost).unwrap();
        assert_eq!(cost, refund);
    }

    #[test]
    fn test_curve_calibrations() {
        // Test various SOL amounts to verify curve behavior
        // At $200 SOL: $42K = 210 SOL
        let sol_210 = 210_000_000_000u64;
        let shares_at_210 = buy_return(sol_210, 0).unwrap();
        
        // Should be approximately 520M shares (depends on curve params)
        // This is just a sanity check that the curve produces reasonable numbers
        assert!(shares_at_210 > 400_000_000, "Expected >400M shares for 210 SOL");
        assert!(shares_at_210 < 800_000_000, "Expected <800M shares for 210 SOL");
        
        // At $100 SOL: $42K = 420 SOL
        let sol_420 = 420_000_000_000u64;
        let shares_at_420 = buy_return(sol_420, 0).unwrap();
        
        // More SOL should produce more shares
        assert!(shares_at_420 > shares_at_210, "More SOL should buy more shares");
    }

    #[test]
    fn test_buy_price_increases_with_supply() {
        // Buy 1M shares from 0 supply
        let cost_from_zero = buy_quote(1_000_000, 0).unwrap();
        
        // Buy 1M shares after 10M supply already exists
        let cost_from_10m = buy_quote(1_000_000, 10_000_000).unwrap();
        
        // Price should be higher when supply is larger
        assert!(cost_from_10m > cost_from_zero, "Price should increase with supply");
    }

    #[test]
    fn test_sell_return_proportional() {
        // User has 100 shares with 10 SOL basis
        let user_shares = 100u64;
        let user_basis = 10_000_000_000u64; // 10 SOL

        // Sell 50 shares (half)
        let refund = sell_return(50, user_shares, user_basis).unwrap();
        // Should get half the basis back
        assert_eq!(refund, 5_000_000_000); // 5 SOL
    }

    #[test]
    fn test_sell_return_no_shares() {
        let result = sell_return(10, 0, 1_000_000_000);
        assert!(result.is_err());
    }

    #[test]
    fn test_sell_cannot_extract_gains() {
        // User buys 100 shares for 10 SOL
        let buy_cost = buy_quote(100, 0).unwrap();
        
        // Price goes up (more supply)
        let new_share_price = buy_quote(100, 1000).unwrap();
        
        // New price is higher
        assert!(new_share_price > buy_cost, "Price should have increased");
        
        // User tries to sell their shares
        let refund = sell_return(100, 100, buy_cost).unwrap();
        
        // User only gets their original investment back, not the new higher price
        assert_eq!(refund, buy_cost, "User should only get proportional refund");
        assert!(refund < new_share_price, "User cannot extract price appreciation");
    }

    #[test]
    fn test_integer_sqrt() {
        assert_eq!(integer_sqrt(0), 0);
        assert_eq!(integer_sqrt(1), 1);
        assert_eq!(integer_sqrt(4), 2);
        assert_eq!(integer_sqrt(9), 3);
        assert_eq!(integer_sqrt(15), 3); // Floor
        assert_eq!(integer_sqrt(16), 4);
        assert_eq!(integer_sqrt(1_000_000_000_000), 1_000_000);
    }
}
