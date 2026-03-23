import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      subscriptionExpiresAt: Date | null;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    subscriptionExpiresAt: Date | null;
    isAdmin: boolean;
  }
}
