import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { query } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const users = await query<{
          id: string;
          email: string;
          password_hash: string;
          subscription_expires_at: Date | null;
          is_admin: boolean;
        }>(
          'SELECT id, email, password_hash, subscription_expires_at, is_admin FROM users WHERE email = $1',
          [credentials.email]
        );

        const user = users[0];
        if (!user) return null;

        const isValid = await compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          subscriptionExpiresAt: user.subscription_expires_at,
          isAdmin: user.is_admin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionExpiresAt = (user as any).subscriptionExpiresAt;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.subscriptionExpiresAt = token.subscriptionExpiresAt as Date;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
