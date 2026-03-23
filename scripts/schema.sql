-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 day'),
  subscription_type VARCHAR(20),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  payment_verified_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  screenshot_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  plan VARCHAR(20),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_by UUID REFERENCES users(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
