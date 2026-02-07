use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + GlobalConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>,
    operator_wallet: Pubkey,
    protocol_fee_wallet: Pubkey,
    vault_protocol_wallet: Pubkey,
    min_seed_lamports: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    config.authority = ctx.accounts.authority.key();
    config.operator_wallet = operator_wallet;
    config.protocol_fee_wallet = protocol_fee_wallet;
    config.vault_protocol_wallet = vault_protocol_wallet;
    config.min_seed_lamports = min_seed_lamports;

    // V7: Price tracking fields - initialized to 0/None
    // Price will be updated via update_price instruction or GitHub Action
    config.sol_price_usd = 0;
    config.price_last_updated = 0;

    config.paused = false;
    config.total_launches = 0;
    config.bump = ctx.bumps.config;

    // Emit initialization event
    emit!(crate::events::ConfigInitialized {
        authority: config.authority,
        min_seed_lamports: config.min_seed_lamports,
    });

    Ok(())
}
