//! Force Graduate instruction handler - V7
//!
//! Emergency graduation that bypasses all graduation gates.
//! Can only be called by the protocol authority (admin).
//!
//! Use cases:
//! - Emergency graduation when operator system is down
//! - Override for special cases (e.g., major partnership announcement)
//! - Recovery from edge cases where gates are stuck
//!
//! SECURITY: This is a powerful function that should be used sparingly.
//! All standard graduation operations should use the normal `graduate` instruction
//! which respects the graduation gates checked by the cron job.

use crate::constants::{TOKENS_FOR_LP, TOTAL_SUPPLY};
use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

// Raydium CPMM Program ID
pub const RAYDIUM_CPMM_PROGRAM: Pubkey = pubkey!("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");

#[derive(Accounts)]
pub struct ForceGraduate<'info> {
    /// Authority (admin) only - bypasses operator requirement
    #[account(
        mut,
        constraint = authority.key() == config.authority @ AstraError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        constraint = !launch.graduated @ AstraError::AlreadyGraduated,
        constraint = !launch.refund_mode @ AstraError::RefundModeActive
    )]
    pub launch: Box<Account<'info, Launch>>,

    /// Token mint to be created
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = launch
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    /// Launch Token Account (for holding claimed tokens)
    #[account(
        init,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = launch
    )]
    pub launch_token_account: Box<Account<'info, TokenAccount>>,

    /// wSOL Token Account (temp for wrapping SOL)
    #[account(
        init,
        payer = authority,
        associated_token::mint = token_0_mint,
        associated_token::authority = launch
    )]
    pub wsol_account: Box<Account<'info, TokenAccount>>,

    /// Vault account (LP holder)
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", launch.key().as_ref()],
        bump
    )]
    pub vault: Box<Account<'info, Vault>>,

    /// Vault LP Token Account (stores LP tokens)
    #[account(
        init,
        payer = authority,
        associated_token::mint = lp_mint,
        associated_token::authority = vault
    )]
    pub vault_lp_token: Box<Account<'info, TokenAccount>>,

    // Raydium CPMM Pool Creation Accounts
    /// CHECK: Validated by Raydium CPI
    #[account(mut)]
    pub amm_config: UncheckedAccount<'info>,

    /// CHECK: Validated by Raydium CPI
    pub amm_authority: UncheckedAccount<'info>,

    /// CHECK: Validated by Raydium CPI
    #[account(mut)]
    pub pool_state: UncheckedAccount<'info>,

    /// CHECK: Validated by Raydium CPI - wSOL mint
    pub token_0_mint: UncheckedAccount<'info>,

    #[account(mut)]
    pub token_1_mint: Box<Account<'info, Mint>>,

    /// CHECK: Validated by Raydium CPI
    #[account(mut)]
    pub lp_mint: UncheckedAccount<'info>,

    /// CHECK: Validated by Raydium CPI - creator's wSOL ATA
    #[account(mut)]
    pub creator_token_0: UncheckedAccount<'info>,

    /// CHECK: Validated by Raydium CPI - creator's token ATA
    #[account(mut)]
    pub creator_token_1: UncheckedAccount<'info>,

    /// CHECK: Validated by Raydium CPI - creator's LP token ATA
    #[account(mut)]
    pub creator_lp_token: UncheckedAccount<'info>,

    /// CHECK: Validated by Raydium CPI - pool's token 0 vault
    #[account(mut)]
    pub token_0_vault: UncheckedAccount<'info>,

    /// CHECK: Validated by Raydium CPI - pool's token 1 vault
    #[account(mut)]
    pub token_1_vault: UncheckedAccount<'info>,

    /// CHECK: Validated by Raydium CPI
    #[account(mut)]
    pub observation_state: UncheckedAccount<'info>,

    /// CHECK: Validated via address constraint
    #[account(address = RAYDIUM_CPMM_PROGRAM)]
    pub raydium_program: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"creator_stats", launch.creator.as_ref()],
        bump = creator_stats.bump
    )]
    pub creator_stats: Box<Account<'info, CreatorStats>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<ForceGraduate>) -> Result<()> {
    let launch = &mut ctx.accounts.launch;
    let vault = &mut ctx.accounts.vault;

    // Reentrancy protection
    require!(
        !launch.operation_in_progress,
        AstraError::InvalidCalculation
    );
    launch.operation_in_progress = true;

    // V7: Use simplified launch.total_sol (no locked/unlocked split)
    let sol_amount = launch.total_sol;
    require!(sol_amount > 0, AstraError::InvalidCalculation);

    msg!("FORCE GRADUATE: Launch {}", launch.key());
    msg!("Authority: {}", ctx.accounts.authority.key());
    msg!("Total Shares: {}", launch.total_shares);
    msg!("Total SOL: {}", sol_amount);

    // PDA Seeds
    let launch_seeds = &[
        b"launch",
        launch.creator.as_ref(),
        &launch.launch_id.to_le_bytes(),
        &[launch.bump],
    ];
    let signer_seeds = &[&launch_seeds[..]];

    // 1. Wrap SOL
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: launch.to_account_info(),
                to: ctx.accounts.wsol_account.to_account_info(),
            },
            signer_seeds,
        ),
        sol_amount,
    )?;

    token::sync_native(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::SyncNative {
            account: ctx.accounts.wsol_account.to_account_info(),
        },
        signer_seeds,
    ))?;

    // 2. Mint Total Supply (1B tokens with 9 decimals)
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.launch_token_account.to_account_info(),
                authority: launch.to_account_info(),
            },
            signer_seeds,
        ),
        TOTAL_SUPPLY * 1_000_000_000, // 1B with 9 decimals
    )?;

    // 3. Create Raydium CPMM Pool
    let init_amount_0 = sol_amount;
    let init_amount_1 = TOKENS_FOR_LP * 1_000_000_000; // 200M with 9 decimals

    require!(init_amount_1 > 0, AstraError::InvalidCalculation);

    let mut instruction_data = vec![175, 175, 109, 31, 56, 222, 53, 138];
    instruction_data.extend_from_slice(&init_amount_0.to_le_bytes());
    instruction_data.extend_from_slice(&init_amount_1.to_le_bytes());
    instruction_data.extend_from_slice(&Clock::get()?.unix_timestamp.to_le_bytes());

    let account_metas = vec![
        AccountMeta::new(launch.key(), true),
        AccountMeta::new_readonly(ctx.accounts.amm_config.key(), false),
        AccountMeta::new_readonly(ctx.accounts.amm_authority.key(), false),
        AccountMeta::new(ctx.accounts.pool_state.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_0_mint.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_1_mint.key(), false),
        AccountMeta::new(ctx.accounts.lp_mint.key(), false),
        AccountMeta::new(ctx.accounts.wsol_account.key(), false),
        AccountMeta::new(ctx.accounts.launch_token_account.key(), false),
        AccountMeta::new(ctx.accounts.vault_lp_token.key(), false),
        AccountMeta::new(ctx.accounts.token_0_vault.key(), false),
        AccountMeta::new(ctx.accounts.token_1_vault.key(), false),
        AccountMeta::new(ctx.accounts.observation_state.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.associated_token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.rent.key(), false),
    ];

    let initialize_instruction = Instruction {
        program_id: RAYDIUM_CPMM_PROGRAM,
        accounts: account_metas,
        data: instruction_data,
    };

    invoke_signed(
        &initialize_instruction,
        &[
            launch.to_account_info(),
            ctx.accounts.amm_config.to_account_info(),
            ctx.accounts.amm_authority.to_account_info(),
            ctx.accounts.pool_state.to_account_info(),
            ctx.accounts.token_0_mint.to_account_info(),
            ctx.accounts.token_1_mint.to_account_info(),
            ctx.accounts.lp_mint.to_account_info(),
            ctx.accounts.wsol_account.to_account_info(),
            ctx.accounts.launch_token_account.to_account_info(),
            ctx.accounts.vault_lp_token.to_account_info(),
            ctx.accounts.token_0_vault.to_account_info(),
            ctx.accounts.token_1_vault.to_account_info(),
            ctx.accounts.observation_state.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.associated_token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        signer_seeds,
    )?;

    // 4. Initialize Vault
    let estimated_lp_tokens = ((init_amount_0 as u128)
        .checked_mul(init_amount_1 as u128)
        .ok_or(AstraError::MathOverflow)?)
    .isqrt() as u64;

    let pool_address = ctx.accounts.pool_state.key();

    vault.launch = launch.key();
    vault.creator = launch.creator;
    vault.lp_mint = ctx.accounts.lp_mint.key();
    vault.lp_balance = estimated_lp_tokens;
    vault.activated = true;
    vault.total_yield_collected = 0;
    vault.last_poke_at = Clock::get()?.unix_timestamp;
    vault.bump = ctx.bumps.vault;

    // 5. Update Launch State
    launch.graduated = true;
    launch.graduated_at = Some(Clock::get()?.unix_timestamp);
    launch.vesting_start = Some(Clock::get()?.unix_timestamp);
    launch.token_mint = Some(ctx.accounts.token_mint.key());
    launch.pool_address = Some(pool_address);
    launch.vault = Some(vault.key());

    // V7: Store total shares at graduation for proportional distribution
    launch.total_shares_at_graduation = launch.total_shares;

    // 6. Increment Creator's graduated count
    let creator_stats = &mut ctx.accounts.creator_stats;
    creator_stats.record_graduation();

    emit!(crate::events::Graduated {
        launch: launch.key(),
        token_mint: ctx.accounts.token_mint.key(),
        pool_address,
        lp_mint: ctx.accounts.lp_mint.key(),
        sol_for_lp: sol_amount,
        total_shares: launch.total_shares_at_graduation,
        timestamp: launch.graduated_at.unwrap(),
    });

    msg!("FORCE GRADUATE COMPLETE: Launch {} graduated", launch.key());

    // Reset reentrancy flag
    launch.operation_in_progress = false;
    Ok(())
}
