import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { userDb } from "@/lib/db";

const ADMIN_EMAILS = new Set([
  "shailendavdra@gmail.com",
  "admin@internal",
  ...(process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean),
]);

function isAdmin(email: string) {
  return ADMIN_EMAILS.has(email.toLowerCase());
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "admin-credentials",
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { username, password } = credentials as { username: string; password: string };
        if (ADMIN_PASSWORD && username === "admin" && password === ADMIN_PASSWORD) {
          return { id: "admin", email: "admin@internal", name: "Admin" };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user }) {
      if (!user.email) return false;
      // admin@internal is a virtual account — skip DB upsert
      if (user.email === "admin@internal") return true;
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
        if (isAdmin(email)) {
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
        if (isAdmin(session.user.email)) {
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
