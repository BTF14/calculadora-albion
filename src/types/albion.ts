// ============================================================
// src/types/albion.ts — Fuente de Verdad de Tipos (MVP v4.0)
// Prohibido: any. Usar unknown + type guards si es necesario.
// ============================================================

// ─── DOMINIO: USUARIO ────────────────────────────────────────
export type UserRole = 'admin' | 'premium' | 'guest';

export interface User {
  id: number;
  wallet_address: string | null;
  email: string | null;
  referral_code: string;           // Ej: "ED-X7B9"
  referred_by: number | null;
  role: UserRole;
  created_at: Date;
}

// Lo que expone NextAuth al cliente (sin datos sensibles)
export interface SessionUser {
  id: number;
  email: string | null;
  role: UserRole;
  referral_code: string;
  subscription_expiry: Date | null; // calculado vía get_user_expiry()
}

// ─── DOMINIO: SUSCRIPCIÓN ────────────────────────────────────
export type SubscriptionPlan = 'trial' | 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id: number;
  user_id: number;
  expiry_date: Date;
  free_trial_used: boolean;
  plan: SubscriptionPlan;
  created_at: Date;
}

// ─── DOMINIO: CUPONES ────────────────────────────────────────
export interface Coupon {
  id: number;
  code: string;
  reward_days: number;
  expires_at: Date;
  is_redeemed: boolean;
  redeemed_by: number | null;
  created_by: number | null;
  created_at: Date;
}

export interface CouponRedeemResult {
  success: boolean;
  reward_days: number;
  new_expiry: Date;
}

// ─── DOMINIO: REFERIDOS ──────────────────────────────────────
export interface ReferralData {
  referral_code: string;           // El código del usuario actual
  total_referrals: number;         // Cuántos usuarios invitó
  total_days_earned: number;       // Días ganados en total
  pending_rewards: ReferralReward[];
}

export interface ReferralReward {
  id: number;
  referrer_id: number;
  referee_id: number;
  reward_days: number;
  granted_at: Date;
}

// ─── DOMINIO: PAGOS WEB3 ─────────────────────────────────────
export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type PaymentCurrency = 'USDT' | 'USDC';
export type PaymentNetwork = 'BEP20' | 'BASE';

export interface Payment {
  id: number;
  user_id: number;
  tx_hash: string;                 // 0x + 64 hex chars
  amount: number;
  currency: PaymentCurrency;
  network: PaymentNetwork;
  plan: SubscriptionPlan;
  status: PaymentStatus;
  verified_by: number | null;
  verified_at: Date | null;
  created_at: Date;
}

// ─── DOMINIO: CRAFTING — REFINADO ────────────────────────────
export type ResourceType = 'metal' | 'wood' | 'stone' | 'fiber' | 'leather';
export type Enchantment = 0 | 1 | 2 | 3 | 4;

export interface RefiningInput {
  resourceType: ResourceType;
  tier: number;
  enchantment: Enchantment;
  quantity: number;
  focusUsed: boolean;
  cityBonus: boolean;
  premium: boolean;
}

export interface RefiningOutput {
  rawMaterials: Record<string, number>;
  refinedMaterial: string;
  refinedQuantity: number;
  silverCost: number;
  focusPointsUsed: number;
  returnRate: number;
}

// ─── DOMINIO: CRAFTING — TRANSMUTACIÓN ───────────────────────
export interface TransmutationInput {
  resourceType: ResourceType;
  fromTier: number;
  fromEnchant: Enchantment;
  toTier: number;
  toEnchant: Enchantment;
  quantity: number;
}

export interface TransmutationOutput {
  requiredRaw: number;
  silverCost: number;
}

// ─── DOMINIO: CRAFTING — BAGS / FOOD / POTIONS ───────────────
export interface CraftingInput {
  itemId: string;
  enchantment: Enchantment;
  quantity: number;
}

export interface CraftingOutput {
  ingredients: Record<string, number>;
  outputQuantity: number;
  fame: number;
  focusPoints: number;
}

// ─── DOMINIO: FAVORITOS ──────────────────────────────────────
export interface UserFavorite {
  id: number;
  user_id: number;
  recipe_id: string;
  custom_price_data: CustomPriceData | null;
  last_used: Date;
}

export interface CustomPriceData {
  prices: Record<string, number>;  // materialName → precio en silver
  updated_at: string;              // ISO string
}

// ─── HELPERS API ─────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
