// ============================================================
// lib/validations.ts — Capa de Validación con Zod (MVP v4.0)
// Usar en Server Actions y API Routes para sanear todo input.
// ============================================================

import { z } from 'zod';

// ─── AUTH ────────────────────────────────────────────────────
const ALLOWED_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com',
  'yahoo.com', 'icloud.com', 'live.com', 'msn.com',
];

export const RegisterSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim()
    .refine(
      (val) => ALLOWED_DOMAINS.includes(val.split('@')[1] ?? ''),
      { message: 'Solo se permiten correos de Gmail, Outlook, Hotmail o Yahoo.' }
    ),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72, 'Máximo 72 caracteres'),
  referral_code: z
    .string()
    .regex(/^[A-Z0-9]{2}-[A-Z0-9]{4}$/, 'Código de referido inválido')
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
});

// ─── PAGOS WEB3 ──────────────────────────────────────────────
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

export const SubmitPaymentSchema = z.object({
  tx_hash: z
    .string()
    .regex(TX_HASH_REGEX, 'Hash de transacción inválido (debe ser 0x + 64 hex)'),
  plan: z.enum(['weekly', 'monthly', 'yearly']),
  currency: z.enum(['USDT', 'USDC']),
  network: z.enum(['BEP20', 'BASE']),
  amount: z.number().positive('El monto debe ser positivo'),
});

export const VerifyPaymentSchema = z.object({
  payment_id: z.number().int().positive(),
  action: z.enum(['verify', 'reject']),
});

// ─── CUPONES ─────────────────────────────────────────────────
export const RedeemCouponSchema = z.object({
  code: z
    .string()
    .toUpperCase()
    .trim()
    .min(3, 'Código muy corto')
    .max(20, 'Código muy largo'),
});

export const CreateCouponSchema = z.object({
  code: z
    .string()
    .toUpperCase()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Solo letras mayúsculas, números y guiones'),
  reward_days: z
    .number()
    .int()
    .min(1, 'Mínimo 1 día')
    .max(30, 'Máximo 30 días')
    .default(2),
});

// ─── REFERIDOS ───────────────────────────────────────────────
export const ApplyReferralSchema = z.object({
  referral_code: z
    .string()
    .toUpperCase()
    .trim()
    .regex(/^[A-Z0-9]{2}-[A-Z0-9]{4}$/, 'Formato de código inválido: XX-XXXX'),
});

// ─── CRAFTING ────────────────────────────────────────────────
export const RefiningInputSchema = z.object({
  resourceType: z.enum(['metal', 'wood', 'stone', 'fiber', 'leather']),
  tier: z.number().int().min(2).max(8),
  enchantment: z.union([
    z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4),
  ]),
  quantity: z.number().int().min(1).max(100_000),
  focusUsed: z.boolean(),
  cityBonus: z.boolean(),
  premium: z.boolean(),
});

// ─── FAVORITOS ───────────────────────────────────────────────
export const SaveFavoriteSchema = z.object({
  recipe_id: z.string().min(1).max(100),
  custom_price_data: z
    .object({
      prices: z.record(z.string(), z.number().nonnegative()),
      updated_at: z.string().datetime(),
    })
    .optional(),
});

// ─── ADMIN: GESTIÓN DE USUARIOS ──────────────────────────────
export const AdminUpdateUserSchema = z.object({
  action: z.enum(['extend_days', 'change_role', 'revoke_access']),
  // Para extend_days
  days: z
    .number()
    .int()
    .min(1, 'Mínimo 1 día')
    .max(365, 'Máximo 365 días')
    .optional(),
  // Para change_role
  role: z.enum(['guest', 'premium', 'admin']).optional(),
}).refine(data => {
  if (data.action === 'extend_days' && !data.days) return false;
  if (data.action === 'change_role' && !data.role) return false;
  return true;
}, { message: 'Datos insuficientes para la acción solicitada.' });

export const AdminSearchUsersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  page:   z.number().int().min(1).default(1),
  limit:  z.number().int().min(1).max(50).default(15),
  role:   z.enum(['all', 'guest', 'premium', 'admin']).default('all'),
});

// ─── TIPOS INFERIDOS ─────────────────────────────────────────
export type AdminUpdateUserInput  = z.infer<typeof AdminUpdateUserSchema>;
export type AdminSearchUsersInput = z.infer<typeof AdminSearchUsersSchema>;
export type RegisterInput         = z.infer<typeof RegisterSchema>;
export type LoginInput          = z.infer<typeof LoginSchema>;
export type SubmitPaymentInput  = z.infer<typeof SubmitPaymentSchema>;
export type RedeemCouponInput   = z.infer<typeof RedeemCouponSchema>;
export type CreateCouponInput   = z.infer<typeof CreateCouponSchema>;
export type ApplyReferralInput  = z.infer<typeof ApplyReferralSchema>;
export type RefiningInputType   = z.infer<typeof RefiningInputSchema>;
export type SaveFavoriteInput   = z.infer<typeof SaveFavoriteSchema>;
