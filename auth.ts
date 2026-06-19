import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { userDb } from "@/lib/db";

const ADMIN_USER = { id: "admin", name: "Admin", email: "admin@internal" };

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.username === "admin" &&
          credentials?.password === "MA2026"
        ) {
          return ADMIN_USER;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user }) {
      if (!user.email) return false;
      // Skip DB upsert for admin
      if (user.email === ADMIN_USER.email) return true;
      await userDb.upsert({
        id: user.id ?? user.email,
        email: user.email,
        name: user.name,
        image: user.image,
      });
      return true;
    },

    async jwt({ token, user }) {
      const email = user?.email ?? (token.email as string | undefined);
      if (email === ADMIN_USER.email) {
        token.tier = "institutional";
        token.email = email;
        return token;
      }
      if (email) {
        const row = await userDb.getByEmail(email);
        token.tier = row?.tier ?? "explorer";
        token.email = email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user?.email === ADMIN_USER.email) {
        (session as unknown as Record<string, unknown>).tier = "institutional";
        return session;
      }
      if (session.user?.email) {
        const row = await userDb.getByEmail(session.user.email);
        (session as unknown as Record<string, unknown>).tier = row?.tier ?? token.tier ?? "explorer";
      }
      return session;
    },
  },
});
