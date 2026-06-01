import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { getAuthSecret, isSqliteOnVercel } from "@/lib/auth-env";
import { isGoogleAuthConfigured } from "@/lib/google-auth";
import prisma from "@/lib/prisma";
import { findOrCreateOAuthUser } from "@/lib/user";

const authSecret = getAuthSecret();

const googleProviders: Provider[] = isGoogleAuthConfigured()
  ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        allowDangerousEmailAccountLinking: true,
      }),
    ]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: authSecret,
  providers: [
    ...googleProviders,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email ?? email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email) {
        console.error("[auth] Google sign-in missing email");
        return false;
      }

      if (isSqliteOnVercel()) {
        console.error(
          "[auth] DATABASE_URL is SQLite on Vercel — use PostgreSQL (e.g. Neon). Google sign-in cannot persist users."
        );
        return false;
      }

      try {
        const dbUser = await findOrCreateOAuthUser({
          email: user.email,
          name: user.name,
          image: user.image,
        });
        user.id = dbUser.id;
        return true;
      } catch (error) {
        console.error("[auth] Google sign-in database error:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id;
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
        if (user.image) token.picture = user.image;
      } else if (account?.provider === "google" && token.email && !token.id) {
        try {
          const dbUser = await findOrCreateOAuthUser({
            email: token.email as string,
            name: (token.name as string) ?? null,
            image: (token.picture as string) ?? null,
          });
          token.id = dbUser.id;
        } catch (error) {
          console.error("[auth] jwt Google user sync failed:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      if (token.name) {
        session.user.name = token.name as string;
      }
      if (token.picture) {
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (account?.provider === "google") {
        console.info("[auth] Google sign-in ok", {
          userId: user.id,
          isNewUser,
        });
      }
    },
  },
});
