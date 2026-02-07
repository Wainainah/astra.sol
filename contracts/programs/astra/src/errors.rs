use anchor_lang::prelude::*;

#[error_code]
pub enum AstraError {
    #[msg("Protocol is currently paused")]
    ProtocolPaused,

    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Vesting not complete - creator must finish vesting before claiming")]
    VestingNotComplete,

    #[msg("This launch has already been graduated")]
    AlreadyGraduated,

    #[msg("Vesting has not started yet")]
    VestingNotStarted,

    #[msg("No shares available to claim")]
    NoSharesToClaim,

    #[msg("Launch is not graduated")]
    NotGraduated,

    #[msg("Refund mode is already active")]
    RefundModeAlreadyActive,

    #[msg("Refund mode is not active")]
    RefundModeNotActive,

    #[msg("Refund mode is active")]
    RefundModeActive,

    #[msg("Launch duration has not expired yet")]
    LaunchNotExpired,

    #[msg("Insufficient shares for sell")]
    InsufficientShares,

    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Already claimed tokens")]
    AlreadyClaimed,

    #[msg("Creator only")]
    NotCreator,

    #[msg("Invalid calculation")]
    InvalidCalculation,

    #[msg("No fees to claim")]
    NoFeesToClaim,

    #[msg("Refund period is still active")]
    RefundPeriodActive,

    #[msg("Insufficient funds in launch for refund")]
    InsufficientFunds,

    #[msg("Launch is not empty, cannot close")]
    LaunchNotEmpty,

    // V7 ERRORS
    #[msg("Price oracle unavailable and cached price is stale")]
    PriceOracleUnavailable,

    #[msg("Seed amount below minimum USD threshold")]
    SeedAmountTooLow,

    #[msg("Seed amount above maximum USD threshold")]
    SeedAmountTooHigh,
}
