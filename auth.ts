import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { userDb } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
  ],
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user }) {
      if (!user.email) return false;
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
      if (email) {
        const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);
        if (adminEmails.includes(email)) {
          token.tier = "institutional";
        } else {
          const row = await userDb.getByEmail(email);
          token.tier = row?.tier ?? "explorer";
        }
        token.email = email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user?.email) {
        const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);
        if (adminEmails.includes(session.user.email)) {
          (session as unknown as Record<string, unknown>).tier = "institutional";
        } else {
          const row = await userDb.getByEmail(session.user.email);
          (session as unknown as Record<string, unknown>).tier = row?.tier ?? token.tier ?? "explorer";
        }
      }
      return session;
    },
  },
});
