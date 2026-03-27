import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';
import type { UserRole } from '@/src/types/albion';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      referral_code: string;
      subscriptionExpiresAt: string | null;
      isAdmin: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: UserRole;
    referral_code: string;
    subscriptionExpiresAt: string | null;
    isAdmin: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    referral_code: string;
    subscriptionExpiresAt: string | null;
    isAdmin: boolean;
  }
}
