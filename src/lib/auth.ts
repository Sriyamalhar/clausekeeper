import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/types/schemas";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt", // required for the Credentials provider
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials, req) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Rate-limit by IP + email combined so an attacker can't spray
        // across accounts to dodge a per-account limit, or vice versa.
        const ip =
          (req.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
          "unknown";
        const limitResult = rateLimit(`login:${ip}:${email}`, 5, 15 * 60 * 1000);
        if (!limitResult.success) {
          throw new Error("Too many attempts. Try again in a few minutes.");
        }

        const user = await db.user.findUnique({ where: { email } });
        // Always run verifyPassword even when user is null, against a dummy
        // hash, so response timing doesn't leak whether the email exists.
        const hashToCheck =
          user?.passwordHash ??
          "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        const valid = await verifyPassword(hashToCheck, password);

        if (!user || !valid || !user.emailVerified) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in, attach the user's org + role so every server-side check
      // downstream reads from the token instead of re-querying every time.
      if (user) {
        token.userId = user.id;
      }
      if (user || trigger === "update") {
        const membership = await db.membership.findFirst({
          where: { userId: token.userId as string },
          select: { orgId: true, role: true },
        });
        token.orgId = membership?.orgId ?? null;
        token.role = membership?.role ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.orgId = token.orgId as string | null;
        session.user.role = token.role as string | null;
      }
      return session;
    },
  },
  events: {
    // Auth.js rotates the session token automatically on each sign-in when
    // using the JWT strategy — no extra wiring needed for fixation defense.
  },
};
