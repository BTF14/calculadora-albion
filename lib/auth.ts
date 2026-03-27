// lib/auth.ts
// Fix #5:  JWT refresca subscriptionExpiresAt de la BD cada 5 minutos
//          → el middleware detecta el nuevo estado sin re-login
// Fix #16: JWT también refresca `role` y `isAdmin`
//          → si el admin sube el role a 'premium', el usuario no necesita re-login

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { query } from './db';
import type { UserRole } from '@/src/types/albion';

// Intervalo de refresco del token desde la BD (5 minutos)
const TOKEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  referral_code: string;
}

interface DbExpiry { expiry: string; }

interface DbRoleExpiry {
  role: UserRole;
  referral_code: string;
  expiry: string | null;
}

/**
 * Refresca desde la BD los datos que pueden cambiar post-login:
 * role, isAdmin, subscriptionExpiresAt
 */
async function refreshTokenFromDb(userId: number): Promise<DbRoleExpiry | null> {
  try {
    const [userRows, expiryRows] = await Promise.all([
      query<{ role: UserRole; referral_code: string }>(
        'SELECT role, referral_code FROM users WHERE id = $1',
        [userId]
      ),
      query<DbExpiry>(
        'SELECT get_user_expiry($1)::text AS expiry',
        [userId]
      ),
    ]);

    if (!userRows[0]) return null;

    return {
      role:          userRows[0].role,
      referral_code: userRows[0].referral_code,
      expiry:        expiryRows[0]?.expiry ?? null,
    };
  } catch {
    // Si la BD falla, devolvemos null y mantenemos el token actual
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',      type: 'email'    },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const users = await query<DbUser>(
          `SELECT id, email, password_hash, role, referral_code
           FROM users WHERE email = $1`,
          [credentials.email.toLowerCase().trim()]
        );

        const user = users[0];
        if (!user) return null;

        const isValid = await compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        const expiryRows = await query<DbExpiry>(
          'SELECT get_user_expiry($1)::text AS expiry',
          [user.id]
        );

        return {
          id:                    String(user.id),
          email:                 user.email,
          role:                  user.role,
          referral_code:         user.referral_code,
          subscriptionExpiresAt: expiryRows[0]?.expiry ?? null,
          isAdmin:               user.role === 'admin',
          // Timestamp para saber cuándo refrescar
          lastRefreshedAt:       Date.now(),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // ── Login inicial: escribir todo en el token ──────────
      if (user) {
        token.id                    = user.id;
        token.role                  = (user as { role: UserRole }).role;
        token.referral_code         = (user as { referral_code: string }).referral_code;
        token.subscriptionExpiresAt = (user as { subscriptionExpiresAt: string | null }).subscriptionExpiresAt;
        token.isAdmin               = (user as { isAdmin: boolean }).isAdmin;
        token.lastRefreshedAt       = Date.now();
        return token;
      }

      // Fix #5 + #16: refrescar desde BD si pasaron más de 5 minutos
      const lastRefresh = (token.lastRefreshedAt as number | undefined) ?? 0;
      const shouldRefresh = Date.now() - lastRefresh > TOKEN_REFRESH_INTERVAL_MS;

      if (shouldRefresh && token.id) {
        const fresh = await refreshTokenFromDb(Number(token.id));
        if (fresh) {
          token.role                  = fresh.role;
          token.referral_code         = fresh.referral_code;
          token.subscriptionExpiresAt = fresh.expiry;
          token.isAdmin               = fresh.role === 'admin';
          token.lastRefreshedAt       = Date.now();
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id                    = token.id as string;
        session.user.role                  = token.role as UserRole;
        session.user.referral_code         = token.referral_code as string;
        session.user.subscriptionExpiresAt = token.subscriptionExpiresAt as string | null;
        session.user.isAdmin               = token.isAdmin as boolean;
      }
      return session;
    },
  },

  pages:   { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET,
};
