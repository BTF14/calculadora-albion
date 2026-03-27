-- ============================================================
-- Albion Crafting Hub — Schema v4.0 (Growth, Logistics & Web3)
-- Fuente de verdad única. Ejecutar en Vercel Postgres / Neon.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. USUARIOS & MOTOR DE REFERIDOS ───────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    wallet_address  VARCHAR(42)  UNIQUE,
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255),
    referral_code   VARCHAR(10)  UNIQUE NOT NULL,
    referred_by     INTEGER      REFERENCES users(id),
    role                 VARCHAR(20)  DEFAULT 'guest'
                         CHECK (role IN ('admin', 'premium', 'guest')),
    reset_token          VARCHAR(64)  UNIQUE,
    reset_token_expires  TIMESTAMP WITH TIME ZONE,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet         ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_referral_code  ON users(referral_code);

-- ─── 2. SUSCRIPCIONES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expiry_date      TIMESTAMP WITH TIME ZONE NOT NULL,
    free_trial_used  BOOLEAN DEFAULT FALSE,
    plan             VARCHAR(20) CHECK (plan IN ('trial', 'weekly', 'monthly', 'yearly')),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user    ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry  ON subscriptions(expiry_date);
-- Índice compuesto para el cron de expiración (busca la última suscripción por usuario)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_expiry ON subscriptions(user_id, expiry_date DESC);

-- ─── 3. CUPONES RELÁMPAGO (FOMO 48h) ─────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
    id           SERIAL PRIMARY KEY,
    code         VARCHAR(20)  UNIQUE NOT NULL,
    reward_days  INTEGER      DEFAULT 2,
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    is_redeemed  BOOLEAN      DEFAULT FALSE,
    redeemed_by  INTEGER      REFERENCES users(id),
    created_by   INTEGER      REFERENCES users(id),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupons_code        ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at  ON coupons(expires_at);

-- ─── 4. PREMIOS POR REFERIDOS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_rewards (
    id           SERIAL PRIMARY KEY,
    referrer_id  INTEGER NOT NULL REFERENCES users(id),
    referee_id   INTEGER NOT NULL REFERENCES users(id),
    reward_days  INTEGER DEFAULT 7,
    granted_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (referrer_id, referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referee  ON referral_rewards(referee_id);

-- ─── 5. FAVORITOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id         VARCHAR(100) NOT NULL,
    custom_price_data JSONB,
    last_used         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);

-- ─── 6. PAGOS WEB3 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tx_hash     VARCHAR(66) UNIQUE NOT NULL,
    amount      DECIMAL(18, 8),
    currency    VARCHAR(10) DEFAULT 'USDT',
    network     VARCHAR(20) DEFAULT 'BEP20',
    plan        VARCHAR(20) CHECK (plan IN ('weekly', 'monthly', 'yearly')),
    status      VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON payments(tx_hash);

-- ─── FUNCIÓN HELPER: Expiración efectiva por usuario ──────────
CREATE OR REPLACE FUNCTION get_user_expiry(p_user_id INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    base_expiry TIMESTAMP WITH TIME ZONE;
    bonus_days  INTEGER := 0;
BEGIN
    SELECT expiry_date INTO base_expiry
    FROM subscriptions
    WHERE user_id = p_user_id
    ORDER BY expiry_date DESC
    LIMIT 1;

    IF base_expiry IS NULL THEN
        base_expiry := CURRENT_TIMESTAMP;
    END IF;

    SELECT COALESCE(SUM(reward_days), 0) INTO bonus_days
    FROM referral_rewards
    WHERE referrer_id = p_user_id;

    RETURN base_expiry + (bonus_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;
