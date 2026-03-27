// lib/referral.ts — Motor de Referidos (MVP v4.0)
// Fix #10: usa crypto.randomBytes para generación segura de códigos

import crypto from 'crypto';
import { query } from './db';
import type { ReferralData, ReferralReward } from '@/src/types/albion';

// Charset sin caracteres ambiguos (O/0, I/1/l)
const CHARSET           = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REFERRAL_REWARD_DAYS = 7;

/**
 * Genera un código de referido criptográficamente seguro con formato XX-XXXX
 * Fix #10: usa crypto.randomBytes en vez de Math.random()
 */
export function generateReferralCode(): string {
  const bytes = crypto.randomBytes(6);
  const chars = Array.from(bytes).map(b => CHARSET[b % CHARSET.length]).join('');
  return `${chars.slice(0, 2)}-${chars.slice(2, 6)}`;
}

/**
 * Genera un código único verificando contra la BD
 */
export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempts = 0; attempts < 10; attempts++) {
    const code = generateReferralCode();
    const existing = await query<{ id: number }>(
      'SELECT id FROM users WHERE referral_code = $1',
      [code]
    );
    if (existing.length === 0) return code;
  }
  // Fallback garantizado con timestamp + entropy
  const ts      = Date.now().toString(36).toUpperCase().slice(-3);
  const entropy = crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 3);
  return `${ts}-${entropy}`;
}

/**
 * Obtiene los datos de referidos de un usuario
 */
export async function getReferralData(userId: number): Promise<ReferralData> {
  const userRows = await query<{ referral_code: string }>(
    'SELECT referral_code FROM users WHERE id = $1',
    [userId]
  );
  if (!userRows[0]) throw new Error('Usuario no encontrado');

  const rewardsRows = await query<ReferralReward>(
    `SELECT id, referrer_id, referee_id, reward_days, granted_at
     FROM referral_rewards
     WHERE referrer_id = $1
     ORDER BY granted_at DESC`,
    [userId]
  );

  const totalDays = rewardsRows.reduce((acc, r) => acc + r.reward_days, 0);

  return {
    referral_code:    userRows[0].referral_code,
    total_referrals:  rewardsRows.length,
    total_days_earned: totalDays,
    pending_rewards:  rewardsRows,
  };
}

/**
 * Otorga premio al referrer cuando el referee hace su primer pago.
 * Idempotente: la UNIQUE constraint de la tabla previene duplicados.
 */
export async function grantReferralReward(refereeId: number): Promise<void> {
  const rows = await query<{ referred_by: number | null }>(
    'SELECT referred_by FROM users WHERE id = $1',
    [refereeId]
  );

  const referrerId = rows[0]?.referred_by;
  if (!referrerId) return;

  // Usamos INSERT ... ON CONFLICT DO NOTHING para atomicidad
  await query(
    `INSERT INTO referral_rewards (referrer_id, referee_id, reward_days)
     VALUES ($1, $2, $3)
     ON CONFLICT (referrer_id, referee_id) DO NOTHING`,
    [referrerId, refereeId, REFERRAL_REWARD_DAYS]
  );
}
